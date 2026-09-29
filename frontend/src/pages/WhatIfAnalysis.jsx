import { useState, useEffect } from 'react';
import { apiFetch } from '../api';

function ImpactCard({ demandImpact, stockoutImpact, extra }) {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 20 }}>
      <div className="card" style={{ flex: 1, minWidth: 160, borderColor: demandImpact >= 0 ? 'var(--green)33' : 'var(--red)33' }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 8 }}>PREDICTED DEMAND IMPACT</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: demandImpact >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {demandImpact >= 0 ? '+' : ''}{demandImpact}%
        </div>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>vs baseline demand</div>
      </div>
      <div className="card" style={{ flex: 1, minWidth: 160, borderColor: stockoutImpact <= 0 ? 'var(--green)33' : 'var(--red)33' }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 8 }}>STOCK-OUT RISK IMPACT</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: stockoutImpact <= 0 ? 'var(--green)' : 'var(--red)' }}>
          {stockoutImpact >= 0 ? '+' : ''}{stockoutImpact}%
        </div>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>change in risk level</div>
      </div>
      {extra && (
        <div className="card" style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 8 }}>{extra.label}</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)' }}>{extra.value}</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{extra.sub}</div>
        </div>
      )}
    </div>
  );
}

function DiscountTab() {
  const [discount, setDiscount] = useState(10);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    setLoading(true);
    apiFetch('/api/what-if/discount', { discount })
      .then(d => { setResult(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [discount]);

  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 16 }}>Simulate the impact of a store-wide discount</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: 'var(--text2)' }}>Discount Level</span>
            <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 20 }}>{discount}%</span>
          </div>
          <input type="range" min={0} max={50} value={discount} onChange={e => setDiscount(+e.target.value)}
            style={{ width: '100%', accentColor: 'var(--accent)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
            <span>0%</span><span>25%</span><span>50%</span>
          </div>
        </div>
      </div>
      {loading ? <div style={{ color: 'var(--text2)', marginTop: 16 }}>Calculating…</div> : result && (
        <ImpactCard demandImpact={result.demandImpact} stockoutImpact={result.stockoutImpact} />
      )}
    </div>
  );
}

function SupplierDelayTab() {
  const [days, setDays]   = useState(3);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiFetch('/api/what-if/supplier-delay', { days })
      .then(d => { setResult(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [days]);

  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 16 }}>Simulate supplier delivery delay impact on stock levels</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: 'var(--text2)' }}>Delay Duration</span>
            <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 20 }}>{days} days</span>
          </div>
          <input type="range" min={1} max={14} value={days} onChange={e => setDays(+e.target.value)}
            style={{ width: '100%', accentColor: 'var(--accent)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
            <span>1 day</span><span>7 days</span><span>14 days</span>
          </div>
        </div>
      </div>
      {loading ? <div style={{ color: 'var(--text2)', marginTop: 16 }}>Calculating…</div> : result && (
        <ImpactCard
          demandImpact={result.demandImpact}
          stockoutImpact={result.stockoutRiskIncrease}
          extra={{ label: 'PRODUCTS AT RISK', value: result.atRiskProducts, sub: 'SKUs that may stock out' }}
        />
      )}
    </div>
  );
}

function FestivalTab() {
  const [intensity, setIntensity] = useState(3);
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const labels = ['', 'Very Low', 'Low', 'Moderate', 'High', 'Very High'];

  useEffect(() => {
    setLoading(true);
    apiFetch('/api/what-if/festival', { intensity })
      .then(d => { setResult(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [intensity]);

  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 16 }}>Simulate festival season demand surge</div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
          <span style={{ color: 'var(--text2)' }}>Festival Intensity</span>
          <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 16 }}>{labels[intensity]}</span>
        </div>
        <input type="range" min={1} max={5} value={intensity} onChange={e => setIntensity(+e.target.value)}
          style={{ width: '100%', accentColor: 'var(--accent)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
          {labels.slice(1).map(l => <span key={l}>{l}</span>)}
        </div>
      </div>
      {loading ? <div style={{ color: 'var(--text2)', marginTop: 16 }}>Calculating…</div> : result && (
        <ImpactCard
          demandImpact={result.demandImpact}
          stockoutImpact={result.stockoutImpact}
        />
      )}
    </div>
  );
}

const TABS = [
  { id: 'discount', label: '🏷️ Discount' },
  { id: 'delay',    label: '🚚 Supplier Delay' },
  { id: 'festival', label: '🎉 Festival Demand' },
];

export default function WhatIfAnalysis() {
  const [tab, setTab] = useState('discount');
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="section-title">What-If Analysis</div>
        <div className="section-sub">Simulate scenarios and see predicted impact on demand and stock-out risk</div>
      </div>

      <div className="tabs" style={{ alignSelf: 'flex-start' }}>
        {TABS.map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {tab === 'discount' && <DiscountTab />}
        {tab === 'delay'    && <SupplierDelayTab />}
        {tab === 'festival' && <FestivalTab />}
      </div>

      <div className="card" style={{ background: 'var(--bg2)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
        ⚠️ <strong style={{ color: 'var(--text)' }}>Disclaimer:</strong> What-If values are computed using elasticity models derived from the actual transaction and inventory data.
        Results are indicative estimates for planning purposes.
      </div>
    </div>
  );
}
