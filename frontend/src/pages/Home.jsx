import { useFilters } from '../FilterContext';
import { useApi } from '../useApi';
import KpiCard from '../components/KpiCard';
import { Loading, ErrorState } from '../components/States';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts';

const COLORS = ['#f5a623','#3b82f6','#22c55e','#8b5cf6','#ef4444','#06b6d4','#f97316'];
const fmt = n => n >= 1e7 ? `₹${(n/1e7).toFixed(2)}Cr` : n >= 1e6 ? `₹${(n/1e6).toFixed(2)}M` : n >= 1e3 ? `₹${(n/1e3).toFixed(1)}K` : `₹${n}`;

function DonutCenter({ cx, cy, total }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-8" fontSize="11" fill="var(--text2)">Total</tspan>
      <tspan x={cx} dy="18" fontSize="13" fontWeight="800" fill="var(--accent)">{fmt(total)}</tspan>
    </text>
  );
}

export default function Home() {
  const { filters } = useFilters();
  const p = { startDate: filters.startDate, endDate: filters.endDate, city: filters.city };

  const kpi  = useApi('/api/kpis', p);
  const rev  = useApi('/api/revenue-by-category', p);
  const dem  = useApi('/api/demand-forecast', p);
  const risk = useApi('/api/stockout-risk', p);

  const totalRev = rev.data ? rev.data.reduce((s, r) => s + r.revenue, 0) : 0;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="section-title">Overview Dashboard</div>
        <div className="section-sub">Real-time inventory intelligence for NovaMart Retail</div>
      </div>

      {/* KPI Cards */}
      {kpi.loading ? <Loading /> : kpi.error ? <ErrorState message={kpi.error} /> : (
        <div className="grid-5">
          <KpiCard title="Total Revenue" value={fmt(kpi.data.totalRevenue)} icon="💰"
            sub={`${kpi.data.growthPct >= 0 ? '+' : ''}${kpi.data.growthPct}% vs last 7d`}
            trendUp={kpi.data.growthPct >= 0} accent />
          <KpiCard title="Growth" value={`${kpi.data.growthPct >= 0 ? '+' : ''}${kpi.data.growthPct}%`} icon="📊"
            sub="Week-over-week" trendUp={kpi.data.growthPct >= 0} />
          <KpiCard title="Stock-out Rate" value={`${kpi.data.stockoutRate}%`} icon="⚠️"
            sub="Items out of stock" trendUp={kpi.data.stockoutRate < 10} />
          <KpiCard title="Inventory Value" value={fmt(kpi.data.inventoryValue)} icon="📦"
            sub="Current stock value" />
          <KpiCard title="Products at Risk" value={kpi.data.productsAtRisk} icon="🔴"
            sub="SKUs near reorder level" trendUp={kpi.data.productsAtRisk === 0} />
        </div>
      )}

      {/* Charts Row: donut | line (2 cols) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        {/* Donut */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Revenue by Category</div>
          {rev.loading ? <Loading /> : rev.error ? <ErrorState message={rev.error} /> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={rev.data} dataKey="revenue" nameKey="category"
                  cx="50%" cy="45%" innerRadius={58} outerRadius={88} paddingAngle={2}>
                  {rev.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <DonutCenter cx="50%" cy="45%" total={totalRev} />
                <Tooltip formatter={v => fmt(v)} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Line Chart */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Demand Forecast vs Actual</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 12 }}>
            Solid = actual daily units · Dashed = ML predicted demand
          </div>
          {dem.loading ? <Loading /> : dem.error ? <ErrorState message={dem.error} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dem.data} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text2)' }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text2)' }} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="actual" stroke="var(--accent)" strokeWidth={2} dot={false} name="Actual" />
                <Line type="monotone" dataKey="predicted" stroke="var(--blue)" strokeWidth={2} strokeDasharray="5 3" dot={false} name="Predicted" />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Stock-out Risk Bar */}
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Stock-out Risk by Category</div>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 12 }}>% of SKUs approaching or below reorder level</div>
        {risk.loading ? <Loading /> : risk.error ? <ErrorState message={risk.error} /> : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={risk.data} margin={{ top: 4, right: 16, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="category" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} unit="%" />
              <Tooltip formatter={v => `${v}%`} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="riskPct" name="Risk %" radius={[4, 4, 0, 0]}>
                {risk.data.map((d, i) => (
                  <Cell key={i} fill={d.riskPct >= 70 ? '#ef4444' : d.riskPct >= 40 ? '#f5a623' : '#22c55e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
