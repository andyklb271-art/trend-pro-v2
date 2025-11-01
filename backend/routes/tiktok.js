import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";

const router = express.Router();

const val  = (v) => (v ?? "").toString().trim();
const KEY  = val(process.env.TIKTOK_CLIENT_KEY);
const SEC  = val(process.env.TIKTOK_CLIENT_SECRET);
const REDI = val(process.env.REDIRECT_URI);
const FRONT= val(process.env.FRONTEND_ORIGIN || "https://trend-pro.onrender.com");
let SCOPES = val(process.env.TIKTOK_SCOPES || "user.info.basic user.info.profile");
SCOPES = SCOPES.replace(/,/g," ").replace(/\s+/g," ").trim();

// PKCE helpers
const b64url = (b)=>b.toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const genV   = ()=> b64url(crypto.randomBytes(64));
const chal   = (v)=> b64url(crypto.createHash("sha256").update(v).digest());

router.get("/debug", (_req,res)=>{
  res.json({ key_present: !!KEY, secret_present: !!SEC, redirect_uri: REDI, front: FRONT, scopes: SCOPES });
});

router.get("/login",(req,res)=>{
  const state = crypto.randomBytes(16).toString("hex");
  const ver = genV(); const ch = chal(ver);
  res.cookie("tt_code_verifier", ver, { httpOnly:true, sameSite:"lax", secure:true });

  const u = new URL("https://www.tiktok.com/v2/auth/authorize/");
  u.searchParams.set("client_key", KEY);
  u.searchParams.set("scope", SCOPES);
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
  let data; try{ data = JSON.parse(text);} catch { data = { raw:text }; }
  return { r, data };
}

async function saveSessionAndRedirect(req, res, tokenData){
  const access = tokenData?.data?.access_token ?? tokenData?.access_token;
  if (!access) {
    return res.status(400).type("text").send("No access_token in token response: "+JSON.stringify(tokenData));
  }
  if (typeof req.__setSession === "function") {
    await req.__setSession({ access_token: access });
  }
  return res.redirect(`${FRONT}/api/me?auth=ok`);
}

router.get("/callback", async (req,res)=>{
  const { code, error, error_description } = req.query;
  if (error) return res.status(400).send(`TikTok Error: ${error} - ${error_description || "n/a"}`);
  if (!code)  return res.status(400).send("Missing ?code");

  const decoded = decodeURIComponent(String(code).trim());
  const base = {
    client_key: KEY,
    client_secret: SEC,
    code: decoded,
    grant_type: "authorization_code",
    redirect_uri: REDI.trim()
  };

  try {
    // Versuch A – minimal
    let { r, data } = await exchange(base);
    if (r.ok && !data?.error && !data?.error_code && !data?.data?.error_code) {
      return saveSessionAndRedirect(req,res,data);
    }

    // Bei 10002 – PKCE
    const ec = data?.error_code || data?.data?.error_code;
    if (ec === 10002) {
      const ver = req.cookies?.tt_code_verifier;
      const bodyB = ver ? { ...base, code_verifier: ver } : base;
      ({ r, data } = await exchange(bodyB));
      if (r.ok && !data?.error && !data?.error_code && !data?.data?.error_code) {
        res.clearCookie("tt_code_verifier");
        return saveSessionAndRedirect(req,res,data);
      }
    }

    return res.status(400).type("text").send("Token exchange failed: "+JSON.stringify(data));
  } catch (e) {
    return res.status(500).send("Token fetch failed: "+e.message);
  }
});

// optional logout
router.post("/logout", async (req,res)=>{
  const sid = req.signedCookies?.sid;
  if (sid && globalThis.SESSIONS?.delete) globalThis.SESSIONS.delete(sid);
  res.clearCookie("sid");
  res.json({ ok:true });
});

export default router;
