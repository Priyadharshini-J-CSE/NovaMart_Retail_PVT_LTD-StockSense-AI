import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/dashboard',            icon: '⊞', label: 'Home' },
  { to: '/dashboard/demand',     icon: '📈', label: 'Demand Intelligence' },
  { to: '/dashboard/risk',       icon: '⚠️', label: 'Inventory Risk' },
  { to: '/dashboard/actions',    icon: '🎯', label: 'Manager Action Centre' },
  { to: '/dashboard/model',      icon: '🧠', label: 'Model Performance' },
  { to: '/dashboard/explain',    icon: '🔍', label: 'Explainability' },
  { to: '/dashboard/whatif',     icon: '🔮', label: 'What-If Analysis' },
  { to: '/dashboard/settings',   icon: '⚙️', label: 'Settings' },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            display: 'none',
            position: 'fixed', inset: 0, background: '#0008', zIndex: 149,
          }}
          className="sidebar-overlay"
        />
      )}
      <aside style={{
        width: 'var(--sidebar-w)',
        minWidth: 'var(--sidebar-w)',
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
        zIndex: 150,
        transition: 'transform 0.25s',
      }} className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--accent), #e8920f)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800, color: '#000',
            }}>S</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>StockSense</div>
              <div style={{ fontSize: 9, color: 'var(--text3)', lineHeight: 1.2 }}>IntelliData 2026</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 10px',
                borderRadius: 8,
                marginBottom: 2,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--accent)' : 'var(--text2)',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                transition: 'all 0.15s',
                textDecoration: 'none',
              })}
            >
              <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{item.icon}</span>
              <span style={{ fontSize: 12 }}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text3)' }}>
          NovaMart Retail Pvt. Ltd.
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .sidebar { position: fixed; transform: translateX(-100%); }
          .sidebar.sidebar-open { transform: translateX(0); }
          .sidebar-overlay { display: block !important; }
          .menu-toggle { display: block !important; }
        }
      `}</style>
    </>
  );
}
