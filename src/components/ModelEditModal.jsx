import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { uploadToStorage } from '../store/supabaseStorage';
import { compressImage } from '../utils/imageCompression';
import Modal from './Modal';
import AutocompleteInput from './AutocompleteInput';
import { Plus, X } from 'lucide-react';

// עריכת דגם קיים בקטלוג — שם, קטגוריה (חובה) ותמונות. נפתח מכרטיס הדגם ומניהול יצרנים/דגמים.
export default function ModelEditModal({ model, onClose }) {
  const { state, dispatch } = useAppContext();
  const [form, setForm] = useState({
    name: model.name || '',
    device_type: model.device_type || '',
    images: model.images || [],
  });
  const [uploadingImages, setUploadingImages] = useState(false);

  const deviceTypes = state.settings?.fieldLists?.deviceTypes || [];
  const canSave = form.name.trim() && form.device_type.trim();

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 4 - form.images.length);
    e.target.value = '';
    if (!files.length) return;
    setUploadingImages(true);
    try {
      for (const file of files) {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const compressed = await compressImage(dataUrl);
        const url = await uploadToStorage(compressed, 'models');
        setForm(f => ({ ...f, images: [...f.images, url].slice(0, 4) }));
      }
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (idx) => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

  const handleSave = () => {
    if (!canSave) return;
    dispatch({
      type: 'UPDATE_MODEL',
      payload: { id: model.id, name: form.name.trim(), device_type: form.device_type.trim(), images: form.images },
    });
    onClose();
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`עריכת דגם ${model.name}`}
      maxWidth="max-w-lg"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100">ביטול</button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-semibold"
          >
            שמור
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1">שם דגם *</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1">קטגוריה *</label>
          <AutocompleteInput
            value={form.device_type}
            onChange={val => setForm(f => ({ ...f, device_type: val }))}
            onAddValue={val => dispatch({ type: 'ADD_FIELD_VALUE', payload: { field: 'deviceTypes', value: val } })}
            suggestions={deviceTypes}
            placeholder="-- בחר קטגוריה --"
            allowNew
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1">תמונות דגם (עד 4)</label>
          <div className="flex flex-wrap gap-2">
            {form.images.map((img, idx) => (
              <div key={idx} className="relative w-16 h-16 rounded border border-slate-200 overflow-hidden bg-white">
                <img src={img} alt="" className="w-full h-full object-contain" />
                <button onClick={() => removeImage(idx)}
                  className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X size={9} />
                </button>
              </div>
            ))}
            {form.images.length < 4 && (
              <label className="w-16 h-16 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 hover:border-orange-400 cursor-pointer text-xs">
                {uploadingImages ? '...' : <Plus size={20} />}
                <input type="file" accept="image/*" multiple className="hidden" disabled={uploadingImages} onChange={handleImageUpload} />
              </label>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
