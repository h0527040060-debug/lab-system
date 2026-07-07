import { useState } from 'react';
import { useAppContext } from '../../../store/AppContext';
import { Pencil, Trash2, Check, X, Plus, ChevronDown, ChevronUp, Package } from 'lucide-react';
import ConfirmDialog from '../../../components/ConfirmDialog';

const FIELD_SECTIONS = [
  { key: 'deviceTypes', label: 'קטגוריות מכשירים' },
];

function FieldSection({ fieldKey, label }) {
  const { state, dispatch } = useAppContext();
  const values = state.settings?.fieldLists?.[fieldKey] || [];
  const isDeviceCategories = fieldKey === 'deviceTypes';

  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newValue, setNewValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [expandedValue, setExpandedValue] = useState(null);

  const modelsForCategory = (val) => state.models.filter(m => m.device_type === val);

  const startEdit = (idx) => {
    setEditingIndex(idx);
    setEditValue(values[idx]);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const saveEdit = () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === values[editingIndex]) { cancelEdit(); return; }
    dispatch({ type: 'RENAME_FIELD_VALUE', payload: { field: fieldKey, oldValue: values[editingIndex], newValue: trimmed } });
    cancelEdit();
  };

  const handleDelete = (val) => {
    const modelCount = isDeviceCategories ? modelsForCategory(val).length : 0;
    const deviceCount = isDeviceCategories ? state.devices.filter(d => d.type === val).length : 0;
    const msg = modelCount > 0 || deviceCount > 0
      ? `"${val}" בשימוש ב-${modelCount} דגמים ו-${deviceCount} מכשירים. מחיקה תשאיר אותם ללא קטגוריה. האם להמשיך?`
      : `האם אתה בטוח שאתה רוצה למחוק את "${val}"?`;
    setConfirmDelete({ val, msg });
  };

  const handleAdd = () => {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    dispatch({ type: 'ADD_FIELD_VALUE', payload: { field: fieldKey, value: trimmed } });
    setNewValue('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <ConfirmDialog
        open={!!confirmDelete}
        title="אישור מחיקה"
        message={confirmDelete?.msg}
        confirmLabel="מחק"
        variant="danger"
        onConfirm={() => { dispatch({ type: 'DELETE_FIELD_VALUE', payload: { field: fieldKey, value: confirmDelete.val } }); setConfirmDelete(null); }}
        onCancel={() => setConfirmDelete(null)}
      />
      <h3 className="font-semibold text-slate-800 mb-3">{label}</h3>
      <div className="divide-y divide-slate-100">
        {values.map((val, idx) => {
          const models = isDeviceCategories ? modelsForCategory(val) : [];
          const isExpanded = expandedValue === val;
          return (
            <div key={idx}>
              <div className="flex items-center gap-2 py-2">
                {editingIndex === idx ? (
                  <>
                    <input
                      autoFocus
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                      className="flex-1 border border-orange-400 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                    />
                    <button onClick={saveEdit} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Check size={15} /></button>
                    <button onClick={cancelEdit} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X size={15} /></button>
                  </>
                ) : (
                  <>
                    {isDeviceCategories ? (
                      <button
                        onClick={() => setExpandedValue(isExpanded ? null : val)}
                        className="flex-1 flex items-center gap-2 text-right text-sm text-slate-700 hover:text-orange-600"
                      >
                        {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                        <span>{val}</span>
                        <span className="text-xs text-slate-400">({models.length} דגמים)</span>
                      </button>
                    ) : (
                      <span className="flex-1 text-sm text-slate-700">{val}</span>
                    )}
                    <button onClick={() => startEdit(idx)} className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(val)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                  </>
                )}
              </div>
              {isExpanded && (
                <div className="bg-slate-50 rounded-lg p-2 mb-2 mr-6">
                  {models.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">אין דגמים בקטגוריה זו</p>
                  ) : (
                    <div className="space-y-1">
                      {models.map(m => {
                        const mfg = state.manufacturers.find(mf => mf.id === m.manufacturer_id);
                        return (
                          <div key={m.id} className="flex items-center gap-2 text-xs text-slate-600 px-2 py-1">
                            <Package size={12} className="text-slate-400 shrink-0" />
                            <span className="font-medium">{m.name}</span>
                            <span className="text-slate-400">{mfg?.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* הוספת ערך חדש */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
        <input
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder={`הוסף ${label.replace('סוגי ', 'סוג ')} חדש...`}
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
        />
        <button
          onClick={handleAdd}
          disabled={!newValue.trim()}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white disabled:text-slate-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          הוסף
        </button>
      </div>
    </div>
  );
}

export function SettingsFields() {
  return (
    <div className="space-y-4">
      {FIELD_SECTIONS.map(s => (
        <FieldSection key={s.key} fieldKey={s.key} label={s.label} />
      ))}
    </div>
  );
}
