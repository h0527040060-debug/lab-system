import { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { uploadToStorage } from '../store/supabaseStorage';
import { compressImage } from '../utils/imageCompression';
import { generateManufacturerId, generateModelId } from '../utils/idGenerators';
import AutocompleteInput from './AutocompleteInput';
import { Plus, X } from 'lucide-react';

// בחירת יצרן+דגם מתוך הקטלוג המובנה בלבד — לא הקלדה חופשית.
// initialBrand/initialModel: מחרוזות קיימות (נתונים ישנים) — לאיתור בחירה ראשונית בקטלוג.
// allowEmptyModel: מאפשר לבחור "כל הדגמים" של יצרן (למשל עבודה כללית ליצרן).
// onSelect({ brand, model, type }) — נקרא בכל שינוי בחירה, עם מחרוזות מוכנות לטפסים קיימים.
export default function ManufacturerModelPicker({ initialBrand = '', initialModel = '', allowEmptyModel = false, onSelect }) {
  const { state, dispatch } = useAppContext();

  const findManufacturerByName = (name) =>
    state.manufacturers.find(m => m.name.toLowerCase() === (name || '').toLowerCase());
  const findModelByName = (manufacturerId, name) =>
    state.models.find(md => md.manufacturer_id === manufacturerId && md.name.toLowerCase() === (name || '').toLowerCase());

  const [manufacturerId, setManufacturerId] = useState(() => findManufacturerByName(initialBrand)?.id || '');
  const [modelId, setModelId] = useState(() => {
    const mfg = findManufacturerByName(initialBrand);
    return mfg ? (findModelByName(mfg.id, initialModel)?.id || '') : '';
  });

  const [showAddMfg, setShowAddMfg] = useState(false);
  const [newMfgName, setNewMfgName] = useState('');
  const [showAddModel, setShowAddModel] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelType, setNewModelType] = useState('');
  const [newModelImages, setNewModelImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const deviceTypes = state.settings?.fieldLists?.deviceTypes || [];
  const sortedManufacturers = useMemo(
    () => [...state.manufacturers].sort((a, b) => a.name.localeCompare(b.name, 'he')),
    [state.manufacturers]
  );
  const modelsForManufacturer = useMemo(
    () => state.models.filter(m => m.manufacturer_id === manufacturerId).sort((a, b) => a.name.localeCompare(b.name, 'he')),
    [state.models, manufacturerId]
  );

  const fireSelect = (mfgId, mdlId) => {
    const mfg = state.manufacturers.find(m => m.id === mfgId);
    const mdl = state.models.find(m => m.id === mdlId);
    onSelect?.({
      brand: mfg?.name || '',
      model: mdlId === '' ? '' : (mdl?.name || ''),
      type: mdl?.device_type || '',
    });
  };

  const handleManufacturerChange = (id) => {
    setManufacturerId(id);
    setModelId('');
    fireSelect(id, '');
  };

  const handleModelChange = (id) => {
    setModelId(id);
    fireSelect(manufacturerId, id);
  };

  const handleAddManufacturer = () => {
    const name = newMfgName.trim();
    if (!name) return;
    const id = generateManufacturerId(state.manufacturers.map(m => m.id));
    dispatch({ type: 'ADD_MANUFACTURER', payload: { id, name } });
    setNewMfgName('');
    setShowAddMfg(false);
    setManufacturerId(id);
    setModelId('');
    // הבחירה תשלח ל-onSelect ברגע שה-state יתעדכן; מבצעים גם עדכון מיידי מקומי
    onSelect?.({ brand: name, model: '', type: '' });
  };

  const handleModelImageUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 4 - newModelImages.length);
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
        setNewModelImages(prev => [...prev, url].slice(0, 4));
      }
    } finally {
      setUploadingImages(false);
    }
  };

  const handleAddModel = () => {
    const name = newModelName.trim();
    if (!name || !manufacturerId) return;
    const id = generateModelId(state.models.map(m => m.id));
    const payload = {
      id, manufacturer_id: manufacturerId, name,
      device_type: newModelType || '',
      images: newModelImages, main_image_index: 0,
    };
    dispatch({ type: 'ADD_MODEL', payload });
    setNewModelName('');
    setNewModelType('');
    setNewModelImages([]);
    setShowAddModel(false);
    setModelId(id);
    onSelect?.({ brand: state.manufacturers.find(m => m.id === manufacturerId)?.name || '', model: name, type: payload.device_type });
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold block mb-1">יצרן</label>
          <div className="flex gap-1">
            <select
              value={manufacturerId}
              onChange={e => handleManufacturerChange(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm"
            >
              <option value="">-- בחר יצרן --</option>
              {sortedManufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <button
              type="button"
              onClick={() => setShowAddMfg(v => !v)}
              className="shrink-0 px-2 border border-slate-300 rounded-lg text-slate-500 hover:text-orange-600 hover:border-orange-400"
              title="הוסף יצרן חדש"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1">דגם</label>
          <div className="flex gap-1">
            <select
              value={modelId}
              onChange={e => handleModelChange(e.target.value)}
              disabled={!manufacturerId}
              className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">{allowEmptyModel ? 'כל הדגמים' : '-- בחר דגם --'}</option>
              {modelsForManufacturer.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <button
              type="button"
              onClick={() => setShowAddModel(v => !v)}
              disabled={!manufacturerId}
              className="shrink-0 px-2 border border-slate-300 rounded-lg text-slate-500 hover:text-orange-600 hover:border-orange-400 disabled:opacity-40"
              title="הוסף דגם חדש"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {showAddMfg && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 flex items-center gap-2">
          <input
            type="text" value={newMfgName} onChange={e => setNewMfgName(e.target.value)}
            placeholder="שם יצרן חדש" className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
          />
          <button type="button" onClick={handleAddManufacturer} disabled={!newMfgName.trim()}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0">
            הוסף
          </button>
          <button type="button" onClick={() => { setShowAddMfg(false); setNewMfgName(''); }} className="text-slate-400 hover:text-red-600 shrink-0">
            <X size={16} />
          </button>
        </div>
      )}

      {showAddModel && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text" value={newModelName} onChange={e => setNewModelName(e.target.value)}
              placeholder="שם דגם חדש" className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
            />
            <button type="button" onClick={() => { setShowAddModel(false); setNewModelName(''); setNewModelType(''); setNewModelImages([]); }} className="text-slate-400 hover:text-red-600 shrink-0">
              <X size={16} />
            </button>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block mb-0.5">סוג מכשיר</span>
            <AutocompleteInput
              value={newModelType}
              onChange={setNewModelType}
              onAddValue={val => dispatch({ type: 'ADD_FIELD_VALUE', payload: { field: 'deviceTypes', value: val } })}
              suggestions={deviceTypes}
              placeholder="-- בחר סוג מכשיר --"
              allowNew
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block mb-1">תמונות דגם (עד 4)</span>
            <div className="flex flex-wrap gap-2">
              {newModelImages.map((img, idx) => (
                <div key={idx} className="relative w-14 h-14 rounded border border-slate-200 overflow-hidden bg-white">
                  <img src={img} alt="" className="w-full h-full object-contain" />
                  <button type="button" onClick={() => setNewModelImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X size={9} />
                  </button>
                </div>
              ))}
              {newModelImages.length < 4 && (
                <label className="w-14 h-14 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 hover:border-orange-400 cursor-pointer text-xs">
                  {uploadingImages ? '...' : <Plus size={18} />}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleModelImageUpload} disabled={uploadingImages} />
                </label>
              )}
            </div>
          </div>
          <button type="button" onClick={handleAddModel} disabled={!newModelName.trim()}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white px-3 py-1.5 rounded-lg text-xs font-semibold w-full">
            הוסף דגם
          </button>
        </div>
      )}
    </div>
  );
}
