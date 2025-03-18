import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const journals = pgTable("journals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imagePath: text("image_path"),
  imageSubtext: text("image_subtext"),
  videoUrl: text("video_url"),
  refUrl: text("ref_url"),
  authorId: integer("author_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  likeCount: integer("like_count").notNull().default(0),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  journalId: integer("journal_id").notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  journalId: integer("journal_id").notNull(),
  authorId: integer("author_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Create schemas for insert operations
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertJournalSchema = createInsertSchema(journals).pick({
  title: true,
  content: true,
  imagePath: true,
  imageSubtext: true,
  videoUrl: true,
  refUrl: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  journalId: true,
});

// Define types for database operations
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertJournal = z.infer<typeof insertJournalSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;

// Define types for database records
export type User = typeof users.$inferSelect;
export type Journal = typeof journals.$inferSelect & {
  hasLiked?: boolean;
};
export type Comment = typeof comments.$inferSelect & {
  username?: string;
};
export type Like = typeof likes.$inferSelect;