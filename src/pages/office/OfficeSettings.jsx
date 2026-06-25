import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { exportAllData, importAllData, clearAllStorage } from '../../store/storage';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Save, Download, Upload, Trash2 } from 'lucide-react';

export default function OfficeSettings() {
  const { state, dispatch } = useAppContext();
  const [form, setForm] = useState({ ...state.settings });
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSave = () => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: form });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
        alert('שגיאה בקריאת הקובץ');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    clearAllStorage();
    window.location.reload();
  };

  return (
    <div>
      <PageHeader title="הגדרות מערכת" subtitle="הגדרות עסק וניהול נתונים" />

      {/* פרטי עסק */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
        <h2 className="font-bold text-slate-800 mb-4">פרטי העסק</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold block mb-1">שם העסק</label>
            <input
              type="text"
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">כתובת</label>
            <input
              type="text"
              value={form.business_address}
              onChange={(e) => setForm({ ...form, business_address: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold block mb-1">טלפון</label>
              <input
                type="text"
                value={form.business_phone}
                onChange={(e) => setForm({ ...form, business_phone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1">אחוז מע"מ לתצוגה</label>
              <input
                type="number"
                value={form.vat_percent_display}
                onChange={(e) => setForm({ ...form, vat_percent_display: parseFloat(e.target.value) || 0 })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <p className="text-xs text-slate-500 mt-1">תצוגה בלבד במסך גביה</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">ימי תקיעה להתראה</label>
            <input
              type="number"
              value={form.alert_stuck_repair_days}
              onChange={(e) => setForm({ ...form, alert_stuck_repair_days: parseInt(e.target.value) || 7 })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
            <p className="text-xs text-slate-500 mt-1">תיקון שלא משתנה X ימים יסומן כתקוע</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
        >
          <Save size={18} />
          {saved ? '✓ נשמר!' : 'שמור הגדרות'}
        </button>
      </div>

      {/* גיבוי ושחזור */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
        <h2 className="font-bold text-slate-800 mb-4">גיבוי ושחזור נתונים</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
          >
            <Download size={18} />
            יצא גיבוי
          </button>
          <label className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 cursor-pointer">
            <Upload size={18} />
            יבא גיבוי
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          הגיבוי כולל את כל הנתונים במערכת (לקוחות, תיקונים, מלאי, וכו'). שמור את הקובץ במקום בטוח.
        </p>
      </div>

      {/* איפוס מסוכן */}
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
        <h2 className="font-bold text-red-800 mb-2 flex items-center gap-2">
          <Trash2 size={20} />
          איפוס מערכת
        </h2>
        <p className="text-sm text-red-700 mb-4">
          ⚠️ זה ימחק את כל הנתונים מהמערכת! לקוחות, תיקונים, מלאי, הזמנות - הכל יימחק.
          וודא שיש לך גיבוי קודם.
        </p>
        <button
          onClick={() => setConfirmReset(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
        >
          אפס מערכת לחלוטין
        </button>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="איפוס מערכת"
        message="האם אתה בטוח שברצונך למחוק את כל הנתונים? פעולה זו בלתי הפיכה!"
        confirmLabel="כן, מחק הכל"
        variant="danger"
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
