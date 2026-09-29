import { useApi } from '../useApi';
import { Loading, ErrorState } from '../components/States';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

function MetricCard({ label, value, unit = '', desc, highlight, color }) {
  return (
    <div className="card" style={{ textAlign: 'center', borderColor: highlight ? 'var(--accent)44' : 'var(--border)' }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: color || 'var(--accent)' }}>{value}{unit}</div>
      <div style={{ fontWeight: 600, marginTop: 6, fontSize: 13 }}>{label}</div>
      {desc && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{desc}</div>}
    </div>
  );
}

function InfoRow({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
      <span style={{ color: 'var(--text2)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: accent ? 'var(--accent)' : 'var(--text)' }}>{value}</span>
    </div>
  );
}

const MODEL_COLORS = ['#f5a623','#3b82f6','#22c55e','#8b5cf6','#ef4444','#06b6d4','#f97316'];
const XGB_BLUE = '#3b82f6';

export default function ModelPerformance() {
  const { data, loading, error } = useApi('/api/model-performance');
  const fi = useApi('/api/feature-importance');

  // Radar data for XGBoost metrics
  const radarData = data ? [
    { metric: 'Accuracy',  value: data.classification.accuracy },
    { metric: 'Precision', value: data.classification.precision },
    { metric: 'Recall',    value: data.classification.recall },
    { metric: 'F1-Score',  value: data.classification.f1 },
    { metric: 'ROC-AUC',  value: data.classification.rocAuc },
  ] : [];

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <div className="section-title">Model Performance</div>
        <div className="section-sub">Model 1 — SVM Demand Forecast · Model 2 — XGBoost Stock-out Risk Classifier</div>
      </div>

      {loading ? <Loading /> : error ? <ErrorState message={error} /> : (
        <>
          {/* ── MODEL 1: REGRESSION ── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ background: 'var(--accent-dim)', color: 'var(--accent)', padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>MODEL 1 · REGRESSION</span>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Demand Forecast — {data.regression.model}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
              Best model selected by highest Test R² across 7 algorithms trained on Store × Product × Date features
            </div>
            <div className="grid-4">
              <MetricCard label="MAE"  value={data.regression.mae}  desc="Mean Absolute Error (units)" highlight />
              <MetricCard label="RMSE" value={data.regression.rmse} desc="Root Mean Squared Error" />
              <MetricCard label="MAPE" value={data.regression.mape} unit="%" desc="Mean Absolute % Error" />
              <MetricCard label="R²"   value={data.regression.r2}   desc="Coefficient of Determination" />
            </div>
          </section>

          {/* Model Comparison Chart */}
          {data.allModels?.length > 0 && (
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Model 1 — Algorithm Comparison (Test MAE)</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
                Lower MAE = better accuracy · Highlighted bar = selected model
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.allModels} margin={{ top: 4, right: 16, bottom: 44, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="model" tick={{ fontSize: 10, fill: 'var(--text2)' }} angle={-20} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <Tooltip
                    formatter={(v, n) => [isNaN(v) ? 'N/A' : v.toFixed(4), n]}
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="testMae" name="Test MAE" radius={[4, 4, 0, 0]}>
                    {data.allModels.map((d, i) => (
                      <Cell key={i} fill={d.model === data.regression.model ? 'var(--accent)' : MODEL_COLORS[i % MODEL_COLORS.length] + '88'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Model Comparison Table */}
          {data.allModels?.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px 12px', fontWeight: 700, borderBottom: '1px solid var(--border)' }}>
                Model 1 — Full Algorithm Comparison Table
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Algorithm</th>
                      <th>Val MAE</th>
                      <th>Val RMSE</th>
                      <th>Test MAE</th>
                      <th>Test RMSE</th>
                      <th>Test MAPE %</th>
                      <th>Test R²</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.allModels.map(m => (
                      <tr key={m.model} style={{ background: m.model === data.regression.model ? 'var(--accent-dim)' : undefined }}>
                        <td style={{ fontWeight: m.model === data.regression.model ? 700 : 400, color: m.model === data.regression.model ? 'var(--accent)' : 'var(--text)' }}>
                          {m.model} {m.model === data.regression.model && '★'}
                        </td>
                        <td>{!m.valMae  || isNaN(m.valMae)  ? '—' : m.valMae.toFixed(4)}</td>
                        <td>{!m.valRmse || isNaN(m.valRmse) ? '—' : m.valRmse.toFixed(4)}</td>
                        <td>{!m.testMae  || isNaN(m.testMae)  ? '—' : m.testMae.toFixed(4)}</td>
                        <td>{!m.testRmse || isNaN(m.testRmse) ? '—' : m.testRmse.toFixed(4)}</td>
                        <td>{!m.testMape || isNaN(m.testMape) ? '—' : m.testMape.toFixed(2)}</td>
                        <td style={{ color: m.testR2 > 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                          {isNaN(m.testR2) ? '—' : m.testR2.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── MODEL 2: XGBOOST CLASSIFIER ── */}
          <section style={{ borderTop: '1px solid var(--border)', paddingTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ background: '#3b82f622', color: XGB_BLUE, padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>MODEL 2 · CLASSIFICATION</span>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Stock-out Risk — {data.classification.model}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>
              Binary classifier predicting stock-out risk per Store × Product · Trained on inventory, sales lag, and external features
            </div>

            {/* XGBoost Architecture Info */}
            <div className="grid-2" style={{ marginBottom: 20 }}>
              <div className="card" style={{ borderColor: '#3b82f633' }}>
                <div style={{ fontWeight: 700, marginBottom: 12, color: XGB_BLUE, fontSize: 13 }}>⚙️ XGBoost Configuration</div>
                <InfoRow label="Algorithm"         value="XGBoost Classifier" accent />
                <InfoRow label="n_estimators"      value="200 trees" />
                <InfoRow label="max_depth"         value="5 levels" />
                <InfoRow label="learning_rate"     value="0.05 (eta)" />
                <InfoRow label="subsample"         value="0.8" />
                <InfoRow label="colsample_bytree"  value="0.8" />
                <InfoRow label="Class Balancing"   value="scale_pos_weight" />
                <InfoRow label="Objective"         value="binary:logistic" />
                <InfoRow label="eval_metric"       value="logloss" />
              </div>

              <div className="card" style={{ borderColor: '#3b82f633' }}>
                <div style={{ fontWeight: 700, marginBottom: 12, color: XGB_BLUE, fontSize: 13 }}>📊 Training Dataset</div>
                <InfoRow label="Target Variable"   value="stockout_flag" accent />
                <InfoRow label="Positive Class"    value="stock_ratio < 1.5× reorder level" />
                <InfoRow label="Negative Class"    value="stock_ratio ≥ 1.5× reorder level" />
                <InfoRow label="Train Samples"     value={data.classification.nTrain ?? '—'} />
                <InfoRow label="Test Samples"      value={data.classification.nTest  ?? '—'} />
                <InfoRow label="Train/Test Split"  value="80% / 20%" />
                <InfoRow label="Total Features"    value="26 features" />
                <InfoRow label="Random State"      value="42" />
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid-5" style={{ marginBottom: 20 }}>
              <MetricCard label="Accuracy"  value={data.classification.accuracy}  unit="%" desc="Overall correct predictions"          color={XGB_BLUE} highlight />
              <MetricCard label="Precision" value={data.classification.precision} unit="%" desc="True positives / predicted positives"  color={XGB_BLUE} />
              <MetricCard label="Recall"    value={data.classification.recall}    unit="%" desc="True positives / actual positives"     color={XGB_BLUE} />
              <MetricCard label="F1-Score"  value={data.classification.f1}        unit="%" desc="Harmonic mean of precision & recall"   color={XGB_BLUE} />
              <MetricCard label="ROC-AUC"   value={data.classification.rocAuc}    unit="%" desc="Area under ROC curve"                  color={XGB_BLUE} />
            </div>

            {/* Radar + Feature Importance side by side */}
            <div className="grid-2">
              {/* Radar chart */}
              <div className="card" style={{ borderColor: '#3b82f633' }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Performance Radar</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>All 5 metrics on a single view</div>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: 'var(--text2)' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: 'var(--text3)' }} />
                    <Radar name="XGBoost" dataKey="value" stroke={XGB_BLUE} fill={XGB_BLUE} fillOpacity={0.25} />
                    <Tooltip formatter={v => `${v}%`} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Top feature importances */}
              <div className="card" style={{ borderColor: '#3b82f633' }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Top Feature Importances</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 12 }}>XGBoost gain-based importance scores</div>
                {fi.loading ? <Loading /> : fi.error ? <ErrorState message={fi.error} /> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {fi.data?.slice(0, 7).map((f, i) => (
                      <div key={f.feature}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: 'var(--text)', fontWeight: i === 0 ? 700 : 400 }}>{f.feature}</span>
                          <span style={{ color: 'var(--text2)' }}>{(f.importance * 100).toFixed(1)}%</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${(f.importance / (fi.data[0]?.importance || 1)) * 100}%`,
                            background: i === 0 ? XGB_BLUE : XGB_BLUE + '88',
                            borderRadius: 3,
                            transition: 'width 0.5s',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* XGBoost feature groups */}
            <div className="card" style={{ marginTop: 4, borderColor: '#3b82f633' }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: XGB_BLUE }}>📋 Feature Groups Used by XGBoost</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  {
                    group: 'Inventory Features',
                    icon: '📦',
                    features: ['reorder_gap', 'stock_ratio', 'days_of_inventory', 'inventory_to_demand_ratio', 'balance_mismatch', 'lead_days'],
                  },
                  {
                    group: 'Sales Lag Features',
                    icon: '📈',
                    features: ['lag_1', 'lag_7', 'rolling_mean_7', 'rolling_mean_14', 'rolling_std_7', 'discount_pct', 'promotion_flag'],
                  },
                  {
                    group: 'External & Calendar',
                    icon: '🌦️',
                    features: ['festival', 'holiday', 'weekend_flag', 'local_event', 'day_of_week', 'month', 'temp_c', 'rain_mm'],
                  },
                ].map(g => (
                  <div key={g.group}>
                    <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8 }}>{g.icon} {g.group}</div>
                    {g.features.map(f => (
                      <div key={f} style={{ fontSize: 11, color: 'var(--text2)', padding: '3px 0', borderBottom: '1px solid var(--border)', fontFamily: 'monospace' }}>
                        {f}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
