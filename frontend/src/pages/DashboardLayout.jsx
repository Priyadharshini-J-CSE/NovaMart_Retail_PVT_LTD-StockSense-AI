import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
