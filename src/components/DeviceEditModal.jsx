import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import Modal from './Modal';

const DEVICE_TYPES = [
  'מקרר מסחרי', 'מקפיא מסחרי', 'תנור תעשייתי', 'תנור עגלה', 'מדיח כלים',
  'משטח בישול', 'גריל', 'פריטוזה', 'במרה', 'מכונת קפה', 'מיקסר', 'מעבד מזון', 'אחר',
];

export function DeviceEditModal({ device, onClose }) {
  const { dispatch } = useAppContext();
  const [form, setForm] = useState({
    brand: device.brand || '',
    model: device.model || '',
    type: device.type || '',
    manufacturer_serial: device.manufacturer_serial || '',
    manufacture_year: device.manufacture_year || '',
    warranty_until: device.warranty_until || '',
    notes: device.notes || '',
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const canSave = form.brand.trim() && form.model.trim();

  const handleSave = () => {
    dispatch({ type: 'UPDATE_DEVICE', payload: { ...device, ...form } });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="עריכת מכשיר"
      subtitle={device.id}
      maxWidth="max-w-lg"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm">ביטול</button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-semibold text-sm"
          >
            שמור
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">יצרן *</label>
            <input
              value={form.brand}
              onChange={e => set('brand', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
              placeholder="Samsung, LG..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">דגם *</label>
            <input
              value={form.model}
              onChange={e => set('model', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
              placeholder="מספר דגם"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">סוג מכשיר</label>
          <select
            value={form.type}
            onChange={e => set('type', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
          >
            <option value="">-- בחר סוג --</option>
            {DEVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Serial יצרן</label>
            <input
              value={form.manufacturer_serial}
              onChange={e => set('manufacturer_serial', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 font-mono"
              dir="ltr"
              placeholder="S/N"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">שנת ייצור</label>
            <input
              value={form.manufacture_year}
              onChange={e => set('manufacture_year', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
              placeholder="2022"
              maxLength={4}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">אחריות יצרן עד</label>
          <input
            type="date"
            value={form.warranty_until ? form.warranty_until.split('T')[0] : ''}
            onChange={e => set('warranty_until', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">הערות</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none"
            placeholder="הערות חופשיות"
          />
        </div>
      </div>
    </Modal>
  );
}
