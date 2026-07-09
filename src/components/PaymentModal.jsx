import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { REPAIR_STATUSES } from '../constants/statuses';
import { WARRANTY_TYPES, WARRANTY_LABELS } from '../constants/warranty';
import { formatDateTime, formatMoney, formatHours } from '../utils/formatters';
import { calculateInvoiceBreakdown } from '../utils/pricing';
import Modal from './Modal';
import InfoCard from './InfoCard';
import SignaturePad from './SignaturePad';
import ConfirmDialog from './ConfirmDialog';
import PriceBreakdown from './PriceBreakdown';
import ImageGalleryModal from './ImageGalleryModal';
import { User, Wrench, Camera, Check, FileText } from 'lucide-react';
import { useDirtyForm } from '../hooks/useDirtyForm';
import { useUnsavedGuard } from '../hooks/useUnsavedGuard';

// מסך גביה ושחרור לתיקון בודד — נפתח מעמוד "גביה ושחרור" וגם מתצוגת הלוח
export default function PaymentModal({ repair, onClose }) {
  const { state, dispatch } = useAppContext();
  const customer = state.customers.find(c => c.id === repair.customer_id);
  const device = state.devices.find(d => d.id === repair.device_id);

  const isRefused = repair.status === REPAIR_STATUSES.CUSTOMER_REFUSED;
  const isWarrantyFree = repair.warranty_type === WARRANTY_TYPES.FULL_WARRANTY;
  const vatPercent = state.settings.vat_percent_display || 17;
  const diagnosticFee = repair.diagnostic_fee || 0;

  const breakdown = isRefused ? null : calculateInvoiceBreakdown(repair, state);
  const diagnosticCredit = (!isRefused && repair.diagnostic_fee_credited) ? diagnosticFee : 0;

  const [feeWaived, setFeeWaived] = useState(false);
  const [waiverNote, setWaiverNote] = useState('');
  const [signature, setSignature] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [confirmAction, setConfirmAction] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const isDirty = useDirtyForm({ signature, feeWaived, waiverNote, paymentMethod });
  const { requestClose, confirmDialog } = useUnsavedGuard(isDirty, onClose);

  const chargedAmount = isRefused
    ? (feeWaived ? 0 : diagnosticFee)
    : (breakdown.grandTotal - diagnosticCredit);
  const vatAmount = chargedAmount * (vatPercent / 100);
  const totalWithVat = chargedAmount + vatAmount;
  const noCharge = isWarrantyFree || (isRefused && feeWaived);

  const handleComplete = () => {
    dispatch({
      type: 'UPDATE_REPAIR',
      payload: {
        id: repair.id,
        status: REPAIR_STATUSES.PAID_WAITING_PICKUP,
        customer_signature: signature,
        payment_method: noCharge ? 'waived' : paymentMethod,
        // אחריות מלאה → final_price = 0 (לא מנפחים הכנסות)
        final_price: noCharge ? 0 : chargedAmount,
        payment_at: new Date().toISOString(),
        released_at: new Date().toISOString(),
        ...(isRefused && feeWaived && { diagnostic_fee_waived: true, diagnostic_fee_waiver_note: waiverNote }),
      }
    });
    setConfirmAction(null);
    onClose();
  };

  return (
    <>
    <Modal
      open={true}
      onClose={requestClose}
      title={`גביה ושחרור - ${repair.id}`}
      subtitle={`${customer?.name} • ${device?.type || `${device?.brand} ${device?.model}`}`}
      maxWidth="max-w-4xl"
      footer={
        <div className="flex justify-between">
          <button onClick={requestClose} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100">
            סגור
          </button>
          <button
            onClick={() => setConfirmAction({ action: 'complete' })}
            disabled={!signature || (isRefused && feeWaived && !waiverNote.trim())}
            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
          >
            <Check size={18} />
            {noCharge ? 'שחרר ללקוח' : 'שולם - שחרר ללקוח'}
          </button>
        </div>
      }
    >
      <div className="grid lg:grid-cols-2 gap-4">
        {/* פרטים ופירוט */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <InfoCard title="לקוח" icon={User}>
              <p className="font-semibold text-sm">{customer?.name}</p>
              <p className="text-xs text-slate-500">{customer?.phone}</p>
            </InfoCard>
            <InfoCard title="מכשיר" icon={Wrench}>
              <p className="font-semibold text-sm">{device?.type || `${device?.brand} ${device?.model}`}</p>
            </InfoCard>
          </div>

          {isRefused ? (
            <div className="space-y-2">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-bold text-red-900 mb-2">🚫 לקוח מסרב — דמי בדיקה</p>
                <div className="flex justify-between text-sm font-bold text-red-800">
                  <span>דמי בדיקה:</span>
                  <span className={feeWaived ? 'line-through text-slate-400' : ''}>{formatMoney(diagnosticFee)}</span>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-amber-900">
                  <input type="checkbox" checked={feeWaived} onChange={e => setFeeWaived(e.target.checked)} className="w-4 h-4" />
                  זיכוי דמי הבדיקה (גמישות משרדית)
                </label>
                {feeWaived && (
                  <textarea
                    value={waiverNote}
                    onChange={e => setWaiverNote(e.target.value)}
                    placeholder="סיבת הזיכוי (חובה)..."
                    rows={2}
                    className="mt-2 w-full border border-amber-300 rounded px-2 py-1 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                )}
              </div>
            </div>
          ) : (
            <div>
              <h4 className="font-bold text-sm mb-2">פירוט המחיר:</h4>
              <PriceBreakdown breakdown={breakdown} diagnosticCredit={diagnosticCredit} />
            </div>
          )}

          {!noCharge && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-bold text-blue-900 mb-2">💰 חישוב כולל מע"מ:</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>סה"כ:</span>
                  <span>{formatMoney(chargedAmount)}</span>
                </div>
                <div className="flex justify-between text-blue-700">
                  <span>מע"מ ({vatPercent}%):</span>
                  <span>{formatMoney(vatAmount)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-blue-300 font-bold text-blue-900 text-base">
                  <span>לתשלום:</span>
                  <span>{formatMoney(totalWithVat)}</span>
                </div>
              </div>
            </div>
          )}

          {noCharge && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="font-bold text-green-800">
                ✓ ללא תשלום{isRefused ? ' — דמי בדיקה מזוכים' : ' - אחריות מלאה'}
              </p>
            </div>
          )}

          {repair.release_media && repair.release_media.length > 0 && (
            <div>
              <h4 className="font-bold text-sm mb-2 flex items-center gap-1">
                <Camera size={14} />
                תיעוד תקינות:
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {repair.release_media.map((m, idx) => (
                  <div key={idx} className="aspect-square bg-slate-100 rounded-lg overflow-hidden border">
                    {m.type === 'image' ? (
                      <img src={m.data} alt="" onClick={() => setLightbox(m.data)} className="w-full h-full object-cover cursor-zoom-in hover:opacity-90" />
                    ) : (
                      <video src={m.data} controls className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* תשלום וחתימה */}
        <div className="space-y-3">
          {!noCharge && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">שיטת תשלום:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'cash', label: '💵 מזומן' },
                  { key: 'credit', label: '💳 אשראי' },
                  { key: 'transfer', label: '🏦 העברה' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setPaymentMethod(opt.key)}
                    className={`p-2 rounded-lg border-2 text-sm font-semibold ${
                      paymentMethod === opt.key
                        ? 'border-orange-500 bg-orange-50 text-orange-900'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <FileText className="inline ml-1" size={14} />
              חתימת לקוח (אישור קבלת מכשיר) *
            </label>
            <SignaturePad onChange={setSignature} initialSignature={repair.customer_signature} />
            <p className="text-xs text-slate-500 mt-1">חובה לחתום לפני שחרור</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm">
            <p className="font-bold text-slate-700 mb-2">פרטי התיקון:</p>
            <div className="space-y-1 text-xs text-slate-600">
              <p>• נקלט: {formatDateTime(repair.date_intake)}</p>
              {repair.actual_hours && <p>• זמן עבודה: {formatHours(repair.actual_hours)}</p>}
              <p>• סוג אחריות: {WARRANTY_LABELS[repair.warranty_type]}</p>
              {repair.diagnosis && <p>• אבחון: {repair.diagnosis}</p>}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        title="אישור שחרור ללקוח"
        message={
          noCharge
            ? 'הלקוח חתם וקיבל את המכשיר. הקריאה תיסגר ללא חיוב.'
            : `הלקוח שילם ${formatMoney(totalWithVat)} וקיבל את המכשיר. הקריאה תיסגר.`
        }
        confirmLabel="כן, אשר"
        onConfirm={handleComplete}
        onCancel={() => setConfirmAction(null)}
      />

      {lightbox && (
        <ImageGalleryModal images={[lightbox]} altText="תיעוד תקינות" onClose={() => setLightbox(null)} />
      )}
    </Modal>
    {confirmDialog}
    </>
  );
}
