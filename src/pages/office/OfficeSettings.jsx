import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { exportAllData, importAllData, clearAllStorage } from '../../store/storage';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import { getStatusDisplay, COLOR_MAP, PLACEHOLDER_TAGS } from '../../utils/statusConfig';
import { Save, Download, Upload, Trash2, Edit2, Check, X, Plus, MessageCircle } from 'lucide-react';

const COLOR_OPTIONS = [
  { value: 'red',    label: 'אדום' },
  { value: 'yellow', label: 'צהוב' },
  { value: 'orange', label: 'כתום' },
  { value: 'green',  label: 'ירוק' },
  { value: 'blue',   label: 'כחול' },
  { value: 'slate',  label: 'אפור' },
];

export default function OfficeSettings() {
  const { state, dispatch } = useAppContext();
  const [form, setForm] = useState({ ...state.settings });
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // ניהול סטטוסים
  const [editingStatusId, setEditingStatusId] = useState(null);
  const [editStatusForm, setEditStatusForm] = useState({});
  const [showAddStatus, setShowAddStatus] = useState(false);
  const [newStatusForm, setNewStatusForm] = useState({ label: '', emoji: '🔵', color: 'blue' });

  const insertPlaceholder = (field, tag) => {
    setEditStatusForm(f => ({ ...f, [field]: (f[field] || '') + tag }));
  };

  const startEditStatus = (s) => {
    setEditStatusForm({
      label: s.label,
      emoji: s.emoji,
      color: s.color,
      customer_message: s.customer_message || '',
      technician_message: s.technician_message || '',
    });
    setEditingStatusId(s.id);
    setShowAddStatus(false);
  };

  const saveEditStatus = (id) => {
    dispatch({ type: 'UPDATE_STATUS', payload: { id, ...editStatusForm } });
    setEditingStatusId(null);
  };

  const deleteStatus = (id) => {
    dispatch({ type: 'DELETE_STATUS', payload: id });
  };

  const addStatus = () => {
    if (!newStatusForm.label.trim()) return;
    const id = 'custom_' + Date.now();
    dispatch({ type: 'ADD_STATUS', payload: { id, ...newStatusForm, is_system: false } });
    setNewStatusForm({ label: '', emoji: '🔵', color: 'blue' });
    setShowAddStatus(false);
  };

  const getUsageCount = (statusId) => state.repairs.filter(r => r.status === statusId).length;

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
            <div>
              <label className="text-sm font-semibold block mb-1">דמי בדיקה (₪)</label>
              <input
                type="number"
                value={form.diagnostic_fee ?? 180}
                onChange={(e) => setForm({ ...form, diagnostic_fee: parseFloat(e.target.value) || 0 })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <p className="text-xs text-slate-500 mt-1">נגבים בתיקון בתשלום, מזוכים עם אישור הצעה</p>
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

      {/* ניהול סטטוסים */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
        <h2 className="font-bold text-slate-800 mb-4">ניהול סטטוסים</h2>
        <div className="border border-slate-200 rounded-lg overflow-hidden mb-3">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-right p-3 font-semibold">אמוג'י</th>
                <th className="text-right p-3 font-semibold">שם</th>
                <th className="text-right p-3 font-semibold">צבע / תצוגה</th>
                <th className="text-center p-3 font-semibold">סוג</th>
                <th className="text-center p-3 font-semibold">תיקונים</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {state.statusConfig.map(s => {
                const usage = getUsageCount(s.id);
                const display = getStatusDisplay(s.id, state.statusConfig);
                const isEditing = editingStatusId === s.id;

                return (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3">
                      <span className="text-xl">{display.emoji}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold">{display.label}</span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${display.bg} ${display.text} ${display.border}`}>
                        {display.emoji} {display.label}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${s.is_system ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                        {s.is_system ? 'מערכת' : 'מותאם'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-xs font-bold ${usage > 0 ? 'text-slate-700' : 'text-slate-400'}`}>{usage}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button onClick={() => startEditStatus(s)} className="text-slate-400 hover:text-orange-600 p-1" title="ערוך">
                          <Edit2 size={15} />
                        </button>
                        {(s.customer_message || s.technician_message) && (
                          <span className="text-green-500 p-1" title="יש הודעות מוגדרות">
                            <MessageCircle size={13} />
                          </span>
                        )}
                        <button
                          onClick={() => usage === 0 ? deleteStatus(s.id) : alert(`לא ניתן למחוק — ${usage} תיקונים משתמשים בסטטוס זה`)}
                          className={`p-1 ${usage === 0 ? 'text-slate-400 hover:text-red-600' : 'text-slate-200 cursor-not-allowed'}`}
                          title={usage > 0 ? `${usage} תיקונים בשימוש` : 'מחק'}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {showAddStatus ? (
          <div className="border border-orange-200 bg-orange-50 rounded-lg p-3 flex items-center gap-3 flex-wrap">
            <input value={newStatusForm.emoji} onChange={e => setNewStatusForm(f => ({ ...f, emoji: e.target.value }))}
              placeholder="אמוג'י" className="w-14 border border-slate-300 rounded px-2 py-1.5 text-center" />
            <input value={newStatusForm.label} onChange={e => setNewStatusForm(f => ({ ...f, label: e.target.value }))}
              placeholder="שם הסטטוס" className="border border-slate-300 rounded px-2 py-1.5 flex-1 min-w-32" />
            <select value={newStatusForm.color} onChange={e => setNewStatusForm(f => ({ ...f, color: e.target.value }))}
              className="border border-slate-300 rounded px-2 py-1.5">
              {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <button onClick={addStatus} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg font-semibold flex items-center gap-1">
              <Check size={15} /> הוסף
            </button>
            <button onClick={() => setShowAddStatus(false)} className="text-slate-500 hover:text-slate-700 p-1"><X size={16} /></button>
          </div>
        ) : (
          <button onClick={() => { setShowAddStatus(true); setEditingStatusId(null); }}
            className="text-sm text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1">
            <Plus size={16} /> הוסף סטטוס מותאם אישית
          </button>
        )}
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

      {editingStatusId && (
        <StatusEditModal
          form={editStatusForm}
          setForm={setEditStatusForm}
          onSave={() => saveEditStatus(editingStatusId)}
          onClose={() => setEditingStatusId(null)}
          insertPlaceholder={insertPlaceholder}
        />
      )}

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

function StatusEditModal({ form, setForm, onSave, onClose, insertPlaceholder }) {
  const DEMO = { name: 'ישראל ישראלי', id: 'QR_20260625_007', device: 'Rational CM 101', amount: '850₪', address: 'רחוב הרצל 1, תל אביב', phone: '03-1234567' };
  const preview = (tpl) => (tpl || '')
    .replace('[שם]', DEMO.name).replace('[קוד]', DEMO.id).replace('[מכשיר]', DEMO.device)
    .replace('[סכום]', DEMO.amount).replace('[כתובת]', DEMO.address).replace('[טלפון_עסק]', DEMO.phone);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800">עריכת סטטוס</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"><X size={18} /></button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">אמוג'י</label>
              <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-center text-xl" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-600 block mb-1">שם הסטטוס</label>
              <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">צבע</label>
            <select value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
              className="border border-slate-300 rounded-lg px-3 py-2">
              {[
                { value: 'red', label: 'אדום' }, { value: 'yellow', label: 'צהוב' },
                { value: 'orange', label: 'כתום' }, { value: 'green', label: 'ירוק' },
                { value: 'blue', label: 'כחול' }, { value: 'slate', label: 'אפור' },
              ].map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {['customer_message', 'technician_message'].map(field => (
            <div key={field} className="border border-slate-200 rounded-lg p-3 space-y-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <MessageCircle size={13} />
                {field === 'customer_message' ? 'הודעה ללקוח (WhatsApp)' : 'הודעה לטכנאי (WhatsApp)'}
              </label>
              <div className="flex flex-wrap gap-1 mb-1">
                {PLACEHOLDER_TAGS.map(tag => (
                  <button key={tag} type="button" onClick={() => insertPlaceholder(field, tag)}
                    className="text-xs bg-slate-100 hover:bg-orange-100 hover:text-orange-700 border border-slate-200 rounded px-1.5 py-0.5 font-mono">
                    {tag}
                  </button>
                ))}
              </div>
              <textarea
                value={form[field] || ''}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                rows={3}
                placeholder="השאר ריק אם אין צורך בהודעה לסטטוס זה"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none"
              />
              {form[field] && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-xs text-green-900 whitespace-pre-wrap">
                  <span className="font-semibold text-green-700 block mb-0.5">תצוגה מקדימה:</span>
                  {preview(form[field])}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 text-sm">ביטול</button>
          <button onClick={onSave} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-semibold text-sm flex items-center gap-2">
            <Check size={16} /> שמור
          </button>
        </div>
      </div>
    </div>
  );
}
