import { useEffect, useState } from "react";
import { loginWithTikTok, logout } from "./lib/auth";

export default function App(){
  const [user,setUser]=useState<any>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{ (async()=>{
    try{
      const r = await fetch(\\/api/me\,{credentials:'include'});
      const j = await r.json();
      if(j?.user) setUser(j.user);
    }finally{ setLoading(false); }
  })(); },[]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <header className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Trend Pro</h1>
        <div className="flex items-center gap-3">
          {loading ? <span className="text-slate-400">lädt…</span> :
           user ? (
            <>
              <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full"/>
              <span className="text-sm">{user.display_name}</span>
              <button onClick={logout} className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700">Logout</button>
            </>
           ) : (
            <button onClick={loginWithTikTok} className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500">Mit TikTok verbinden</button>
           )
          }
        </div>
      </header>
      <main className="mt-8">
        {user ? <div className="text-slate-300">Verbunden ✅ – open_id: <code className="text-slate-400">{user.open_id}</code></div>
              : <div className="text-slate-400">Bitte verbinde TikTok, um fortzufahren.</div>}
      </main>
    </div>
  );
}
