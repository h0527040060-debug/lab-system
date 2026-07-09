import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import Modal from './Modal';
import { WARRANTY_TYPES, WARRANTY_LABELS } from '../constants/warranty';
import { useDirtyForm } from '../hooks/useDirtyForm';
import { useUnsavedGuard } from '../hooks/useUnsavedGuard';

export function RepairEditModal({ repair, onClose }) {
  const { dispatch } = useAppContext();
  const [form, setForm] = useState({
    complaint: repair.complaint || '',
    warranty_type: repair.warranty_type || 'paid',
    intake_notes: repair.intake_notes || '',
  });
  const isDirty = useDirtyForm(form);
  const { requestClose, confirmDialog } = useUnsavedGuard(isDirty, onClose);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = () => {
    dispatch({ type: 'UPDATE_REPAIR', payload: { ...repair, ...form } });
    onClose();
  };

  return (
    <>
    <Modal
      open
      onClose={requestClose}
      sheet
      title="עריכת פרטי תיקון"
      subtitle={repair.id}
      maxWidth="max-w-lg"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={requestClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm">ביטול</button>
          <button
            onClick={handleSave}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold text-sm"
          >
            שמור
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">סוג שירות</label>
          <select
            value={form.warranty_type}
            onChange={e => set('warranty_type', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
          >
            {Object.values(WARRANTY_TYPES).map(val => (
              <option key={val} value={val}>{WARRANTY_LABELS[val]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">תלונת לקוח</label>
          <textarea
            value={form.complaint}
            onChange={e => set('complaint', e.target.value)}
            rows={3}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none"
            placeholder="תאר את התקלה"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">הערות קליטה פנימיות</label>
          <textarea
            value={form.intake_notes}
            onChange={e => set('intake_notes', e.target.value)}
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none"
            placeholder="הערות פנימיות"
          />
        </div>
      </div>
    </Modal>
    {confirmDialog}
    </>
  );
}
