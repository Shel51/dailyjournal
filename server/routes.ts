import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import { insertJournalSchema, insertCommentSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import express from 'express';

// Set up multer for handling file uploads
const multerStorage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: multerStorage });

// Ensure uploads directory exists
(async () => {
  try {
    await fs.access("./uploads");
  } catch {
    await fs.mkdir("./uploads");
  }
})();

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Create seed data route
  app.post("/api/seed", async (_req, res) => {
    try {
      // Create admin user
      const admin = await storage.createUser({
        username: "admin",
        password: await hashPassword("admin123"),
        isAdmin: true
      });

      // Create sample journal entries with different dates
      const entries = [
        {
          title: "Today's Reflection",
          content: "Today was a productive day filled with coding and learning.",
          imageUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea",
          authorId: admin.id,
          createdAt: new Date()
        },
        {
          title: "Yesterday's Adventures",
          content: "Spent yesterday exploring new technologies and frameworks.",
          imageUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643",
          authorId: admin.id,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
        },
        {
          title: "Last Week's Progress",
          content: "Looking back at last week's achievements and lessons learned.",
          imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8",
          authorId: admin.id,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        },
        {
          title: "Beginning of the Month",
          content: "Starting fresh with new goals and aspirations.",
          authorId: admin.id,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        }
      ];

      for (const entry of entries) {
        await storage.createJournal(entry);
      }

      res.json({ message: "Seed data created successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error creating seed data" });
    }
  });

  // Journal routes
  app.get("/api/journals", async (_req, res) => {
    const journals = await storage.getAllJournals();
    res.json(journals);
  });

  app.get("/api/journals/search", async (req, res) => {
    const query = req.query.q as string;
    if (!query) return res.json([]);
    const journals = await storage.searchJournals(query);
    res.json(journals);
  });

  app.get("/api/journals/:id", async (req, res) => {
    const journal = await storage.getJournal(parseInt(req.params.id));
    if (!journal) return res.sendStatus(404);
    res.json(journal);
  });

  app.post("/api/journals", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(403);
    }

    const parseResult = insertJournalSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }

    const journal = await storage.createJournal({
      ...parseResult.data,
      authorId: req.user.id,
    });
    res.status(201).json(journal);
  });

  app.patch("/api/journals/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(403);
    }

    const parseResult = insertJournalSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }

    const journal = await storage.updateJournal(parseInt(req.params.id), {
      ...parseResult.data,
      authorId: req.user.id,
    });
    res.json(journal);
  });

  app.delete("/api/journals/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(403);
    }

    const journal = await storage.getJournal(parseInt(req.params.id));
    if (!journal) {
      return res.sendStatus(404);
    }

    await storage.deleteJournal(parseInt(req.params.id));
    res.sendStatus(200);
  });


  app.get("/api/journals/:id/comments", async (req, res) => {
    const comments = await storage.getCommentsByJournalId(parseInt(req.params.id));
    res.json(comments);
  });

  app.post("/api/journals/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    const parseResult = insertCommentSchema.safeParse({
      ...req.body,
      journalId: parseInt(req.params.id),
    });

    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }

    const comment = await storage.createComment({
      ...parseResult.data,
      authorId: req.user.id,
    });
    res.status(201).json(comment);
  });

  app.post("/api/journals/:id/like", async (req, res) => {
    const journalId = parseInt(req.params.id);
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    await storage.addLike(journalId, ipAddress);
    res.sendStatus(200);
  });

  app.post("/api/user/change-password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const user = await storage.getUser(req.user.id);
    if (!user || !(await comparePasswords(currentPassword, user.password))) {
      return res.status(400).send("Current password is incorrect");
    }

    // Update password
    const hashedPassword = await hashPassword(newPassword);
    await storage.updateUserPassword(user.id, hashedPassword);

    res.sendStatus(200);
  });

  // Add this new route for fetching all comments
  app.get("/api/comments", async (_req, res) => {
    const comments = await storage.getAllComments();
    res.json(comments);
  });

  // Add these routes before the file upload route
  app.delete("/api/comments/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    const comment = await storage.getComment(parseInt(req.params.id));
    if (!comment) {
      return res.sendStatus(404);
    }

    // Only allow users to delete their own comments or admin to delete any comment
    if (comment.authorId !== req.user.id && !req.user.isAdmin) {
      return res.sendStatus(403);
    }

    await storage.deleteComment(parseInt(req.params.id));
    res.sendStatus(200);
  });

  app.patch("/api/comments/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    const comment = await storage.getComment(parseInt(req.params.id));
    if (!comment) {
      return res.sendStatus(404);
    }

    // Only allow users to edit their own comments
    if (comment.authorId !== req.user.id) {
      return res.sendStatus(403);
    }

    const parseResult = insertCommentSchema.pick({ content: true }).safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }

    const updatedComment = await storage.updateComment(parseInt(req.params.id), parseResult.data);
    res.json(updatedComment);
  });

  // File upload route with improved error handling
  app.post("/api/upload", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Ensure the uploads directory exists
      try {
        await fs.access("./uploads");
      } catch {
        await fs.mkdir("./uploads");
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ url: imageUrl });
    } catch (error) {
      console.error("Error handling file upload:", error);
      res.status(500).json({ error: "Failed to process file upload" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", express.static("uploads"));

  const httpServer = createServer(app);
  return httpServer;
}