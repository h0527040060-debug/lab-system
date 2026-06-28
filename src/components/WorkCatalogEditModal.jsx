import { useState } from 'react';
import Modal from './Modal';

export function WorkCatalogEditModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(item || {
    work_name: '', brand: '', model: '', price: 0, estimated_hours_default: 1, notes: '',
  });

  const canSave = form.work_name && form.brand && form.model && form.price >= 0;

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={item ? `עריכת ${item.id}` : 'הוספת עבודה חדשה'}
      subtitle="הגדרת מחיר עבודה לפי דגם"
      maxWidth="max-w-xl"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100">ביטול</button>
          <button
            onClick={() => onSave(form)}
            disabled={!canSave}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-semibold"
          >
            {item ? 'עדכן' : 'הוסף'}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1">שם העבודה *</label>
          <input
            type="text"
            value={form.work_name}
            onChange={(e) => setForm({ ...form, work_name: e.target.value })}
            placeholder="למשל: החלפת מייסבים, החלפת פחמים"
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">יצרן *</label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              placeholder="Dito, Dynamic, Robot Coupe, או 'כל היצרנים'"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
            <p className="text-xs text-slate-500 mt-1">לעבודה גלובלית: 'כל היצרנים'</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">דגם *</label>
            <input
              type="text"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              placeholder="MX91, R301, או 'כל הדגמים'"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
            <p className="text-xs text-slate-500 mt-1">לכל הדגמים: 'כל הדגמים'</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">מחיר עבודה (₪) *</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
            <p className="text-xs text-slate-500 mt-1">ללא חלקים, ללא מע"מ</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">שעות ברירת מחדל</label>
            <input
              type="number"
              step="0.5"
              value={form.estimated_hours_default}
              onChange={(e) => setForm({ ...form, estimated_hours_default: parseFloat(e.target.value) || 1 })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1">הערות</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>
    </Modal>
  );
}
