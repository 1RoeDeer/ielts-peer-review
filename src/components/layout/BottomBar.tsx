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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t backdrop-blur-2xl"
      style={{
        background: 'rgba(11, 16, 29, 0.88)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        boxShadow: '0 -4px 24px -2px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
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
              color: active ? '#60a5fa' : 'var(--text-muted)',
            }}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                active
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <item.icon size={19} />
            </div>
            <span
              className={`text-[10px] font-semibold leading-none ${
                active ? 'text-blue-400 font-bold' : 'text-slate-400'
              }`}
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
