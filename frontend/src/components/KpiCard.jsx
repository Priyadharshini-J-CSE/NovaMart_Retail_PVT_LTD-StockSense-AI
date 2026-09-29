export default function KpiCard({ title, value, sub, trend, trendUp, icon, accent }) {
  const trendColor = trendUp === undefined ? 'var(--text2)' : trendUp ? 'var(--green)' : 'var(--red)';
  const trendIcon  = trendUp === undefined ? '' : trendUp ? '↑' : '↓';
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      {accent && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, var(--accent), transparent)',
        }} />
      )}
      <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </span>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
      {sub && (
        <div style={{ marginTop: 8, fontSize: 12, color: trendColor, display: 'flex', alignItems: 'center', gap: 4 }}>
          {trendIcon && <span>{trendIcon}</span>}
          <span>{sub}</span>
        </div>
      )}
    </div>
  );
}
