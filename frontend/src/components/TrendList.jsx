export default function TrendList({ items = [] }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Heutige Trends</h3>
        <span className="text-slate-400 text-sm">mocked feed</span>
      </div>
      <div className="space-y-3">
        {items.map(t => (
          <div key={t.id} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl">
            <div className="font-medium">{t.hashtag}</div>
            <div className="text-sm text-slate-300">Velocity: {(t.velocity*100).toFixed(0)}% · Posts: {t.postsToday.toLocaleString()}</div>
            <div className="text-xs text-slate-400">{t.ctrHint}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
