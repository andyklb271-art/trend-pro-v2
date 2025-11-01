export default function Header({ user, onLogin, onLogout }) {
  return (
    <header className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Trend‑Pro v2</h1>
          <p className="text-slate-300">AI‑Powered TikTok Optimizer</p>
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
