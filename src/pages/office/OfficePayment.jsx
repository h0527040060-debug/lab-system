import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { REPAIR_STATUSES } from '../../constants/statuses';
import { WARRANTY_TYPES, WARRANTY_LABELS } from '../../constants/warranty';
import { formatDateTime, formatMoney, formatHours } from '../../utils/formatters';
import { calculateQuoteBreakdown } from '../../utils/pricing';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import InfoCard from '../../components/InfoCard';
import SignaturePad from '../../components/SignaturePad';
import ConfirmDialog from '../../components/ConfirmDialog';
import PriceBreakdown from '../../components/PriceBreakdown';
import { DollarSign, User, Wrench, Camera, Check, Receipt, FileText } from 'lucide-react';

export default function OfficePayment() {
  const { state } = useAppContext();
  const [selectedRepair, setSelectedRepair] = useState(null);

  const pendingPayments = state.repairs
    .filter(r => r.status === REPAIR_STATUSES.PENDING_PAYMENT)
    .sort((a, b) => new Date(b.work_end || b.date_intake) - new Date(a.work_end || a.date_intake));

  return (
    <div>
      <PageHeader
        title="גביה ושחרור"
        subtitle={`${pendingPayments.length} תיקונים ממתינים לתשלום ושחרור`}
      />

      {pendingPayments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm">
          <EmptyState
            icon={DollarSign}
            title="אין תיקונים לגביה"
            description="תיקונים מוכנים יופיעו כאן אחרי תיעוד תקינות"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {pendingPayments.map(r => {
            const customer = state.customers.find(c => c.id === r.customer_id);
            const device = state.devices.find(d => d.id === r.device_id);
            const breakdown = calculateQuoteBreakdown(r, state);
            const vatPercent = state.settings.vat_percent_display || 17;
            const vatAmount = breakdown.grandTotal * (vatPercent / 100);
            const totalWithVat = breakdown.grandTotal + vatAmount;
            const isWarrantyFree = r.warranty_type === WARRANTY_TYPES.FULL_WARRANTY;

            return (
              <div key={r.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-bold text-orange-600">{r.id}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="font-mono text-xs text-slate-500">{device?.id}</span>
                      </div>
                      <p className="font-semibold">{customer?.name}</p>
                      <p className="text-xs text-slate-500">{customer?.phone}</p>
                      <p className="text-xs text-slate-500 mt-1">{device?.brand} {device?.model}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-slate-500">תיעוד הסתיים</p>
                      <p className="text-xs font-semibold">{formatDateTime(r.release_docs_at)}</p>
                      {isWarrantyFree && (
                        <p className="text-xs font-bold text-green-600 mt-1">✓ ללא תשלום (אחריות מלאה)</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h4 className="font-bold text-slate-800 mb-2">פירוט המחיר:</h4>
                  <PriceBreakdown breakdown={breakdown} />

                  {!isWarrantyFree && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs font-bold text-blue-900 mb-2">💰 לתצוגה ללקוח (כולל מע"מ):</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-700">סה"כ:</span>
                          <span className="font-semibold">{formatMoney(breakdown.grandTotal)}</span>
                        </div>
                        <div className="flex justify-between text-blue-700">
                          <span>מע"מ ({vatPercent}%):</span>
                          <span>{formatMoney(vatAmount)}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-blue-300 font-bold text-blue-900">
                          <span>לתשלום (כולל מע"מ):</span>
                          <span className="text-base">{formatMoney(totalWithVat)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-blue-700 mt-2 text-center italic">
                        מע"מ לתצוגה בלבד - חשבונית מופקת בנפרד במערכת החשבונאות
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => setSelectedRepair(r)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
                  >
                    <Receipt size={18} />
                    מסך גביה ושחרור
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedRepair && (
        <PaymentModal
          repair={selectedRepair}
          onClose={() => setSelectedRepair(null)}
        />
      )}
    </div>
  );
}

function PaymentModal({ repair, onClose }) {
  const { state, dispatch } = useAppContext();
  const customer = state.customers.find(c => c.id === repair.customer_id);
  const device = state.devices.find(d => d.id === repair.device_id);

  const breakdown = calculateQuoteBreakdown(repair, state);
  const vatPercent = state.settings.vat_percent_display || 17;
  const vatAmount = breakdown.grandTotal * (vatPercent / 100);
  const totalWithVat = breakdown.grandTotal + vatAmount;
  const isWarrantyFree = repair.warranty_type === WARRANTY_TYPES.FULL_WARRANTY;

  const [signature, setSignature] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [confirmAction, setConfirmAction] = useState(null);

  const handleComplete = () => {
    dispatch({
      type: 'UPDATE_REPAIR',
      payload: {
        id: repair.id,
        status: REPAIR_STATUSES.GREEN_COMPLETE,
        customer_signature: signature,
        payment_method: isWarrantyFree ? 'warranty' : paymentMethod,
        final_price: breakdown.grandTotal,
        payment_at: new Date().toISOString(),
        released_at: new Date().toISOString(),
      }
    });
    setConfirmAction(null);
    onClose();
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`גביה ושחרור - ${repair.id}`}
      subtitle={`${customer?.name} • ${device?.brand} ${device?.model}`}
      maxWidth="max-w-4xl"
      footer={
        <div className="flex justify-between">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100">
            סגור
          </button>
          <button
            onClick={() => setConfirmAction({ action: 'complete' })}
            disabled={!signature}
            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
          >
            <Check size={18} />
            {isWarrantyFree ? 'שחרר ללקוח' : 'שולם - שחרר ללקוח'}
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
              <p className="font-semibold text-sm">{device?.brand} {device?.model}</p>
            </InfoCard>
          </div>

          <div>
            <h4 className="font-bold text-sm mb-2">פירוט המחיר:</h4>
            <PriceBreakdown breakdown={breakdown} />
          </div>

          {!isWarrantyFree && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-bold text-blue-900 mb-2">💰 חישוב כולל מע"מ:</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>סה"כ:</span>
                  <span>{formatMoney(breakdown.grandTotal)}</span>
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

          {isWarrantyFree && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="font-bold text-green-800">✓ ללא תשלום - אחריות מלאה</p>
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
                      <img src={m.data} alt="" className="w-full h-full object-cover" />
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
          {!isWarrantyFree && (
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
              חתימת לקוח (אישור קבלת מכשיר תקין) *
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
        message={isWarrantyFree
          ? 'הלקוח חתם וקיבל את המכשיר. הקריאה תיסגר.'
          : `הלקוח שילם ${formatMoney(totalWithVat)} וקיבל את המכשיר. הקריאה תיסגר.`}
        confirmLabel="כן, אשר"
        onConfirm={handleComplete}
        onCancel={() => setConfirmAction(null)}
      />
    </Modal>
  );
}
