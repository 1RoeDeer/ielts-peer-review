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

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: 'var(--bg)' }}>
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

        {/* Main content — extra bottom padding on mobile to avoid BottomBar overlap */}
        <main
          className="flex-1 overflow-auto pb-16 md:pb-0"
          style={{ background: 'var(--bg)' }}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation bar */}
      <BottomBar />

      <ToastContainer />
    </div>
  );
};

export default AppShell;
