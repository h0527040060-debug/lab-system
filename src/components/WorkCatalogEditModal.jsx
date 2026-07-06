import { useState } from 'react';
import Modal from './Modal';
import ManufacturerModelPicker from './ManufacturerModelPicker';
import { getWorkCompatibleDevices } from '../utils/workCatalog';
import { X } from 'lucide-react';

export function WorkCatalogEditModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(item ? {
    ...item,
    compatible_devices: getWorkCompatibleDevices(item),
  } : {
    work_name: '', price: 0, estimated_hours_default: 1, notes: '', compatible_devices: [],
  });
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');

  const addCompatibleDevice = () => {
    const b = deviceBrand.trim();
    if (!b) return;
    const m = deviceModel.trim();
    const exists = form.compatible_devices?.some(d => d.brand === b && (d.model || '') === m);
    if (exists) return;
    setForm(f => ({ ...f, compatible_devices: [...(f.compatible_devices || []), { brand: b, model: m }] }));
    setDeviceBrand('');
    setDeviceModel('');
  };

  const removeCompatibleDevice = (idx) => {
    setForm(f => ({ ...f, compatible_devices: f.compatible_devices.filter((_, i) => i !== idx) }));
  };

  const canSave = form.work_name?.trim() && form.price >= 0;

  const handleSave = () => {
    const cd = form.compatible_devices || [];
    // שדות legacy — לתצוגה בהצעות מחיר/חשבוניות ישנות שמסתמכות על brand/model בודדים
    const legacyBrand = cd.length === 0 ? 'כל היצרנים' : cd.length === 1 ? cd[0].brand : cd.map(d => d.brand).join(', ');
    const legacyModel = cd.length === 0 ? 'כל הדגמים' : cd.length === 1 ? (cd[0].model || 'כל הדגמים') : `${cd.length} דגמים`;
    onSave({ ...form, brand: legacyBrand, model: legacyModel });
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={item ? `עריכת ${item.id}` : 'הוספת עבודה חדשה'}
      subtitle="הגדרת מחיר עבודה והמכשירים שהיא מתאימה להם"
      maxWidth="max-w-xl"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100">ביטול</button>
          <button
            onClick={handleSave}
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
            placeholder="למשל: החלפת מייסבים, החלפת פחמים, החלפת כבל חשמל, ניקוי כללי"
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
        </div>

        {/* מכשירים תואמים */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <h4 className="text-xs font-bold text-slate-700 mb-1">🔗 מכשירים תואמים</h4>
          <p className="text-[10px] text-slate-400 mb-2">
            ריק = עבודה כללית שמתאימה לכל המכשירים (כמו החלפת כבל חשמל, ניקוי, החלפת תקע)
          </p>
          <div className="flex gap-2 mb-2 items-end">
            <div className="flex-1">
              <ManufacturerModelPicker
                initialBrand={deviceBrand}
                initialModel={deviceModel}
                allowEmptyModel
                onSelect={({ brand, model }) => { setDeviceBrand(brand); setDeviceModel(model); }}
              />
            </div>
            <button
              type="button"
              onClick={addCompatibleDevice}
              disabled={!deviceBrand.trim()}
              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded text-xs font-semibold shrink-0"
            >
              הוסף
            </button>
          </div>
          {form.compatible_devices?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {form.compatible_devices.map((d, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs rounded-full px-2.5 py-0.5 font-medium">
                  {d.brand}{d.model ? ` ${d.model}` : ' (כל הדגמים)'}
                  <button type="button" onClick={() => removeCompatibleDevice(i)} className="hover:text-red-600 ml-1">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-2 py-1.5 font-medium">
              ✓ עבודה כללית — תוצג ותהיה זמינה לכל המכשירים
            </p>
          )}
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
