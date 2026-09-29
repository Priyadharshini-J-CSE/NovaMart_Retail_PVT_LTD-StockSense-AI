export function Loading() {
  return (
    <div className="loading-spinner">
      <div className="spinner" />
      <span>Loading data…</span>
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div style={{ padding: 32, textAlign: 'center', color: 'var(--red)' }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>⚠</div>
      <div style={{ fontWeight: 600 }}>Failed to load data</div>
      <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 4 }}>{message}</div>
      <div style={{ color: 'var(--text3)', fontSize: 11, marginTop: 8 }}>
        Make sure the backend is running on port 4000
      </div>
    </div>
  );
}

export function Empty({ message = 'No data available' }) {
  return (
    <div style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
      <div>{message}</div>
    </div>
  );
}
