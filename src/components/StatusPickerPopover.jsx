import { useEffect, useRef } from 'react';
import { useAppContext } from '../store/AppContext';
import { STATUS_LABELS, STATUS_COLORS } from '../constants/statuses';

export default function StatusPickerPopover({ repair, onClose }) {
  const { dispatch } = useAppContext();
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleSelect = (statusKey) => {
    if (statusKey === repair.status) { onClose(); return; }
    dispatch({ type: 'UPDATE_REPAIR', payload: { id: repair.id, status: statusKey } });
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-2 min-w-[190px]"
      style={{ top: '100%', right: 0 }}
    >
      <p className="text-xs text-slate-400 px-2 pb-1 mb-1 border-b border-slate-100">שנה סטטוס</p>
      {Object.entries(STATUS_LABELS).map(([key, label]) => {
        const colors = STATUS_COLORS[key] || {};
        const isActive = key === repair.status;
        return (
          <button
            key={key}
            onClick={() => handleSelect(key)}
            className={`w-full text-right flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors
              ${isActive ? `${colors.bg} ${colors.text} font-semibold` : 'hover:bg-slate-50 text-slate-700'}`}
          >
            <span>{colors.emoji}</span>
            <span>{label}</span>
            {isActive && <span className="mr-auto text-[10px] opacity-60">נוכחי</span>}
          </button>
        );
      })}
    </div>
  );
}
