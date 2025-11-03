import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import fetch from "node-fetch";

const {
  PORT = 3000,
  NODE_ENV = "production",
  FRONTEND_ORIGIN = "http://localhost:5173",
  REDIRECT_URI = "https://trend-pro.onrender.com/auth/tiktok/callback",
  TIKTOK_CLIENT_KEY,
  TIKTOK_CLIENT_SECRET,
  SESSION_SECRET = "change-me",
} = process.env;

const app = express();
app.use(cors({
  origin: [FRONTEND_ORIGIN, "http://localhost:5173", "https://trend-pro.onrender.com"],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser(SESSION_SECRET));

// RAM session (PoC)
let SESSION = { state: null, access_token: null, refresh_token: null, user: null };

const TIKTOK_AUTH_URL     = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN_URL    = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_USERINFO_URL = "https://open.tiktokapis.com/v2/user/info/";

// Minimal: nur Login-Kit Basisscope (später erweitern)
const SCOPES = ["user.info.basic];

function buildAuthUrl() {
  const state = crypto.randomBytes(16).toString("hex");
  SESSION.state = state;

  const params = new URLSearchParams({
    client_key: TIKTOK_CLIENT_KEY,
    // TikTok erwartet SPACE-separiert (keine Kommata!)
    scope: "user.info.basic
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    state,
  });
  return `${TIKTOK_AUTH_URL}?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
  const body = {
    client_key: TIKTOK_CLIENT_KEY,
    client_secret: TIKTOK_CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT_URI,
  };
  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${txt}`);
  return JSON.parse(txt);
}

async function refreshToken(refresh_token) {
  const body = {
    client_key: TIKTOK_CLIENT_KEY,
    client_secret: TIKTOK_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token
  };
  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`Refresh failed: ${res.status} ${txt}`);
  return JSON.parse(txt);
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, env: { NODE_ENV, FRONTEND_ORIGIN, REDIRECT_URI, scopes: SCOPES } });
});

app.get("/auth/tiktok/login", (_req, res) => {
  if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) {
    return res.status(500).json({ error: "TikTok credentials missing" });
  }
  res.redirect(buildAuthUrl());
});

app.get("/auth/tiktok/callback", async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;
    if (error) return res.status(400).send(`TikTok error: ${error} ${error_description || ""}`);
    if (!code || !state) return res.status(400).send("Missing code/state");
    if (!SESSION.state || state !== SESSION.state) return res.status(400).send("Invalid state");

    const tokenJson = await exchangeCodeForToken(code.toString());
    SESSION.access_token  = tokenJson.access_token;
    SESSION.refresh_token = tokenJson.refresh_token;

    const ui = await fetch(TIKTOK_USERINFO_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${SESSION.access_token}`,
        "Content-Type": "application/json"
      }
    });
    const userJson = await ui.json();
    const u = userJson?.data?.user;
    SESSION.user = u ? {
      open_id: u.open_id,
      display_name: u.display_name,
      avatar_url: u.avatar_url
    } : null;

    const sid = crypto.randomBytes(18).toString("hex");
    res.cookie("sid", sid, {
      httpOnly: true,
      sameSite: NODE_ENV === "production" ? "none" : "lax",
      secure: NODE_ENV === "production",
      signed: true,
      maxAge: 7 * 24 * 3600 * 1000
    });
    res.redirect(FRONTEND_ORIGIN);
  } catch (e) {
    console.error("[Auth Callback Error]", e);
    res.status(500).send(`Auth error: ${(e && e.message) || e}`);
  }
});

app.get("/auth/tiktok/logout", (_req, res) => {
  SESSION = { state: null, access_token: null, refresh_token: null, user: null };
  res.clearCookie("sid");
  res.json({ ok: true });
});

app.get("/api/me", async (_req, res) => {
  try {
    if (!SESSION.access_token) return res.status(401).json({ error: "Not logged in" });

    const ui = await fetch(TIKTOK_USERINFO_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${SESSION.access_token}`,
        "Content-Type": "application/json"
      }
    });
    const j = await ui.json();
    const u = j?.data?.user;
    if (u) {
      SESSION.user = {
        open_id: u.open_id,
        display_name: u.display_name,
        avatar_url: u.avatar_url
      };
    }
    res.json({ ok: true, user: SESSION.user });
  } catch (e) {
    console.error("[ME Error]", e);
    res.status(500).json({ error: (e && e.message) || e });
  }
});

app.get("/api/refresh", async (_req, res) => {
  try {
    if (!SESSION.refresh_token) return res.status(400).json({ error: "No refresh_token" });
    const r = await refreshToken(SESSION.refresh_token);
    SESSION.access_token = r.access_token;
    SESSION.refresh_token = r.refresh_token || SESSION.refresh_token;
    res.json({ ok: true });
  } catch (e) {
    console.error("[Refresh Error]", e);
    res.status(500).json({ error: (e && e.message) || e });
  }
});

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`✅ API on :${PORT}`);
  console.log(`   FRONTEND_ORIGIN: ${FRONTEND_ORIGIN}`);
  console.log(`   REDIRECT_URI   : ${REDIRECT_URI}`);
  console.log(`   SCOPES         : ${SCOPES.join(" ")}`);
});



app.get('/auth/tiktok/debug',(_req,res)=>res.send(buildAuthUrl()));


















