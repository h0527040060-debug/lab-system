import { useState } from 'react';
import { X } from 'lucide-react';
import { useAppContext } from '../store/AppContext';

const WARRANTY_OPTIONS = [
  { value: 'paid', label: 'תשלום רגיל' },
  { value: 'full_warranty', label: 'אחריות מלאה' },
  { value: 'paid_warranty', label: 'אחריות בתשלום' },
];

export default function RepairEditModal({ repair, onClose }) {
  const { state, dispatch } = useAppContext();
  const [form, setForm] = useState({
    complaint: repair.complaint || '',
    customer_id: repair.customer_id || '',
    date_intake: repair.date_intake ? repair.date_intake.slice(0, 16) : '',
    warranty_type: repair.warranty_type || 'paid',
  });

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = () => {
    dispatch({ type: 'UPDATE_REPAIR', payload: { ...repair, ...form } });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">עריכת קריאה {repair.id}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">תלונת לקוח</label>
            <textarea
              value={form.complaint}
              onChange={set('complaint')}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">לקוח</label>
            <select
              value={form.customer_id}
              onChange={set('customer_id')}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">— בחר לקוח —</option>
              {state.customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">תאריך קליטה</label>
            <input
              type="datetime-local"
              value={form.date_intake}
              onChange={set('date_intake')}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">סוג שירות</label>
            <select
              value={form.warranty_type}
              onChange={set('warranty_type')}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {WARRANTY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 p-4 border-t border-slate-200">
          <button
            onClick={handleSave}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
          >
            שמור
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-sm transition-colors"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}
