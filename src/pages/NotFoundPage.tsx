import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppShell title="Страница не найдена">
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="glass-card max-w-md p-8 sm:p-10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/10">
            <Compass size={32} />
          </div>

          <div className="text-4xl font-black text-slate-100 font-mono">404</div>

          <h2 className="text-lg font-bold text-slate-100">Страница не найдена</h2>

          <p className="text-xs text-slate-400 leading-relaxed">
            Запрашиваемый адрес не существует или был перемещен. Проверьте правильность ссылки или вернитесь в панель управления.
          </p>

          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => navigate(-1)}
              className="btn-secondary text-xs flex items-center gap-1.5 py-2.5 px-4"
            >
              <ArrowLeft size={13} /> Назад
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary text-xs flex items-center gap-1.5 py-2.5 px-4"
            >
              <Home size={13} /> На главную
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default NotFoundPage;
