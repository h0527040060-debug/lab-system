import { useState } from 'react';
import { useAppContext as useApp } from '../../../store/AppContext';
import { formatMoney } from '../../../utils/formatters';
import { calculateWeightedAvgCost } from '../../../utils/inventory';
import PartThumbnail from '../../../components/PartThumbnail';
import SearchInput from '../../../components/SearchInput';
import PartQuickModal from '../../../components/PartQuickModal';
import EmptyState from '../../../components/EmptyState';
import { Package, Edit2, Check, X } from 'lucide-react';

export default function PartsPricing() {
  const { state, dispatch } = useApp();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [lastEdit, setLastEdit] = useState('markup');
  const [search, setSearch] = useState('');
  const [viewingPart, setViewingPart] = useState(null);

  const filteredParts = state.parts.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(s) ||
      p.manufacturer_sku?.toLowerCase().includes(s) ||
      p.internal_barcode?.toLowerCase().includes(s) ||
      p.category?.toLowerCase().includes(s)
    );
  });

  const startEdit = (part) => {
    const avgCost = calculateWeightedAvgCost(part.id, state.stockBatches);
    setEditForm({
      cost_price: part.cost_price ?? avgCost,
      selling_price: part.selling_price ?? 0,
      selling_markup_percent: part.selling_markup_percent ?? 0,
    });
    setLastEdit('markup');
    setEditingId(part.id);
  };

  const handleCostChange = (val) => {
    const cost = parseFloat(val) || 0;
    if (lastEdit === 'markup') {
      const markup = parseFloat(editForm.selling_markup_percent) || 0;
      setEditForm(f => ({ ...f, cost_price: val, selling_price: parseFloat((cost * (1 + markup / 100)).toFixed(2)) }));
    } else {
      const selling = parseFloat(editForm.selling_price) || 0;
      const markup = cost > 0 ? parseFloat(((selling - cost) / cost * 100).toFixed(2)) : 0;
      setEditForm(f => ({ ...f, cost_price: val, selling_markup_percent: markup }));
    }
  };

  const handleSellingChange = (val) => {
    setLastEdit('selling');
    const selling = parseFloat(val) || 0;
    const cost = parseFloat(editForm.cost_price) || 0;
    const markup = cost > 0 ? parseFloat(((selling - cost) / cost * 100).toFixed(2)) : 0;
    setEditForm(f => ({ ...f, selling_price: val, selling_markup_percent: markup }));
  };

  const handleMarkupChange = (val) => {
    setLastEdit('markup');
    const markup = parseFloat(val) || 0;
    const cost = parseFloat(editForm.cost_price) || 0;
    const selling = parseFloat((cost * (1 + markup / 100)).toFixed(2));
    setEditForm(f => ({ ...f, selling_markup_percent: val, selling_price: selling }));
  };

  const handleSave = (partId) => {
    dispatch({
      type: 'UPDATE_PART',
      payload: {
        id: partId,
        cost_price: parseFloat(editForm.cost_price) || 0,
        selling_price: parseFloat(editForm.selling_price) || 0,
        selling_markup_percent: parseFloat(editForm.selling_markup_percent) || 0,
      }
    });
    setEditingId(null);
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">תמחור חלקים</h2>
        <p className="text-sm text-slate-500">עריכת מחיר עלות, מחיר ללקוח ורווח — כל שינוי מחשב אוטומטית</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="חיפוש לפי שם, יצרן, מק״ט, ברקוד..." />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredParts.length === 0 ? (
          <EmptyState icon={Package} title={state.parts.length === 0 ? 'אין חלקים בקטלוג' : 'לא נמצאו תוצאות'} />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-right p-3 font-semibold">חלק</th>
                <th className="text-right p-3 font-semibold">עלות ממוצעת (FIFO)</th>
                <th className="text-right p-3 font-semibold">עלות ידנית (₪)</th>
                <th className="text-right p-3 font-semibold">מחיר ללקוח (₪)</th>
                <th className="text-right p-3 font-semibold">רווח (%)</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.map(part => {
                const avgCost = calculateWeightedAvgCost(part.id, state.stockBatches);
                const isEditing = editingId === part.id;

                return (
                  <tr key={part.id} className={`border-b border-slate-100 ${isEditing ? 'bg-orange-50' : 'hover:bg-slate-50'}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <PartThumbnail part={part} size="sm" onClick={() => setViewingPart(part)} />
                        <button onClick={() => setViewingPart(part)} className="text-right hover:text-blue-600 group">
                          <p className="font-semibold group-hover:underline">{part.name}</p>
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-xs">{formatMoney(avgCost)}</td>

                    {isEditing ? (
                      <>
                        <td className="p-3">
                          <input type="number" step="0.01" value={editForm.cost_price} onChange={e => handleCostChange(e.target.value)}
                            className="w-24 border border-orange-300 rounded px-2 py-1 text-sm text-left" dir="ltr" />
                        </td>
                        <td className="p-3">
                          <input type="number" step="0.01" value={editForm.selling_price} onChange={e => handleSellingChange(e.target.value)}
                            className="w-24 border border-orange-300 rounded px-2 py-1 text-sm text-left" dir="ltr" />
                        </td>
                        <td className="p-3">
                          <input type="number" step="0.01" value={editForm.selling_markup_percent} onChange={e => handleMarkupChange(e.target.value)}
                            className="w-20 border border-orange-300 rounded px-2 py-1 text-sm text-left" dir="ltr" />
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <button onClick={() => handleSave(part.id)} className="text-green-600 hover:text-green-800 p-1"><Check size={16} /></button>
                            <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-red-600 p-1"><X size={16} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 font-semibold">{formatMoney(part.cost_price || avgCost)}</td>
                        <td className="p-3 font-semibold text-green-700">{formatMoney(part.selling_price || 0)}</td>
                        <td className="p-3">
                          <span className={`font-bold ${(part.selling_markup_percent || 0) > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                            {parseFloat(part.selling_markup_percent || 0).toFixed(2)}%
                          </span>
                        </td>
                        <td className="p-3">
                          <button onClick={() => startEdit(part)} className="text-slate-400 hover:text-orange-600 p-1">
                            <Edit2 size={15} />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {viewingPart && <PartQuickModal part={viewingPart} onClose={() => setViewingPart(null)} />}
    </div>
  );
}
