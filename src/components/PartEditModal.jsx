import { useState, useMemo } from 'react';
import { useAppContext as useApp } from '../store/AppContext';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { Plus, Trash2, MapPin, Building2, X } from 'lucide-react';

export function PartEditModal({ part, onSave, onClose }) {
  const { state } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState(part || {
    name: '', manufacturer: '', manufacturer_sku: '', internal_barcode: '',
    category: 'other', images: ['📦'],
    shelf: '', bin: '', zone: '',
    suppliers: [],
    min_stock: 1, selling_markup_percent: 50,
    compatible_devices: [],
  });
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');

  // רשימת דגמים ייחודיים מהמכשירים הקיימים לצורך autocomplete
  const deviceSuggestions = useMemo(() => {
    const seen = new Set();
    return state.devices
      .filter(d => d.brand && d.model)
      .filter(d => {
        const key = `${d.brand}||${d.model}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(d => ({ brand: d.brand, model: d.model }));
  }, [state.devices]);

  const addCompatibleDevice = () => {
    const b = deviceBrand.trim();
    const m = deviceModel.trim();
    if (!b || !m) return;
    const exists = form.compatible_devices?.some(d => d.brand === b && d.model === m);
    if (exists) return;
    setForm(prev => ({ ...prev, compatible_devices: [...(prev.compatible_devices || []), { brand: b, model: m }] }));
    setDeviceBrand('');
    setDeviceModel('');
  };

  const removeCompatibleDevice = (idx) => {
    setForm(prev => ({ ...prev, compatible_devices: prev.compatible_devices.filter((_, i) => i !== idx) }));
  };

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

  const canSave = !!form.name;

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
            <label className="text-xs font-semibold block mb-1">יצרן</label>
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

        {/* מכשירים תואמים */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <h4 className="text-xs font-bold text-slate-700 mb-1">🔗 מכשירים תואמים</h4>
          <p className="text-[10px] text-slate-400 mb-2">ריק = החלק מתאים לכל המכשירים</p>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              list="brand-suggestions"
              placeholder="יצרן (לדוגמה: Dynamics)"
              value={deviceBrand}
              onChange={e => setDeviceBrand(e.target.value)}
              className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs"
            />
            <input
              type="text"
              list="model-suggestions"
              placeholder="דגם (לדוגמה: MX91)"
              value={deviceModel}
              onChange={e => setDeviceModel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCompatibleDevice()}
              className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs"
            />
            <button
              type="button"
              onClick={addCompatibleDevice}
              disabled={!deviceBrand.trim() || !deviceModel.trim()}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded text-xs font-semibold"
            >
              הוסף
            </button>
          </div>
          <datalist id="brand-suggestions">
            {[...new Set(deviceSuggestions.map(d => d.brand))].map(b => <option key={b} value={b} />)}
          </datalist>
          <datalist id="model-suggestions">
            {deviceSuggestions
              .filter(d => !deviceBrand || d.brand === deviceBrand)
              .map(d => <option key={`${d.brand}||${d.model}`} value={d.model} />)}
          </datalist>
          {form.compatible_devices?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.compatible_devices.map((d, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs rounded-full px-2.5 py-0.5 font-medium">
                  {d.brand} {d.model}
                  <button type="button" onClick={() => removeCompatibleDevice(i)} className="hover:text-red-600 ml-1">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
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
                <div className="col-span-2 flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400">עלות רכש ₪</span>
                  <input
                    type="number"
                    value={supplier.price}
                    onChange={(e) => updateSupplier(idx, 'price', parseFloat(e.target.value) || 0)}
                    className="border border-slate-300 rounded px-2 py-1 text-xs w-full"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400">זמן אספקה (ימים)</span>
                  <input
                    type="number"
                    value={supplier.lead_time_days}
                    onChange={(e) => updateSupplier(idx, 'lead_time_days', parseInt(e.target.value) || 0)}
                    className="border border-slate-300 rounded px-2 py-1 text-xs w-full"
                  />
                </div>
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
