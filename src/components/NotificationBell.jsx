import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { getNotifications } from '../utils/notifications';
import { Bell } from 'lucide-react';

export default function NotificationBell({ onNavigate }) {
  const { state } = useAppContext();
  const [open, setOpen] = useState(false);
  const notifications = getNotifications(state);
  const highCount = notifications.filter(n => n.severity === 'high').length;

  if (notifications.length === 0) {
    return (
      <button className="p-2 text-slate-400 cursor-default" disabled>
        <Bell size={20} />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative"
      >
        <Bell size={20} />
        <span className={`absolute top-1 left-1 ${highCount > 0 ? 'bg-red-500' : 'bg-orange-500'} text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold`}>
          {notifications.length}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">התראות ({notifications.length})</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (n.link && onNavigate) onNavigate(n.link);
                    setOpen(false);
                  }}
                  className="w-full text-right p-3 hover:bg-slate-50 flex gap-3 items-start"
                >
                  <span className="text-2xl">{n.icon}</span>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${n.severity === 'high' ? 'text-red-700' : n.severity === 'medium' ? 'text-orange-700' : 'text-slate-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
