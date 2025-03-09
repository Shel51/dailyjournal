import { IStorage } from "./storage";
import session from "express-session";
import { db, pool } from "./db";
import { eq, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import {
  users,
  journals,
  comments,
  likes,
  type User,
  type Journal,
  type Comment,
  type Like,
  type InsertUser,
  type InsertJournal,
  type InsertComment,
} from "@shared/schema";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser & { isAdmin?: boolean }): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserPassword(userId: number, newPassword: string): Promise<void>;
  createJournal(insertJournal: InsertJournal & { authorId: number }): Promise<Journal>;
  getJournal(id: number): Promise<Journal | undefined>;
  getAllJournals(): Promise<Journal[]>;
  createComment(insertComment: InsertComment & { authorId: number }): Promise<Comment>;
  getCommentsByJournalId(journalId: number): Promise<Comment[]>;
  getAllComments(): Promise<Comment[]>;
  addLike(journalId: number, ipAddress: string): Promise<void>;
  searchJournals(query: string): Promise<Journal[]>;
  updateJournal(id: number, journal: InsertJournal & { authorId: number }): Promise<Journal>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    console.log("Initializing DatabaseStorage...");
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not set");
    }

    try {
      console.log("Setting up PostgresSessionStore...");
      this.sessionStore = new PostgresSessionStore({
        pool: pool,
        tableName: 'session',
        createTableIfMissing: true,
        // Reduce pruning frequency to avoid startup overhead
        pruneSessionInterval: 60 * 60 // Prune expired sessions every hour instead of every 15 minutes
      });
      console.log("PostgresSessionStore initialized successfully");
    } catch (error) {
      console.error("Failed to initialize PostgresSessionStore:", error);
      throw error;
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      console.log(`Fetching user with ID: ${id}`);
      const [user] = await db.select().from(users).where(eq(users.id, id));
      console.log(`User fetch result:`, user ? 'Found' : 'Not found');
      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser & { isAdmin?: boolean }): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).execute();
  }

  async createJournal(insertJournal: InsertJournal & { authorId: number }): Promise<Journal> {
    const [journal] = await db.insert(journals).values(insertJournal).returning();
    return journal;
  }

  async getJournal(id: number): Promise<Journal | undefined> {
    const [journal] = await db.select().from(journals).where(eq(journals.id, id));
    return journal;
  }

  async getAllJournals(): Promise<Journal[]> {
    return await db
      .select()
      .from(journals)
      .orderBy(sql`${journals.createdAt} DESC`)
      .execute();
  }

  async createComment(insertComment: InsertComment & { authorId: number }): Promise<Comment> {
    const [comment] = await db.insert(comments).values(insertComment).returning();
    return comment;
  }

  async getCommentsByJournalId(journalId: number): Promise<Comment[]> {
    return await db
      .select({
        id: comments.id,
        content: comments.content,
        journalId: comments.journalId,
        authorId: comments.authorId,
        createdAt: comments.createdAt,
        username: users.username
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.journalId, journalId))
      .orderBy(sql`${comments.createdAt} DESC`)
      .execute();
  }

  async getAllComments(): Promise<Comment[]> {
    return await db
      .select({
        id: comments.id,
        content: comments.content,
        journalId: comments.journalId,
        authorId: comments.authorId,
        createdAt: comments.createdAt,
        username: users.username
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .orderBy(sql`${comments.createdAt} DESC`)
      .execute();
  }

  async addLike(journalId: number, ipAddress: string): Promise<void> {
    if (!ipAddress) return;

    const [existingLike] = await db
      .select()
      .from(likes)
      .where(eq(likes.journalId, journalId))
      .where(eq(likes.ipAddress, ipAddress))
      .execute();

    if (existingLike) return;

    await db.insert(likes).values({ journalId, ipAddress });

    // Update like count using a subquery
    await db
      .update(journals)
      .set({
        likeCount: sql`(SELECT COUNT(*) FROM ${likes} WHERE ${likes.journalId} = ${journalId})`
      })
      .where(eq(journals.id, journalId));
  }

  async searchJournals(query: string): Promise<Journal[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(journals)
      .where(sql`LOWER(title) LIKE ${searchQuery} OR LOWER(content) LIKE ${searchQuery}`)
      .orderBy(sql`${journals.createdAt} DESC`)
      .execute();
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, userId));
  }

  async updateJournal(id: number, journal: InsertJournal & { authorId: number }): Promise<Journal> {
    const [updatedJournal] = await db
      .update(journals)
      .set(journal)
      .where(eq(journals.id, id))
      .returning();
    return updatedJournal;
  }
}

export const storage = new DatabaseStorage();