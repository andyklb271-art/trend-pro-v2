import { useEffect, useState } from "react";
import { login, logout, getMe, getStats, getTrends, startAutoBoost } from "./api";

function Header({ user, onLogin, onLogout }) {
  return (
    <header className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Trend-Pro v2</h1>
          <p className="text-slate-300">AI-Powered TikTok Optimizer</p>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <img src={user.avatar_url} alt="avatar" className="w-10 h-10 rounded-full" />
              <span className="text-slate-200">{user.display_name}</span>
              <button className="btn btn-ghost" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={onLogin}>Mit TikTok verbinden</button>
          )}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function refreshAll() {
    try {
      const me = await getMe(); setUser(me.user);
      const s = await getStats(); setStats(s.stats);
      const tr = await getTrends(); setTrends(tr.data);
    } catch (e) {}
  }
  useEffect(() => { refreshAll(); }, []);

  const handleLogin = () => {
    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";
    window.location.href = `${API_BASE}/auth/tiktok/login`;
  };
  const handleLogout = async () => {
    setBusy(true); setMsg("");
    try { await logout(); setUser(null); setStats(null); setTrends([]); } finally { setBusy(false); }
  };
  const handleAutoBoost = async (mode) => {
    setBusy(true); setMsg("");
    try { const r = await startAutoBoost(mode); setMsg(r.message || "Auto-Boost gestartet."); }
    catch { setMsg("Aktion fehlgeschlagen. Bitte einloggen."); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <Header user={user} onLogin={handleLogin} onLogout={handleLogout} />
      {msg && (<div className="mb-6 card text-sm text-slate-200">{msg}</div>)}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card"><div className="text-slate-400 text-sm">Follower</div><div className="text-3xl font-bold">{stats ? stats.followers.toLocaleString() : "—"}</div></div>
        <div className="card"><div className="text-slate-400 text-sm">Views (7d)</div><div className="text-3xl font-bold">{stats ? stats.views7d.toLocaleString() : "—"}</div></div>
        <div className="card"><div className="text-slate-400 text-sm">Engagement</div><div className="text-3xl font-bold">{stats ? `${(stats.engagementRate*100).toFixed(1)}%` : "—"}</div></div>
        <div className="card"><div className="text-slate-400 text-sm">Posts</div><div className="text-3xl font-bold">{stats ? stats.posts : "—"}</div></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Heutige Trends</h3>
              <span className="text-slate-400 text-sm">mocked feed</span>
            </div>
            <div className="space-y-3">
              {trends.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl">
                  <div className="font-medium">{t.hashtag}</div>
                  <div className="text-sm text-slate-300">Velocity: {(t.velocity*100).toFixed(0)}% · Posts: {t.postsToday.toLocaleString()}</div>
                  <div className="text-xs text-slate-400">{t.ctrHint}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card space-y-4">
          <h3 className="text-xl font-semibold">Auto-Boost</h3>
          <p className="text-slate-300 text-sm">Erzeuge/plane Content basierend auf aktuellen Trends.</p>
          <div className="flex gap-3">
            <button className="btn btn-primary" disabled={busy} onClick={() => handleAutoBoost('safe')}>Start (Safe)</button>
            <button className="btn btn-ghost" disabled={busy} onClick={() => handleAutoBoost('aggressive')}>Aggressiv</button>
          </div>
          <div className="text-xs text-slate-400">Tipp: Safe für stabile Ergebnisse; Aggressiv pusht Reichweite.</div>
        </div>
      </div>
    </div>
  );
}
