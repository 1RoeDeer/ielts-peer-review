import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import {
  GraduationCap, BookOpen, ArrowRight, Star, CheckCheck,
  Pen, UserPlus, LogIn, Sparkles, Eye, EyeOff, Loader2, ShieldCheck,
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
  return `${slug}@ieltsclass.com`;
}

const LoginPage: React.FC = () => {
  const { theme } = useStore();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('login');

  // Регистрация — только имя + пароль
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('student');

  // Вход — имя + пароль
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
      if (signUpErr.message.toLowerCase().includes('already registered') ||
          signUpErr.message.toLowerCase().includes('already exists')) {
        setError(`Имя "${regName.trim()}" уже занято. Попробуй добавить фамилию или цифру.`);
      } else {
        setError(signUpErr.message);
      }
      setLoading(false);
      return;
    }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: regPassword,
    });

    setLoading(false);
    if (signInErr) {
      setError('Аккаунт создан! Теперь переключись на вкладку "Войти" и введи данные.');
      setMode('login');
      return;
    }

    navigate('/dashboard');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginName.trim()) { setError('Введи имя.'); return; }
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorative Rings / Ambient Glow */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6 relative z-10 animate-fade-in">
        <div className="relative mb-3 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-40 group-hover:opacity-75 transition duration-500" />
          <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white shadow-xl shadow-blue-500/25 ring-1 ring-white/30">
            <GraduationCap size={28} />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-text-sapphire">
          IELTS Peer Review
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm">
          Платформа написания эссе, взаимной оценки и подготовки на Band 8+
        </p>
      </div>

      {/* Feature Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6 max-w-xl relative z-10">
        {[
          { icon: Pen, text: 'Редактор эссе без копипаста' },
          { icon: Star, text: 'Официальные критерии IELTS' },
          { icon: CheckCheck, text: 'Взаимная проверка работ' },
          { icon: Sparkles, text: 'Разбор Band 9 образцов' },
        ].map((f) => (
          <div
            key={f.text}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900/60 border border-slate-700/50 text-slate-300 backdrop-blur-md hover:border-blue-500/40 transition-colors shadow-sm"
          >
            <f.icon size={12} className="text-blue-400" />
            <span>{f.text}</span>
          </div>
        ))}
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md glass-card p-6 sm:p-8 space-y-6 relative z-10 animate-scale-in">
        {/* Sleek Segmented Switch */}
        <div className="flex p-1 rounded-xl bg-slate-900/80 border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
              mode === 'login'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <LogIn size={14} /> Вход
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
              mode === 'register'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <UserPlus size={14} /> Регистрация
          </button>
        </div>

        {/* ── REGISTER ── */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 mb-0.5">Создание профиля</h2>
              <p className="text-xs text-slate-400">Email не требуется — только имя и пароль</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                Используется как логин для входа в платформу
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Пароль <span className="text-slate-500 font-normal">(от 6 символов)</span>
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Ваша роль
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRegRole('student')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    regRole === 'student'
                      ? 'bg-blue-600/15 border-blue-500/60 text-blue-200 shadow-sm shadow-blue-500/10'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-200">
                    <BookOpen size={14} className={regRole === 'student' ? 'text-blue-400' : 'text-slate-400'} />
                    Студент
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Писать эссе и проверять</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRegRole('teacher')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    regRole === 'teacher'
                      ? 'bg-blue-600/15 border-blue-500/60 text-blue-200 shadow-sm shadow-blue-500/10'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-200">
                    <GraduationCap size={14} className={regRole === 'teacher' ? 'text-blue-400' : 'text-slate-400'} />
                    Учитель
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Классы и журнал</div>
                </button>
              </div>
            </div>

            {error && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-start gap-2">
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>Зарегистрироваться <ArrowRight size={15} /></>
              )}
            </button>

            <p className="text-center text-xs text-slate-400">
              Уже есть аккаунт?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2"
              >
                Войти
              </button>
            </p>
          </form>
        )}

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 mb-0.5">Вход в систему</h2>
              <p className="text-xs text-slate-400">Введите имя и пароль указанные при регистрации</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>Войти в кабинет <ArrowRight size={15} /></>
              )}
            </button>

            <p className="text-center text-xs text-slate-400">
              Еще нет аккаунта?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2"
              >
                Создать аккаунт
              </button>
            </p>
          </form>
        )}
      </div>

      {/* Security Footer Notice */}
      <div className="mt-6 flex items-center gap-1.5 text-xs text-slate-500 relative z-10">
        <ShieldCheck size={14} className="text-blue-400/80" />
        <span>Защищенный экзаменационный симулятор IELTS</span>
      </div>
    </div>
  );
};

export default LoginPage;
