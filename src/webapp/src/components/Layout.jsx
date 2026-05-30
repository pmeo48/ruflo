import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Search, Layers, History, BarChart2,
  ChevronLeft, ChevronRight, RefreshCw, Menu, X
} from 'lucide-react';
import { useBankroll } from '../lib/useBankroll.js';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/picks', icon: TrendingUp, label: 'Daily Picks' },
  { to: '/analysis', icon: Search, label: 'Game Analysis' },
  { to: '/parlays', icon: Layers, label: 'Parlays' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
];

const SPORTS = [
  { label: 'NBA', emoji: '🏀' },
  { label: 'NFL', emoji: '🏈' },
  { label: 'NHL', emoji: '🏒' },
  { label: 'MLB', emoji: '⚾' },
  { label: 'NCAAB', emoji: '🎓' },
  { label: 'NCAAF', emoji: '🏈' },
  { label: 'Soccer', emoji: '⚽' },
];

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/picks': 'Daily Picks',
  '/analysis': 'Game Analysis',
  '/parlays': 'Parlays',
  '/history': 'Bet History',
  '/analytics': 'Analytics',
};

function ETClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York',
      }) + ' ET');
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);
  return <span className="text-xs text-white/40 font-mono">{time}</span>;
}

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bankroll, setBankroll] = useBankroll();
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] || 'EDGE AI';
  const etDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York',
  });

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #00FFA8, #00cc85)' }}>
          <span className="font-black text-[#0a0f0d] text-base leading-none">E</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-bold text-sm tracking-wider" style={{ color: '#00FFA8' }}>EDGE AI</div>
            <div className="text-xs text-white/40 font-medium">Sports Analytics</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }
            onClick={() => setMobileOpen(false)}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {/* Sports */}
        {!collapsed && (
          <div className="pt-4">
            <div className="text-xs text-white/25 font-semibold uppercase tracking-widest px-3 mb-2">Sports</div>
            {SPORTS.map(({ label, emoji }) => (
              <NavLink key={label} to={`/picks?sport=${label}`}
                className="sidebar-link"
                onClick={() => setMobileOpen(false)}
              >
                <span className="text-base leading-none">{emoji}</span>
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Bankroll */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-white/5">
          <div className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-1.5">Bankroll</div>
          <div className="flex items-center gap-1">
            <span className="text-white/50 text-sm">$</span>
            <input
              type="number"
              min={10}
              value={bankroll}
              onChange={e => setBankroll(e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white w-full focus:outline-none focus:border-green-400/40"
            />
          </div>
        </div>
      )}

      {/* Status */}
      <div className={`px-4 py-3 border-t border-white/5 flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
        <span className="w-2 h-2 rounded-full bg-green-400 pulse-dot flex-shrink-0" />
        {!collapsed && <span className="text-xs text-white/40">Engine Active • Live Data</span>}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar desktop */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0 transition-all duration-200 border-r border-white/5"
        style={{ width: collapsed ? 60 : 220, background: 'var(--bg-sidebar)' }}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute top-1/2 -right-3 z-10 w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          style={{ transform: 'translateY(-50%)' }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Sidebar mobile */}
      <aside
        className={`fixed left-0 top-0 h-full z-50 flex flex-col lg:hidden transition-transform duration-200 border-r border-white/5`}
        style={{
          width: 220,
          background: 'var(--bg-sidebar)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-white/5 flex-shrink-0"
          style={{ background: 'rgba(8,13,11,0.8)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 rounded hover:bg-white/10 transition-colors"
              onClick={() => setMobileOpen(m => !m)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h1 className="font-bold text-base text-white">{pageTitle}</h1>
              <p className="text-xs text-white/40">{etDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ETClock />
            <NavLink to="/picks" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: 'rgba(0,255,168,0.12)', color: '#00FFA8', border: '1px solid rgba(0,255,168,0.2)' }}>
              <RefreshCw size={13} />
              <span className="hidden sm:inline">Refresh</span>
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
