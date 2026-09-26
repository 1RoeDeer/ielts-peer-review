import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Sun, Moon, LogOut, Menu } from 'lucide-react';
import { useStore } from '../../store/useStore';
import NotificationPanel from './NotificationPanel';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { currentUser, theme, toggleTheme, logout, sidebarOpen, setSidebarOpen } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  const parts = location.pathname.split('/').filter(Boolean);
  const crumbs = parts.map((p, i) => ({
    label: p.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    path: '/' + parts.slice(0, i + 1).join('/'),
  }));

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header
      className="h-14 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 flex-shrink-0"
      style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Mobile Hamburger Menu Toggle */}
      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center"
        aria-label="Toggle navigation menu"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm flex-1 min-w-0">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={crumb.path}>
            {i > 0 && <ChevronRight size={12} className="text-slate-500 flex-shrink-0" />}
            <span
              style={{
                color: i === crumbs.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: i === crumbs.length - 1 ? 600 : 400,
              }}
              className={`truncate ${i < crumbs.length - 1 ? 'hidden sm:inline' : 'inline'}`}
            >
              {title && i === crumbs.length - 1 ? title : crumb.label}
            </span>
          </React.Fragment>
        ))}
        {subtitle && (
          <span className="text-[11px] sm:text-xs ml-1 truncate hidden md:inline text-slate-400">
            — {subtitle}
          </span>
        )}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="btn-ghost"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{ padding: '7px', borderRadius: '8px' }}
        >
          {theme === 'dark' ? (
            <Sun size={16} style={{ color: 'var(--text-secondary)' }} />
          ) : (
            <Moon size={16} style={{ color: 'var(--text-secondary)' }} />
          )}
        </button>

        {/* Notifications */}
        <NotificationPanel />

        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />

        {/* User avatar + name */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: 'var(--accent)',
              color: 'var(--text-inverse)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {currentUser?.avatar}
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {currentUser?.name?.split(' ')[0]} {currentUser?.name?.split(' ')[1]?.[0]}.
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {currentUser?.role === 'teacher' ? 'Преподаватель' : 'Студент'}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn-ghost ml-1"
          title="Выйти из аккаунта"
          style={{ padding: '7px', borderRadius: '8px' }}
        >
          <LogOut size={15} style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>
    </header>
  );
};

export default Header;

