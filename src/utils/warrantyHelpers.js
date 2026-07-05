// כלים לניהול מעבר בין מסלולי אחריות
import { REPAIR_STATUSES } from '../constants/statuses';
import { WARRANTY_TYPES } from '../constants/warranty';

// המרת "אחריות מלאה" → "תשלום" (נזק בשימוש).
// שומר את כל נתוני התוכן — רק מחליף סוג אחריות ומעורר את מסלול הגביה.
// אם המכשיר כבר שוחרר בחינם (ממתין משלוח) — מחזירים ל"ממתין תשלום".
export const buildMisuseConversionPayload = (repair, diagnosticFee) => {
  const alreadyReleasedFree = repair.status === REPAIR_STATUSES.PAID_WAITING_PICKUP;
  return {
    id: repair.id,
    warranty_type: WARRANTY_TYPES.PAID,
    warranty_verdict: 'misuse',
    diagnostic_fee: diagnosticFee,
    diagnostic_fee_credited: true,
    misuse_converted_at: new Date().toISOString(),
    // מחזיר ל"ממתין תשלום" רק אם כבר הועבר ל"ממתין משלוח"
    ...(alreadyReleasedFree && { status: REPAIR_STATUSES.PENDING_PAYMENT }),
  };
};
