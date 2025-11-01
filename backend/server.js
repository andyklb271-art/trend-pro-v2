import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import tiktokRouter from './routes/tiktok.js';

const {
  PORT = 3000,
  FRONTEND_ORIGIN = 'https://trend-pro.onrender.com',
  NODE_ENV = 'production',
  SESSION_SECRET = 'change-me',
  COOKIE_SECURE = 'true', // in Render: true
} = process.env;

const app = express();

// --- minimaler In-Memory Session-Store ---
const SESSIONS = new Map(); // sid -> { access_token, refresh_token, open_id, expires_in, created_at }

app.use(express.json());
app.use(cors({ origin: [FRONTEND_ORIGIN], credentials: true }));
app.use(cookieParser(SESSION_SECRET));

// Session Helper
function setSession(res, session) {
  const sid = crypto.randomBytes(24).toString('hex');
  SESSIONS.set(sid, { ...session, created_at: Date.now() });
  res.cookie('sid', sid, {
    httpOnly: true,
    sameSite: 'lax',
    secure: COOKIE_SECURE === 'true',
    maxAge: 1000 * 60 * 60 * 24 * 7,
    signed: true,
  });
}
function getSession(req) {
  const sid = req.signedCookies?.sid;
  if (!sid) return null;
  return SESSIONS.get(sid) || null;
}
function clearSession(req, res) {
  const sid = req.signedCookies?.sid;
  if (sid) SESSIONS.delete(sid);
  res.clearCookie('sid');
}

// Health & ENV-Debug (nur für dich)
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/debug-env', (_req, res) => {
  res.json({
    FRONTEND_ORIGIN, NODE_ENV, PORT,
    REDIRECT_URI: process.env.REDIRECT_URI,
  });
});

// --- API: aktueller User ---
app.get('/api/me', async (req, res) => {
  const sess = getSession(req);
  if (!sess?.access_token) return res.status(401).json({ authenticated: false });

  try {
    const r = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      method: 'GET',
      headers: { Authorization: Bearer  },
    });
    const data = await r.json();
    if (!r.ok) return res.status(401).json({ authenticated: false, error: data });
    return res.json({ authenticated: true, session: { open_id: sess.open_id }, user: data });
  } catch (e) {
    return res.status(500).json({ authenticated: false, error: e.message });
  }
});

// --- Logout ---
app.post('/auth/logout', (req, res) => {
  clearSession(req, res);
  res.json({ ok: true });
});

// TikTok Auth-Router bekommt Zugriff auf Session-Setter
app.use((req, res, next) => {
  req.__setSession = (payload) => setSession(res, payload);
  next();
});
app.use('/auth/tiktok', tiktokRouter);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(✅ API on :);
  console.log(FRONTEND_ORIGIN: );
});
