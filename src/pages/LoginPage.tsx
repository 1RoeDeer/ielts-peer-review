import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import {
  GraduationCap, BookOpen, ArrowRight, Star, CheckCheck,
  Pen, UserPlus, LogIn, Sparkles, Eye, EyeOff, Loader2,
} from 'lucide-react';
import type { UserRole } from '../types';

type AuthMode = 'login' | 'register';

/** Генерируем "скрытый" email из имени — пользователь его не видит */
function nameToFakeEmail(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.а-яё]/gi, '')
    // транслитерация самых частых русских букв
    .replace(/а/g,'a').replace(/б/g,'b').replace(/в/g,'v').replace(/г/g,'g')
    .replace(/д/g,'d').replace(/е/g,'e').replace(/ё/g,'yo').replace(/ж/g,'zh')
    .replace(/з/g,'z').replace(/и/g,'i').replace(/й/g,'y').replace(/к/g,'k')
    .replace(/л/g,'l').replace(/м/g,'m').replace(/н/g,'n').replace(/о/g,'o')
    .replace(/п/g,'p').replace(/р/g,'r').replace(/с/g,'s').replace(/т/g,'t')
    .replace(/у/g,'u').replace(/ф/g,'f').replace(/х/g,'kh').replace(/ц/g,'ts')
    .replace(/ч/g,'ch').replace(/ш/g,'sh').replace(/щ/g,'sch').replace(/ъ/g,'')
    .replace(/ы/g,'y').replace(/ь/g,'').replace(/э/g,'e').replace(/ю/g,'yu')
    .replace(/я/g,'ya')
    .replace(/[^a-z0-9.]/g, '')
    || `user${Date.now()}`;
  return `${slug}@ieltsclass.local`;
}

/** Извлекаем "имя пользователя" из email для формы входа */
function emailToDisplayName(email: string): string {
  return email.replace('@ieltsclass.local', '').replace(/\./g, ' ');
}

const LoginPage: React.FC = () => {
  const { theme } = useStore();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('login');

  // Регистрация — только имя + пароль
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('student');

  // Вход — имя + пароль (email генерируется из имени)
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/dashboard');
    });
  }, [navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) { setError('Введи своё имя.'); return; }
    if (regPassword.length < 6) { setError('Пароль — минимум 6 символов.'); return; }

    setLoading(true);
    setError('');

    const fakeEmail = nameToFakeEmail(regName);
    const parts = regName.trim().split(/\s+/);
    const avatar = parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : regName.trim().slice(0, 2).toUpperCase();

    const { error: signUpErr } = await supabase.auth.signUp({
      email: fakeEmail,
      password: regPassword,
      options: {
        data: { name: regName.trim(), avatar, role: regRole },
      },
    });

    if (signUpErr) {
      // Если имя уже занято — подсказываем
      if (signUpErr.message.toLowerCase().includes('already registered') ||
          signUpErr.message.toLowerCase().includes('already exists')) {
        setError(`Имя "${regName.trim()}" уже занято. Попробуй добавить фамилию или цифру.`);
      } else {
        setError(signUpErr.message);
      }
      setLoading(false);
      return;
    }

    // Сразу входим
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: regPassword,
    });
    setLoading(false);
    if (!signInErr) {
      navigate('/dashboard');
    } else {
      setError('Зарегистрировался! Теперь войди под своим именем.');
      setMode('login');
      setLoginName(regName);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginName.trim()) { setError('Введи своё имя.'); return; }
    if (!loginPassword) { setError('Введи пароль.'); return; }

    setLoading(true);
    setError('');

    const fakeEmail = nameToFakeEmail(loginName);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: loginPassword,
    });
    setLoading(false);
    if (err) {
      setError('Неверное имя или пароль. Имя нужно вводить точно так же, как при регистрации.');
      return;
    }
    navigate('/dashboard');
  };

  void emailToDisplayName; // suppress unused

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6"
      style={{ background: 'var(--bg)' }}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-4 mb-3">
        <div
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--accent)', boxShadow: 'var(--shadow-lg)' }}
        >
          <GraduationCap size={28} style={{ color: 'var(--text-inverse)' }} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            IELTS Peer Review
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">Writing Excellence & Collaborative Learning Platform</p>
        </div>
      </div>

      {/* Feature Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8 max-w-xl">
        {[
          { icon: Pen, text: 'Редактор эссе без копипаста' },
          { icon: Star, text: 'Официальные критерии IELTS' },
          { icon: CheckCheck, text: 'Модульные взаимные проверки' },
          { icon: Sparkles, text: 'Разбор Band 9 образцов' },
        ].map((f) => (
          <div
            key={f.text}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900/60 border border-slate-700/60 text-slate-300"
          >
            <f.icon size={12} className="text-violet-400" />
            {f.text}
          </div>
        ))}
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md glass-card p-6 sm:p-8 space-y-5 animate-scale-in">

        {/* Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900/70 border border-slate-700/60">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
              mode === 'login' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn size={14} /> Войти
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
              mode === 'register' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus size={14} /> Регистрация
          </button>
        </div>

        {/* ── REGISTER ── */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 mb-0.5">Создай аккаунт</h2>
              <p className="text-xs text-slate-400">Email не нужен — просто имя и пароль 👇</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Имя и фамилия
              </label>
              <input
                type="text"
                required
                autoFocus
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="например, Александр Соколов"
                className="input-field text-sm"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Вводи точно — это твой логин для входа
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Пароль <span className="font-normal normal-case">(минимум 6 символов)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field text-sm pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Роль
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setRegRole('student')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    regRole === 'student'
                      ? 'bg-violet-600/20 border-violet-500 text-slate-100 shadow-sm'
                      : 'bg-slate-900/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
                  }`}>
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <BookOpen size={14} className={regRole === 'student' ? 'text-violet-400' : ''} />
                    Студент
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Писать эссе и рецензировать</div>
                </button>
                <button type="button" onClick={() => setRegRole('teacher')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    regRole === 'teacher'
                      ? 'bg-violet-600/20 border-violet-500 text-slate-100 shadow-sm'
                      : 'bg-slate-900/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
                  }`}>
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <GraduationCap size={14} className={regRole === 'teacher' ? 'text-violet-400' : ''} />
                    Преподаватель
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Создавать задания</div>
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Зарегистрироваться <ArrowRight size={14} /></>}
            </button>

            <p className="text-center text-xs text-slate-500">
              Уже есть аккаунт?{' '}
              <button onClick={() => { setMode('login'); setError(''); }}
                className="text-violet-400 hover:text-violet-300 font-semibold">
                Войти
              </button>
            </p>
          </form>
        )}

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 mb-0.5">Добро пожаловать!</h2>
              <p className="text-xs text-slate-400">Введи имя и пароль как при регистрации</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Имя и фамилия
              </label>
              <input
                type="text"
                required
                autoFocus
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder="например, Александр Соколов"
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field text-sm pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Войти <ArrowRight size={14} /></>}
            </button>

            <p className="text-center text-xs text-slate-500">
              Нет аккаунта?{' '}
              <button onClick={() => { setMode('register'); setError(''); }}
                className="text-violet-400 hover:text-violet-300 font-semibold">
                Зарегистрируйся
              </button>
            </p>
          </form>
        )}
      </div>

      {/* Hint */}
      <p className="mt-6 text-xs text-slate-600 text-center max-w-sm">
        💡 Запомни своё имя и пароль — они нужны для входа
      </p>
    </div>
  );
};

export default LoginPage;
