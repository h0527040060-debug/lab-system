import { useState } from 'react';
import { useAppContext as useApp } from '../../../store/AppContext';
import { formatMoney } from '../../../utils/formatters';
import { getTotalStock } from '../../../utils/fifo';
import EmptyState from '../../../components/EmptyState';
import PartThumbnail from '../../../components/PartThumbnail';
import SearchInput from '../../../components/SearchInput';
import PartQuickModal from '../../../components/PartQuickModal';
import { Package, Plus, X } from 'lucide-react';

const EMPTY_ADD_FORM = { part_id: '', quantity: 1, unit_cost: 0, supplier_name: 'מלאי פתיחה' };

export default function PartsStock() {
  const { state, dispatch } = useApp();
  const [selectedPart, setSelectedPart] = useState(null);
  const [search, setSearch] = useState('');
  const [viewingPart, setViewingPart] = useState(null);
  const [showAddStock, setShowAddStock] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);

  const partsWithStock = state.parts
    .filter(p => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        p.name?.toLowerCase().includes(s) ||
        p.manufacturer?.toLowerCase().includes(s) ||
        p.manufacturer_sku?.toLowerCase().includes(s) ||
        p.internal_barcode?.toLowerCase().includes(s) ||
        p.category?.toLowerCase().includes(s)
      );
    })
    .map(p => ({
      ...p,
      totalStock: getTotalStock(p.id, state.stockBatches),
      batches: state.stockBatches
        .filter(b => b.part_id === p.id)
        .sort((a, b) => new Date(a.received_date) - new Date(b.received_date)),
    }));

  const displayPart = selectedPart ? partsWithStock.find(p => p.id === selectedPart) : null;
  const displayBatches = displayPart ? displayPart.batches : [...state.stockBatches].sort((a, b) => new Date(a.received_date) - new Date(b.received_date));

  const handleAddStock = () => {
    if (!addForm.part_id || !addForm.quantity || addForm.quantity <= 0) return;
    const batchIdCounter = state.stockBatches.length + 1;
    const batchId = `BATCH-${String(batchIdCounter).padStart(4, '0')}`;
    dispatch({
      type: 'ADD_STOCK_BATCH',
      payload: {
        id: batchId,
        part_id: addForm.part_id,
        received_date: new Date().toISOString(),
        quantity: Number(addForm.quantity),
        quantity_remaining: Number(addForm.quantity),
        supplier_name: addForm.supplier_name || 'מלאי פתיחה',
        unit_cost: Number(addForm.unit_cost) || 0,
        purchase_order_id: null,
      },
    });
    setAddForm(EMPTY_ADD_FORM);
    setShowAddStock(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">מלאי ואצוות</h2>
          <p className="text-sm text-slate-500">כל האצוות לפי FIFO — ישן יוצא קודם</p>
        </div>
        <button
          onClick={() => setShowAddStock(!showAddStock)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          <Plus size={16} />
          הוסף מלאי ידנית
        </button>
      </div>

      {showAddStock && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-900 text-sm">הוספת מלאי ידנית</h3>
            <button onClick={() => setShowAddStock(false)} className="text-blue-400 hover:text-blue-700"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="md:col-span-1">
              <label className="text-xs font-semibold text-slate-700 block mb-1">חלק *</label>
              <select
                value={addForm.part_id}
                onChange={e => setAddForm(f => ({ ...f, part_id: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
              >
                <option value="">-- בחר חלק --</option>
                {state.parts.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">כמות *</label>
              <input
                type="number" min="1" value={addForm.quantity}
                onChange={e => setAddForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">עלות ליחידה ₪</label>
              <input
                type="number" min="0" step="0.01" value={addForm.unit_cost}
                onChange={e => setAddForm(f => ({ ...f, unit_cost: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">ספק / מקור</label>
              <input
                type="text" value={addForm.supplier_name}
                onChange={e => setAddForm(f => ({ ...f, supplier_name: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
                placeholder="מלאי פתיחה"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleAddStock}
              disabled={!addForm.part_id || addForm.quantity <= 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-5 py-2 rounded-lg text-sm font-semibold"
            >
              הוסף לאצווה
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* רשימת חלקים */}
        <div className="md:col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50 space-y-2">
            <p className="text-xs font-semibold text-slate-600">סינון לפי חלק</p>
            <SearchInput value={search} onChange={setSearch} placeholder="חיפוש חלק..." />
          </div>
          <div className="overflow-y-auto max-h-96">
            <button
              onClick={() => setSelectedPart(null)}
              className={`w-full text-right px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 border-b border-slate-100 ${!selectedPart ? 'bg-orange-50 font-semibold text-orange-700' : ''}`}
            >
              <Package size={14} />
              כל החלקים
            </button>
            {partsWithStock.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPart(p.id)}
                className={`w-full text-right px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 border-b border-slate-100 ${selectedPart === p.id ? 'bg-orange-50 font-semibold text-orange-700' : ''}`}
              >
                <PartThumbnail part={p} size="xs" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-medium">{p.name}</p>
                  <p className={`text-xs ${p.totalStock === 0 ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>מלאי: {p.totalStock}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* טבלת אצוות */}
        <div className="md:col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden">
          {displayBatches.length === 0 ? (
            <EmptyState icon={Package} title="אין אצוות" />
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-right p-3 font-semibold">חלק</th>
                  <th className="text-right p-3 font-semibold">קוד אצווה</th>
                  <th className="text-right p-3 font-semibold">תאריך קבלה</th>
                  <th className="text-right p-3 font-semibold">ספק</th>
                  <th className="text-center p-3 font-semibold">התקבל</th>
                  <th className="text-center p-3 font-semibold">נשאר</th>
                  <th className="text-right p-3 font-semibold">עלות</th>
                  <th className="text-center p-3 font-semibold">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {displayBatches.map(b => {
                  const part = state.parts.find(p => p.id === b.part_id);
                  return (
                    <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <PartThumbnail part={part} size="xs" onClick={part ? () => setViewingPart(part) : undefined} />
                          {part ? (
                            <button onClick={() => setViewingPart(part)} className="text-xs font-medium hover:text-blue-600 hover:underline text-right">{part.name}</button>
                          ) : <span className="text-xs font-medium">—</span>}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-xs">{b.id}</td>
                      <td className="p-3 text-xs">{new Date(b.received_date).toLocaleDateString('he-IL')}</td>
                      <td className="p-3 text-xs">{b.supplier_name}</td>
                      <td className="p-3 text-center font-semibold">{b.quantity}</td>
                      <td className={`p-3 text-center font-bold ${b.quantity_remaining === 0 ? 'text-slate-400' : 'text-green-700'}`}>
                        {b.quantity_remaining}
                      </td>
                      <td className="p-3 font-semibold">{formatMoney(b.unit_cost)}</td>
                      <td className="p-3 text-center">
                        {b.quantity_remaining === 0
                          ? <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">נגמר</span>
                          : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">פעיל</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>

      {viewingPart && <PartQuickModal part={viewingPart} onClose={() => setViewingPart(null)} />}
    </div>
  );
}
