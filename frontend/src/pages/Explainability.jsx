import { useApi } from '../useApi';
import { Loading, ErrorState } from '../components/States';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const FEATURE_DESCRIPTIONS = {
  'Promotion Flag':      'Products on promotion sell significantly more units. Promotions are the strongest demand driver.',
  'Lag 1 (Yesterday)':  "Yesterday's sales strongly predict today's demand — demand has momentum.",
  'Rolling Mean 7d':    '7-day average smooths out noise and captures the underlying weekly demand trend.',
  'Lag 7 (Last Week)':  'Same-day last week sales reveal weekly seasonality patterns.',
  'Rolling Mean 14d':   '14-day average captures medium-term demand shifts and trend direction.',
  'Discount %':         'Price reductions drive volume. Higher discounts correlate with higher unit sales.',
  'Days of Inventory':  'Low inventory days signal upcoming stock-out risk and affect ordering urgency.',
  'Festival Flag':      'Festival periods cause demand spikes — critical for pre-festival stock planning.',
  'Weekend Flag':       'Weekend shopping patterns differ from weekdays across store formats.',
  'Day of Week':        'Specific days show consistent high/low demand — useful for weekly planning.',
  'Holiday':            'Public holidays shift demand timing and volume.',
  'Local Event':        'Local events near stores temporarily boost foot traffic and sales.',
  'Temperature (°C)':   'Temperature affects demand for beverages, dairy and seasonal products.',
  'Rain (mm)':          'Rainfall reduces store visits but may increase certain category purchases.',
};

const COLORS = ['#f5a623','#f5a623cc','#f5a62399','#3b82f6','#3b82f6cc','#22c55e','#22c55ecc','#8b5cf6','#ef4444','#06b6d4','#f97316','#ec4899','#14b8a6','#a78bfa'];

export default function Explainability() {
  const { data, loading, error } = useApi('/api/feature-importance');

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="section-title">Model Explainability</div>
        <div className="section-sub">What drives demand predictions — feature importance from the ML pipeline</div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Feature Importance (Correlation with Demand)</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>
          Absolute correlation between each feature and 7-day demand. Higher bar = stronger demand driver.
        </div>
        {loading ? <Loading /> : error ? <ErrorState message={error} /> : (
          <ResponsiveContainer width="100%" height={Math.max(280, (data?.length || 8) * 32)}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 60, bottom: 0, left: 140 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text2)' }} domain={[0, 1]}
                tickFormatter={v => v.toFixed(2)} />
              <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fill: 'var(--text)' }} width={140} />
              <Tooltip
                formatter={v => [(v * 100).toFixed(1) + '%', 'Importance']}
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="importance" name="Importance" radius={[0, 4, 4, 0]}>
                {data?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top 3 feature cards */}
      {!loading && !error && data && data.length > 0 && (
        <div className="grid-3">
          {data.slice(0, 3).map((d, i) => (
            <div key={d.feature} className="card" style={{ borderColor: i === 0 ? 'var(--accent)44' : 'var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{d.feature}</span>
                <span style={{ fontSize: 10, background: 'var(--accent-dim)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                  #{i + 1}
                </span>
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--accent)' }}>{(d.importance * 100).toFixed(1)}%</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>correlation with demand</div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${d.importance * 100}%`, background: 'var(--accent)', borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 12, lineHeight: 1.5 }}>
                {FEATURE_DESCRIPTIONS[d.feature] || 'Influences demand prediction.'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All features explanation table */}
      {!loading && !error && data && data.length > 3 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 12px', fontWeight: 700, borderBottom: '1px solid var(--border)' }}>
            All Features — Manager Guide
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Feature</th>
                <th>Importance</th>
                <th>What it means for you</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={d.feature}>
                  <td style={{ color: 'var(--text3)', fontWeight: 600 }}>#{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{d.feature}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${d.importance * 100}%`, background: COLORS[i % COLORS.length], borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{(d.importance * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                    {FEATURE_DESCRIPTIONS[d.feature] || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
