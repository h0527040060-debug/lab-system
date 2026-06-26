import { useState } from 'react';
import { X, User, Smartphone, FileText, Wrench, Camera, Stethoscope, Clock, Package } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { getStatusDisplay } from '../utils/statusConfig';
import { formatDateTime } from '../utils/formatters';
import WhatsAppButton from './WhatsAppButton';
import CustomerQuickModal from './CustomerQuickModal';
import DeviceQuickModal from './DeviceQuickModal';

const WARRANTY_LABELS = {
  paid: 'תשלום רגיל',
  full_warranty: 'אחריות מלאה',
  paid_warranty: 'אחריות בתשלום',
};

function formatSeconds(sec) {
  if (!sec || sec < 60) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}ש׳ ${m > 0 ? m + 'ד׳' : ''}`.trim();
  return `${m} דקות`;
}

export default function RepairDetailModal({ repair, customer, device, onClose, onAction }) {
  const { state } = useAppContext();
  const [innerModal, setInnerModal] = useState(null); // 'customer' | 'device'
  const statusDisplay = getStatusDisplay(repair.status, state.statusConfig);

  const diagnosedParts = repair.diagnosed_parts || [];
  const partsDetails = diagnosedParts.map(dp => {
    const part = state.parts?.find(p => p.id === dp.part_id || p.id === dp.id);
    return { name: part?.name || dp.name || 'חלק', qty: dp.quantity || 1, price: dp.price || part?.price || 0 };
  });

  const elapsedTime = formatSeconds(repair.timer_seconds);
  const laborCost = repair.labor_cost || 0;
  const partsCost = repair.parts_cost || partsDetails.reduce((s, p) => s + p.price * p.qty, 0);
  const finalPrice = repair.final_price;

  const canDiagnosis = ['red_intake', 'yellow_diagnosis', 'yellow_appeal'].includes(repair.status);
  const canWork = ['yellow_ready_to_work', 'in_work'].includes(repair.status);
  const canDocs = repair.status === 'pending_release_docs';

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* כותרת */}
          <div className={`flex items-center justify-between p-4 border-b border-slate-200 ${statusDisplay.bg}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{statusDisplay.emoji}</span>
              <div>
                <p className="font-mono font-bold text-orange-600 text-sm">{repair.id}</p>
                <p className={`text-xs font-semibold ${statusDisplay.text}`}>{statusDisplay.label}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-white/60">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* לקוח ומכשיר */}
            <div className="space-y-2">
              <button
                onClick={() => setInnerModal('customer')}
                className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors text-right"
              >
                <User size={16} className="text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">לקוח</p>
                  <p className="font-semibold text-slate-800 truncate">{customer?.name || '—'}</p>
                  {customer?.phone && <p className="text-xs text-slate-500">{customer.phone}</p>}
                </div>
                <span className="text-xs text-blue-500 font-semibold flex-shrink-0">פרטים ←</span>
              </button>

              <button
                onClick={() => setInnerModal('device')}
                className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-purple-50 rounded-xl border border-slate-200 hover:border-purple-300 transition-colors text-right"
              >
                <Smartphone size={16} className="text-purple-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">מכשיר</p>
                  <p className="font-semibold text-slate-800 truncate">{device?.brand} {device?.model}</p>
                  {device?.id && <p className="text-xs text-slate-400 font-mono">{device.id}</p>}
                </div>
                <span className="text-xs text-purple-500 font-semibold flex-shrink-0">פרטים ←</span>
              </button>
            </div>

            {/* תאריך + אחריות */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-slate-50 rounded-xl p-2.5">
                <p className="text-xs text-slate-500 mb-0.5">תאריך קליטה</p>
                <p className="font-semibold text-slate-800">{repair.date_intake ? formatDateTime(repair.date_intake).slice(0, 10) : '—'}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5">
                <p className="text-xs text-slate-500 mb-0.5">סוג שירות</p>
                <p className="font-semibold text-slate-800">{WARRANTY_LABELS[repair.warranty_type] || repair.warranty_type || '—'}</p>
              </div>
            </div>

            {/* תלונה */}
            {repair.complaint && (
              <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText size={13} className="text-orange-600" />
                  <p className="text-xs font-bold text-orange-700">תלונת לקוח</p>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{repair.complaint}</p>
              </div>
            )}

            {/* אבחון */}
            {repair.diagnosis_notes && (
              <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Stethoscope size={13} className="text-yellow-700" />
                  <p className="text-xs font-bold text-yellow-700">אבחון טכנאי</p>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{repair.diagnosis_notes}</p>
              </div>
            )}

            {/* זמן עבודה */}
            {elapsedTime && (
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-blue-500" />
                <span className="text-slate-600">זמן עבודה:</span>
                <span className="font-semibold text-slate-800">{elapsedTime}</span>
              </div>
            )}

            {/* חלקים */}
            {partsDetails.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <div className="flex items-center gap-1.5 mb-2">
                  <Package size={13} className="text-slate-600" />
                  <p className="text-xs font-bold text-slate-700">חלקים ({partsDetails.length})</p>
                </div>
                <div className="space-y-1">
                  {partsDetails.map((p, i) => (
                    <div key={i} className="flex justify-between text-xs text-slate-700">
                      <span>{p.name} {p.qty > 1 ? `×${p.qty}` : ''}</span>
                      {p.price > 0 && <span className="font-semibold">{p.price * p.qty}₪</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* תמחור */}
            {(finalPrice != null || laborCost > 0 || partsCost > 0) && (
              <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                <p className="text-xs font-bold text-green-700 mb-1.5">תמחור</p>
                <div className="space-y-0.5 text-xs text-slate-700">
                  {laborCost > 0 && (
                    <div className="flex justify-between"><span>עבודה</span><span>{laborCost}₪</span></div>
                  )}
                  {partsCost > 0 && (
                    <div className="flex justify-between"><span>חלקים</span><span>{partsCost}₪</span></div>
                  )}
                  {finalPrice != null && (
                    <div className="flex justify-between font-bold text-sm text-green-800 pt-1 border-t border-green-200 mt-1">
                      <span>סה״כ לתשלום</span><span>{finalPrice}₪</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* פעולות */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
              <WhatsAppButton repair={repair} customer={customer} device={device} type="customer" />
              {canDiagnosis && (
                <button
                  onClick={() => { onAction(repair.id, 'diagnosis'); onClose(); }}
                  className="flex items-center gap-1.5 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1.5 rounded-lg font-semibold"
                >
                  <Stethoscope size={12} /> אבחון
                </button>
              )}
              {canWork && (
                <button
                  onClick={() => { onAction(repair.id, 'work'); onClose(); }}
                  className="flex items-center gap-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1.5 rounded-lg font-semibold"
                >
                  <Wrench size={12} /> ביצוע
                </button>
              )}
              {canDocs && (
                <button
                  onClick={() => { onAction(repair.id, 'docs'); onClose(); }}
                  className="flex items-center gap-1.5 text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1.5 rounded-lg font-semibold"
                >
                  <Camera size={12} /> תיעוד
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* modals פנימיים */}
      {innerModal === 'customer' && customer && (
        <CustomerQuickModal
          customer={customer}
          repairs={state.repairs}
          devices={state.devices}
          onClose={() => setInnerModal(null)}
        />
      )}
      {innerModal === 'device' && device && (
        <DeviceQuickModal
          device={device}
          customer={customer}
          repairs={state.repairs}
          onClose={() => setInnerModal(null)}
        />
      )}
    </>
  );
}
