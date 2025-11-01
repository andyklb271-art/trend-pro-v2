import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fetch from 'node-fetch';

const app = express();
const {
  PORT = 3000,
  NODE_ENV = 'development',
  FRONTEND_ORIGIN = 'http://localhost:5173',
  SESSION_SECRET = 'change-me',
  USE_MOCK = '1',

  // TikTok OAuth
  TIKTOK_CLIENT_KEY,
  TIKTOK_CLIENT_SECRET,
  REDIRECT_URI = 'http://localhost:3000/auth/tiktok/callback',
  TIKTOK_AUTH_BASE = 'https://www.tiktok.com/v2/auth/authorize/',
  TIKTOK_TOKEN_URL = 'https://open-api.tiktok.com/oauth/access_token/',
  TIKTOK_SCOPE = 'user.info.basic',
} = process.env;

const isMock = USE_MOCK === '1';

app.use(express.json());
app.use(cookieParser(SESSION_SECRET));
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));

// --- Simple in-memory session (dev only) ---
let SESSION = { user: null, token: null };

// --- Health ---
app.get('/health', (req, res) => res.json({ ok: true, env: NODE_ENV, mock: isMock }));

// ===== AUTH =====
app.get('/auth/tiktok/login', (req, res) => {
  if (isMock) {
    SESSION.user = {
      open_id: 'mock_user_123',
      display_name: 'Andreas (Mock)',
      avatar_url: 'https://i.pravatar.cc/150?img=12',
    };
    return res.redirect(FRONTEND_ORIGIN);
  }
  if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) {
    return res.status(500).json({ ok:false, error:'Missing TikTok client credentials' });
  }
  const state = Math.random().toString(36).slice(2);
  const url = new URL(TIKTOK_AUTH_BASE);
  url.searchParams.set('client_key', TIKTOK_CLIENT_KEY);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', TIKTOK_SCOPE);
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('state', state);
  res.redirect(url.toString());
});

app.get('/auth/tiktok/callback', async (req, res) => {
  try {
    if (isMock) return res.redirect(FRONTEND_ORIGIN);
    const { code, error, error_description } = req.query;
    if (error) return res.status(400).send(`TikTok error: ${error_description || error}`);
    if (!code) return res.status(400).send('Missing code');

    const tokenRes = await fetch(TIKTOK_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || (tokenJson.data && tokenJson.data.error_code)) {
      return res.status(500).send(`Token exchange failed: ${JSON.stringify(tokenJson)}`);
    }
    const data = tokenJson.data || tokenJson;
    SESSION.token = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      open_id: data.open_id,
      scope: data.scope,
      expires_in: data.expires_in,
      obtained_at: Date.now(),
    };
    SESSION.user = {
      open_id: data.open_id || 'unknown',
      display_name: 'TikTok User',
      avatar_url: 'https://i.pravatar.cc/150?img=5',
    };
    return res.redirect(FRONTEND_ORIGIN);
  } catch (e) {
    console.error('OAuth callback error', e);
    return res.status(500).send('OAuth error');
  }
});

app.post('/auth/logout', (req, res) => { SESSION = { user:null, token:null }; res.json({ ok:true }); });
app.get('/api/me', (req, res) => { if(!SESSION.user) return res.status(401).json({ ok:false, error:'not_authenticated' }); res.json({ ok:true, user:SESSION.user }); });
app.get('/api/trends', (req, res) => { if(!SESSION.user) return res.status(401).json({ ok:false, error:'not_authenticated' }); res.json({ ok:true, data:[
  { id:'t1', hashtag:'#CityNights', velocity:0.92, postsToday:124000, ctrHint:'Good for night-life clips' },
  { id:'t2', hashtag:'#WinterVibes', velocity:0.87, postsToday:98000, ctrHint:'Cozy indoor scenes perform' },
  { id:'t3', hashtag:'#DIYHack', velocity:0.81, postsToday:143000, ctrHint:'Step-by-step format' },
]});});
app.get('/api/stats', (req, res) => { if(!SESSION.user) return res.status(401).json({ ok:false, error:'not_authenticated' }); res.json({ ok:true, stats:{ followers:12890, views7d:423000, engagementRate:0.062, posts:214 }}); });
app.post('/api/auto-boost', (req, res) => { if(!SESSION.user) return res.status(401).json({ ok:false, error:'not_authenticated' }); res.json({ ok:true, message:'Auto-Boost gestartet.' }); });

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`✅ API on :${PORT}`);
  console.log(`   FRONTEND_ORIGIN: ${FRONTEND_ORIGIN}`);
  console.log(`   REDIRECT_URI   : ${REDIRECT_URI}`);
  console.log(`   MOCK           : ${isMock}`);
});
