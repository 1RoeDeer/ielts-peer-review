import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, Users, PenSquare, GraduationCap } from 'lucide-react';
import { useStore } from '../../store/useStore';

const BottomBar: React.FC = () => {
  const { currentUser } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const teacherNav = [
    { icon: Home,          label: 'Главная',   path: '/dashboard' },
    { icon: GraduationCap, label: 'Классы',    path: '/classrooms' },
    { icon: BookOpen,      label: 'Задания',   path: '/assignments' },
    { icon: Users,         label: 'Рецензии',  path: '/reviews' },
  ];

  const studentNav = [
    { icon: Home,      label: 'Главная',   path: '/dashboard' },
    { icon: BookOpen,  label: 'Классы',    path: '/classrooms' },
    { icon: PenSquare, label: 'Эссе',      path: '/essays' },
    { icon: Users,     label: 'Рецензии',  path: '/reviews' },
  ];

  const nav = currentUser?.role === 'teacher' ? teacherNav : studentNav;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {nav.map((item) => {
        const active = isActive(item.path);
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-1 transition-all"
            style={{
              color: active ? '#8b5cf6' : 'var(--text-muted)',
            }}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${active ? 'bg-violet-600/20' : ''}`}
            >
              <item.icon size={20} />
            </div>
            <span
              className="text-[10px] font-semibold leading-none"
              style={{ color: active ? '#8b5cf6' : 'var(--text-muted)' }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomBar;
