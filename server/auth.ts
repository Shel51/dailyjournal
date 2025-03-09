import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, cert } from "firebase-admin/app";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Initialize Firebase Admin
try {
  initializeApp({
    credential: cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  // Handle Google authentication
  app.post("/api/auth/google", async (req, res) => {
    try {
      console.log('Received Google auth request');
      const { token } = req.body;

      if (!token) {
        console.error('No token provided');
        return res.status(400).json({ error: 'No token provided' });
      }

      console.log('Verifying token with Firebase Admin');
      const decodedToken = await getAuth().verifyIdToken(token);

      if (!decodedToken.email) {
        console.error('No email in decoded token');
        return res.status(400).json({ error: 'Email is required' });
      }

      console.log('Looking up user by email:', decodedToken.email);
      let user = await storage.getUserByEmail(decodedToken.email);

      if (!user) {
        console.log('Creating new user for email:', decodedToken.email);
        const username = decodedToken.email.split('@')[0];
        user = await storage.createUser({
          username,
          email: decodedToken.email,
          password: await hashPassword(randomBytes(32).toString('hex')),
          isAdmin: false,
        });
      }

      req.login(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ error: 'Failed to login' });
        }
        console.log('User successfully logged in:', user.username);
        res.json(user);
      });
    } catch (error) {
      console.error('Google auth error:', error);
      res.status(401).json({ error: error.message || 'Authentication failed' });
    }
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    // Check if this is the first user
    const users = await storage.getAllUsers();
    const isFirstUser = users.length === 0;

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
      isAdmin: isFirstUser // Make the first user an admin
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}