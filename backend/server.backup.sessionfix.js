import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import fetch from 'node-fetch';

const {
  PORT = 3000,
  NODE_ENV = 'production',
  FRONTEND_ORIGIN = 'http://localhost:5173',
  REDIRECT_URI = 'https://trend-pro.onrender.com/auth/tiktok/callback',
  TIKTOK_CLIENT_KEY,
  TIKTOK_CLIENT_SECRET,
  SESSION_SECRET = 'change-me'
} = process.env;

// =============================================================
// Session-Objekt bleibt im RAM (später Redis/Upstash möglich)
// =============================================================
const SESSION = { state: null, oauth: null };

// =============================================================
// App Setup
// =============================================================
const app = express();
app.use(express.json());
app.use(cookieParser(SESSION_SECRET));

// --- CORS fix ---
app.use(cors({
  origin: [FRONTEND_ORIGIN],
  credentials: true,
  methods: ['GET','POST'],
  allowedHeaders: ['Content-Type','Authorization','Origin','Accept'],
  exposedHeaders: ['Set-Cookie']
}));

// =============================================================
// TikTok OAuth
// =============================================================
function buildAuthUrl() {
  const state = crypto.randomBytes(16).toString('hex');
  SESSION.state = state;
  const p = new URLSearchParams({
    client_key: TIKTOK_CLIENT_KEY,
    scope: 'user.info.basic',
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    state
  });
  return 'https://www.tiktok.com/v2/auth/authorize/?' + p.toString();
}

async function exchangeCodeForToken(code) {
  const params = new URLSearchParams();
  params.append('client_key', TIKTOK_CLIENT_KEY);
  params.append('client_secret', TIKTOK_CLIENT_SECRET);
  params.append('grant_type', 'authorization_code');
  params.append('redirect_uri', REDIRECT_URI);
  params.append('code', code);

  const resp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: params.toString(),
  });

  const text = await resp.text();
  if (!resp.ok) {
    console.error('❌ Token error:', text);
    throw new Error('Token exchange failed: ' + resp.status);
  }

  const json = JSON.parse(text);
  console.log('✅ Token erhalten:', json);
  return json;
}


// =============================================================
// Routes
// =============================================================
app.get('/health', (_req, res) => {
  res.json({ ok:true, env:{ FRONTEND_ORIGIN, REDIRECT_URI }, has_token: !!SESSION.oauth });
});

app.get('/auth/tiktok/login', (_req,res)=>{
  res.redirect(buildAuthUrl());
});

app.get('/auth/tiktok/callback', async (req,res)=>{
  try {
    const { code, state } = req.query;
    if (!code || !state || state !== SESSION.state) return res.status(400).send('Invalid state');
    const tokenJson = await exchangeCodeForToken(code);
    SESSION.oauth = tokenJson;
    console.log('✅ Token erhalten:', tokenJson);
    res.cookie('logged_in','1',{
      httpOnly:false,
      secure:true,
      sameSite:'none',
      domain:'.onrender.com',
      path:'/',
      maxAge:7*24*60*60*1000
    });
    return res.redirect(FRONTEND_ORIGIN + '/?auth=success');
  } catch(e){
    res.status(500).send('Callback error: ' + e.message);
  }
});

app.get('/auth/tiktok/debug', (_req,res)=>{
  res.json({
    env:{ FRONTEND_ORIGIN, REDIRECT_URI },
    session:{ has_token: !!SESSION.oauth, oauth: SESSION.oauth }
  });
});

app.get('/api/me', async (_req,res)=>{
  try {
    if (!SESSION.oauth?.access_token) return res.status(401).json({error:'Not authenticated'});
    const data = await getUserInfo(SESSION.oauth.access_token);
    res.json({data});
  } catch(e){
    res.status(500).json({error:e.message});
  }
});

// =============================================================
app.listen(PORT, '0.0.0.0', ()=>{
  console.log('✅ API on :' + PORT);
});
