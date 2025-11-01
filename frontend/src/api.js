const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";
export async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}
export const login = () => api("/auth/tiktok/login");
export const logout = () => api("/auth/logout", { method:"POST" });
export const getMe = () => api("/api/me");
export const getTrends = () => api("/api/trends");
export const getStats = () => api("/api/stats");
export const startAutoBoost = (mode="safe") => api("/api/auto-boost", { method:"POST", body:{ mode } });
