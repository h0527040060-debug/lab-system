import { useState } from 'react';
import { useAppContext } from '../../../store/AppContext';
import { useToast } from '../../../store/ToastContext';
import { DEFAULT_ROLE_CONFIG } from '../../../store/AppContext';
import { REPAIR_STATUSES } from '../../../constants/statuses';
import { getStatusDisplay } from '../../../utils/statusConfig';
import { Check, RotateCcw } from 'lucide-react';

const ROLE_LABELS = {
  office: { label: 'משרד', icon: '🏢', desc: 'עובדי משרד וקבלת קהל' },
  lab: { label: 'מעבדה', icon: '🔧', desc: 'טכנאים ועובדי מעבדה' },
};

const ALL_STATUSES = Object.values(REPAIR_STATUSES);

function RolePanel({ roleKey, roleData, statusConfig, onSave }) {
  const { label, icon, desc } = ROLE_LABELS[roleKey];
  const [selected, setSelected] = useState(new Set(roleData?.visible_statuses ?? []));
  const [saved, setSaved] = useState(false);
  const { showToast } = useToast();

  const toggle = (statusId) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(statusId)) next.delete(statusId);
      else next.add(statusId);
      return next;
    });
  };

  const handleSave = () => {
    if (selected.size === 0) {
      showToast('יש לבחור לפחות סטטוס אחד לתפקיד זה', 'error');
      return;
    }
    onSave(roleKey, Array.from(selected));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setSelected(new Set(DEFAULT_ROLE_CONFIG[roleKey]?.visible_statuses ?? []));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">{icon} תפקיד: {label}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
        </div>
        <button onClick={handleReset} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mt-1">
          <RotateCcw size={13} /> ברירת מחדל
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-3 bg-slate-50 rounded-lg p-2">
        סמן את הסטטוסים שתפקיד זה יוכל לראות בלוח Kanban. סטטוסים לא מסומנים יוסתרו לחלוטין מהתצוגה.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {ALL_STATUSES.map(statusId => {
          const display = getStatusDisplay(statusId, statusConfig);
          const isChecked = selected.has(statusId);
          return (
            <label
              key={statusId}
              className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                isChecked
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(statusId)}
                className="w-4 h-4 accent-orange-500 shrink-0"
              />
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${display.bg} ${display.text} ${display.border}`}>
                {display.emoji} {display.label}
              </span>
            </label>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2 text-sm"
        >
          <Check size={16} />
          {saved ? '✓ נשמר!' : 'שמור הגדרות תפקיד'}
        </button>
        <span className="text-xs text-slate-400">{selected.size} סטטוסים מוצגים</span>
      </div>
    </div>
  );
}

export function SettingsRoles() {
  const { state, dispatch } = useAppContext();

  const handleSave = (roleKey, visible_statuses) => {
    dispatch({
      type: 'UPDATE_ROLE_CONFIG',
      payload: { [roleKey]: { ...state.roleConfig?.[roleKey], visible_statuses } },
    });
  };

  return (
    <div className="space-y-4">
      {Object.keys(ROLE_LABELS).map(roleKey => (
        <RolePanel
          key={roleKey}
          roleKey={roleKey}
          roleData={state.roleConfig?.[roleKey]}
          statusConfig={state.statusConfig}
          onSave={handleSave}
        />
      ))}
    </div>
  );
}
