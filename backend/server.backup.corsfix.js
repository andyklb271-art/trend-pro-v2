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

// Erzwinge exakt einen Scope
const TIKTOK_SCOPE = "user.info.basic";

const app = express();
app.use(express.json());
app.use(cookieParser(SESSION_SECRET));
app.use(
  cors({
    origin: [FRONTEND_ORIGIN],
    credentials: true,
  })
);

// In-Memory Session
const SESSION = { state: null, oauth: null };

// Health
app.get("/health", function (_req, res) {
  res.status(200).json({
    ok: true,
    env: {
      NODE_ENV: NODE_ENV,
      FRONTEND_ORIGIN: FRONTEND_ORIGIN,
      REDIRECT_URI: REDIRECT_URI,
      scopes: [TIKTOK_SCOPE],
    },
  });
});

// Helpers
function buildAuthUrl() {
  const state = crypto.randomBytes(16).toString("hex");
  SESSION.state = state;

  const params = new URLSearchParams();
  params.set("client_key", TIKTOK_CLIENT_KEY);
  params.set("scope", TIKTOK_SCOPE);
  params.set("response_type", "code");
  params.set("redirect_uri", REDIRECT_URI);
  params.set("state", state);

  return "https://www.tiktok.com/v2/auth/authorize/?" + params.toString();
}

async function exchangeCodeForToken(code) {
  const url = "https://open.tiktokapis.com/v2/oauth/token/";
  const body = {
    client_key: TIKTOK_CLIENT_KEY,
    client_secret: TIKTOK_CLIENT_SECRET,
    code: code,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT_URI,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error("Token exchange failed: HTTP " + resp.status + " " + txt);
  }
  return await resp.json();
}

async function getUserInfo(access_token) {
  const url = "https://open.tiktokapis.com/v2/user/info/";
  const resp = await fetch(url, {
    method: "GET",
    headers: { Authorization: "Bearer " + access_token },
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error("User info failed: HTTP " + resp.status + " " + txt);
  }
  return await resp.json();
}

// Routes
app.get("/auth/tiktok/login", function (_req, res) {
  try {
    const url = buildAuthUrl();
    res.redirect(url);
  } catch (e) {
    res.status(500).json({ error: String(e && e.message ? e.message : e) });
  }
});

app.get("/auth/tiktok/callback", async function (req, res) {
  try {
    const code = req.query.code;
    const state = req.query.state;
    const error = req.query.error;
    const error_type = req.query.error_type;

    if (error) return res.status(400).send("OAuth error: " + error + " (" + (error_type || "no-type") + ")");
    if (!code || !state) return res.status(400).send("Missing code/state");
    if (!SESSION.state || state !== SESSION.state) return res.status(400).send("Invalid state");

    const tokenJson = await exchangeCodeForToken(code);
    SESSION.oauth = tokenJson;
    SESSION.state = null;

    res.cookie("logged_in", "1", {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(FRONTEND_ORIGIN + "/?auth=success");
  } catch (e) {
    return res.status(500).send("Callback error: " + String(e && e.message ? e.message : e));
  }
});

app.get("/auth/tiktok/debug", function (_req, res) {
  const safe = SESSION.oauth
    ? { has_token: true, open_id: SESSION.oauth.open_id, scope: SESSION.oauth.scope, expires_in: SESSION.oauth.expires_in }
    : { has_token: false };
  res.json({ env: { FRONTEND_ORIGIN: FRONTEND_ORIGIN, REDIRECT_URI: REDIRECT_URI, scope_enforced: TIKTOK_SCOPE }, session: safe });
});

app.get("/api/me", async function (_req, res) {
  try {
    if (!SESSION.oauth || !SESSION.oauth.access_token) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const data = await getUserInfo(SESSION.oauth.access_token);
    return res.json({ data: data });
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message ? e.message : e) });
  }
});

// Start
app.listen(Number(PORT), "0.0.0.0", function () {
  console.log("✅ API on :" + PORT);
  console.log("   FRONTEND_ORIGIN: " + FRONTEND_ORIGIN);
  console.log("   REDIRECT_URI   : " + REDIRECT_URI);
  console.log("   SCOPE          : " + TIKTOK_SCOPE);
});
