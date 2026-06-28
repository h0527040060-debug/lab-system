import { useState } from 'react';
import { useAppContext as useApp } from '../store/AppContext';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { Plus, Trash2, MapPin, Building2 } from 'lucide-react';

export function PartEditModal({ part, onSave, onClose }) {
  const { state } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState(part || {
    name: '', manufacturer: '', manufacturer_sku: '', internal_barcode: '',
    category: 'other', images: ['📦'],
    shelf: '', bin: '', zone: '',
    suppliers: [],
    min_stock: 1, selling_markup_percent: 50,
  });

  const updateSupplier = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      suppliers: prev.suppliers.map((s, i) => i === idx ? { ...s, [field]: value } : s)
    }));
  };

  const addSupplier = () => {
    setForm(prev => ({
      ...prev,
      suppliers: [...prev.suppliers, {
        supplier_id: state.suppliers[0]?.id || 1,
        supplier_name: state.suppliers[0]?.name || '',
        supplier_sku: '',
        price: 0,
        lead_time_days: 7,
        is_default: prev.suppliers.length === 0,
      }]
    }));
  };

  const removeSupplier = (idx) => {
    setForm(prev => ({
      ...prev,
      suppliers: prev.suppliers.filter((_, i) => i !== idx)
    }));
  };

  const setDefaultSupplier = (idx) => {
    setForm(prev => ({
      ...prev,
      suppliers: prev.suppliers.map((s, i) => ({ ...s, is_default: i === idx }))
    }));
  };

  const canSave = form.name && form.manufacturer;

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={part ? `עריכת ${part.name}` : 'חלק חדש'}
      maxWidth="max-w-3xl"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100">ביטול</button>
          <button
            onClick={() => onSave(form)}
            disabled={!canSave}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-semibold"
          >
            {part ? 'עדכן' : 'הוסף'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold block mb-1">שם החלק *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">יצרן *</label>
            <input
              type="text"
              value={form.manufacturer}
              onChange={(e) => setForm({...form, manufacturer: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">מק"ט יצרן</label>
            <input
              type="text"
              value={form.manufacturer_sku}
              onChange={(e) => setForm({...form, manufacturer_sku: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold block mb-1">קטגוריה</label>
            <select
              value={form.category}
              onChange={(e) => setForm({...form, category: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="sensor">חיישן</option>
              <option value="heating">חימום</option>
              <option value="control">בקרה</option>
              <option value="motor">מנוע</option>
              <option value="seal">איטום</option>
              <option value="pump">משאבה</option>
              <option value="fan">מאוורר</option>
              <option value="other">אחר</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">אימוג'י</label>
            <input
              type="text"
              value={form.images?.[0] || ''}
              onChange={(e) => setForm({...form, images: [e.target.value]})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-2xl text-center"
              maxLength={2}
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">מלאי מינימום</label>
            <input
              type="number"
              value={form.min_stock}
              onChange={(e) => setForm({...form, min_stock: parseInt(e.target.value) || 0})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">מרווח רווח %</label>
            <input
              type="number"
              value={form.selling_markup_percent}
              onChange={(e) => setForm({...form, selling_markup_percent: parseInt(e.target.value) || 0})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
            <MapPin size={12} />
            מיקום במחסן
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-600 block mb-1">מדף</label>
              <input
                type="text"
                value={form.shelf}
                onChange={(e) => setForm({...form, shelf: e.target.value})}
                placeholder="A3"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">תא</label>
              <input
                type="text"
                value={form.bin}
                onChange={(e) => setForm({...form, bin: e.target.value})}
                placeholder="B2"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">אזור</label>
              <input
                type="text"
                value={form.zone}
                onChange={(e) => setForm({...form, zone: e.target.value})}
                placeholder="אלקטרוניקה"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Building2 size={12} />
              ספקים ({form.suppliers?.length || 0})
            </h4>
            <button onClick={addSupplier} className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1">
              <Plus size={12} />
              הוסף ספק
            </button>
          </div>
          <div className="space-y-2">
            {form.suppliers?.map((supplier, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-lg p-2 grid grid-cols-12 gap-2 items-center text-sm">
                <select
                  value={supplier.supplier_name}
                  onChange={(e) => {
                    const s = state.suppliers.find(sp => sp.name === e.target.value);
                    updateSupplier(idx, 'supplier_name', e.target.value);
                    if (s) updateSupplier(idx, 'supplier_id', s.id);
                  }}
                  className="col-span-3 border border-slate-300 rounded px-2 py-1 text-xs"
                >
                  {state.suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="מק״ט ספק"
                  value={supplier.supplier_sku}
                  onChange={(e) => updateSupplier(idx, 'supplier_sku', e.target.value)}
                  className="col-span-3 border border-slate-300 rounded px-2 py-1 text-xs"
                />
                <input
                  type="number"
                  placeholder="מחיר"
                  value={supplier.price}
                  onChange={(e) => updateSupplier(idx, 'price', parseFloat(e.target.value) || 0)}
                  className="col-span-2 border border-slate-300 rounded px-2 py-1 text-xs"
                />
                <input
                  type="number"
                  placeholder="ימים"
                  value={supplier.lead_time_days}
                  onChange={(e) => updateSupplier(idx, 'lead_time_days', parseInt(e.target.value) || 0)}
                  className="col-span-2 border border-slate-300 rounded px-2 py-1 text-xs"
                />
                <label className="col-span-1 flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="default_supplier"
                    checked={supplier.is_default}
                    onChange={() => setDefaultSupplier(idx)}
                  />
                  <span>ברירת מחדל</span>
                </label>
                <button
                  onClick={() => setConfirmDelete({ action: () => removeSupplier(idx), message: 'האם אתה בטוח שאתה רוצה להסיר את הספק?' })}
                  className="col-span-1 text-slate-400 hover:text-red-600 flex justify-center"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {(!form.suppliers || form.suppliers.length === 0) && (
              <p className="text-xs text-slate-500 text-center py-2">אין ספקים. הוסף ספק לקבלת מחירים והזמנות.</p>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={!!confirmDelete}
        title="אישור מחיקה"
        message={confirmDelete?.message}
        confirmLabel="הסר"
        variant="danger"
        onConfirm={() => { confirmDelete?.action(); setConfirmDelete(null); }}
        onCancel={() => setConfirmDelete(null)}
      />
    </Modal>
  );
}
