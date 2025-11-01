import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import Redis from "ioredis";
import tiktokRouter from "./routes/tiktok.js";

const {
  PORT = 3000,
  FRONTEND_ORIGIN = "https://trend-pro.onrender.com",
  SESSION_SECRET = "change-me",
  COOKIE_SECURE = "true",
  REDIS_URL,
  REDIRECT_URI
} = process.env;

const app = express();
const redis = new Redis(REDIS_URL);

// Middleware
app.use(express.json());
app.use(cors({ origin: [FRONTEND_ORIGIN], credentials: true }));
app.use(cookieParser(SESSION_SECRET));

// Health + ENV
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/debug-env", (_req, res) => res.json({
  FRONTEND_ORIGIN, REDIRECT_URI, REDIS_URL_present: !!REDIS_URL
}));

// Notfall-Debug (bevor Router gemountet wird)
app.get("/auth/tiktok/debug", (_req, res) => {
  res.json({ mounted: true, note: "This is server fallback debug route." });
});

// Session helpers
async function setSession(res, session) {
  const sid = crypto.randomBytes(24).toString("hex");
  await redis.setex("sess:" + sid, 60*60*24*7, JSON.stringify(session));
  res.cookie("sid", sid, {
    httpOnly: true, sameSite: "lax", secure: COOKIE_SECURE === "true",
    maxAge: 1000*60*60*24*7, signed: true
  });
}
app.use((req, res, next) => { req.__setSess
$serverJs = @'
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import Redis from "ioredis";
import tiktokRouter from "./routes/tiktok.js";

const {
  PORT = 3000,
  FRONTEND_ORIGIN = "https://trend-pro.onrender.com",
  SESSION_SECRET = "change-me",
  COOKIE_SECURE = "true",
  REDIS_URL,
  REDIRECT_URI
} = process.env;

const app = express();
const redis = new Redis(REDIS_URL);

// Middleware
app.use(express.json());
app.use(cors({ origin: [FRONTEND_ORIGIN], credentials: true }));
app.use(cookieParser(SESSION_SECRET));

// Health + ENV
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/debug-env", (_req, res) => res.json({
  FRONTEND_ORIGIN, REDIRECT_URI, REDIS_URL_present: !!REDIS_URL
}));

// Notfall-Debug (bevor Router gemountet wird)
app.get("/auth/tiktok/debug", (_req, res) => {
  res.json({ mounted: true, note: "This is server fallback debug route." });
});

// Session helpers
async function setSession(res, session) {
  const sid = crypto.randomBytes(24).toString("hex");
  await redis.setex("sess:" + sid, 60*60*24*7, JSON.stringify(session));
  res.cookie("sid", sid, {
    httpOnly: true, sameSite: "lax", secure: COOKIE_SECURE === "true",
    maxAge: 1000*60*60*24*7, signed: true
  });
}
app.use((req, res, next) => { req.__setSess
$serverJs = @'
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import Redis from "ioredis";
import tiktokRouter from "./routes/tiktok.js";

const {
  PORT = 3000,
  FRONTEND_ORIGIN = "https://trend-pro.onrender.com",
  SESSION_SECRET = "change-me",
  COOKIE_SECURE = "true",
  REDIS_URL,
  REDIRECT_URI
} = process.env;

const app = express();
const redis = new Redis(REDIS_URL);

// Middleware
app.use(express.json());
app.use(cors({ origin: [FRONTEND_ORIGIN], credentials: true }));
app.use(cookieParser(SESSION_SECRET));

// Health + ENV
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/debug-env", (_req, res) => res.json({
  FRONTEND_ORIGIN, REDIRECT_URI, REDIS_URL_present: !!REDIS_URL
}));

// Notfall-Debug (bevor Router gemountet wird)
app.get("/auth/tiktok/debug", (_req, res) => {
  res.json({ mounted: true, note: "This is server fallback debug route." });
});

// Session helpers
async function setSession(res, session) {
  const sid = crypto.randomBytes(24).toString("hex");
  await redis.setex("sess:" + sid, 60*60*24*7, JSON.stringify(session));
  res.cookie("sid", sid, {
    httpOnly: true, sameSite: "lax", secure: COOKIE_SECURE === "true",
    maxAge: 1000*60*60*24*7, signed: true
  });
}
app.use((req, res, next) => { req.__setSession = (p) => setSession(res, p); next(); });

// MOUNT
app.use("/auth/tiktok", tiktokRouter);

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`✅ API running on :${PORT}`);
});
