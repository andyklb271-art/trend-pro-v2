const { TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, REDIRECT_URI } = process.env;

const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const AUTH_URL  = "https://www.tiktok.com/v2/auth/authorize/";

export function buildAuthUrl({ state = "tp", scope = "user.info.basic" } = {}) {
  const u = new URL(AUTH_URL);
  u.searchParams.set("client_key", TIKTOK_CLIENT_KEY);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", scope);
  u.searchParams.set("redirect_uri", REDIRECT_URI);
  u.searchParams.set("state", state);
  return u.toString();
}

export async function exchangeCodeForToken(code) {
  const body = {
    client_key: TIKTOK_CLIENT_KEY,
    client_secret: TIKTOK_CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT_URI,
  };
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Token exchange failed: ${r.status} ${await r.text()}`);
  return r.json();
}

export async function refreshToken(refresh_token) {
  const body = {
    client_key: TIKTOK_CLIENT_KEY,
    client_secret: TIKTOK_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token,
  };
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Refresh failed: ${r.status} ${await r.text()}`);
  return r.json();
}

export async function getUserInfo(access_token) {
  const r = await fetch("https://open.tiktokapis.com/v2/user/info/", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
  });
  if (!r.ok) throw new Error(`user/info failed: ${r.status} ${await r.text()}`);
  return r.json();
}
