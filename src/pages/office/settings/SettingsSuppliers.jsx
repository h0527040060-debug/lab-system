import { useState } from 'react';
import { useAppContext } from '../../../store/AppContext';
import { Edit2, Trash2, Check, X, Plus } from 'lucide-react';
import ConfirmDialog from '../../../components/ConfirmDialog';

export function SettingsSuppliers() {
  const { state, dispatch } = useAppContext();
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [editSupplierForm, setEditSupplierForm] = useState({});
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplierForm, setNewSupplierForm] = useState({ name: '', phone: '', contact_person: '', email: '', notes: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const startEdit = (s) => {
    setEditSupplierForm({ name: s.name || '', phone: s.phone || '', contact_person: s.contact_person || '', email: s.email || '', notes: s.notes || '' });
    setEditingSupplierId(s.id);
    setShowAddSupplier(false);
  };

  const saveEdit = (id) => {
    dispatch({ type: 'UPDATE_SUPPLIER', payload: { id, ...editSupplierForm } });
    setEditingSupplierId(null);
  };

  const addSupplier = () => {
    if (!newSupplierForm.name.trim()) return;
    const id = Math.max(0, ...state.suppliers.map(s => s.id || 0)) + 1;
    dispatch({ type: 'ADD_SUPPLIER', payload: { id, ...newSupplierForm } });
    setNewSupplierForm({ name: '', phone: '', contact_person: '', email: '', notes: '' });
    setShowAddSupplier(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-slate-800">ספקים</h2>
        <button onClick={() => { setShowAddSupplier(true); setEditingSupplierId(null); }}
          className="text-sm text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1">
          <Plus size={15} /> הוסף ספק
        </button>
      </div>

      {state.suppliers.length === 0 && !showAddSupplier ? (
        <p className="text-sm text-slate-400 text-center py-4">אין ספקים מוגדרים</p>
      ) : (
        <div className="space-y-2 mb-3">
          {state.suppliers.map(s => (
            <div key={s.id} className="border border-slate-200 rounded-lg p-3">
              {editingSupplierId === s.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={editSupplierForm.name} onChange={e => setEditSupplierForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="שם ספק *" className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full" />
                    <input value={editSupplierForm.phone} onChange={e => setEditSupplierForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="טלפון" className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full" dir="ltr" />
                    <input value={editSupplierForm.contact_person} onChange={e => setEditSupplierForm(f => ({ ...f, contact_person: e.target.value }))}
                      placeholder="איש קשר" className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full" />
                    <input value={editSupplierForm.email} onChange={e => setEditSupplierForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="מייל" className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full" dir="ltr" />
                  </div>
                  <input value={editSupplierForm.notes} onChange={e => setEditSupplierForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="הערות" className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingSupplierId(null)} className="text-slate-500 hover:text-slate-700 p-1"><X size={15} /></button>
                    <button onClick={() => saveEdit(s.id)} disabled={!editSupplierForm.name.trim()}
                      className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white px-3 py-1 rounded font-semibold text-sm flex items-center gap-1">
                      <Check size={14} /> שמור
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800">{s.name}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                      {s.phone && <span dir="ltr">{s.phone}</span>}
                      {s.contact_person && <span>איש קשר: {s.contact_person}</span>}
                      {s.email && <span dir="ltr">{s.email}</span>}
                    </div>
                    {s.notes && <p className="text-xs text-slate-400 mt-1">{s.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(s)} className="text-slate-400 hover:text-orange-600 p-1"><Edit2 size={14} /></button>
                    <button onClick={() => setConfirmDelete(s)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="אישור מחיקה"
        message={`האם אתה בטוח שאתה רוצה למחוק את הספק "${confirmDelete?.name}"?`}
        confirmLabel="מחק"
        variant="danger"
        onConfirm={() => { dispatch({ type: 'DELETE_SUPPLIER', payload: confirmDelete.id }); setConfirmDelete(null); }}
        onCancel={() => setConfirmDelete(null)}
      />

      {showAddSupplier && (
        <div className="border border-orange-200 bg-orange-50 rounded-lg p-3 space-y-2">
          <p className="text-sm font-semibold text-orange-800">ספק חדש</p>
          <div className="grid grid-cols-2 gap-2">
            <input value={newSupplierForm.name} onChange={e => setNewSupplierForm(f => ({ ...f, name: e.target.value }))}
              placeholder="שם ספק *" className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full" />
            <input value={newSupplierForm.phone} onChange={e => setNewSupplierForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="טלפון" className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full" dir="ltr" />
            <input value={newSupplierForm.contact_person} onChange={e => setNewSupplierForm(f => ({ ...f, contact_person: e.target.value }))}
              placeholder="איש קשר" className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full" />
            <input value={newSupplierForm.email} onChange={e => setNewSupplierForm(f => ({ ...f, email: e.target.value }))}
              placeholder="מייל" className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full" dir="ltr" />
          </div>
          <input value={newSupplierForm.notes} onChange={e => setNewSupplierForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="הערות" className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAddSupplier(false)} className="text-slate-500 hover:text-slate-700 p-1"><X size={15} /></button>
            <button onClick={addSupplier} disabled={!newSupplierForm.name.trim()}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white px-4 py-1.5 rounded-lg font-semibold text-sm flex items-center gap-1">
              <Check size={15} /> הוסף
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
