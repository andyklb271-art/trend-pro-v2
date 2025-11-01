import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";

const router = express.Router();

const val =(v)=>(v??"").toString().trim();
const KEY   = val(process.env.TIKTOK_CLIENT_KEY);
const SEC   = val(process.env.TIKTOK_CLIENT_SECRET);
const REDI  = val(process.env.REDIRECT_URI);
const FRONT = val(process.env.FRONTEND_ORIGIN || "https://trend-pro.onrender.com");
const SCOPES= val(process.env.TIKTOK_SCOPES || "user.info.basic user.info.profile");

// ==== Debug
router.get("/debug",(_req,res)=>{
  res.json({ key_present: !!KEY, secret_present: !!SEC, redirect_uri: REDI, front: FRONT, scopes: SCOPES });
});

// ==== PKCE helpers
const b64url = (b)=>b.toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const genV = ()=> b64url(crypto.randomBytes(64));
const chal = (v)=> b64url(crypto.createHash("sha256").update(v).digest());

// ==== Login (mit PKCE vorbereitet)
router.get("/login",(req,res)=>{
  const state = crypto.randomBytes(16).toString("hex");
  const ver = genV(); const ch = chal(ver);
  res.cookie("tt_code_verifier", ver, { httpOnly:true, sameSite:"lax", secure:true });

  const u = new URL("https://www.tiktok.com/v2/auth/authorize/");
  u.searchParams.set("client_key", KEY);
  u.searchParams.set("scope", SCOPES);              // SPACE-separated!
  u.searchParams.set("response_type", "code");
  u.searchParams.set("redirect_uri", REDI);
  u.searchParams.set("state", state);
  u.searchParams.set("code_challenge", ch);
  u.searchParams.set("code_challenge_method", "S256");
  res.redirect(u.toString());
});

async function exchange(body){
  const form = new URLSearchParams(body);
  const r = await fetch("https://open.tiktokapis.com/v2/oauth/token/",{
    method:"POST",
    headers:{ "Content-Type":"application/x-www-form-urlencoded" },
    body: form.toString()
  });
  const text = await r.text();
  let data; try{ data = JSON.parse(text);} catch { data = { raw: text }; }
  return { r, data };
}

// ==== Callback (erst minimal 5 Felder, dann PKCE-Fallback)
router.get("/callback", async (req,res)=>{
  const { code, error, error_description } = req.query;
  if (error) return res.status(400).send(`TikTok Error: ${error} - ${error_description || "n/a"}`);
  if (!code)  return res.status(400).send("Missing ?code");

  const decoded = decodeURIComponent(String(code));
  const base = {
    client_key: KEY,
    client_secret: SEC,
    code: decoded,
    grant_type: "authorization_code",
    redirect_uri: REDI
  };

  try {
    // Versuch A – minimal
    let { r, data } = await exchange(base);
    if (r.ok && !data?.error && !data?.error_code && !data?.data?.error_code) {
      return res.redirect(`${FRONT}/?auth=ok`);
    }

    // Versuch B – bei 10002 mit PKCE
    const ec = data?.error_code || data?.data?.error_code;
    if (ec === 10002) {
      const ver = req.cookies?.tt_code_verifier;
      const bodyB = ver ? { ...base, code_verifier: ver } : base;
      ({ r, data } = await exchange(bodyB));
      if (r.ok && !data?.error && !data?.error_code && !data?.data?.error_code) {
        res.clearCookie("tt_code_verifier");
        return res.redirect(`${FRONT}/?auth=ok`);
      }
    }

    return res.status(400).type("text").send("Token exchange failed: " + JSON.stringify(data));
  } catch (e) {
    return res.status(500).send("Token fetch failed: " + e.message);
  }
});

export default router;
