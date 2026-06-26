import { useState } from 'react';
import { useAppContext } from '../../../store/AppContext';
import { getStatusDisplay, PLACEHOLDER_TAGS } from '../../../utils/statusConfig';
import { Edit2, Trash2, Check, X, Plus, MessageCircle } from 'lucide-react';

const COLOR_OPTIONS = [
  { value: 'red',    label: 'אדום' },
  { value: 'yellow', label: 'צהוב' },
  { value: 'orange', label: 'כתום' },
  { value: 'green',  label: 'ירוק' },
  { value: 'blue',   label: 'כחול' },
  { value: 'slate',  label: 'אפור' },
];

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
              {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
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

export function SettingsStatuses() {
  const { state, dispatch } = useAppContext();
  const [editingStatusId, setEditingStatusId] = useState(null);
  const [editStatusForm, setEditStatusForm] = useState({});
  const [showAddStatus, setShowAddStatus] = useState(false);
  const [newStatusForm, setNewStatusForm] = useState({ label: '', emoji: '🔵', color: 'blue' });

  const insertPlaceholder = (field, tag) => setEditStatusForm(f => ({ ...f, [field]: (f[field] || '') + tag }));

  const startEditStatus = (s) => {
    setEditStatusForm({ label: s.label, emoji: s.emoji, color: s.color, customer_message: s.customer_message || '', technician_message: s.technician_message || '' });
    setEditingStatusId(s.id);
    setShowAddStatus(false);
  };

  const saveEditStatus = (id) => {
    dispatch({ type: 'UPDATE_STATUS', payload: { id, ...editStatusForm } });
    setEditingStatusId(null);
  };

  const deleteStatus = (id) => dispatch({ type: 'DELETE_STATUS', payload: id });

  const addStatus = () => {
    if (!newStatusForm.label.trim()) return;
    dispatch({ type: 'ADD_STATUS', payload: { id: 'custom_' + Date.now(), ...newStatusForm, is_system: false } });
    setNewStatusForm({ label: '', emoji: '🔵', color: 'blue' });
    setShowAddStatus(false);
  };

  const getUsageCount = (statusId) => state.repairs.filter(r => r.status === statusId).length;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
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
              return (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3"><span className="text-xl">{display.emoji}</span></td>
                  <td className="p-3"><span className="font-semibold">{display.label}</span></td>
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
                      <button onClick={() => startEditStatus(s)} className="text-slate-400 hover:text-orange-600 p-1">
                        <Edit2 size={15} />
                      </button>
                      {(s.customer_message || s.technician_message) && (
                        <span className="text-green-500 p-1"><MessageCircle size={13} /></span>
                      )}
                      <button
                        onClick={() => usage === 0 ? deleteStatus(s.id) : alert(`לא ניתן למחוק — ${usage} תיקונים משתמשים בסטטוס זה`)}
                        className={`p-1 ${usage === 0 ? 'text-slate-400 hover:text-red-600' : 'text-slate-200 cursor-not-allowed'}`}
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

      {editingStatusId && (
        <StatusEditModal
          form={editStatusForm}
          setForm={setEditStatusForm}
          onSave={() => saveEditStatus(editingStatusId)}
          onClose={() => setEditingStatusId(null)}
          insertPlaceholder={insertPlaceholder}
        />
      )}
    </div>
  );
}
