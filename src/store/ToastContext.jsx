import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

// ============================================================
// TOAST CONTEXT
// ============================================================
const ToastContext = createContext(null);
let _idCounter = 0;

const TYPE_STYLES = {
  success: {
    bg: 'bg-green-600',
    icon: CheckCircle,
    bar: 'bg-green-400',
  },
  error: {
    bg: 'bg-red-600',
    icon: XCircle,
    bar: 'bg-red-400',
  },
  info: {
    bg: 'bg-blue-600',
    icon: Info,
    bar: 'bg-blue-400',
  },
};

// ============================================================
// TOAST ITEM
// ============================================================
function ToastItem({ toast, onClose }) {
  const { bg, icon: Icon, bar } = TYPE_STYLES[toast.type] || TYPE_STYLES.success;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // הפעל animation כניסה
    const t1 = setTimeout(() => setVisible(true), 10);
    // התחל animation יציאה לפני הסרה
    const t2 = setTimeout(() => setVisible(false), toast.duration - 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [toast.duration]);

  return (
    <div
      onClick={onClose}
      className={`
        flex items-center gap-3 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-2xl cursor-pointer
        min-w-[240px] max-w-[340px] overflow-hidden relative
        transition-all duration-300
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
        ${bg}
      `}
      style={{ fontFamily: 'Heebo, sans-serif' }}
    >
      <Icon size={18} className="shrink-0" />
      <span className="flex-1 leading-snug">{toast.message}</span>
      <X size={14} className="shrink-0 opacity-60" />
      {/* סרגל התקדמות */}
      <div
        className={`absolute bottom-0 right-0 h-1 ${bar} rounded-b-xl`}
        style={{
          animation: `toast-progress ${toast.duration}ms linear forwards`,
        }}
      />
    </div>
  );
}

// ============================================================
// TOAST CONTAINER
// ============================================================
function ToastContainer({ toasts, onClose }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-[9999] flex flex-col gap-2 items-end">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onClose={() => onClose(t.id)} />
      ))}
    </div>
  );
}

// ============================================================
// PROVIDER
// ============================================================
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 2000) => {
    const id = ++_idCounter;
    setToasts(prev => [...prev.slice(-2), { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration + 50);
  }, []);

  // הקשב לאירוע גלישת localStorage
  useEffect(() => {
    const handler = () => showToast('שגיאה: האחסון מלא — לא ניתן לשמור נתונים', 'error', 5000);
    window.addEventListener('storage-quota-exceeded', handler);
    return () => window.removeEventListener('storage-quota-exceeded', handler);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
