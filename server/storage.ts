export interface IStorage {
  sessionStore: import("express-session").Store;
  getUser(id: number): Promise<import("@shared/schema").User | undefined>;
  getUserByUsername(username: string): Promise<import("@shared/schema").User | undefined>;
  createUser(user: import("@shared/schema").InsertUser): Promise<import("@shared/schema").User>;
  createJournal(journal: import("@shared/schema").InsertJournal & { authorId: number }): Promise<import("@shared/schema").Journal>;
  getJournal(id: number): Promise<import("@shared/schema").Journal | undefined>;
  getAllJournals(): Promise<import("@shared/schema").Journal[]>;
  createComment(comment: import("@shared/schema").InsertComment & { authorId: number }): Promise<import("@shared/schema").Comment>;
  getCommentsByJournalId(journalId: number): Promise<import("@shared/schema").Comment[]>;
  addLike(journalId: number, ipAddress: string): Promise<void>;
  searchJournals(query: string): Promise<import("@shared/schema").Journal[]>;
}

import createMemoryStore from "memorystore";
import session from "express-session";
import {
  type User,
  type Journal,
  type Comment,
  type Like,
  type InsertUser,
  type InsertJournal,
  type InsertComment,
} from "@shared/schema";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private journals: Map<number, Journal>;
  private comments: Map<number, Comment>;
  private likes: Map<number, Like>;
  sessionStore: session.Store;
  currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.journals = new Map();
    this.comments = new Map();
    this.likes = new Map();
    this.currentId = { users: 1, journals: 1, comments: 1, likes: 1 };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id, isAdmin: false };
    this.users.set(id, user);
    return user;
  }

  async createJournal(insertJournal: InsertJournal & { authorId: number }): Promise<Journal> {
    const id = this.currentId.journals++;
    const journal: Journal = {
      ...insertJournal,
      id,
      createdAt: new Date(),
      likeCount: 0,
    };
    this.journals.set(id, journal);
    return journal;
  }

  async getJournal(id: number): Promise<Journal | undefined> {
    return this.journals.get(id);
  }

  async getAllJournals(): Promise<Journal[]> {
    return Array.from(this.journals.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async createComment(insertComment: InsertComment & { authorId: number }): Promise<Comment> {
    const id = this.currentId.comments++;
    const comment: Comment = {
      ...insertComment,
      id,
      createdAt: new Date(),
    };
    this.comments.set(id, comment);
    return comment;
  }

  async getCommentsByJournalId(journalId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter((comment) => comment.journalId === journalId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async addLike(journalId: number, ipAddress: string): Promise<void> {
    if (!ipAddress) return;

    const existing = Array.from(this.likes.values()).find(
      (like) => like.journalId === journalId && like.ipAddress === ipAddress,
    );
    if (existing) return;

    const id = this.currentId.likes++;
    this.likes.set(id, { id, journalId, ipAddress });

    const journal = await this.getJournal(journalId);
    if (journal) {
      journal.likeCount++;
      this.journals.set(journalId, journal);
    }
  }

  async searchJournals(query: string): Promise<Journal[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.journals.values())
      .filter(
        (journal) =>
          journal.title.toLowerCase().includes(lowercaseQuery) ||
          journal.content.toLowerCase().includes(lowercaseQuery),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new MemStorage();