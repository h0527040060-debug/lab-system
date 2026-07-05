import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../store/AppContext';
import { getNotifications } from '../utils/notifications';
import { Bell } from 'lucide-react';

export default function NotificationBell({ onNavigate }) {
  const { state } = useAppContext();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);
  const notifications = getNotifications(state);
  const highCount = notifications.filter(n => n.severity === 'high').length;

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setOpen(o => !o);
  };

  const handleClick = (n) => {
    if (onNavigate && n.link) {
      if (typeof n.link === 'object') {
        onNavigate(n.link.page, n.link.repairId);
      } else {
        onNavigate(n.link);
      }
    }
    setOpen(false);
  };

  if (notifications.length === 0) {
    return (
      <button className="p-2 text-slate-400 cursor-default" disabled aria-label="אין התראות">
        <Bell size={20} />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        aria-label={`התראות (${notifications.length})`}
        aria-expanded={open}
        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative"
      >
        <Bell size={20} />
        <span className={`absolute top-1 left-1 ${highCount > 0 ? 'bg-red-500' : 'bg-orange-500'} text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold`}>
          {notifications.length}
        </span>
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setOpen(false)} />
          <div
            className="fixed w-80 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-[420px] overflow-y-auto"
            style={{ top: pos.top, right: pos.right, zIndex: 9999 }}
          >
            <div className="p-3 border-b border-slate-200 sticky top-0 bg-white">
              <h3 className="font-bold text-slate-900">התראות ({notifications.length})</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="w-full text-right p-3 hover:bg-slate-50 flex gap-3 items-start transition-colors"
                >
                  <span className="text-2xl leading-none mt-0.5">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm leading-snug ${n.severity === 'high' ? 'text-red-700' : n.severity === 'medium' ? 'text-orange-700' : 'text-slate-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{n.message}</p>
                    {typeof n.link === 'object' && (
                      <span className="text-xs text-blue-600 mt-0.5 inline-block">לחץ לפתיחת כרטיס ←</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
