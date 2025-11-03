import { useEffect, useState } from 'react';
import { getMe, loginUrl } from './api';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const j = await getMe();               // <-- richtig: /api/me über VITE_API_BASE
        if (j?.data?.data?.user) {
          // TikTok response shape: { data: { user: { open_id, display_name, avatar_url, ... } } }
          setUser(j.data.user);
        } else if (j?.data?.user) {
          setUser(j.data.user);
        }
      } catch (e) {
        setErr(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className='min-h-screen bg-slate-900 text-white p-8'>
      <div className='max-w-xl mx-auto space-y-6'>
        <h1 className='text-3xl font-bold'>Trend Pro · TikTok Login</h1>

        {!user && (
          <a
            href={loginUrl()}
            className='inline-block rounded-xl px-5 py-3 bg-purple-600 hover:bg-purple-500 transition'
          >
            Mit TikTok einloggen
          </a>
        )}

        {loading && <p className='text-slate-300'>Lade Status…</p>}
        {err && <p className='text-red-400 text-sm'>Fehler: {err}</p>}

        {user && (
          <div className='mt-4 rounded-2xl bg-slate-800 p-4 flex items-center gap-4 shadow'>
            {user.avatar_url && (
              <img src={user.avatar_url} alt='avatar' className='w-16 h-16 rounded-full object-cover' />
            )}
            <div>
              <div className='text-lg font-semibold'>{user.display_name || 'Ohne Name'}</div>
              <div className='text-slate-400 text-sm'>open_id: {user.open_id}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
