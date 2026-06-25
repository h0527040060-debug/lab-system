import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { REPAIR_STATUSES } from '../constants/statuses';
import { formatMoney, formatDateTime } from '../utils/formatters';
import { useStopwatch } from '../hooks/useStopwatch';
import { allocateFifo, getTotalStock, calculateAllocationCost } from '../utils/fifo';
import { filterWorkCatalogForDevice } from '../utils/workCatalog';
import Modal from './Modal';
import InfoCard from './InfoCard';
import ConfirmDialog from './ConfirmDialog';
import { Play, Square, User, Wrench, Package, AlertTriangle, Plus, CheckCircle2, Trash2, Clock } from 'lucide-react';

export default function WorkSessionModal({ repair, onClose }) {
  const { state, dispatch } = useAppContext();

  const customer = state.customers.find(c => c.id === repair.customer_id);
  const device = state.devices.find(d => d.id === repair.device_id);

  const isRunning = repair.status === REPAIR_STATUSES.IN_WORK && repair.work_start;
  const stopwatch = useStopwatch(isRunning ? repair.work_start : null);

  const [completedWorks, setCompletedWorks] = useState(repair.performed_work_codes || repair.diagnosed_work_codes || []);
  const [partsToUse, setPartsToUse] = useState(repair.diagnosed_parts?.map(p => ({ ...p })) || []);
  const [showAddPart, setShowAddPart] = useState(false);
  const [showAddWork, setShowAddWork] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [stockError, setStockError] = useState(null);

  const originalWorks = repair.diagnosed_work_codes || [];
  const originalParts = repair.diagnosed_parts || [];

  const hasNewWorks = completedWorks.some(w => !originalWorks.includes(w));
  const hasNewParts = partsToUse.some(p => !originalParts.find(op => op.part_id === p.part_id));
  const hasChanges = hasNewWorks || hasNewParts;

  const handleStart = () => {
    dispatch({
      type: 'UPDATE_REPAIR',
      payload: {
        id: repair.id,
        status: REPAIR_STATUSES.IN_WORK,
        work_start: new Date().toISOString(),
      }
    });
  };

  const handleFinish = () => {
    const allAllocations = [];

    for (const partItem of partsToUse) {
      const allocation = allocateFifo(partItem.part_id, partItem.quantity, state.stockBatches);
      if (!allocation.success) {
        const part = state.parts.find(p => p.id === partItem.part_id);
        setStockError(`אין מספיק מלאי של ${part?.name}. זמין: ${allocation.totalAvailable}, נדרש: ${partItem.quantity}`);
        setConfirmAction(null);
        return;
      }
      allAllocations.push(...allocation.allocations);
    }

    const workEnd = new Date().toISOString();
    const elapsedMs = new Date(workEnd) - new Date(repair.work_start);
    const actualHours = elapsedMs / (1000 * 60 * 60);
    const internalPartsCost = calculateAllocationCost(allAllocations);

    // אחד כמויות לפי batch_id
    const usedFromBatch = {};
    allAllocations.forEach(a => {
      usedFromBatch[a.batch_id] = (usedFromBatch[a.batch_id] || 0) + a.quantity;
    });

    const batchUpdates = Object.entries(usedFromBatch).map(([batchId, qty]) => {
      const batch = state.stockBatches.find(b => b.id === batchId);
      return { id: batchId, quantity_remaining: batch.quantity_remaining - qty };
    });

    if (batchUpdates.length > 0) {
      dispatch({ type: 'UPDATE_STOCK_BATCHES_BULK', payload: batchUpdates });
    }

    dispatch({
      type: 'UPDATE_REPAIR',
      payload: {
        id: repair.id,
        status: REPAIR_STATUSES.PENDING_RELEASE_DOCS,
        work_end: workEnd,
        actual_hours: actualHours,
        performed_work_codes: completedWorks,
        used_parts: allAllocations,
        internal_parts_cost: internalPartsCost,
        has_unapproved_changes: hasChanges,
      }
    });

    setConfirmAction(null);
    onClose();
  };

  const toggleWork = (workId) => {
    setCompletedWorks(prev => prev.includes(workId) ? prev.filter(w => w !== workId) : [...prev, workId]);
  };

  const addPart = (partId) => {
    setPartsToUse(prev => {
      if (prev.find(p => p.part_id === partId)) return prev;
      return [...prev, { part_id: partId, quantity: 1 }];
    });
    setShowAddPart(false);
  };

  const updatePartQty = (partId, qty) => {
    const newQty = Math.max(1, parseInt(qty) || 1);
    setPartsToUse(prev => prev.map(p => p.part_id === partId ? { ...p, quantity: newQty } : p));
  };

  const removePart = (partId) => {
    setPartsToUse(prev => prev.filter(p => p.part_id !== partId));
  };

  const addWork = (workId) => {
    if (!completedWorks.includes(workId)) {
      setCompletedWorks(prev => [...prev, workId]);
    }
    setShowAddWork(false);
  };

  const relevantWorks = filterWorkCatalogForDevice(state.workCatalog, device);
  const availableWorksToAdd = relevantWorks.filter(w => !completedWorks.includes(w.id));
  const availablePartsToAdd = state.parts.filter(p => !partsToUse.find(used => used.part_id === p.id));

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`ביצוע תיקון: ${repair.id}`}
      subtitle={`${customer?.name} • ${device?.brand} ${device?.model}`}
      maxWidth="max-w-5xl"
      footer={
        <div className="flex justify-between items-center">
          <div className="text-sm">
            {hasChanges && (
              <div className="flex items-center gap-1 text-orange-600">
                <AlertTriangle size={16} />
                <span className="font-semibold">יש שינויים מהאבחון - יידרש אישור משרד</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100">סגור</button>
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
              >
                <Play size={18} />
                התחל סטופר
              </button>
            ) : (
              <button
                onClick={() => setConfirmAction({ action: 'finish' })}
                disabled={completedWorks.length === 0}
                className="bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
              >
                <Square size={18} />
                סיים סטופר
              </button>
            )}
          </div>
        </div>
      }
    >
      {isRunning && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 mb-4 text-center">
          <div className="flex items-center justify-center gap-2 text-green-700 mb-1">
            <Clock size={20} />
            <span className="text-sm font-semibold">סטופר רץ</span>
          </div>
          <p className="text-5xl font-bold font-mono text-green-800 tracking-wider">{stopwatch.display}</p>
          <p className="text-xs text-green-600 mt-1">החל ב-{formatDateTime(repair.work_start)}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-4">
        <InfoCard title="לקוח" icon={User}>
          <p className="font-semibold">{customer?.name}</p>
          <p className="text-xs text-slate-500">{customer?.phone}</p>
        </InfoCard>
        <InfoCard title="מכשיר" icon={Wrench}>
          <p className="font-semibold">{device?.brand} {device?.model}</p>
          <p className="text-xs text-slate-500 font-mono">{device?.id}</p>
        </InfoCard>
        <InfoCard title="תלונה">
          <p className="text-sm">{repair.complaint}</p>
        </InfoCard>
      </div>

      {repair.diagnosis && (
        <InfoCard title="אבחון">
          <p className="text-sm text-slate-700">{repair.diagnosis}</p>
        </InfoCard>
      )}

      {/* עבודות */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-slate-800">עבודות לביצוע ({completedWorks.length})</h3>
          <button
            onClick={() => setShowAddWork(!showAddWork)}
            className="text-sm text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
          >
            <Plus size={16} />
            הוסף עבודה
          </button>
        </div>

        {showAddWork && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-2 max-h-32 overflow-y-auto">
            {availableWorksToAdd.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-2">אין עבודות נוספות</p>
            ) : (
              availableWorksToAdd.map(w => (
                <button
                  key={w.id}
                  onClick={() => addWork(w.id)}
                  className="w-full text-right p-2 hover:bg-white rounded text-sm flex justify-between"
                >
                  <span>{w.work_name} ({w.brand} {w.model})</span>
                  <span className="font-bold">{formatMoney(w.price)}</span>
                </button>
              ))
            )}
          </div>
        )}

        <div className="space-y-1">
          {completedWorks.map(workId => {
            const work = state.workCatalog.find(w => w.id === workId);
            if (!work) return null;
            const isNew = !originalWorks.includes(workId);
            return (
              <div
                key={workId}
                className={`flex items-center gap-2 p-2 rounded-lg border ${isNew ? 'bg-orange-50 border-orange-300' : 'bg-slate-50 border-slate-200'}`}
              >
                <CheckCircle2 className="text-green-600" size={18} />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{work.work_name}</p>
                  <p className="text-xs text-slate-500">{work.brand} {work.model}</p>
                </div>
                {isNew && <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded font-bold">חדש!</span>}
                <span className="text-sm font-bold">{formatMoney(work.price)}</span>
                <button onClick={() => toggleWork(workId)} className="text-slate-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
          {completedWorks.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-3 border border-dashed border-slate-300 rounded-lg">אין עבודות מסומנות</p>
          )}
        </div>
      </div>

      {/* חלקים */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-slate-800">חלקים בשימוש ({partsToUse.length})</h3>
          <button
            onClick={() => setShowAddPart(!showAddPart)}
            className="text-sm text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
          >
            <Plus size={16} />
            הוסף חלק
          </button>
        </div>

        {showAddPart && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-2 max-h-32 overflow-y-auto">
            {availablePartsToAdd.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-2">אין חלקים נוספים</p>
            ) : (
              availablePartsToAdd.map(p => {
                const stock = getTotalStock(p.id, state.stockBatches);
                return (
                  <button
                    key={p.id}
                    onClick={() => addPart(p.id)}
                    disabled={stock === 0}
                    className="w-full text-right p-2 hover:bg-white rounded text-sm disabled:opacity-50 flex justify-between"
                  >
                    <span>{p.images?.[0]} {p.name}</span>
                    <span className={stock === 0 ? 'text-red-600' : 'text-slate-500'}>מלאי: {stock}</span>
                  </button>
                );
              })
            )}
          </div>
        )}

        <div className="space-y-1">
          {partsToUse.map(item => {
            const part = state.parts.find(p => p.id === item.part_id);
            if (!part) return null;
            const isNew = !originalParts.find(op => op.part_id === item.part_id);
            const totalStock = getTotalStock(item.part_id, state.stockBatches);
            const lowStock = totalStock < item.quantity;

            return (
              <div
                key={item.part_id}
                className={`flex items-center gap-2 p-2 rounded-lg border ${
                  isNew ? 'bg-orange-50 border-orange-300' :
                  lowStock ? 'bg-red-50 border-red-300' :
                  'bg-slate-50 border-slate-200'
                }`}
              >
                <Package className="text-slate-600" size={18} />
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {part.images?.[0]} {part.name}
                    {isNew && <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded font-bold mr-2">חדש!</span>}
                  </p>
                  <p className={`text-xs ${lowStock ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                    {part.manufacturer} • מלאי זמין: {totalStock}
                    {lowStock && ` (לא מספיק!)`}
                  </p>
                </div>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updatePartQty(item.part_id, e.target.value)}
                  className="w-16 border border-slate-300 rounded px-2 py-1 text-sm text-center"
                />
                <button onClick={() => removePart(item.part_id)} className="text-slate-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
          {partsToUse.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-3 border border-dashed border-slate-300 rounded-lg">אין חלקים בשימוש</p>
          )}
        </div>

        {stockError && (
          <div className="mt-3 bg-red-50 border-2 border-red-300 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="text-red-600 mt-0.5 shrink-0" size={18} />
            <div>
              <p className="font-bold text-red-800">לא ניתן לסיים תיקון</p>
              <p className="text-sm text-red-700">{stockError}</p>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        title="סיום סטופר"
        message={`האם בטוח שברצונך לסיים? זמן עבודה: ${stopwatch.display}. ${partsToUse.length} סוגי חלקים יוסרו מהמלאי לפי FIFO.`}
        confirmLabel="כן, סיים"
        onConfirm={handleFinish}
        onCancel={() => setConfirmAction(null)}
      />
    </Modal>
  );
}
