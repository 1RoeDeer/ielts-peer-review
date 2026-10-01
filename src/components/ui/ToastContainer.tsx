import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { CheckCircle2, ShieldAlert, AlertTriangle, X, ChevronRight, Sparkles } from 'lucide-react';
import type { ToastMessage } from '../../types';

interface ToastItemProps {
  toast: ToastMessage;
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 5000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'security':
        return <ShieldAlert size={18} className="text-red-500" />;
      case 'success':
        return <CheckCircle2 size={18} className="text-green-500" />;
      case 'warning':
        return <AlertTriangle size={18} className="text-amber-500" />;
      case 'info':
      default:
        return <Sparkles size={18} className="text-blue-400" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'security':
        return 'rgba(239, 68, 68, 0.4)';
      case 'success':
        return 'rgba(34, 197, 94, 0.4)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.4)';
      case 'info':
      default:
        return 'rgba(59, 130, 246, 0.4)';
    }
  };

  return (
    <div
      className="relative flex items-start gap-3 p-4 rounded-xl shadow-2xl max-w-sm w-full animate-slide-up transition-all duration-300"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${getBorderColor()}`,
        boxShadow: 'var(--shadow-xl)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
          {toast.title}
        </h4>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {toast.message}
        </p>
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onClose();
            }}
            className="mt-2 text-xs font-semibold flex items-center gap-1 hover:underline"
            style={{ color: 'var(--text-primary)' }}
          >
            {toast.action.label} <ChevronRight size={12} />
          </button>
        )}
      </div>
      <button
        onClick={onClose}
        className="btn-ghost flex-shrink-0"
        style={{ padding: '4px', borderRadius: '6px' }}
        title="Close"
      >
        <X size={13} style={{ color: 'var(--text-muted)' }} />
      </button>
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-auto">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

export default ToastContainer;
