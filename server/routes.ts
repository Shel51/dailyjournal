import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertJournalSchema, insertCommentSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

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
    const ipAddress = req.ip;
    await storage.addLike(journalId, ipAddress);
    res.sendStatus(200);
  });

  const httpServer = createServer(app);
  return httpServer;
}
