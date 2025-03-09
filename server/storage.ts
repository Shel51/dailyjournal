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
  type InsertUser,
  type InsertJournal,
  type InsertComment,
} from "@shared/schema";

const PostgresSessionStore = connectPg(session);

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
        pruneSessionInterval: 60 * 60
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
    try {
      const [result] = await db
        .select()
        .from(journals)
        .where(eq(journals.id, id));
      return result;
    } catch (error) {
      console.error("Error in getJournal:", error);
      throw error;
    }
  }

  async getAllJournals(): Promise<Journal[]> {
    try {
      const result = await db
        .select()
        .from(journals)
        .orderBy(sql`${journals.createdAt} DESC`);
      return result;
    } catch (error) {
      console.error("Error in getAllJournals:", error);
      throw error;
    }
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

    try {
      console.log(`[LIKE] Starting like operation for journal ${journalId} from IP ${ipAddress}`);

      // First check the current like count
      const [journal] = await db
        .select()
        .from(journals)
        .where(eq(journals.id, journalId));

      console.log(`[LIKE] Current like count for journal ${journalId}: ${journal?.likeCount}`);

      // Use a transaction to ensure atomicity
      await db.transaction(async (tx) => {
        // Check if like exists first
        const [existingLike] = await tx
          .select()
          .from(likes)
          .where(eq(likes.journalId, journalId))
          .where(eq(likes.ipAddress, ipAddress));

        console.log(`[LIKE] Existing like check result:`, existingLike ? 'Found' : 'Not found');

        if (!existingLike) {
          // First insert the like
          const [insertedLike] = await tx
            .insert(likes)
            .values({ journalId, ipAddress })
            .returning();

          console.log(`[LIKE] Inserted new like:`, insertedLike);

          // Then increment the like count
          const [updatedJournal] = await tx
            .update(journals)
            .set({ likeCount: sql`${journals.likeCount} + 1` })
            .where(eq(journals.id, journalId))
            .returning();

          console.log(`[LIKE] Updated journal like count:`, updatedJournal?.likeCount);
        } else {
          console.log(`[LIKE] Like already exists for journal ${journalId} from IP ${ipAddress}`);
        }
      });

      // Verify the final like count
      const [finalJournal] = await db
        .select()
        .from(journals)
        .where(eq(journals.id, journalId));

      console.log(`[LIKE] Final like count for journal ${journalId}: ${finalJournal?.likeCount}`);
    } catch (error) {
      console.error('[LIKE] Error in addLike:', error);
      throw error;
    }
  }

  async hasLiked(journalId: number, ipAddress: string): Promise<boolean> {
    try {
      console.log(`[LIKE] Checking if IP ${ipAddress} has liked journal ${journalId}`);
      const [like] = await db
        .select()
        .from(likes)
        .where(eq(likes.journalId, journalId))
        .where(eq(likes.ipAddress, ipAddress));

      const hasLiked = !!like;
      console.log(`[LIKE] Has liked status for journal ${journalId}: ${hasLiked}`);
      return hasLiked;
    } catch (error) {
      console.error("[LIKE] Error in hasLiked:", error);
      return false;
    }
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

  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db
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
      .where(eq(comments.id, id));
    return comment;
  }

  async deleteComment(id: number): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  async updateComment(id: number, data: { content: string }): Promise<Comment> {
    const [comment] = await db
      .update(comments)
      .set(data)
      .where(eq(comments.id, id))
      .returning();
    return comment;
  }

  async deleteJournal(id: number): Promise<void> {
    // First delete all comments associated with this journal
    await db.delete(comments).where(eq(comments.journalId, id));
    // Then delete all likes associated with this journal
    await db.delete(likes).where(eq(likes.journalId, id));
    // Finally delete the journal itself
    await db.delete(journals).where(eq(journals.id, id));
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
}

export const storage = new DatabaseStorage();