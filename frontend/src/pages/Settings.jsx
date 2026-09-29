export default function Settings() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="section-title">Settings</div>
        <div className="section-sub">Application configuration and preferences</div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Application Info</div>
          {[
            ['Application', 'StockSense'],
            ['Version', '1.0.0'],
            ['Hackathon', 'IntelliData 2026'],
            ['Business', 'NovaMart Retail Pvt. Ltd.'],
            ['Backend', 'http://localhost:4000'],
            ['Data Source', 'CSV files (data/)'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span style={{ color: 'var(--text2)' }}>{k}</span>
              <span style={{ fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Data Files</div>
          {['transactions.csv','products.csv','stores.csv','inventory.csv','external_factors.csv'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span style={{ color: 'var(--green)', fontSize: 16 }}>✓</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>data/{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)33' }}>
        <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>🔧 Data Quality Notes</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.8 }}>
          The data pipeline automatically handles: duplicate transactions (removed by transaction_id), negative/zero quantities (filtered out),
          category casing inconsistencies (normalized to Title Case), missing temperature/rain values (treated as null),
          and inventory balance mismatches (flagged in Manager Action Centre).
        </div>
      </div>
    </div>
  );
}
