import { useFilters } from '../FilterContext';
import { useApi } from '../useApi';
import { Loading, ErrorState } from '../components/States';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#f5a623','#3b82f6','#22c55e','#8b5cf6','#ef4444','#06b6d4','#f97316'];
const fmt = n => n >= 1e6 ? `₹${(n/1e6).toFixed(2)}M` : n >= 1e3 ? `₹${(n/1e3).toFixed(1)}K` : `₹${n}`;

export default function DemandIntelligence() {
  const { filters } = useFilters();
  const p = { startDate: filters.startDate, endDate: filters.endDate, city: filters.city };
  const dem = useApi('/api/demand-forecast', p);
  const rev = useApi('/api/revenue-by-category', p);

  // Last 7 data points as "7-day forecast"
  const forecast7 = dem.data ? dem.data.slice(-7) : [];

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="section-title">Demand Intelligence</div>
        <div className="section-sub">Revenue analytics and demand forecasting across stores and products</div>
      </div>

      {/* Full time-series */}
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Demand Forecast vs Actual Sales</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
          Solid line = actual daily units sold · Dashed line = ML model predicted demand
        </div>
        {dem.loading ? <Loading /> : dem.error ? <ErrorState message={dem.error} /> : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dem.data} margin={{ top: 4, right: 16, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text2)' }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="actual" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3 }} name="Actual Demand" />
              <Line type="monotone" dataKey="predicted" stroke="var(--blue)" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Predicted Demand" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 7-day forecast table */}
      {!dem.loading && !dem.error && forecast7.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 12px', fontWeight: 700, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            7-Day Demand Forecast
            <span style={{ fontSize: 11, background: 'var(--accent-dim)', color: 'var(--accent)', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>ML Model</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Actual Units</th>
                <th>Predicted Units</th>
                <th>Variance</th>
                <th>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {forecast7.map(d => {
                const variance = d.predicted - d.actual;
                const accuracy = d.actual > 0 ? Math.max(0, 100 - Math.abs(variance / d.actual) * 100) : null;
                return (
                  <tr key={d.date}>
                    <td style={{ fontWeight: 600 }}>{d.date}</td>
                    <td>{d.actual.toLocaleString()}</td>
                    <td style={{ color: 'var(--blue)', fontWeight: 600 }}>{d.predicted.toLocaleString()}</td>
                    <td style={{ color: variance >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {variance >= 0 ? '+' : ''}{variance}
                    </td>
                    <td>
                      {accuracy !== null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 50, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${accuracy}%`, background: accuracy >= 80 ? 'var(--green)' : accuracy >= 60 ? 'var(--accent)' : 'var(--red)', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text2)' }}>{accuracy.toFixed(0)}%</span>
                        </div>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Revenue breakdown */}
      <div className="grid-2">
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Revenue by Category</div>
          {rev.loading ? <Loading /> : rev.error ? <ErrorState message={rev.error} /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={rev.data} dataKey="revenue" nameKey="category"
                  cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={3}
                  label={({ pct }) => `${pct}%`} labelLine={false}>
                  {rev.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => fmt(v)} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Category Revenue Breakdown</div>
          {rev.loading ? <Loading /> : rev.error ? <ErrorState message={rev.error} /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rev.data.map((d, i) => (
                <div key={d.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ color: 'var(--text)' }}>{d.category}</span>
                    <span style={{ color: 'var(--text2)' }}>{fmt(d.revenue)} · {d.pct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${d.pct}%`, background: COLORS[i % COLORS.length], borderRadius: 3, transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
