import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { REPAIR_STATUSES } from '../constants/statuses';
import { WARRANTY_TYPES, WARRANTY_LABELS } from '../constants/warranty';
import { formatDateTime, formatMoney } from '../utils/formatters';
import { calculateQuoteBreakdown } from '../utils/pricing';
import { buildMisuseConversionPayload } from '../utils/warrantyHelpers';
import Modal from './Modal';
import InfoCard from './InfoCard';
import PriceBreakdown from './PriceBreakdown';
import ConfirmDialog from './ConfirmDialog';
import { Wrench, FileText, Check, X, ShoppingCart, AlertTriangle } from 'lucide-react';

// אישור תמחור ללקוח על תיקון בודד — נפתח מעמוד "אישור תמחור" וגם מתצוגת הלוח.
// לעריכת ההצעה (הוספת/הסרת חלקים ועבודות) יש להשתמש בעמוד "אישור תמחור" הייעודי.
export default function ApprovalModal({ repair, onClose }) {
  const { state, dispatch } = useAppContext();
  const customer = state.customers.find(c => c.id === repair.customer_id);
  const device = state.devices.find(d => d.id === repair.device_id);
  const [confirmAction, setConfirmAction] = useState(null);

  const breakdown = calculateQuoteBreakdown(repair, state);
  const isWarrantyFree = repair.warranty_type === WARRANTY_TYPES.FULL_WARRANTY;
  const diagnosticFee = state.settings.diagnostic_fee || 180;

  const handleApprove = () => {
    const isPaid = repair.warranty_type === WARRANTY_TYPES.PAID;
    dispatch({
      type: 'UPDATE_REPAIR',
      payload: {
        id: repair.id,
        status: REPAIR_STATUSES.YELLOW_READY_TO_WORK,
        approved_at: new Date().toISOString(),
        quoted_breakdown: calculateQuoteBreakdown(repair, state),
        ...(isPaid && { diagnostic_fee: diagnosticFee, diagnostic_fee_credited: true }),
        ...(isWarrantyFree && { warranty_verdict: 'technical_fault' }),
      },
    });
    setConfirmAction(null);
    onClose();
  };

  const handleMisuseConversion = () => {
    dispatch({ type: 'UPDATE_REPAIR', payload: buildMisuseConversionPayload(repair, diagnosticFee) });
    setConfirmAction(null);
    onClose();
  };

  const handleCustomerRefused = () => {
    dispatch({
      type: 'UPDATE_REPAIR',
      payload: {
        id: repair.id,
        status: REPAIR_STATUSES.CUSTOMER_REFUSED,
        refused_at: new Date().toISOString(),
        diagnostic_fee: diagnosticFee,
        diagnostic_fee_credited: false,
      },
    });
    setConfirmAction(null);
    onClose();
  };

  const handleBoughtNew = () => {
    dispatch({
      type: 'UPDATE_REPAIR',
      payload: {
        id: repair.id,
        status: REPAIR_STATUSES.BOUGHT_NEW,
        bought_new_at: new Date().toISOString(),
        diagnostic_fee: diagnosticFee,
        diagnostic_fee_credited: true,
        diagnostic_fee_waived: true,
      },
    });
    setConfirmAction(null);
    onClose();
  };

  return (
    <>
      <Modal
        open={true}
        onClose={onClose}
        title={`אישור תמחור - ${repair.id}`}
        subtitle={`${customer?.name} • ${device?.type || `${device?.brand} ${device?.model}`}`}
        maxWidth="max-w-3xl"
        footer={
          <div className="flex flex-wrap gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100">סגור</button>
            {isWarrantyFree ? (
              <>
                <button
                  onClick={() => setConfirmAction('misuse')}
                  className="px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg font-semibold text-sm flex items-center gap-1"
                >
                  <AlertTriangle size={16} /> נזק בשימוש — לתשלום
                </button>
                <button
                  onClick={() => setConfirmAction('approve')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm flex items-center gap-1"
                >
                  <Check size={16} /> כשל טכני — שחרר לעבודה
                </button>
              </>
            ) : (
              <>
                {repair.warranty_type === WARRANTY_TYPES.PAID && (
                  <>
                    <button
                      onClick={() => setConfirmAction('refused')}
                      className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-semibold text-sm flex items-center gap-1"
                    >
                      <X size={16} /> לקוח מסרב
                    </button>
                    <button
                      onClick={() => setConfirmAction('bought_new')}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-sm flex items-center gap-1"
                    >
                      <ShoppingCart size={16} /> קנה חדש
                    </button>
                  </>
                )}
                <button
                  onClick={() => setConfirmAction('approve')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm flex items-center gap-1"
                >
                  <Check size={16} /> הלקוח אישר
                </button>
              </>
            )}
          </div>
        }
      >
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <InfoCard title="מכשיר" icon={Wrench}>
              <p className="font-semibold">{device?.type || `${device?.brand} ${device?.model}`}</p>
              <p className="text-xs text-slate-500">{device?.brand} {device?.model}</p>
            </InfoCard>
            <InfoCard title="תלונה" icon={FileText}>
              <p className="text-sm">{repair.complaint}</p>
            </InfoCard>
            <InfoCard title="אבחון הטכנאי">
              <p className="text-sm">{repair.diagnosis}</p>
            </InfoCard>
            <p className="text-xs text-slate-500">אובחן ב-{formatDateTime(repair.diagnosed_at)}</p>
            <p className={`text-xs font-bold ${isWarrantyFree ? 'text-green-600' : 'text-slate-600'}`}>
              {WARRANTY_LABELS[repair.warranty_type]}
            </p>
          </div>
          <div>
            <PriceBreakdown breakdown={breakdown} />
            {isWarrantyFree && (
              <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2 text-xs text-green-800">
                ✓ הלקוח לא משלם — תיקון באחריות מלאה
              </div>
            )}
            {repair.warranty_type === WARRANTY_TYPES.PAID && (
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-800">
                🔍 דמי בדיקה: {formatMoney(diagnosticFee)} — יזוכו אם הלקוח יאשר תיקון
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmAction}
        title={
          confirmAction === 'approve' ? 'אישור הצעה' :
          confirmAction === 'refused' ? 'לקוח מסרב' :
          confirmAction === 'misuse' ? 'המרה לתשלום — נזק בשימוש' :
          'לקוח קנה חדש'
        }
        message={
          confirmAction === 'approve'
            ? (isWarrantyFree
                ? 'כשל טכני אושר — הקריאה תועבר למעבדה לביצוע ללא חיוב ללקוח.'
                : 'האם הלקוח אישר את ההצעה? הקריאה תועבר למעבדה לביצוע. דמי הבדיקה יזוכו מהחשבון.')
            : confirmAction === 'refused'
            ? `הלקוח מסרב לתיקון. הקריאה תועבר לגביה של ${formatMoney(diagnosticFee)} דמי בדיקה.`
            : confirmAction === 'misuse'
            ? `נמצא נזק/שימוש חורג — התיקון יומר למסלול תשלום מלא. כל הנתונים (חלקים, אבחון, הערות) נשמרים. דמי בדיקה ${formatMoney(diagnosticFee)} ייזוכו מהחשבון הסופי.`
            : 'הלקוח קנה מכשיר חדש. הקריאה תיסגר ללא חיוב — דמי הבדיקה מזוכים.'
        }
        confirmLabel={
          confirmAction === 'approve' ? 'כן, אושר' :
          confirmAction === 'refused' ? 'העבר לגביה' :
          confirmAction === 'misuse' ? 'המר לתשלום' :
          'סגור קריאה'
        }
        variant={confirmAction === 'refused' || confirmAction === 'misuse' ? 'danger' : 'default'}
        onConfirm={() => {
          if (confirmAction === 'approve') handleApprove();
          else if (confirmAction === 'refused') handleCustomerRefused();
          else if (confirmAction === 'misuse') handleMisuseConversion();
          else handleBoughtNew();
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
}
