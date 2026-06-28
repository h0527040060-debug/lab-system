import { useState, useCallback } from 'react';
import { useAppContext } from '../../../store/AppContext';
import {
  getStorageUsage,
  stripImagesFromObject,
  saveToStorage,
  clearLogs,
  storageKeys,
} from '../../../store/storage';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { HardDrive, Trash2, Image, FileText, RefreshCw } from 'lucide-react';

const LABEL_MAP = {
  customers: 'לקוחות',
  devices: 'מכשירים',
  repairs: 'תיקונים',
  parts: 'חלקים',
  stock_batches: 'אצוות מלאי',
  suppliers: 'ספקים',
  purchase_orders: 'הזמנות רכש',
  general_expenses: 'הוצאות כלליות',
  work_catalog: 'קטלוג עבודות',
  services: 'שירותים',
  technicians: 'טכנאים',
  warranty_appeals: 'ערעורי אחריות',
  settings: 'הגדרות',
  current_user: 'משתמש נוכחי',
  users: 'משתמשים',
  status_config: 'הגדרות סטטוס',
  role_config: 'הגדרות תפקיד',
  action_logs: 'לוגי פעולות',
};

const QUOTA_BYTES = 5 * 1024 * 1024; // 5MB

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const COMPLETED_STATUSES = new Set(['green_complete', 'red_cancelled']);

export function SettingsStorage() {
  const { state } = useAppContext();
  const [confirm, setConfirm] = useState(null); // { type, title, message, action }
  const [, forceUpdate] = useState(0);

  const refresh = useCallback(() => forceUpdate(n => n + 1), []);

  const { usage, total } = getStorageUsage();
  const pct = Math.min((total / QUOTA_BYTES) * 100, 100);
  const barColor = pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : 'bg-green-500';
  const textColor = pct > 85 ? 'text-red-700' : pct > 60 ? 'text-yellow-700' : 'text-green-700';

  const sorted = Object.entries(usage).sort((a, b) => b[1] - a[1]);

  const doAction = (type) => {
    if (type === 'logs') {
      clearLogs();
    } else if (type === 'images_completed') {
      const completedDeviceIds = new Set(
        (state.repairs || [])
          .filter(r => COMPLETED_STATUSES.has(r.status))
          .map(r => r.device_id)
      );
      const activeDeviceIds = new Set(
        (state.repairs || [])
          .filter(r => !COMPLETED_STATUSES.has(r.status))
          .map(r => r.device_id)
      );
      // רק מכשירים שאין להם תיקון פתוח
      const safeIds = new Set([...completedDeviceIds].filter(id => !activeDeviceIds.has(id)));
      const cleaned = (state.devices || []).map(d =>
        safeIds.has(d.id) ? stripImagesFromObject(d) : d
      );
      saveToStorage(storageKeys.DEVICES, cleaned);
      const cleanedAppeals = stripImagesFromObject(state.warranty_appeals || []);
      saveToStorage(storageKeys.WARRANTY_APPEALS, cleanedAppeals);
    } else if (type === 'images_all') {
      const cleaned = stripImagesFromObject(state.devices || []);
      saveToStorage(storageKeys.DEVICES, cleaned);
      const cleanedAppeals = stripImagesFromObject(state.warranty_appeals || []);
      saveToStorage(storageKeys.WARRANTY_APPEALS, cleanedAppeals);
    }
    setConfirm(null);
    refresh();
  };

  const ACTIONS = [
    {
      type: 'logs',
      icon: <FileText size={18} />,
      label: 'נקה לוגי פעולות',
      desc: 'מוחק את לוג הפעולות בלבד. נתוני המערכת נשמרים.',
      color: 'blue',
      title: 'ניקוי לוגי פעולות',
      message: 'האם לנקות את לוג הפעולות? הנתונים עצמם לא יימחקו.',
    },
    {
      type: 'images_completed',
      icon: <Image size={18} />,
      label: 'הסר תמונות ממכשירים סגורים',
      desc: 'מסיר תמונות ממכשירים שכל התיקונים שלהם הסתיימו/בוטלו.',
      color: 'orange',
      title: 'הסרת תמונות ממכשירים סגורים',
      message: 'פעולה זו תמחק תמונות ממכשירים ללא תיקון פתוח. לא ניתן לשחזר. להמשיך?',
    },
    {
      type: 'images_all',
      icon: <Trash2 size={18} />,
      label: 'הסר תמונות מכל המכשירים',
      desc: 'מסיר תמונות מכל המכשירים וערעורי האחריות. חוסך הכי הרבה מקום.',
      color: 'red',
      title: 'הסרת תמונות מכל המכשירים',
      message: '⚠️ פעולה זו תמחק את כל התמונות מכל המכשירים וערעורי האחריות! לא ניתן לשחזר ללא גיבוי. להמשיך?',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100',
    orange: 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100',
    red: 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100',
  };

  return (
    <div className="space-y-4">
      {/* מד אחסון */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <HardDrive size={20} /> שימוש באחסון
          </h2>
          <button onClick={refresh} className="text-slate-400 hover:text-slate-600 transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className={`font-semibold ${textColor}`}>{formatBytes(total)} בשימוש</span>
            <span className="text-slate-500">מתוך ~5 MB</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-1 text-left">{pct.toFixed(1)}%</div>
        </div>

        {/* טבלת פירוט */}
        <div className="mt-4 border border-slate-100 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-right px-3 py-2 font-medium text-slate-600">קטגוריה</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600">גודל</th>
                <th className="px-3 py-2 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(([key, size]) => {
                const pctKey = total > 0 ? (size / total) * 100 : 0;
                return (
                  <tr key={key} className="border-t border-slate-100">
                    <td className="px-3 py-1.5 text-slate-700">{LABEL_MAP[key] || key}</td>
                    <td className="px-3 py-1.5 text-slate-500 text-left font-mono text-xs">{formatBytes(size)}</td>
                    <td className="px-3 py-1.5">
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${pctKey}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* כפתורי ניקוי */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-bold text-slate-800 mb-3">פינוי מקום</h2>
        <p className="text-sm text-slate-500 mb-4">
          בצע ניקוי מדורג — התחל מהאפשרות הבטוחה ביותר ובדוק אם הבעיה נפתרה.
        </p>
        <div className="space-y-2">
          {ACTIONS.map(a => (
            <button
              key={a.type}
              onClick={() => setConfirm(a)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg border text-right transition-colors ${colorClasses[a.color]}`}
            >
              <span className="mt-0.5 shrink-0">{a.icon}</span>
              <div>
                <div className="font-semibold text-sm">{a.label}</div>
                <div className="text-xs opacity-75 mt-0.5">{a.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {confirm && (
        <ConfirmDialog
          open
          title={confirm.title}
          message={confirm.message}
          confirmLabel="כן, המשך"
          variant={confirm.color === 'red' ? 'danger' : 'default'}
          onConfirm={() => doAction(confirm.type)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
