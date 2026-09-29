import { useState } from 'react';
import { Link } from 'react-router-dom';

function DashboardPreview() {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: 16,
      width: '100%',
      maxWidth: 480,
      boxShadow: '0 24px 80px #000a',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f5a623' }} />
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
        <div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 3, marginLeft: 8 }} />
        <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600 }}>StockSense</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Revenue', value: '₹2.4M', color: 'var(--accent)' },
          { label: 'Growth', value: '+8.2%', color: 'var(--green)' },
          { label: 'At Risk', value: '7 SKUs', color: 'var(--red)' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--bg2)', borderRadius: 8, padding: '10px 8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 9, color: 'var(--text2)', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: 12, marginBottom: 12, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 8 }}>Demand Forecast vs Actual</div>
        <svg viewBox="0 0 300 80" style={{ width: '100%', height: 80 }}>
          <polyline points="0,60 40,45 80,50 120,30 160,35 200,20 240,25 280,15 300,18"
            fill="none" stroke="var(--accent)" strokeWidth="2" />
          <polyline points="0,65 40,52 80,55 120,38 160,42 200,28 240,32 280,22 300,25"
            fill="none" stroke="var(--blue)" strokeWidth="2" strokeDasharray="5,3" />
          <text x="4" y="76" fontSize="7" fill="var(--text3)">Aug</text>
          <text x="140" y="76" fontSize="7" fill="var(--text3)">Sep</text>
          <text x="270" y="76" fontSize="7" fill="var(--text3)">Oct</text>
        </svg>
        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--text2)' }}>
            <div style={{ width: 12, height: 2, background: 'var(--accent)' }} /> Actual
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--text2)' }}>
            <div style={{ width: 12, height: 2, background: 'var(--blue)', borderTop: '2px dashed var(--blue)' }} /> Predicted
          </div>
        </div>
      </div>
      <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 8 }}>Risk Matrix — Store × Category</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
          {['#ef4444','#f5a623','#22c55e','#f5a623','#ef4444',
            '#22c55e','#ef4444','#f5a623','#22c55e','#22c55e',
            '#f5a623','#22c55e','#ef4444','#f5a623','#22c55e'].map((c, i) => (
            <div key={i} style={{ height: 18, borderRadius: 3, background: c + '33', border: `1px solid ${c}55` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: '📈',
    title: 'Demand Forecasting',
    desc: 'Predict next 7-day demand for each Store × Product combination with high accuracy.',
  },
  {
    icon: '⚠️',
    title: 'Inventory Risk',
    desc: 'Identify products at risk of stock-out and classify risk as High, Medium or Low with clear explanations.',
  },
  {
    icon: '🎯',
    title: 'Manager Action Centre',
    desc: 'Get recommended reorder quantity, key reasons and actionable steps for each product and store.',
  },
];

const NAV_LINKS = ['Features', 'Dashboard', 'How It Works', 'Insights'];

export default function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' }}>
      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--bg2)cc',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 40px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), #e8920f)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#000',
          }}>S</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>StockSense</div>
            <div style={{ fontSize: 9, color: 'var(--text3)' }}>IntelliData 2026 | Data Science Hackathon</div>
          </div>
        </div>

        {/* Desktop nav */}
        <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {NAV_LINKS.map(item => (
            <a key={item}
              href={item === 'Dashboard' ? '/dashboard' : `#${item.toLowerCase().replace(/ /g, '-')}`}
              style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = 'var(--text2)'}
            >{item}</a>
          ))}
          <Link to="/dashboard" className="btn btn-primary" style={{ fontSize: 13 }}>
            View Dashboard →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileOpen(o => !o)}
          style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text)', fontSize: 22, padding: 4 }}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="nav-mobile-menu" style={{
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99,
          background: 'var(--bg2)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 24px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {NAV_LINKS.map(item => (
            <a key={item}
              href={item === 'Dashboard' ? '/dashboard' : `#${item.toLowerCase().replace(/ /g, '-')}`}
              onClick={() => setMobileOpen(false)}
              style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 500, padding: '8px 0', borderBottom: '1px solid var(--border)' }}
            >{item}</a>
          ))}
          <Link to="/dashboard" className="btn btn-primary" onClick={() => setMobileOpen(false)} style={{ textAlign: 'center' }}>
            View Dashboard →
          </Link>
        </div>
      )}

      {/* Hero */}
      <section style={{
        padding: 'clamp(40px, 6vw, 80px) clamp(20px, 4vw, 40px) 60px',
        maxWidth: 1200,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 60,
        alignItems: 'center',
      }} className="hero-grid">
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--accent-dim)', border: '1px solid var(--accent)44',
            borderRadius: 20, padding: '4px 14px', marginBottom: 24,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
            <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>NovaMart Retail Pvt. Ltd.</span>
          </div>

          <h1 style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20 }}>
            Predict demand.<br />
            Prevent stock-outs.<br />
            <span style={{ color: 'var(--accent)' }}>Power better decisions.</span>
          </h1>

          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
            StockSense forecasts the next 7-day demand, predicts stock-out risk, explains key reasons
            and recommends replenishment actions — all in one platform.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
            <Link to="/dashboard" className="btn btn-primary" style={{ fontSize: 14, padding: '11px 24px' }}>
              Explore Dashboard →
            </Link>
            <a href="#how-it-works" className="btn btn-outline" style={{ fontSize: 14, padding: '11px 24px' }}>
              How It Works
            </a>
          </div>

          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[
              { num: '7-Day', label: 'Demand Forecast' },
              { num: 'Risk', label: 'Stock-out Risk' },
              { num: 'Action', label: 'Replenishment Action' },
            ].map(p => (
              <div key={p.num} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>{p.num}</span>
                <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500 }}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }} className="hero-preview">
          <DashboardPreview />
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: 'clamp(40px, 5vw, 60px) clamp(20px, 4vw, 40px)', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 800, marginBottom: 12 }}>
            Everything you need for smarter inventory decisions
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text2)', maxWidth: 520, margin: '0 auto' }}>
            From demand forecasting to actionable recommendations, StockSense gives you the complete picture.
          </p>
        </div>

        <div className="grid-3">
          {features.map(f => (
            <div key={f.title} className="card" style={{ transition: 'border-color 0.2s, transform 0.2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)44'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: 'var(--accent-dim)', border: '1px solid var(--accent)33',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, marginBottom: 16,
              }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{
        padding: 'clamp(40px, 5vw, 60px) clamp(20px, 4vw, 40px)',
        background: 'var(--bg2)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: 800, marginBottom: 12 }}>How It Works</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 48 }}>Four steps from raw data to actionable intelligence</p>
          <div className="grid-4">
            {[
              { step: '01', title: 'Ingest Data', desc: 'Transactions, inventory, products, stores and external factors loaded from CSV.' },
              { step: '02', title: 'Clean & Join', desc: 'Duplicates removed, categories normalized, datasets merged at Store × Product × Date grain.' },
              { step: '03', title: 'Model & Score', desc: 'Demand forecast and stock-out risk classification computed from the analytics dataset.' },
              { step: '04', title: 'Act', desc: 'Reorder recommendations surfaced in Manager Action Centre with one-click PO creation.' },
            ].map(s => (
              <div key={s.step} className="card" style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)', opacity: 0.4, marginBottom: 8 }}>{s.step}</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Insights */}
      <section id="insights" style={{ padding: 'clamp(40px, 5vw, 60px) clamp(20px, 4vw, 40px)', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: 800, marginBottom: 12 }}>Built for NovaMart</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)' }}>Covering 4 cities, multiple store formats and 500+ SKUs</p>
        </div>
        <div className="grid-4">
          {[
            { icon: '🏪', label: 'Stores', value: '4 Cities' },
            { icon: '📦', label: 'Products', value: '500+ SKUs' },
            { icon: '📊', label: 'Data Points', value: '50K+ Rows' },
            { icon: '🤖', label: 'ML Models', value: '6 Compared' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'clamp(40px, 5vw, 80px) 40px', textAlign: 'center', background: 'var(--bg2)', borderTop: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 40px)', fontWeight: 800, marginBottom: 16 }}>
          Ready to eliminate stock-outs?
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 32 }}>
          Open the live dashboard and explore real insights from NovaMart data.
        </p>
        <Link to="/dashboard" className="btn btn-primary" style={{ fontSize: 15, padding: '13px 32px' }}>
          Open StockSense Dashboard →
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 12,
        color: 'var(--text3)',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <span>StockSense · NovaMart Retail Pvt. Ltd.</span>
        <span>IntelliData 2026 | Data Science Hackathon</span>
      </footer>

      <style>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .hero-preview { display: none !important; }
          .nav-desktop { display: none !important; }
          .nav-mobile-toggle { display: block !important; }
        }
        @media (max-width: 600px) {
          nav { padding: 0 20px !important; }
        }
      `}</style>
    </div>
  );
}
