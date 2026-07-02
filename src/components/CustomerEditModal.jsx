import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import Modal from './Modal';

export function CustomerEditModal({ customer, onClose }) {
  const { dispatch } = useAppContext();
  const [form, setForm] = useState({
    name: customer.name || '',
    phone: customer.phone || '',
    phone2: customer.phone2 || '',
    email: customer.email || '',
    address: customer.address || '',
    notes: customer.notes || '',
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const canSave = form.name.trim() && form.phone.trim();

  const handleSave = () => {
    dispatch({ type: 'UPDATE_CUSTOMER', payload: { ...customer, ...form } });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="עריכת לקוח"
      subtitle={customer.id}
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
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">שם לקוח *</label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            placeholder="שם מלא"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">טלפון ראשי *</label>
            <input
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
              dir="ltr"
              placeholder="050-0000000"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">טלפון נוסף</label>
            <input
              value={form.phone2}
              onChange={e => set('phone2', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
              dir="ltr"
              placeholder="אופציונלי"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">מייל</label>
          <input
            value={form.email}
            onChange={e => set('email', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            dir="ltr"
            placeholder="example@mail.com"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">כתובת</label>
          <input
            value={form.address}
            onChange={e => set('address', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            placeholder="רחוב, עיר"
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
