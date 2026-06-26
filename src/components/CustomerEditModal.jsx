import { useState } from 'react';
import { X } from 'lucide-react';
import { useAppContext } from '../store/AppContext';

export default function CustomerEditModal({ customer, onClose }) {
  const { dispatch } = useAppContext();
  const [form, setForm] = useState({
    name: customer.name || '',
    phone: customer.phone || '',
    email: customer.email || '',
    address: customer.address || '',
    notes: customer.notes || '',
  });

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = () => {
    dispatch({ type: 'UPDATE_CUSTOMER', payload: { ...customer, ...form } });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">עריכת לקוח {customer.id}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {[
            { field: 'name', label: 'שם', type: 'text' },
            { field: 'phone', label: 'טלפון', type: 'tel' },
            { field: 'email', label: 'מייל', type: 'email' },
            { field: 'address', label: 'כתובת', type: 'text' },
          ].map(({ field, label, type }) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
              <input
                type={type}
                value={form[field]}
                onChange={set(field)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">הערות</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
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
