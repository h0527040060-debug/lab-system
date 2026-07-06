import { useState } from 'react';
import { useAppContext } from '../../../store/AppContext';
import { uploadToStorage } from '../../../store/supabaseStorage';
import { generateManufacturerId, generateModelId } from '../../../utils/idGenerators';
import ConfirmDialog from '../../../components/ConfirmDialog';
import AutocompleteInput from '../../../components/AutocompleteInput';
import { Plus, Edit2, Trash2, Check, X, Package } from 'lucide-react';

export function ManufacturersModels() {
  const { state, dispatch } = useAppContext();
  const [selectedMfgId, setSelectedMfgId] = useState(null);

  const [showAddMfg, setShowAddMfg] = useState(false);
  const [newMfgName, setNewMfgName] = useState('');
  const [editingMfgId, setEditingMfgId] = useState(null);
  const [editMfgName, setEditMfgName] = useState('');
  const [confirmDeleteMfg, setConfirmDeleteMfg] = useState(null);

  const [showAddModel, setShowAddModel] = useState(false);
  const [newModel, setNewModel] = useState({ name: '', device_type: '', images: [] });
  const [editingModelId, setEditingModelId] = useState(null);
  const [editModel, setEditModel] = useState({ name: '', device_type: '', images: [] });
  const [confirmDeleteModel, setConfirmDeleteModel] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  const deviceTypes = state.settings?.fieldLists?.deviceTypes || [];
  const sortedManufacturers = [...state.manufacturers].sort((a, b) => a.name.localeCompare(b.name, 'he'));
  const modelsForSelected = state.models
    .filter(m => m.manufacturer_id === selectedMfgId)
    .sort((a, b) => a.name.localeCompare(b.name, 'he'));
  const selectedMfg = state.manufacturers.find(m => m.id === selectedMfgId);

  const addManufacturer = () => {
    const name = newMfgName.trim();
    if (!name) return;
    const id = generateManufacturerId(state.manufacturers.map(m => m.id));
    dispatch({ type: 'ADD_MANUFACTURER', payload: { id, name } });
    setNewMfgName('');
    setShowAddMfg(false);
    setSelectedMfgId(id);
  };

  const startEditMfg = (m) => { setEditingMfgId(m.id); setEditMfgName(m.name); };
  const saveEditMfg = () => {
    if (!editMfgName.trim()) return;
    dispatch({ type: 'UPDATE_MANUFACTURER', payload: { id: editingMfgId, name: editMfgName.trim() } });
    setEditingMfgId(null);
  };

  const uploadModelImages = async (files, currentImages, setter) => {
    const toAdd = files.slice(0, 4 - currentImages.length);
    if (!toAdd.length) return;
    setUploadingImages(true);
    try {
      for (const file of toAdd) {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const url = await uploadToStorage(dataUrl, 'models');
        setter(prev => ({ ...prev, images: [...prev.images, url].slice(0, 4) }));
      }
    } finally {
      setUploadingImages(false);
    }
  };

  const addModel = () => {
    if (!newModel.name.trim() || !selectedMfgId) return;
    const id = generateModelId(state.models.map(m => m.id));
    dispatch({
      type: 'ADD_MODEL',
      payload: { id, manufacturer_id: selectedMfgId, name: newModel.name.trim(), device_type: newModel.device_type, images: newModel.images, main_image_index: 0 },
    });
    setNewModel({ name: '', device_type: '', images: [] });
    setShowAddModel(false);
  };

  const startEditModel = (m) => {
    setEditingModelId(m.id);
    setEditModel({ name: m.name, device_type: m.device_type || '', images: m.images || [] });
  };
  const saveEditModel = () => {
    if (!editModel.name.trim()) return;
    dispatch({ type: 'UPDATE_MODEL', payload: { id: editingModelId, name: editModel.name.trim(), device_type: editModel.device_type, images: editModel.images } });
    setEditingModelId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">יצרנים ודגמים</h2>
          <p className="text-sm text-slate-500">קטלוג מובנה — בחירת יצרן+דגם במכשירים ובחלקים נעשית מתוך רשימה זו בלבד</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* יצרנים */}
        <div className="md:col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600">יצרנים ({state.manufacturers.length})</p>
            <button onClick={() => setShowAddMfg(v => !v)} className="text-orange-600 hover:text-orange-700"><Plus size={16} /></button>
          </div>

          {showAddMfg && (
            <div className="p-2 bg-orange-50 border-b border-orange-200 flex items-center gap-1.5">
              <input value={newMfgName} onChange={e => setNewMfgName(e.target.value)} placeholder="שם יצרן"
                className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm" />
              <button onClick={addManufacturer} disabled={!newMfgName.trim()} className="text-green-600 disabled:text-slate-300"><Check size={16} /></button>
              <button onClick={() => { setShowAddMfg(false); setNewMfgName(''); }} className="text-slate-400 hover:text-red-600"><X size={16} /></button>
            </div>
          )}

          <div className="overflow-y-auto max-h-[32rem]">
            {sortedManufacturers.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">אין יצרנים עדיין</p>
            ) : sortedManufacturers.map(m => (
              <div key={m.id} className={`border-b border-slate-100 ${selectedMfgId === m.id ? 'bg-orange-50' : ''}`}>
                {editingMfgId === m.id ? (
                  <div className="p-2 flex items-center gap-1.5">
                    <input value={editMfgName} onChange={e => setEditMfgName(e.target.value)}
                      className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm" />
                    <button onClick={saveEditMfg} className="text-green-600"><Check size={16} /></button>
                    <button onClick={() => setEditingMfgId(null)} className="text-slate-400 hover:text-red-600"><X size={16} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-1">
                    <button
                      onClick={() => setSelectedMfgId(m.id)}
                      className="flex-1 text-right px-2 py-2.5 text-sm font-medium hover:bg-slate-50"
                    >
                      {m.name}
                      <span className="text-xs text-slate-400 mr-1">
                        ({state.models.filter(md => md.manufacturer_id === m.id).length})
                      </span>
                    </button>
                    <button onClick={() => startEditMfg(m)} className="text-slate-400 hover:text-orange-600 p-1"><Edit2 size={13} /></button>
                    <button onClick={() => setConfirmDeleteMfg(m)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* דגמים של היצרן הנבחר */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600">
              {selectedMfg ? `דגמים של ${selectedMfg.name} (${modelsForSelected.length})` : 'בחר יצרן מהרשימה'}
            </p>
            {selectedMfg && (
              <button onClick={() => setShowAddModel(v => !v)} className="text-orange-600 hover:text-orange-700"><Plus size={16} /></button>
            )}
          </div>

          {showAddModel && selectedMfg && (
            <div className="p-3 bg-orange-50 border-b border-orange-200 space-y-2">
              <input value={newModel.name} onChange={e => setNewModel(f => ({ ...f, name: e.target.value }))}
                placeholder="שם דגם" className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
              <AutocompleteInput
                value={newModel.device_type}
                onChange={val => setNewModel(f => ({ ...f, device_type: val }))}
                onAddValue={val => dispatch({ type: 'ADD_FIELD_VALUE', payload: { field: 'deviceTypes', value: val } })}
                suggestions={deviceTypes}
                placeholder="-- בחר סוג מכשיר --"
                allowNew
              />
              <div className="flex flex-wrap gap-2">
                {newModel.images.map((img, idx) => (
                  <div key={idx} className="relative w-14 h-14 rounded border border-slate-200 overflow-hidden bg-white">
                    <img src={img} alt="" className="w-full h-full object-contain" />
                    <button onClick={() => setNewModel(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}
                      className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"><X size={9} /></button>
                  </div>
                ))}
                {newModel.images.length < 4 && (
                  <label className="w-14 h-14 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 hover:border-orange-400 cursor-pointer text-xs">
                    {uploadingImages ? '...' : <Plus size={18} />}
                    <input type="file" accept="image/*" multiple className="hidden" disabled={uploadingImages}
                      onChange={e => { uploadModelImages(Array.from(e.target.files), newModel.images, setNewModel); e.target.value = ''; }} />
                  </label>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowAddModel(false); setNewModel({ name: '', device_type: '', images: [] }); }}
                  className="text-slate-500 hover:text-slate-700 p-1"><X size={15} /></button>
                <button onClick={addModel} disabled={!newModel.name.trim()}
                  className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white px-4 py-1.5 rounded-lg font-semibold text-sm flex items-center gap-1">
                  <Check size={15} /> הוסף דגם
                </button>
              </div>
            </div>
          )}

          <div className="overflow-y-auto max-h-[32rem]">
            {!selectedMfg ? (
              <p className="text-sm text-slate-400 text-center py-10">בחר יצרן כדי לראות את הדגמים שלו</p>
            ) : modelsForSelected.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">אין דגמים עדיין ליצרן זה</p>
            ) : modelsForSelected.map(m => {
              const mainImg = m.images?.[m.main_image_index || 0];
              const isReal = mainImg && (mainImg.startsWith('data:image/') || mainImg.startsWith('http'));
              return (
                <div key={m.id} className="border-b border-slate-100 p-3">
                  {editingModelId === m.id ? (
                    <div className="space-y-2">
                      <input value={editModel.name} onChange={e => setEditModel(f => ({ ...f, name: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
                      <AutocompleteInput
                        value={editModel.device_type}
                        onChange={val => setEditModel(f => ({ ...f, device_type: val }))}
                        onAddValue={val => dispatch({ type: 'ADD_FIELD_VALUE', payload: { field: 'deviceTypes', value: val } })}
                        suggestions={deviceTypes}
                        placeholder="-- בחר סוג מכשיר --"
                        allowNew
                      />
                      <div className="flex flex-wrap gap-2">
                        {editModel.images.map((img, idx) => (
                          <div key={idx} className="relative w-14 h-14 rounded border border-slate-200 overflow-hidden bg-white">
                            <img src={img} alt="" className="w-full h-full object-contain" />
                            <button onClick={() => setEditModel(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}
                              className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"><X size={9} /></button>
                          </div>
                        ))}
                        {editModel.images.length < 4 && (
                          <label className="w-14 h-14 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 hover:border-orange-400 cursor-pointer text-xs">
                            {uploadingImages ? '...' : <Plus size={18} />}
                            <input type="file" accept="image/*" multiple className="hidden" disabled={uploadingImages}
                              onChange={e => { uploadModelImages(Array.from(e.target.files), editModel.images, setEditModel); e.target.value = ''; }} />
                          </label>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingModelId(null)} className="text-slate-500 hover:text-slate-700 p-1"><X size={15} /></button>
                        <button onClick={saveEditModel} disabled={!editModel.name.trim()}
                          className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white px-3 py-1 rounded font-semibold text-sm flex items-center gap-1">
                          <Check size={14} /> שמור
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                        {isReal ? <img src={mainImg} alt="" className="w-full h-full object-contain" /> : <Package size={18} className="text-slate-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{m.name}</p>
                        {m.device_type && <p className="text-xs text-slate-500">{m.device_type}</p>}
                      </div>
                      <button onClick={() => startEditModel(m)} className="text-slate-400 hover:text-orange-600 p-1 shrink-0"><Edit2 size={14} /></button>
                      <button onClick={() => setConfirmDeleteModel(m)} className="text-slate-400 hover:text-red-600 p-1 shrink-0"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDeleteMfg}
        title="מחיקת יצרן"
        message={`האם למחוק את "${confirmDeleteMfg?.name}"? כל הדגמים שלו יימחקו גם.`}
        confirmLabel="מחק"
        variant="danger"
        onConfirm={() => {
          state.models.filter(m => m.manufacturer_id === confirmDeleteMfg.id).forEach(m => dispatch({ type: 'DELETE_MODEL', payload: m.id }));
          dispatch({ type: 'DELETE_MANUFACTURER', payload: confirmDeleteMfg.id });
          if (selectedMfgId === confirmDeleteMfg.id) setSelectedMfgId(null);
          setConfirmDeleteMfg(null);
        }}
        onCancel={() => setConfirmDeleteMfg(null)}
      />

      <ConfirmDialog
        open={!!confirmDeleteModel}
        title="מחיקת דגם"
        message={`האם למחוק את "${confirmDeleteModel?.name}"?`}
        confirmLabel="מחק"
        variant="danger"
        onConfirm={() => { dispatch({ type: 'DELETE_MODEL', payload: confirmDeleteModel.id }); setConfirmDeleteModel(null); }}
        onCancel={() => setConfirmDeleteModel(null)}
      />
    </div>
  );
}
