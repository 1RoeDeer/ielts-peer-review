import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomBar from './BottomBar';
import ToastContainer from '../ui/ToastContainer';
import { useStore } from '../../store/useStore';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const AppShell: React.FC<AppShellProps> = ({ children, title, subtitle }) => {
  const { theme, sidebarOpen, setSidebarOpen } = useStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 767px)');
    const closeMobileMenu = () => { if (mobile.matches) setSidebarOpen(false); };
    closeMobileMenu();
    mobile.addEventListener('change', closeMobileMenu);
    return () => mobile.removeEventListener('change', closeMobileMenu);
  }, [setSidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <div className="app-viewport flex overflow-hidden relative bg-page">
      {/* Mobile sidebar backdrop overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header title={title} subtitle={subtitle} />

        {/* Main content — transparent so aurora shows through page background */}
        <main
          className="flex-1 min-h-0 overflow-auto app-content"
        >
          {children}
        </main>
        <BottomBar />
      </div>

      <ToastContainer />
    </div>
  );
};

export default AppShell;
