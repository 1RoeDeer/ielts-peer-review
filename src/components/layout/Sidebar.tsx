import React from 'react';
import { useStore } from '../../store/useStore';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen, Home, Users, FileText, Star, LogOut,
  ChevronLeft, ChevronRight, GraduationCap, PenSquare, X,
} from 'lucide-react';
import GamificationBar from '../ui/GamificationBar';

const Sidebar: React.FC = () => {
  const { currentUser, logout, sidebarOpen, setSidebarOpen, classrooms } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const teacherNav = [
    { icon: Home,     label: 'Dashboard',     path: '/dashboard' },
    { icon: Users,    label: 'My Classrooms', path: '/classrooms' },
    { icon: FileText, label: 'Assignments',   path: '/assignments' },
    { icon: Star,     label: 'Peer Reviews',  path: '/reviews' },
    { icon: Star,     label: 'Results',       path: '/results' },
  ];

  const studentNav = [
    { icon: Home,      label: 'Dashboard',   path: '/dashboard' },
    { icon: BookOpen,  label: 'My Classes',  path: '/classrooms' },
    { icon: PenSquare, label: 'My Essays',   path: '/essays' },
    { icon: Users,     label: 'Peer Review', path: '/reviews' },
  ];

  const nav = currentUser?.role === 'teacher' ? teacherNav : studentNav;

  const myClassrooms = classrooms.filter((c) =>
    currentUser?.role === 'teacher'
      ? c.teacherId === currentUser.id
      : c.studentIds.includes(currentUser?.id || '')
  );

  const colorDots: Record<string, string> = {
    violet: '#8b5cf6', indigo: '#6366f1', teal: '#14b8a6',
    rose: '#f43f5e', amber: '#f59e0b',
  };

  const handleNav = (path: string) => {
    navigate(path);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <aside
      id="main-sidebar"
      style={{
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
      }}
      className={`fixed md:relative inset-y-0 left-0 z-50 md:z-auto flex flex-col h-full w-64 max-w-[calc(100vw-2rem)] md:max-w-none flex-shrink-0 transition-all duration-300 safe-bottom ${
        sidebarOpen
          ? 'w-64 md:w-60 translate-x-0'
          : 'invisible md:visible -translate-x-full md:translate-x-0 md:w-14'
      }`}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-3 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white shadow-md shadow-blue-500/25 ring-1 ring-white/20"
        >
          <GraduationCap size={16} />
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden min-w-0">
            <div className="text-sm font-bold whitespace-nowrap gradient-text-sapphire">
              IELTS Peer Review
            </div>
            <div className="text-xs whitespace-nowrap text-slate-400">
              Writing Platform
            </div>
          </div>
        )}
        <button className="md:hidden btn-ghost ml-auto flex-shrink-0" aria-label="Закрыть меню" onClick={() => setSidebarOpen(false)}>
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {nav.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNav(item.path)}
            className={`nav-item w-full ${isActive(item.path) ? 'active' : ''}`}
          >
            <item.icon size={16} style={{ flexShrink: 0 }} />
            {sidebarOpen && <span className="truncate">{item.label}</span>}
          </button>
        ))}

        {/* Classrooms sub-list */}
        {sidebarOpen && myClassrooms.length > 0 && (
          <div className="pt-3">
            <div className="section-label px-3 mb-1.5">
              {currentUser?.role === 'teacher' ? 'Classes' : 'Enrolled'}
            </div>
            {myClassrooms.map((c) => (
              <button
                key={c.id}
                onClick={() => handleNav(`/classrooms/${c.id}`)}
                className={`nav-item w-full ${isActive(`/classrooms/${c.id}`) ? 'active' : ''}`}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: colorDots[c.color] || 'var(--text-muted)' }}
                />
                <span className="truncate text-xs">{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Gamification Bar */}
      <GamificationBar collapsed={!sidebarOpen} />

      {/* User section */}
      <div className="p-2 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        {currentUser && (
          <div className={`flex items-center gap-2.5 p-2 rounded-lg ${sidebarOpen ? '' : 'justify-center'}`}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20 ring-1 ring-white/10"
            >
              {currentUser.avatar}
            </div>
            {sidebarOpen && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {currentUser.name}
                  </div>
                  <div className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                    {currentUser.role}
                  </div>
                </div>
                <button
                  onClick={async () => { await logout(); navigate('/'); }}
                  className="btn-ghost p-1.5"
                  title="Sign out"
                >
                  <LogOut size={13} style={{ color: 'var(--text-muted)' }} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? 'Свернуть меню' : 'Развернуть меню'}
        className="absolute -right-3 top-8 w-6 h-6 rounded-full hidden md:flex items-center justify-center transition-all z-10"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow)',
          color: 'var(--text-secondary)',
        }}
      >
        {sidebarOpen ? <ChevronLeft size={11} /> : <ChevronRight size={11} />}
      </button>
    </aside>
  );
};

export default Sidebar;
