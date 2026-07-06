import { useState, useRef, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import Modal from './Modal';
import AutocompleteInput from './AutocompleteInput';
import ImageGalleryModal from './ImageGalleryModal';
import ConfirmDialog from './ConfirmDialog';
import { X, RefreshCw, Camera } from 'lucide-react';
import { uploadToStorage } from '../store/supabaseStorage';

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
  const { state, dispatch } = useAppContext();
  const deviceTypes = state.settings?.fieldLists?.deviceTypes || [];
  const addInputRef = useRef(null);
  const replaceInputRef = useRef(null);
  const [replaceIndex, setReplaceIndex] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(null);
  const [confirmDeleteImg, setConfirmDeleteImg] = useState(null);

  const [form, setForm] = useState({
    brand: device.brand || '',
    model: device.model || '',
    type: device.type || '',
    manufacturer_serial: device.manufacturer_serial || '',
    manufacture_year: device.manufacture_year || '',
    our_warranty_months: device.our_warranty_months || null,
    notes: device.notes || '',
    images: device.images || [],
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const canSave = form.brand.trim() && form.model.trim();

  // קטלוג יצרנים ודגמים מהמכשירים הקיימים
  const allBrands = useMemo(() =>
    [...new Set(state.devices.filter(d => d.brand).map(d => d.brand))].sort(),
    [state.devices]
  );
  const modelsForBrand = useMemo(() =>
    [...new Set(
      state.devices
        .filter(d => d.model && (!form.brand || d.brand?.toLowerCase() === form.brand?.toLowerCase()))
        .map(d => d.model)
    )].sort(),
    [state.devices, form.brand]
  );

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
    const urls = await Promise.all(compressed.map(c => uploadToStorage(c, 'devices')));
    setForm(prev => ({ ...prev, images: [...prev.images, ...urls] }));
    e.target.value = '';
  };

  const handleReplaceImage = async (e) => {
    const file = e.target.files[0];
    if (!file || replaceIndex === null) return;
    const compressed = await compressImage(await readFile(file));
    const url = await uploadToStorage(compressed, 'devices');
    setForm(prev => {
      const imgs = [...prev.images];
      imgs[replaceIndex] = url;
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
    <>
    <Modal
      open
      onClose={onClose}
      sheet
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
            <AutocompleteInput
              value={form.brand}
              onChange={val => { set('brand', val); set('model', ''); }}
              suggestions={allBrands}
              placeholder="Samsung, LG..."
              allowNew
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">דגם *</label>
            <AutocompleteInput
              value={form.model}
              onChange={val => set('model', val)}
              suggestions={modelsForBrand}
              placeholder="מספר דגם מדויק"
              allowNew
              className="text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">שם מכשיר</label>
          <AutocompleteInput
            value={form.type}
            onChange={val => set('type', val)}
            onAddValue={val => dispatch({ type: 'ADD_FIELD_VALUE', payload: { field: 'deviceTypes', value: val } })}
            suggestions={deviceTypes}
            placeholder="-- בחר סוג --"
            allowNew
          />
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
          <label className="block text-sm font-semibold text-slate-700 mb-1">אחריות שלנו</label>
          <div className="flex gap-2 items-center flex-wrap">
            {[3, 12].map(m => (
              <button
                type="button"
                key={m}
                onClick={() => set('our_warranty_months', form.our_warranty_months === m ? null : m)}
                className={`px-3 py-1.5 rounded-lg text-sm border ${form.our_warranty_months === m ? 'bg-orange-500 text-white border-orange-500' : 'border-slate-300 text-slate-600 hover:border-orange-400'}`}
              >
                {m} חודשים
              </button>
            ))}
            <input
              type="number"
              min="1"
              max="120"
              placeholder="אחר"
              value={form.our_warranty_months && ![3, 12].includes(form.our_warranty_months) ? form.our_warranty_months : ''}
              onChange={e => set('our_warranty_months', e.target.value ? Number(e.target.value) : null)}
              className="w-20 border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-orange-400"
            />
            {form.our_warranty_months && <span className="text-xs text-slate-500">{form.our_warranty_months} חודשים</span>}
          </div>
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
              <div key={idx} className="relative w-20 h-20 rounded-lg overflow-visible border border-slate-200">
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover rounded-lg cursor-pointer"
                  onClick={() => setGalleryIndex(idx)}
                />
                {/* כפתור מחיקה — תמיד גלוי */}
                <button
                  type="button"
                  onClick={() => setConfirmDeleteImg(idx)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                  title="מחק"
                >
                  <X size={10} />
                </button>
                {/* כפתור החלפה — תמיד גלוי */}
                <button
                  type="button"
                  onClick={() => openReplace(idx)}
                  className="absolute -bottom-2 -right-2 w-5 h-5 bg-slate-600 text-white rounded-full flex items-center justify-center shadow"
                  title="החלף"
                >
                  <RefreshCw size={9} />
                </button>
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
    {galleryIndex !== null && (
      <ImageGalleryModal
        images={form.images}
        startIndex={galleryIndex}
        onClose={() => setGalleryIndex(null)}
      />
    )}
    <ConfirmDialog
      open={confirmDeleteImg !== null}
      title="אישור מחיקה"
      message="האם אתה בטוח שאתה רוצה למחוק את התמונה?"
      confirmLabel="מחק"
      variant="danger"
      onConfirm={() => { handleDeleteImage(confirmDeleteImg); setConfirmDeleteImg(null); }}
      onCancel={() => setConfirmDeleteImg(null)}
    />
    </>
  );
}
