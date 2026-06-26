import { useState } from 'react';
import { X } from 'lucide-react';
import { useAppContext } from '../store/AppContext';

export default function DeviceEditModal({ device, onClose }) {
  const { dispatch } = useAppContext();
  const [form, setForm] = useState({
    type: device.type || '',
    brand: device.brand || '',
    model: device.model || '',
    manufacturer_serial: device.manufacturer_serial || '',
    purchase_date: device.purchase_date || '',
    warranty_until: device.warranty_until || '',
  });

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = () => {
    dispatch({ type: 'UPDATE_DEVICE', payload: { ...device, ...form } });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">עריכת מכשיר {device.id}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {[
            { field: 'type', label: 'סוג מכשיר', type: 'text', placeholder: 'בלנדר מוט, מקרר...' },
            { field: 'brand', label: 'יצרן', type: 'text' },
            { field: 'model', label: 'דגם', type: 'text' },
            { field: 'manufacturer_serial', label: 'Serial יצרן', type: 'text' },
          ].map(({ field, label, type, placeholder }) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
              <input
                type={type}
                value={form[field]}
                onChange={set(field)}
                placeholder={placeholder}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">תאריך רכישה</label>
            <input
              type="date"
              value={form.purchase_date}
              onChange={set('purchase_date')}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">אחריות יצרן עד</label>
            <input
              type="date"
              value={form.warranty_until}
              onChange={set('warranty_until')}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
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
