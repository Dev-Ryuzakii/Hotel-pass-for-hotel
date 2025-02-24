import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { Hotel as SelectHotel } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectHotel {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
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
    secret: "your-secret-key", // In production, use environment variable
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const hotel = await storage.getHotelByEmail(email);
          if (!hotel || !(await comparePasswords(password, hotel.password))) {
            return done(null, false, { message: "Invalid credentials" });
          }
          return done(null, hotel);
        } catch (error) {
          return done(error);
        }
      },
    ),
  );

  passport.serializeUser((hotel, done) => {
    done(null, hotel.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const hotel = await storage.getHotel(id);
      done(null, hotel);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingHotel = await storage.getHotelByEmail(req.body.email);
      if (existingHotel) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hotel = await storage.createHotel({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(hotel, (err) => {
        if (err) return next(err);
        // Don't send password back to client
        const { password, ...safeHotel } = hotel;
        res.status(201).json(safeHotel);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, hotel, info) => {
      if (err) return next(err);
      if (!hotel) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(hotel, (err) => {
        if (err) return next(err);
        // Don't send password back to client
        const { password, ...safeHotel } = hotel;
        res.json(safeHotel);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/hotel", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    // Don't send password back to client
    const { password, ...safeHotel } = req.user;
    res.json(safeHotel);
  });
}
