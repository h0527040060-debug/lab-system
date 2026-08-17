// כלים לניהול מעבר בין מסלולי אחריות
import { REPAIR_STATUSES, TERMINAL_STATUSES } from '../constants/statuses';
import { WARRANTY_TYPES } from '../constants/warranty';

// סטטוס האחריות שאנחנו נתנו על התיקון — נספרת מ-date_intake לפי warranty_months.
// מחזיר null אם לא הוגדרה אחריות. expiry הוא תאריך הפקיעה לתצוגה.
export const getWarrantyStatus = (repair) => {
  if (!repair?.warranty_months) return null;
  const expiry = new Date(repair.date_intake);
  expiry.setMonth(expiry.getMonth() + repair.warranty_months);
  const daysLeft = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) return { expired: true, expiry };
  if (daysLeft > 30) return { expired: false, months: Math.floor(daysLeft / 30), expiry };
  return { expired: false, days: daysLeft, expiry };
};

// מאתר תיקון קודם של אותו מכשיר שהאחריות עליו עדיין בתוקף — כלומר תיקון חוזר.
// excludeRepairId — התיקון הנוכחי, שלא ייחשב "קודם" לעצמו.
// מחזיר { repair, warranty } של התיקון האחרון שנסגר ועדיין באחריות, או null.
export const findActiveWarrantyRepair = (repairs, deviceId, excludeRepairId = null) => {
  if (!deviceId) return null;
  const candidates = repairs
    .filter(r =>
      r.device_id === deviceId &&
      r.id !== excludeRepairId &&
      TERMINAL_STATUSES.has(r.status)
    )
    .sort((a, b) => new Date(b.date_intake) - new Date(a.date_intake));

  for (const repair of candidates) {
    const warranty = getWarrantyStatus(repair);
    if (warranty && !warranty.expired) return { repair, warranty };
  }
  return null;
};

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
