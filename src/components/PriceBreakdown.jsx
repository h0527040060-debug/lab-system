import { formatMoney } from '../utils/formatters';
import { Wrench, Package, Sparkles } from 'lucide-react';

export default function PriceBreakdown({ breakdown, showHeaders = true }) {
  const { works, worksTotal, parts, partsTotal, services, servicesTotal, grandTotal } = breakdown;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
      {works.length > 0 && (
        <div className="p-3 border-b border-slate-200">
          {showHeaders && (
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-600 uppercase">
              <Wrench size={14} />
              <span>עבודות ({works.length})</span>
            </div>
          )}
          <div className="space-y-1">
            {works.map(w => (
              <div key={w.id} className="flex justify-between text-sm">
                <span className="text-slate-700">
                  {w.name} <span className="text-xs text-slate-500">({w.brand} {w.model})</span>
                </span>
                <span className="font-semibold">{formatMoney(w.price)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-bold">
              <span>סה"כ עבודות:</span>
              <span>{formatMoney(worksTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {parts.length > 0 && (
        <div className="p-3 border-b border-slate-200">
          {showHeaders && (
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-600 uppercase">
              <Package size={14} />
              <span>חלקים ({parts.length})</span>
            </div>
          )}
          <div className="space-y-1">
            {parts.map(p => (
              <div key={p.id} className="flex justify-between text-sm">
                <span className="text-slate-700">
                  {p.name} {p.quantity > 1 && <span className="text-xs text-slate-500">× {p.quantity}</span>}
                </span>
                <span className="font-semibold">{formatMoney(p.total)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-bold">
              <span>סה"כ חלקים:</span>
              <span>{formatMoney(partsTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {services.length > 0 && (
        <div className="p-3 border-b border-slate-200">
          {showHeaders && (
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-600 uppercase">
              <Sparkles size={14} />
              <span>שירותים ({services.length})</span>
            </div>
          )}
          <div className="space-y-1">
            {services.map(s => (
              <div key={s.id} className="flex justify-between text-sm">
                <span className="text-slate-700">{s.name}</span>
                <span className="font-semibold">{formatMoney(s.price)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-bold">
              <span>סה"כ שירותים:</span>
              <span>{formatMoney(servicesTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {works.length === 0 && parts.length === 0 && services.length === 0 && (
        <div className="p-4 text-sm text-slate-500 text-center">לא נבחרו עבודות, חלקים או שירותים</div>
      )}

      <div className="p-4 bg-orange-50 border-t-2 border-orange-300">
        <div className="flex justify-between items-center">
          <span className="text-base font-bold text-slate-800">סה"כ הצעת מחיר:</span>
          <span className="text-2xl font-bold text-orange-700">{formatMoney(grandTotal)}</span>
        </div>
        <p className="text-xs text-slate-500 text-left mt-1">ללא מע"מ</p>
      </div>
    </div>
  );
}
