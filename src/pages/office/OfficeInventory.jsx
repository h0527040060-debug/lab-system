import { useState } from 'react';
import { useAppContext as useApp } from '../../store/AppContext';
import { formatMoney } from '../../utils/formatters';
import { getTotalStock } from '../../utils/fifo';
import { getDefaultSupplier, isPartLowStock, calculateWeightedAvgCost } from '../../utils/inventory';
import { generateInternalBarcode } from '../../utils/idGenerators';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Package, Plus, Edit2, Trash2, AlertTriangle, MapPin, Building2 } from 'lucide-react';

export default function OfficeInventory() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [viewingBatches, setViewingBatches] = useState(null);
  const [deletingPart, setDeletingPart] = useState(null);

  const filteredParts = state.parts.filter(p => {
    if (showLowStockOnly && !isPartLowStock(p, state.stockBatches)) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(s) ||
      p.manufacturer?.toLowerCase().includes(s) ||
      p.manufacturer_sku?.toLowerCase().includes(s) ||
      p.internal_barcode?.toLowerCase().includes(s) ||
      p.category?.toLowerCase().includes(s)
    );
  });

  const handleSavePart = (partData) => {
    if (partData.id) {
      dispatch({ type: 'UPDATE_PART', payload: partData });
    } else {
      const newId = Math.max(0, ...state.parts.map(p => p.id || 0)) + 1;
      const newPart = {
        ...partData,
        id: newId,
        internal_barcode: partData.internal_barcode ||
          generateInternalBarcode(partData.category || 'other', state.parts.map(p => p.internal_barcode)),
      };
      dispatch({ type: 'ADD_PART', payload: newPart });
    }
    setEditingPart(null);
  };

  const handleDeletePart = () => {
    if (!deletingPart) return;
    dispatch({ type: 'DELETE_PART', payload: deletingPart.id });
    setDeletingPart(null);
  };

  const lowStockCount = state.parts.filter(p => isPartLowStock(p, state.stockBatches)).length;

  return (
    <div>
      <PageHeader
        title="ניהול מלאי חלקים"
        subtitle={`${state.parts.length} חלקים בקטלוג, ${lowStockCount} במצב חוסר`}
        action={
          <button
            onClick={() => setEditingPart('new')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-1"
          >
            <Plus size={18} />
            הוסף חלק
          </button>
        }
      />

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex gap-3 items-center flex-wrap">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="חיפוש לפי שם, יצרן, מק״ט..."
            className="flex-1 min-w-64"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
              className="w-4 h-4"
            />
            <span>הצג רק חוסרים ({lowStockCount})</span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredParts.length === 0 ? (
          <EmptyState icon={Package} title="אין חלקים בקטלוג" />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-right p-3 font-semibold">חלק</th>
                    <th className="text-right p-3 font-semibold">ברקוד פנימי</th>
                    <th className="text-right p-3 font-semibold">מיקום</th>
                    <th className="text-right p-3 font-semibold">ספק ברירת מחדל</th>
                    <th className="text-center p-3 font-semibold">מלאי</th>
                    <th className="text-right p-3 font-semibold">עלות ממוצעת</th>
                    <th className="text-right p-3 font-semibold">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParts.map(part => {
                    const stock = getTotalStock(part.id, state.stockBatches);
                    const lowStock = isPartLowStock(part, state.stockBatches);
                    const supplier = getDefaultSupplier(part);
                    const avgCost = calculateWeightedAvgCost(part.id, state.stockBatches);
                    const batchesCount = state.stockBatches.filter(b => b.part_id === part.id && b.quantity_remaining > 0).length;
                    return (
                      <tr key={part.id} className={`border-b border-slate-100 hover:bg-slate-50 ${lowStock ? 'bg-red-50' : ''}`}>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{part.images?.[0] || '📦'}</span>
                            <div>
                              <p className="font-semibold">{part.name}</p>
                              <p className="text-xs text-slate-500">{part.manufacturer} • {part.manufacturer_sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-xs">{part.internal_barcode}</td>
                        <td className="p-3 text-xs">
                          {part.shelf && <div className="flex items-center gap-1 text-slate-600"><MapPin size={12} /><span>מדף {part.shelf}{part.bin && `, תא ${part.bin}`}</span></div>}
                          {part.zone && <p className="text-slate-500 mt-0.5">{part.zone}</p>}
                        </td>
                        <td className="p-3 text-xs">
                          {supplier ? (<><p className="font-semibold">{supplier.supplier_name}</p><p className="text-slate-500">{formatMoney(supplier.price)} • {supplier.lead_time_days} ימים</p></>) : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => setViewingBatches(part)} className={`font-bold text-lg ${lowStock ? 'text-red-600' : stock > 0 ? 'text-green-600' : 'text-slate-400'} hover:underline`}>{stock}</button>
                          <p className="text-xs text-slate-500">מינ׳ {part.min_stock} • {batchesCount} אצוות</p>
                          {lowStock && <div className="flex items-center justify-center gap-1 text-red-600 text-xs mt-1"><AlertTriangle size={10} />חוסר</div>}
                        </td>
                        <td className="p-3">
                          <p className="font-semibold">{formatMoney(avgCost)}</p>
                          <p className="text-xs text-slate-500">+ {part.selling_markup_percent || 0}% מרווח</p>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <button onClick={() => setEditingPart(part)} className="text-slate-500 hover:text-orange-600 p-1"><Edit2 size={16} /></button>
                            <button onClick={() => setDeletingPart(part)} className="text-slate-500 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredParts.map(part => {
                const stock = getTotalStock(part.id, state.stockBatches);
                const lowStock = isPartLowStock(part, state.stockBatches);
                const supplier = getDefaultSupplier(part);
                const avgCost = calculateWeightedAvgCost(part.id, state.stockBatches);
                const batchesCount = state.stockBatches.filter(b => b.part_id === part.id && b.quantity_remaining > 0).length;
                return (
                  <div key={part.id} className={`p-4 space-y-3 ${lowStock ? 'bg-red-50' : ''}`}>
                    {/* שורה 1: תמונה + שם + פעולות */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-2xl flex-shrink-0">{part.images?.[0] || '📦'}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{part.name}</p>
                          <p className="text-xs text-slate-500 truncate">{part.manufacturer} • {part.manufacturer_sku}</p>
                          {part.internal_barcode && <p className="font-mono text-xs text-slate-400">{part.internal_barcode}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => setEditingPart(part)} className="text-slate-500 hover:text-orange-600 p-1"><Edit2 size={16} /></button>
                        <button onClick={() => setDeletingPart(part)} className="text-slate-500 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    {/* שורה 2: מלאי + מיקום */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400 mb-0.5">מלאי</p>
                        <button onClick={() => setViewingBatches(part)} className={`font-bold text-xl hover:underline ${lowStock ? 'text-red-600' : stock > 0 ? 'text-green-600' : 'text-slate-400'}`}>{stock}</button>
                        <p className="text-slate-500">מינ׳ {part.min_stock} • {batchesCount} אצוות</p>
                        {lowStock && <div className="flex items-center gap-1 text-red-600 mt-0.5"><AlertTriangle size={10} />חוסר</div>}
                      </div>
                      <div>
                        <p className="text-slate-400 mb-0.5">מיקום</p>
                        {part.shelf ? <div className="flex items-center gap-1 text-slate-600"><MapPin size={11} /><span>מדף {part.shelf}{part.bin && `, תא ${part.bin}`}</span></div> : <span className="text-slate-400">—</span>}
                        {part.zone && <p className="text-slate-500">{part.zone}</p>}
                      </div>
                    </div>
                    {/* שורה 3: ספק + עלות */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400 mb-0.5">ספק ברירת מחדל</p>
                        {supplier ? (<><p className="font-semibold">{supplier.supplier_name}</p><p className="text-slate-500">{formatMoney(supplier.price)} • {supplier.lead_time_days} ימים</p></>) : <span className="text-slate-400">—</span>}
                      </div>
                      <div>
                        <p className="text-slate-400 mb-0.5">עלות ממוצעת</p>
                        <p className="font-semibold">{formatMoney(avgCost)}</p>
                        <p className="text-slate-500">+ {part.selling_markup_percent || 0}% מרווח</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {editingPart && (
        <PartEditModal
          part={editingPart === 'new' ? null : editingPart}
          onSave={handleSavePart}
          onClose={() => setEditingPart(null)}
        />
      )}

      {viewingBatches && (
        <BatchesModal
          part={viewingBatches}
          onClose={() => setViewingBatches(null)}
        />
      )}

      <ConfirmDialog
        open={!!deletingPart}
        title="מחיקת חלק"
        message={`האם למחוק את "${deletingPart?.name}"? כל האצוות שלו יימחקו גם.`}
        confirmLabel="מחק"
        variant="danger"
        onConfirm={handleDeletePart}
        onCancel={() => setDeletingPart(null)}
      />
    </div>
  );
}

function PartEditModal({ part, onSave, onClose }) {
  const { state } = useApp();
  const [form, setForm] = useState(part || {
    name: '', manufacturer: '', manufacturer_sku: '', internal_barcode: '',
    category: 'other', images: ['📦'],
    shelf: '', bin: '', zone: '',
    suppliers: [],
    min_stock: 1, selling_markup_percent: 50,
  });

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

  const canSave = form.name && form.manufacturer;

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
            <label className="text-xs font-semibold block mb-1">יצרן *</label>
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
                <input
                  type="number"
                  placeholder="מחיר"
                  value={supplier.price}
                  onChange={(e) => updateSupplier(idx, 'price', parseFloat(e.target.value) || 0)}
                  className="col-span-2 border border-slate-300 rounded px-2 py-1 text-xs"
                />
                <input
                  type="number"
                  placeholder="ימים"
                  value={supplier.lead_time_days}
                  onChange={(e) => updateSupplier(idx, 'lead_time_days', parseInt(e.target.value) || 0)}
                  className="col-span-2 border border-slate-300 rounded px-2 py-1 text-xs"
                />
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
                  onClick={() => removeSupplier(idx)}
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
    </Modal>
  );
}

function BatchesModal({ part, onClose }) {
  const { state } = useApp();
  const allBatches = state.stockBatches
    .filter(b => b.part_id === part.id)
    .sort((a, b) => new Date(a.received_date) - new Date(b.received_date));

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`אצוות מלאי - ${part.name}`}
      subtitle="לפי FIFO - ישן יוצא קודם"
      maxWidth="max-w-3xl"
    >
      {allBatches.length === 0 ? (
        <EmptyState icon={Package} title="אין אצוות לחלק זה" />
      ) : (
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-right p-2">קוד אצווה</th>
              <th className="text-right p-2">תאריך קבלה</th>
              <th className="text-right p-2">ספק</th>
              <th className="text-center p-2">התקבל</th>
              <th className="text-center p-2">נשאר</th>
              <th className="text-right p-2">עלות יחידה</th>
              <th className="text-center p-2">סטטוס</th>
            </tr>
          </thead>
          <tbody>
            {allBatches.map(b => (
              <tr key={b.id} className="border-b">
                <td className="p-2 font-mono text-xs">{b.id}</td>
                <td className="p-2 text-xs">{new Date(b.received_date).toLocaleDateString('he-IL')}</td>
                <td className="p-2 text-xs">{b.supplier_name}</td>
                <td className="p-2 text-center font-semibold">{b.quantity}</td>
                <td className={`p-2 text-center font-bold ${b.quantity_remaining === 0 ? 'text-slate-400' : 'text-green-700'}`}>
                  {b.quantity_remaining}
                </td>
                <td className="p-2 font-semibold">{formatMoney(b.unit_cost)}</td>
                <td className="p-2 text-center">
                  {b.quantity_remaining === 0 ? (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">נגמר</span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">פעיל</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </Modal>
  );
}
