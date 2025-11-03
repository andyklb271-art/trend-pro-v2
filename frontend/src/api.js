const API = (path) => (import.meta.env.VITE_API_BASE || "http://localhost:3000") + path;

async function j(r){ if(!r.ok){ const t=await r.text(); throw new Error(`${r.status} ${t}`);} return r.json(); }

export async function getMe(){
  return j(await fetch(API("/api/me"),{credentials:"include"}));
}
export async function getStats(){
  return j(await fetch(API("/api/stats"),{credentials:"include"}));
}
export async function getTrends(){
  return j(await fetch(API("/api/trends"),{credentials:"include"}));
}
export async function startAutoBoost(mode="safe"){
  return j(await fetch(API("/api/auto-boost"),{
    method:"POST",
    headers:{ "Content-Type":"application/json"},
    credentials:"include",
    body: JSON.stringify({mode})
  }));
}
export function gotoTikTokLogin(){
  window.location.href = API("/auth/tiktok/login");
}
export async function logout(){
  return j(await fetch(API("/auth/logout"),{method:"POST",credentials:"include"}));
}
