import { useState } from 'react';
import { exportAllData, importAllData, clearAllStorage } from '../../../store/storage';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { useToast } from '../../../store/ToastContext';
import { Download, Upload, Trash2 } from 'lucide-react';

export function SettingsMisc() {
  const [confirmReset, setConfirmReset] = useState(false);
  const { showToast } = useToast();

  const handleExport = () => {
    const data = exportAllData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horovitz-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        importAllData(data);
        window.location.reload();
      } catch {
        showToast('שגיאה בקריאת הקובץ — ודא שהקובץ תקין', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-bold text-slate-800 mb-4">גיבוי ושחזור נתונים</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExport}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
            <Download size={18} /> יצא גיבוי
          </button>
          <label className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 cursor-pointer">
            <Upload size={18} /> יבא גיבוי
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          הגיבוי כולל את כל הנתונים במערכת (לקוחות, תיקונים, מלאי, וכו'). שמור את הקובץ במקום בטוח.
        </p>
      </div>

      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
        <h2 className="font-bold text-red-800 mb-2 flex items-center gap-2">
          <Trash2 size={20} /> איפוס מערכת
        </h2>
        <p className="text-sm text-red-700 mb-4">
          ⚠️ זה ימחק את כל הנתונים מהמערכת! לקוחות, תיקונים, מלאי, הזמנות - הכל יימחק. וודא שיש לך גיבוי קודם.
        </p>
        <button onClick={() => setConfirmReset(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold">
          אפס מערכת לחלוטין
        </button>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="איפוס מערכת"
        message="האם אתה בטוח שברצונך למחוק את כל הנתונים? פעולה זו בלתי הפיכה!"
        confirmLabel="כן, מחק הכל"
        variant="danger"
        onConfirm={() => { clearAllStorage(); window.location.reload(); }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
