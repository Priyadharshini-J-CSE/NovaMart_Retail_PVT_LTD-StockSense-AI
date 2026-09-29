import { useFilters } from '../FilterContext';

const CITIES = ['All Cities', 'Chennai', 'Coimbatore', 'Madurai', 'Salem'];

export default function Header({ onMenuToggle }) {
  const { filters, setFilters } = useFilters();

  return (
    <header style={{
      height: 'var(--header-h)',
      background: 'var(--bg2)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <button
        onClick={onMenuToggle}
        style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text)', fontSize: 20, padding: 4 }}
        className="menu-toggle"
      >☰</button>

      <div style={{ flex: 1 }} />

      {/* Date Range */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>FROM</span>
        <input
          type="date"
          value={filters.startDate}
          onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
          style={inputStyle}
        />
        <span style={{ color: 'var(--text3)' }}>–</span>
        <input
          type="date"
          value={filters.endDate}
          onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
          style={inputStyle}
        />
      </div>

      {/* City */}
      <select
        value={filters.city || 'All Cities'}
        onChange={e => setFilters(f => ({ ...f, city: e.target.value === 'All Cities' ? '' : e.target.value }))}
        style={{ ...inputStyle, paddingRight: 28 }}
      >
        {CITIES.map(c => <option key={c}>{c}</option>)}
      </select>

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--purple))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#000',
        }}>N</div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>NovaMart</div>
          <div style={{ fontSize: 10, color: 'var(--text2)' }}>Team</div>
        </div>
      </div>
    </header>
  );
}

const inputStyle = {
  background: 'var(--bg3)',
  border: '1px solid var(--border2)',
  borderRadius: 6,
  color: 'var(--text)',
  padding: '5px 10px',
  fontSize: 12,
  outline: 'none',
};
