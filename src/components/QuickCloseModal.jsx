import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { REPAIR_STATUSES } from '../constants/statuses';
import { formatMoney, toDateInputValue } from '../utils/formatters';
import {
  TIMELINE_ACTIONS, buildTimelineEntry, appendTimeline,
  DEFAULT_QUICK_WARRANTY_MONTHS,
} from '../constants/quickRepair';
import {
  SELECTABLE_PAYMENT_METHODS, PAYMENT_METHOD_LABELS, PAYMENT_METHOD_EMOJI, PAYMENT_METHODS,
} from '../constants/payment';
import Modal from './Modal';
import { useDirtyForm } from '../hooks/useDirtyForm';
import { useUnsavedGuard } from '../hooks/useUnsavedGuard';
import { Check, Wrench, Package, Banknote, ShieldCheck } from 'lucide-react';

const WARRANTY_PRESETS = [3, 6, 12];

// QuickCloseModal — סגירת תיקון מהיר, או רישום תשלום לתיקון שכבר נסגר.
// mode='close'   → תקלה אמיתית, מה בוצע, חלקים, מחיר, אחריות + תשלום אופציונלי
// mode='payment' → רק אמצעי תשלום ותאריך, לתיקון שנסגר וטרם שולם
export default function QuickCloseModal({ repair, mode = 'close', onClose }) {
  const { state, dispatch } = useAppContext();
  const isPaymentOnly = mode === 'payment';

  const [actualFault, setActualFault] = useState(repair.actual_fault || '');
  const [workSummary, setWorkSummary] = useState(repair.work_summary || '');
  const [partsNote, setPartsNote] = useState(repair.parts_note || '');
  const [price, setPrice] = useState(repair.final_price != null ? String(repair.final_price) : '');
  const [warrantyMonths, setWarrantyMonths] = useState(
    repair.warranty_months ?? DEFAULT_QUICK_WARRANTY_MONTHS
  );
  const [isPaid, setIsPaid] = useState(isPaymentOnly);
  const [paymentMethod, setPaymentMethod] = useState(repair.payment_method || PAYMENT_METHODS.CASH);
  const [paymentDate, setPaymentDate] = useState(repair.payment_date || toDateInputValue());

  const isDirty = useDirtyForm({ actualFault, workSummary, partsNote, price, warrantyMonths, isPaid, paymentMethod, paymentDate });
  const { requestClose, confirmDialog } = useUnsavedGuard(isDirty, onClose);

  const numericPrice = Number(price);
  const priceValid = price !== '' && !isNaN(numericPrice) && numericPrice >= 0;

  // מע"מ לתצוגה בלבד — הסכום הנשמר הוא תמיד ללא מע"מ
  const vatPercent = state.settings.vat_percent_display || 17;
  const displayPrice = isPaymentOnly ? (repair.final_price || 0) : (priceValid ? numericPrice : 0);
  const vatAmount = displayPrice * (vatPercent / 100);

  const canSave = isPaymentOnly
    ? !!paymentMethod && !!paymentDate
    : !!actualFault.trim() && !!workSummary.trim() && priceValid && (!isPaid || (!!paymentMethod && !!paymentDate));

  const handleSave = () => {
    if (!canSave) return;
    const now = new Date().toISOString();
    const user = state.currentUser;

    if (isPaymentOnly) {
      dispatch({
        type: 'UPDATE_REPAIR',
        payload: {
          id: repair.id,
          status: REPAIR_STATUSES.GREEN_COMPLETE,
          payment_method: paymentMethod,
          payment_date: paymentDate,
          payment_at: now,
          timeline: appendTimeline(repair, TIMELINE_ACTIONS.PAYMENT, user, PAYMENT_METHOD_LABELS[paymentMethod]),
        },
      });
      onClose();
      return;
    }

    let timeline = appendTimeline(repair, TIMELINE_ACTIONS.CLOSED, user, formatMoney(numericPrice));
    if (isPaid) {
      timeline = [...timeline, buildTimelineEntry(TIMELINE_ACTIONS.PAYMENT, user, repair, PAYMENT_METHOD_LABELS[paymentMethod])];
    }

    dispatch({
      type: 'UPDATE_REPAIR',
      payload: {
        id: repair.id,
        actual_fault: actualFault.trim(),
        work_summary: workSummary.trim(),
        parts_note: partsNote.trim(),
        final_price: numericPrice,
        warranty_months: Number(warrantyMonths) || null,
        closed_at: now,
        closed_by_user_id: user?.id || '',
        closed_by_name: user?.name || 'מערכת',
        status: isPaid ? REPAIR_STATUSES.GREEN_COMPLETE : REPAIR_STATUSES.PENDING_PAYMENT,
        timeline,
        ...(isPaid && {
          payment_method: paymentMethod,
          payment_date: paymentDate,
          payment_at: now,
        }),
      },
    });
    onClose();
  };

  const paymentSection = (
    <div className="space-y-2.5">
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5">אמצעי תשלום</label>
        <div className="grid grid-cols-4 gap-1.5">
          {SELECTABLE_PAYMENT_METHODS.map(method => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={`px-2 py-1.5 rounded-lg border-2 text-xs font-semibold transition-colors ${
                paymentMethod === method
                  ? 'border-orange-500 bg-orange-50 text-orange-900'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {PAYMENT_METHOD_EMOJI[method]} {PAYMENT_METHOD_LABELS[method]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5">תאריך התשלום</label>
        <input
          type="date"
          value={paymentDate}
          onChange={e => setPaymentDate(e.target.value)}
          className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-orange-400"
        />
        <p className="text-xs text-slate-400 mt-1">התאריך שבו הכסף התקבל בפועל — ניתן להזין תאריך אחורה.</p>
      </div>
    </div>
  );

  return (
    <>
      <Modal
        open
        onClose={requestClose}
        sheet
        title={isPaymentOnly ? 'רישום תשלום' : 'סגירת תיקון מהיר'}
        subtitle={repair.id}
        maxWidth="max-w-xl"
        footer={
          <div className="flex justify-between items-center gap-2">
            <button onClick={requestClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm">
              ביטול
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-1.5"
            >
              <Check size={16} />
              {isPaymentOnly ? 'רשום תשלום' : isPaid ? 'סגור ושולם' : 'סגור — ממתין תשלום'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {!isPaymentOnly && (
            <>
              {repair.complaint && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <p className="text-xs font-bold text-slate-500 mb-0.5">תלונת הלקוח בפתיחה</p>
                  <p className="text-sm text-slate-700">{repair.complaint}</p>
                </div>
              )}

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1">
                  <Wrench size={13} /> מה הייתה הבעיה באמת *
                </label>
                <textarea
                  value={actualFault}
                  onChange={e => setActualFault(e.target.value)}
                  rows={2}
                  placeholder="התקלה בפועל, כפי שהתגלתה"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm resize-y focus:outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1">
                  <Check size={13} /> מה בוצע *
                </label>
                <textarea
                  value={workSummary}
                  onChange={e => setWorkSummary(e.target.value)}
                  rows={2}
                  placeholder="הטיפול שבוצע בפועל"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm resize-y focus:outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1">
                  <Package size={13} /> פירוט חלקים
                </label>
                <textarea
                  value={partsNote}
                  onChange={e => setPartsNote(e.target.value)}
                  rows={2}
                  placeholder="אילו חלקים הוחלפו — טקסט חופשי"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm resize-y focus:outline-none focus:border-orange-400"
                />
                <p className="text-xs text-slate-400 mt-1">
                  נשמר בהיסטוריית המכשיר ויוצג אם יגיע תיקון חוזר בתוך תקופת האחריות.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1">
                    <Banknote size={13} /> מחיר (ללא מע"מ) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="0"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-orange-400"
                  />
                  {priceValid && numericPrice > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      + מע"מ {vatPercent}% = <span className="font-semibold">{formatMoney(displayPrice + vatAmount)}</span> כולל מע"מ
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1">
                    <ShieldCheck size={13} /> אחריות על התיקון
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {WARRANTY_PRESETS.map(months => (
                      <button
                        key={months}
                        type="button"
                        onClick={() => setWarrantyMonths(months)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                          Number(warrantyMonths) === months
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'border-slate-300 text-slate-600 hover:border-orange-400'
                        }`}
                      >
                        {months} חודשים
                      </button>
                    ))}
                    <input
                      type="number"
                      min="0"
                      value={WARRANTY_PRESETS.includes(Number(warrantyMonths)) ? '' : warrantyMonths}
                      onChange={e => setWarrantyMonths(e.target.value)}
                      placeholder="אחר"
                      className="w-16 border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-orange-400"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 mb-2.5">
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={e => setIsPaid(e.target.checked)}
                    className="w-4 h-4 accent-green-600"
                  />
                  שולם
                </label>
                {isPaid && paymentSection}
              </div>
            </>
          )}

          {isPaymentOnly && (
            <>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">סכום לגביה (ללא מע"מ):</span>
                  <span className="font-bold text-slate-900">{formatMoney(displayPrice)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>מע"מ {vatPercent}%:</span>
                  <span>{formatMoney(vatAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 mt-1 pt-1 border-t border-slate-300">
                  <span>לתשלום:</span>
                  <span>{formatMoney(displayPrice + vatAmount)}</span>
                </div>
              </div>
              {paymentSection}
            </>
          )}
        </div>
      </Modal>
      {confirmDialog}
    </>
  );
}
