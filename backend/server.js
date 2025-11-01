import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import fetch from "node-fetch";
import tiktokRouter from "./routes/tiktok.js";

const {
  PORT = 3000,
  FRONTEND_ORIGIN = "https://trend-pro.onrender.com",
  SESSION_SECRET = "change-me",
  COOKIE_SECURE = "true"
} = process.env;

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(cors({ origin: [FRONTEND_ORIGIN], credentials: true }));
app.use(cookieParser(SESSION_SECRET));

// ---- simple in-memory session store (reicht für jetzt)
const SESSIONS = new Map();

async function setSession(res, session) {
  const sid = crypto.randomBytes(24).toString("hex");
  SESSIONS.set(sid, session);
  res.cookie("sid", sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: COOKIE_SECURE === "true",
    signed: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}
app.use((req, res, next) => { req.__setSession = (s) => setSession(res, s); next(); });

// ---- sanity routes
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/debug-env", (_req, res) => res.json({ FRONTEND_ORIGIN, COOKIE_SECURE }));

// Root: keine leere 404 mehr
app.get("/", (_req, res) => res.send("✅ Backend läuft. Nutze /auth/tiktok/login oder /api/me"));

// ---- authenticated me
app.get("/api/me", async (req, res) => {
  const sid = req.signedCookies?.sid;
  const sess = sid ? SESSIONS.get(sid) : null;

  if (!sess?.access_token) {
    return res.status(401).json({ ok: false, error: "not_authenticated" });
  }

  try {
    const r = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url", {
      headers: { Authorization: `Bearer ${sess.access_token}` }
    });
    const data = await r.json().catch(() => ({}));
    return res.json({ ok: true, user: data?.data || data || { open_id: sess.open_id } });
  } catch (e) {
    return res.json({ ok: true, user: { open_id: sess.open_id }, warn: "userinfo_fetch_failed", detail: e.message });
  }
});

// ---- mount oauth router
app.use("/auth/tiktok", tiktokRouter);

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`✅ API on :${PORT}`);
});
