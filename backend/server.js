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
  COOKIE_SECURE = 'true',
} = process.env;

const app = express();
const SESSIONS = new Map(); // In-Memory Session Store

app.use(express.json());
app.use(cors({ origin: [FRONTEND_ORIGIN], credentials: true }));
app.use(cookieParser(SESSION_SECRET));

// ---- Session helpers ----
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
  return sid ? SESSIONS.get(sid) || null : null;
}

function clearSession(req, res) {
  const sid = req.signedCookies?.sid;
  if (sid) SESSIONS.delete(sid);
  res.clearCookie('sid');
}

// ---- Routes ----
app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/debug-env', (_req, res) => {
  res.json({
    FRONTEND_ORIGIN,
    REDIRECT_URI: process.env.REDIRECT_URI,
    PORT,
    NODE_ENV,
  });
});

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

app.post('/auth/logout', (req, res) => {
  clearSession(req, res);
  res.json({ ok: true });
});

// Session Setter Injection
app.use((req, res, next) => {
  req.__setSession = (payload) => setSession(res, payload);
  next();
});

app.use('/auth/tiktok', tiktokRouter);

// ---- Start Server ----
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log('✅ API running on :' + PORT);
  console.log('FRONTEND_ORIGIN:', FRONTEND_ORIGIN);
});
