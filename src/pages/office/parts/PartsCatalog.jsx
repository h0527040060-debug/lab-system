import { useState } from 'react';
import { useAppContext as useApp } from '../../../store/AppContext';
import { formatMoney } from '../../../utils/formatters';
import { getTotalStock } from '../../../utils/fifo';
import { getDefaultSupplier, isPartLowStock, calculateWeightedAvgCost } from '../../../utils/inventory';
import SearchInput from '../../../components/SearchInput';
import EmptyState from '../../../components/EmptyState';
import ConfirmDialog from '../../../components/ConfirmDialog';
import PartThumbnail from '../../../components/PartThumbnail';
import PartEditModal from './PartEditModal';
import Modal from '../../../components/Modal';
import { Package, Plus, Edit2, Trash2, AlertTriangle, MapPin, BookOpen } from 'lucide-react';
import AssemblyInstructionsViewer from '../../../components/AssemblyInstructionsViewer';
import PartQuickModal from '../../../components/PartQuickModal';

export default function PartsCatalog() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [viewingBatches, setViewingBatches] = useState(null);
  const [deletingPart, setDeletingPart] = useState(null);
  const [viewingAssembly, setViewingAssembly] = useState(null);
  const [quickViewPart, setQuickViewPart] = useState(null);

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

  // סנכרון מלאי קיים לאצוות: תוספת = אצווה חדשה, הפחתה = ניכוי FIFO מהאצוות
  const reconcileStock = (partId, current, target) => {
    const diff = target - current;
    if (diff === 0) return;
    if (diff > 0) {
      const batchId = `BATCH-${String(state.stockBatches.length + 1).padStart(4, '0')}`;
      dispatch({
        type: 'ADD_STOCK_BATCH',
        payload: {
          id: batchId,
          part_id: partId,
          received_date: new Date().toISOString(),
          quantity: diff,
          quantity_remaining: diff,
          supplier_name: 'התאמת מלאי ידנית',
          unit_cost: 0,
          purchase_order_id: null,
        },
      });
    } else {
      let toRemove = -diff;
      const batches = state.stockBatches
        .filter(b => b.part_id === partId && b.quantity_remaining > 0)
        .sort((a, b) => new Date(a.received_date) - new Date(b.received_date));
      const updates = [];
      for (const b of batches) {
        if (toRemove <= 0) break;
        const take = Math.min(b.quantity_remaining, toRemove);
        updates.push({ id: b.id, quantity_remaining: b.quantity_remaining - take });
        toRemove -= take;
      }
      if (updates.length > 0) {
        dispatch({ type: 'UPDATE_STOCK_BATCHES_BULK', payload: updates });
      }
    }
  };

  const handleSavePart = (partData) => {
    const { __targetStock, __initialStock, ...cleanPart } = partData;
    let partId;
    if (cleanPart.id) {
      dispatch({ type: 'UPDATE_PART', payload: cleanPart });
      partId = cleanPart.id;
    } else {
      partId = Math.max(0, ...state.parts.map(p => p.id || 0)) + 1;
      dispatch({ type: 'ADD_PART', payload: { ...cleanPart, id: partId } });
    }
    if (__targetStock !== undefined && __targetStock !== __initialStock) {
      reconcileStock(partId, __initialStock || 0, __targetStock);
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">קטלוג חלקים</h2>
          <p className="text-sm text-slate-500">{state.parts.length} חלקים, {lowStockCount} במצב חוסר</p>
        </div>
        <button
          onClick={() => setEditingPart('new')}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-1 text-sm"
        >
          <Plus size={16} />
          הוסף חלק
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 flex gap-3 items-center flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="חיפוש לפי שם, יצרן, מק״ט..." className="flex-1 min-w-48" />
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={showLowStockOnly} onChange={e => setShowLowStockOnly(e.target.checked)} className="w-4 h-4" />
          <span>רק חוסרים ({lowStockCount})</span>
        </label>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredParts.length === 0 ? (
          <EmptyState icon={Package} title="אין חלקים בקטלוג" />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-right p-3 font-semibold">חלק</th>
                    <th className="text-right p-3 font-semibold">ברקוד</th>
                    <th className="text-right p-3 font-semibold">מיקום</th>
                    <th className="text-right p-3 font-semibold">ספק ברירת מחדל</th>
                    <th className="text-center p-3 font-semibold">מלאי</th>
                    <th className="text-right p-3 font-semibold">מחיר ללקוח</th>
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
                    const sellingPrice = part.selling_price || (avgCost * (1 + (part.selling_markup_percent || 0) / 100));
                    const hasAssembly = part.assembly_instructions?.text || part.assembly_instructions?.images?.length > 0 || part.assembly_instructions?.video_url;
                    return (
                      <tr key={part.id} className={`border-b border-slate-100 hover:bg-slate-50 ${lowStock ? 'bg-red-50' : ''}`}>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <PartThumbnail part={part} size="sm" onClick={() => setQuickViewPart(part)} />
                            <div>
                              <button onClick={() => setQuickViewPart(part)} className="font-semibold hover:text-orange-600 hover:underline text-right block">{part.name}</button>
                              <p className="text-xs text-slate-500">{part.manufacturer} • {part.manufacturer_sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-xs">{part.internal_barcode}</td>
                        <td className="p-3 text-xs">
                          {part.shelf && <div className="flex items-center gap-1 text-slate-600"><MapPin size={11} /><span>מדף {part.shelf}{part.bin && `, תא ${part.bin}`}</span></div>}
                          {part.zone && <p className="text-slate-500 mt-0.5">{part.zone}</p>}
                        </td>
                        <td className="p-3 text-xs">
                          {supplier ? (<><p className="font-semibold">{supplier.supplier_name}</p><p className="text-slate-500">{formatMoney(supplier.price)} • {supplier.lead_time_days} ימים</p></>) : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => setViewingBatches(part)} className={`font-bold text-lg hover:underline ${lowStock ? 'text-red-600' : stock > 0 ? 'text-green-600' : 'text-slate-400'}`}>{stock}</button>
                          <p className="text-xs text-slate-500">מינ׳ {part.min_stock} • {batchesCount} אצוות</p>
                          {lowStock && <div className="flex items-center justify-center gap-1 text-red-600 text-xs mt-0.5"><AlertTriangle size={10} /> חוסר</div>}
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-green-700">{formatMoney(sellingPrice)}</p>
                          <p className="text-xs text-slate-500">עלות: {formatMoney(avgCost)}</p>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {hasAssembly && <button onClick={() => setViewingAssembly(part)} className="text-blue-500 hover:text-blue-700 p-1" title="הוראות הרכבה"><BookOpen size={15} /></button>}
                            <button onClick={() => setEditingPart(part)} className="text-slate-500 hover:text-orange-600 p-1"><Edit2 size={15} /></button>
                            <button onClick={() => setDeletingPart(part)} className="text-slate-500 hover:text-red-600 p-1"><Trash2 size={15} /></button>
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
                const sellingPrice = part.selling_price || (avgCost * (1 + (part.selling_markup_percent || 0) / 100));
                const hasAssembly = part.assembly_instructions?.text || part.assembly_instructions?.images?.length > 0 || part.assembly_instructions?.video_url;
                return (
                  <div key={part.id} className={`p-4 space-y-3 ${lowStock ? 'bg-red-50' : ''}`}>
                    {/* שורה 1: תמונה + שם + פעולות */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex-shrink-0">
                          <PartThumbnail part={part} size="sm" onClick={() => setQuickViewPart(part)} />
                        </div>
                        <div className="min-w-0">
                          <button onClick={() => setQuickViewPart(part)} className="font-semibold text-slate-900 truncate hover:text-orange-600 hover:underline text-right block w-full">{part.name}</button>
                          <p className="text-xs text-slate-500 truncate">{part.manufacturer} • {part.manufacturer_sku}</p>
                          {part.internal_barcode && <p className="font-mono text-xs text-slate-400">{part.internal_barcode}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {hasAssembly && <button onClick={() => setViewingAssembly(part)} className="text-blue-500 hover:text-blue-700 p-1" title="הוראות הרכבה"><BookOpen size={15} /></button>}
                        <button onClick={() => setEditingPart(part)} className="text-slate-500 hover:text-orange-600 p-1"><Edit2 size={15} /></button>
                        <button onClick={() => setDeletingPart(part)} className="text-slate-500 hover:text-red-600 p-1"><Trash2 size={15} /></button>
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
                    {/* שורה 3: ספק + מחיר ללקוח */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400 mb-0.5">ספק ברירת מחדל</p>
                        {supplier ? (<><p className="font-semibold">{supplier.supplier_name}</p><p className="text-slate-500">{formatMoney(supplier.price)} • {supplier.lead_time_days} ימים</p></>) : <span className="text-slate-400">—</span>}
                      </div>
                      <div>
                        <p className="text-slate-400 mb-0.5">מחיר ללקוח</p>
                        <p className="font-semibold text-green-700">{formatMoney(sellingPrice)}</p>
                        <p className="text-slate-500">עלות: {formatMoney(avgCost)}</p>
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
        <BatchesModal part={viewingBatches} onClose={() => setViewingBatches(null)} />
      )}

      {viewingAssembly && (
        <AssemblyInstructionsViewer part={viewingAssembly} onClose={() => setViewingAssembly(null)} />
      )}

      {quickViewPart && <PartQuickModal part={quickViewPart} onClose={() => setQuickViewPart(null)} />}

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

function BatchesModal({ part, onClose }) {
  const { state } = useApp();
  const allBatches = state.stockBatches
    .filter(b => b.part_id === part.id)
    .sort((a, b) => new Date(a.received_date) - new Date(b.received_date));

  return (
    <Modal open={true} onClose={onClose} title={`אצוות מלאי — ${part.name}`} subtitle="לפי FIFO" maxWidth="max-w-3xl">
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
                <td className={`p-2 text-center font-bold ${b.quantity_remaining === 0 ? 'text-slate-400' : 'text-green-700'}`}>{b.quantity_remaining}</td>
                <td className="p-2 font-semibold">{formatMoney(b.unit_cost)}</td>
                <td className="p-2 text-center">
                  {b.quantity_remaining === 0
                    ? <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">נגמר</span>
                    : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">פעיל</span>}
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
