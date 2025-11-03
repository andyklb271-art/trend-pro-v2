const API = import.meta.env.VITE_API_BASE || 'https://trend-pro.onrender.com';

export async function getMe() {
  const r = await fetch(${API}/api/me, { credentials: 'include' });
  return r.json();
}

export function loginUrl() {
  return ${API}/auth/tiktok/login;
}
