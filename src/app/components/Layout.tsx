import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router';
import {
  LayoutDashboard, FileText, Users, BarChart3, LogOut, Plus,
  ChevronLeft, ChevronRight, Building2
} from 'lucide-react';
import { Toaster } from 'sonner';
import { useApp } from '../contexts/AppContext';
import { CreateTransactionModal } from './CreateTransactionModal';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/transactions', label: 'Transactions', icon: FileText },
  { to: '/agents', label: 'Agents', icon: Users },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

export function Layout() {
  const { isAuthenticated, logout } = useApp();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-[#FAFBFC] overflow-hidden">
      {/* Sidebar Desktop */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out"
        style={{
          width: collapsed ? '72px' : '240px',
          backgroundColor: '#0A1628',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#D4A853' }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-white font-bold text-base tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>PropEx</div>
              <div className="text-white/40 text-xs">Transaction Manager</div>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`
              }
              title={collapsed ? label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#D4A853]' : ''}`} />
                  {!collapsed && <span className="text-sm font-medium">{label}</span>}
                  {!collapsed && isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D4A853]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-2 border-t border-white/10 space-y-1">
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium text-white hover:bg-white/5"
            title={collapsed ? 'New Transaction' : undefined}
          >
            <Plus className="w-5 h-5 flex-shrink-0 text-[#D4A853]" />
            {!collapsed && 'New Transaction'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium text-white/50 hover:text-white hover:bg-white/5"
            title={collapsed ? 'Log Out' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && 'Log Out'}
          </button>
          <button
            onClick={() => setCollapsed(p => !p)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium text-white/30 hover:text-white/60 hover:bg-white/5"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-5 h-5 flex-shrink-0" /> : (
              <><ChevronLeft className="w-5 h-5 flex-shrink-0" /><span>Collapse</span></>
            )}
          </button>
        </div>
      </aside>

      {/* Tablet Sidebar (icon only) */}
      <aside className="hidden md:flex lg:hidden flex-col flex-shrink-0 w-[72px]" style={{ backgroundColor: '#0A1628' }}>
        <div className="flex items-center justify-center py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#D4A853' }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center justify-center w-full p-2.5 rounded-xl transition-all ${
                  isActive ? 'bg-white/10 text-[#D4A853]' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`
              }
              title={label}
            >
              <Icon className="w-5 h-5" />
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-white/10 space-y-1">
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center p-2.5 rounded-xl text-[#D4A853] hover:bg-white/5 transition-all"
            title="New Transaction"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2.5 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] flex z-40 safe-area-bottom">
        {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                isActive ? 'text-[#D4A853]' : 'text-[#94A3B8]'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setShowCreate(true)}
          className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[#94A3B8] transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px] font-medium">New</span>
        </button>
      </nav>

      <CreateTransactionModal open={showCreate} onClose={() => setShowCreate(false)} />
      <Toaster position="top-right" richColors />
    </div>
  );
}
