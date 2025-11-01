export default function StatCard({ label, value, hint }) {
  return (
    <div className="card">
      <div className="text-slate-400 text-sm">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
      {hint && <div className="text-slate-400 text-xs mt-1">{hint}</div>}
    </div>
  );
}
