import { useState, useRef } from 'react';
import { useAppContext } from '../store/AppContext';
import Modal from './Modal';
import { X, RefreshCw, Camera } from 'lucide-react';

const DEVICE_TYPES = [
  'מקרר מסחרי', 'מקפיא מסחרי', 'תנור תעשייתי', 'תנור עגלה', 'מדיח כלים',
  'משטח בישול', 'גריל', 'פריטוזה', 'במרה', 'מכונת קפה', 'מיקסר', 'מעבד מזון', 'אחר',
];

const MAX_IMAGES = 4;
const IMG_MAX_PX = 800;
const IMG_QUALITY = 0.7;

const compressImage = (dataUrl) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, IMG_MAX_PX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', IMG_QUALITY));
    };
    img.src = dataUrl;
  });

const readFile = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });

export function DeviceEditModal({ device, onClose }) {
  const { dispatch } = useAppContext();
  const addInputRef = useRef(null);
  const replaceInputRef = useRef(null);
  const [replaceIndex, setReplaceIndex] = useState(null);

  const [form, setForm] = useState({
    brand: device.brand || '',
    model: device.model || '',
    type: device.type || '',
    manufacturer_serial: device.manufacturer_serial || '',
    manufacture_year: device.manufacture_year || '',
    warranty_until: device.warranty_until || '',
    notes: device.notes || '',
    images: device.images || [],
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const canSave = form.brand.trim() && form.model.trim();

  const handleSave = () => {
    dispatch({ type: 'UPDATE_DEVICE', payload: { ...device, ...form } });
    onClose();
  };

  const handleAddImages = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const slots = MAX_IMAGES - form.images.length;
    const toAdd = files.slice(0, slots);
    const compressed = await Promise.all(toAdd.map(async f => compressImage(await readFile(f))));
    setForm(prev => ({ ...prev, images: [...prev.images, ...compressed] }));
    e.target.value = '';
  };

  const handleReplaceImage = async (e) => {
    const file = e.target.files[0];
    if (!file || replaceIndex === null) return;
    const compressed = await compressImage(await readFile(file));
    setForm(prev => {
      const imgs = [...prev.images];
      imgs[replaceIndex] = compressed;
      return { ...prev, images: imgs };
    });
    e.target.value = '';
    setReplaceIndex(null);
  };

  const handleDeleteImage = (idx) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const openReplace = (idx) => {
    setReplaceIndex(idx);
    replaceInputRef.current?.click();
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

        {/* סקשן תמונות */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">תמונות מכשיר</label>
          <div className="flex flex-wrap gap-2">
            {form.images.map((src, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => openReplace(idx)}
                    className="p-1 bg-white/80 rounded text-slate-700 hover:bg-white"
                    title="החלף"
                  >
                    <RefreshCw size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(idx)}
                    className="p-1 bg-white/80 rounded text-red-600 hover:bg-white"
                    title="מחק"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
            {form.images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => addInputRef.current?.click()}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-orange-400 hover:text-orange-400 transition-colors"
              >
                <Camera size={18} />
                <span className="text-xs">הוסף</span>
              </button>
            )}
          </div>
          <input
            ref={addInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleAddImages}
          />
          <input
            ref={replaceInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleReplaceImage}
          />
        </div>
      </div>
    </Modal>
  );
}
