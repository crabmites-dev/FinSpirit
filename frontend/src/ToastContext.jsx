import { createContext, useCallback, useContext, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

const ALERT_STYLES = {
  success: {
    alert: 'alert-success',
    icon: CheckCircle2,
  },
  error: {
    alert: 'alert-error',
    icon: XCircle,
  },
  warning: {
    alert: 'alert-warning',
    icon: AlertTriangle,
  },
  info: {
    alert: 'alert-info',
    icon: Info,
  },
};

function ToastItem({ toast, onClose }) {
  const cfg = ALERT_STYLES[toast.type] || ALERT_STYLES.info;
  const Icon = cfg.icon;

  return (
    <div
      className={`alert ${cfg.alert} shadow-lg rounded-xl pointer-events-auto animate-toast-in flex items-start gap-3 pr-2`}
      role="alert"
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <span className="text-sm font-semibold leading-snug flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className="btn btn-ghost btn-xs btn-circle opacity-70 hover:opacity-100 shrink-0"
        aria-label="Fermer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    if (!message) return;
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed z-[9999] flex flex-col gap-2 p-3 sm:p-4
          bottom-0 inset-x-0 sm:inset-x-auto sm:bottom-6 sm:right-6
          w-full sm:w-[min(100%,22rem)] pointer-events-none"
        aria-live="polite"
      >
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
