import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { uploadToStorage } from '../store/supabaseStorage';
import { compressImage } from '../utils/imageCompression';
import { generateManufacturerId, generateModelId } from '../utils/idGenerators';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import AutocompleteInput from './AutocompleteInput';
import { Plus, X, Trash2 } from 'lucide-react';
import { useDirtyForm } from '../hooks/useDirtyForm';
import { useUnsavedGuard } from '../hooks/useUnsavedGuard';

// עריכת דגם — שם, קטגוריה (חובה) ותמונות. נפתח מכרטיס הדגם, ממסך המכשירים ומניהול יצרנים/דגמים.
// אם model.id ריק (טרם מקוטלג — למשל מכשיר ישן שהמיגרציה פספסה) — השמירה יוצרת דגם חדש בקטלוג,
// כולל יצירת היצרן אם עדיין אין (model.draftBrand מכיל את שם היצרן לשימוש הזה).
export default function ModelEditModal({ model, onClose }) {
  const { state, dispatch } = useAppContext();
  const isNew = !model.id;
  const [form, setForm] = useState({
    name: model.name || '',
    device_type: model.device_type || '',
    images: model.images || [],
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isDirty = useDirtyForm(form);
  const { requestClose, confirmDialog } = useUnsavedGuard(isDirty, onClose);

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

  // מעדכן את כל המכשירים הקיימים שמשויכים לדגם (לפי brand+model המקוריים) כשהשם/הקטגוריה משתנים,
  // כדי שהקיבוץ במסך "מכשירים" והקטגוריה הנגזרת יישארו מסונכרנים אחרי עריכה/קיטלוג
  const syncDevices = (manufacturerName, newName, newCategory) => {
    const oldBrand = (manufacturerName || '').toLowerCase();
    const oldModel = (model.name || '').toLowerCase();
    state.devices
      .filter(d => d.brand?.toLowerCase() === oldBrand && d.model?.toLowerCase() === oldModel)
      .forEach(d => dispatch({ type: 'UPDATE_DEVICE', payload: { ...d, brand: manufacturerName, model: newName, type: newCategory } }));
  };

  const handleSave = () => {
    if (!canSave) return;
    const name = form.name.trim();
    const category = form.device_type.trim();
    if (isNew) {
      let manufacturerId = state.manufacturers.find(
        m => m.name.toLowerCase() === (model.draftBrand || '').toLowerCase()
      )?.id;
      if (!manufacturerId) {
        manufacturerId = generateManufacturerId(state.manufacturers.map(m => m.id));
        dispatch({ type: 'ADD_MANUFACTURER', payload: { id: manufacturerId, name: model.draftBrand } });
      }
      const id = generateModelId(state.models.map(m => m.id));
      dispatch({
        type: 'ADD_MODEL',
        payload: { id, manufacturer_id: manufacturerId, name, device_type: category, images: form.images, main_image_index: 0 },
      });
      syncDevices(model.draftBrand, name, category);
    } else {
      const manufacturerName = state.manufacturers.find(m => m.id === model.manufacturer_id)?.name || '';
      dispatch({
        type: 'UPDATE_MODEL',
        payload: { id: model.id, name, device_type: category, images: form.images },
      });
      syncDevices(manufacturerName, name, category);
    }
    onClose();
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_MODEL', payload: model.id });
    setConfirmDelete(false);
    onClose();
  };

  return (
    <>
    <Modal
      open={true}
      onClose={requestClose}
      title={isNew ? `קטלוג דגם — ${model.draftBrand}` : `עריכת דגם ${model.name}`}
      subtitle={isNew ? 'המכשיר הזה עדיין לא מקוטלג — מלא את הפרטים כדי לקטלג אותו' : undefined}
      maxWidth="max-w-lg"
      footer={
        <div className="flex justify-between items-center">
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={isNew}
            title={isNew ? 'יש לקטלג את הדגם לפני שניתן למחוק אותו' : undefined}
            className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 disabled:text-slate-300 disabled:cursor-not-allowed font-semibold"
          >
            <Trash2 size={15} /> מחק דגם
          </button>
          <div className="flex gap-2">
            <button onClick={requestClose} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100">ביטול</button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-semibold"
            >
              שמור
            </button>
          </div>
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
    <ConfirmDialog
      open={confirmDelete}
      title="מחיקת דגם"
      message={`האם למחוק את "${model.name}" מהקטלוג? מכשירים קיימים מהדגם הזה יישארו במערכת, אך יאבדו את שיוך הקטגוריה/תמונה עד שיקוטלגו מחדש.`}
      confirmLabel="מחק"
      variant="danger"
      onConfirm={handleDelete}
      onCancel={() => setConfirmDelete(false)}
    />
    {confirmDialog}
    </>
  );
}
