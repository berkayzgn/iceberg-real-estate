import { useMemo, useState } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, FileText, Users, BarChart3, LogOut, Plus,
  ChevronLeft, ChevronRight, Building2
} from 'lucide-react';
import { Toaster } from 'sonner';
import { useApp } from '../contexts/AppContext';
import { CreateTransactionModal } from './CreateTransactionModal';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Layout() {
  const { t } = useTranslation();
  const { isAuthenticated, logout } = useApp();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const navItems = useMemo(
    () => [
      { to: '/', labelKey: 'layout.dashboard' as const, icon: LayoutDashboard, exact: true },
      { to: '/transactions', labelKey: 'layout.transactions' as const, icon: FileText },
      { to: '/agents', labelKey: 'layout.agents' as const, icon: Users },
      { to: '/reports', labelKey: 'layout.reports' as const, icon: BarChart3 },
    ],
    []
  );

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
              <div className="text-white/40 text-xs">{t('layout.brandSubtitle')}</div>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map(({ to, labelKey, icon: Icon, exact }) => {
            const label = t(labelKey);
            return (
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
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-2 border-t border-white/10 space-y-1">
          {!collapsed && (
            <div className="px-2 pb-1">
              <LanguageSwitcher />
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center pb-1">
              <LanguageSwitcher compact />
            </div>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium text-white hover:bg-white/5"
            title={collapsed ? t('layout.newTransaction') : undefined}
          >
            <Plus className="w-5 h-5 flex-shrink-0 text-[#D4A853]" />
            {!collapsed && t('layout.newTransaction')}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium text-white/50 hover:text-white hover:bg-white/5"
            title={collapsed ? t('layout.logout') : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && t('layout.logout')}
          </button>
          <button
            onClick={() => setCollapsed(p => !p)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium text-white/30 hover:text-white/60 hover:bg-white/5"
            aria-label={collapsed ? t('layout.expandSidebar') : t('layout.collapseSidebar')}
          >
            {collapsed ? <ChevronRight className="w-5 h-5 flex-shrink-0" /> : (
              <><ChevronLeft className="w-5 h-5 flex-shrink-0" /><span>{t('layout.collapse')}</span></>
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
          {navItems.map(({ to, labelKey, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center justify-center w-full p-2.5 rounded-xl transition-all ${
                  isActive ? 'bg-white/10 text-[#D4A853]' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`
              }
              title={t(labelKey)}
            >
              <Icon className="w-5 h-5" />
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-white/10 space-y-1 flex flex-col items-center gap-1">
          <LanguageSwitcher compact />
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center p-2.5 rounded-xl text-[#D4A853] hover:bg-white/5 transition-all"
            title={t('layout.newTransaction')}
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2.5 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
            title={t('layout.logout')}
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
        {navItems.map(({ to, labelKey, icon: Icon, exact }) => (
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
            <span className="text-[10px] font-medium">{t(labelKey)}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setShowCreate(true)}
          className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[#94A3B8] transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t('layout.new')}</span>
        </button>
      </nav>

      <CreateTransactionModal open={showCreate} onClose={() => setShowCreate(false)} />
      <Toaster position="top-right" richColors />
    </div>
  );
}
