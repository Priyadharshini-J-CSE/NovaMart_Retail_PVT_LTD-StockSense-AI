import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFilters } from '../FilterContext';
import { useApi } from '../useApi';
import { Loading, ErrorState } from '../components/States';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

export default function InventoryRisk() {
  const { filters } = useFilters();
  const p = { startDate: filters.startDate, endDate: filters.endDate, city: filters.city };
  const heatmap = useApi('/api/inventory-heatmap', p);
  const risk    = useApi('/api/stockout-risk', p);
  const navigate = useNavigate();
  const [tooltip, setTooltip] = useState(null);

  const handleCellClick = (store, category) => {
    navigate(`/dashboard/actions?store=${encodeURIComponent(store)}&category=${encodeURIComponent(category)}`);
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="section-title">Inventory Risk</div>
        <div className="section-sub">Stock-out risk analysis and Store × Category risk matrix</div>
      </div>

      {/* Bar chart */}
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Stock-out Risk by Category</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
          % of SKUs approaching or below reorder level
        </div>
        {risk.loading ? <Loading /> : risk.error ? <ErrorState message={risk.error} /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={risk.data} margin={{ top: 4, right: 16, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="category" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} unit="%" />
              <Tooltip formatter={v => `${v}%`} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="riskPct" name="Risk %" radius={[4, 4, 0, 0]}>
                {risk.data?.map((d, i) => (
                  <Cell key={i} fill={d.riskPct >= 70 ? '#ef4444' : d.riskPct >= 40 ? '#f5a623' : '#22c55e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Heatmap */}
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Store × Category Risk Matrix</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
          Click any cell to filter Manager Action Centre for that store/category
        </div>
        {heatmap.loading ? <Loading /> : heatmap.error ? <ErrorState message={heatmap.error} /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 4, minWidth: 500 }}>
              <thead>
                <tr>
                  <th style={{ padding: '6px 12px', fontSize: 11, color: 'var(--text2)', textAlign: 'left', fontWeight: 600 }}>Store</th>
                  {heatmap.data.categories.map(cat => (
                    <th key={cat} style={{ padding: '6px 8px', fontSize: 10, color: 'var(--text2)', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {cat}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmap.data.stores.map(store => (
                  <tr key={store}>
                    <td style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                      {store}
                    </td>
                    {heatmap.data.categories.map(cat => {
                      const cell = heatmap.data.cells.find(c => c.store === store && c.category === cat);
                      const risk = cell?.risk || 'Low';
                      const cls  = `heatmap-cell heatmap-${risk.toLowerCase()}`;
                      return (
                        <td key={cat} style={{ padding: 3 }}>
                          <div
                            className={cls}
                            onClick={() => handleCellClick(store, cat)}
                            title={`${store} × ${cat}: ${risk} risk`}
                          >
                            {risk}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 11 }}>
          {[['High','#ef4444'],['Medium','#f5a623'],['Low','#22c55e']].map(([label, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color + '44', border: `1px solid ${color}` }} />
              <span style={{ color: 'var(--text2)' }}>{label} Risk</span>
            </div>
          ))}
          <span style={{ color: 'var(--text3)', marginLeft: 8 }}>↑ Click a cell to filter actions</span>
        </div>
      </div>
    </div>
  );
}
