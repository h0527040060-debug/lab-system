import { useState } from 'react';
import { useAppContext as useApp } from '../../../store/AppContext';
import { formatMoney } from '../../../utils/formatters';
import { getTotalStock } from '../../../utils/fifo';
import EmptyState from '../../../components/EmptyState';
import PartThumbnail from '../../../components/PartThumbnail';
import { Package } from 'lucide-react';

export default function PartsStock() {
  const { state } = useApp();
  const [selectedPart, setSelectedPart] = useState(null);

  const partsWithStock = state.parts.map(p => ({
    ...p,
    totalStock: getTotalStock(p.id, state.stockBatches),
    batches: state.stockBatches
      .filter(b => b.part_id === p.id)
      .sort((a, b) => new Date(a.received_date) - new Date(b.received_date)),
  }));

  const displayPart = selectedPart ? partsWithStock.find(p => p.id === selectedPart) : null;
  const displayBatches = displayPart ? displayPart.batches : state.stockBatches.sort((a, b) => new Date(a.received_date) - new Date(b.received_date));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">מלאי ואצוות</h2>
          <p className="text-sm text-slate-500">כל האצוות לפי FIFO — ישן יוצא קודם</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {/* רשימת חלקים */}
        <div className="col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50">
            <p className="text-xs font-semibold text-slate-600">סינון לפי חלק</p>
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
                  <p className="text-xs text-slate-500">מלאי: {p.totalStock}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* טבלת אצוות */}
        <div className="col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden">
          {displayBatches.length === 0 ? (
            <EmptyState icon={Package} title="אין אצוות" />
          ) : (
            <table className="w-full text-sm">
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
                          <PartThumbnail part={part} size="xs" />
                          <span className="text-xs font-medium">{part?.name || '—'}</span>
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
          )}
        </div>
      </div>
    </div>
  );
}
