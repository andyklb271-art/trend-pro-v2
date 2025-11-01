import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import tiktokRouter from "./routes/tiktok.js";

const {
  PORT = 3000,
  FRONTEND_ORIGIN = "https://trend-pro.onrender.com",
  SESSION_SECRET = "change-me",
  COOKIE_SECURE = "true",
  REDIRECT_URI
} = process.env;

const app = express();
app.set("trust proxy", 1); // wichtig für secure Cookies hinter Render-Proxy

app.use(express.json());
app.use(cors({ origin: [FRONTEND_ORIGIN], credentials: true }));
app.use(cookieParser(SESSION_SECRET));

// Health + ENV
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/debug-env", (_req, res) => res.json({
  FRONTEND_ORIGIN, REDIRECT_URI, COOKIE_SECURE, trust_proxy: true
}));

// Fallback-Debug (damit wir immer sehen, ob /auth gemountet ist)
app.get("/auth/tiktok/debug", (_req, res) => {
  res.json({ mounted: true, note: "fallback debug route alive" });
});

// Session: nur Cookie setzen (Server-Session optional später/Redis)
function setSession(res, session) {
  const sid = crypto.randomBytes(24).toString("hex");
  res.cookie("sid", sid, {
    httpOnly: true, sameSite: "lax",
    secure: COOKIE_SECURE === "true",
    maxAge: 1000*60*60*24*7, signed: true
  });
  // hier könntest du session in Redis persistieren (später)
}
app.use((req, res, next) => { req.__setSession = (p) => setSession(res, p); next(); });

// TikTok Router mounten
app.use("/auth/tiktok", tiktokRouter);

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`✅ API running on :${PORT}`);
});
