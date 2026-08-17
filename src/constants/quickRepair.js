// תיקון מהיר — מסלול מקוצר לצד הקליטה המלאה.
// אין כאן ישות חדשה ואין סטטוסים חדשים: תיקון מהיר הוא repair רגיל עם הדגל is_quick,
// והמסך המהיר חושף תת-קבוצה מסודרת של הסטטוסים הקיימים עם תוויות קצרות.
import { REPAIR_STATUSES } from './statuses';

// חמשת השלבים הבסיסיים של תיקון מהיר, לפי הסדר
export const QUICK_STATUS_FLOW = [
  REPAIR_STATUSES.RED_INTAKE,
  REPAIR_STATUSES.IN_WORK,
  REPAIR_STATUSES.YELLOW_WAITING_APPROVAL,
  REPAIR_STATUSES.PENDING_PAYMENT,
  REPAIR_STATUSES.GREEN_COMPLETE,
];

// תוויות קצרות — במסך המהיר, לא במערכת כולה
export const QUICK_STATUS_LABELS = {
  [REPAIR_STATUSES.RED_INTAKE]: 'נפתח',
  [REPAIR_STATUSES.IN_WORK]: 'בטיפול',
  [REPAIR_STATUSES.YELLOW_WAITING_APPROVAL]: 'ממתין (חלק / לקוח)',
  [REPAIR_STATUSES.PENDING_PAYMENT]: 'הושלם — ממתין תשלום',
  [REPAIR_STATUSES.GREEN_COMPLETE]: 'שולם / סגור',
};

export const QUICK_STATUS_STYLES = {
  [REPAIR_STATUSES.RED_INTAKE]: 'bg-red-500 border-red-500',
  [REPAIR_STATUSES.IN_WORK]: 'bg-blue-500 border-blue-500',
  [REPAIR_STATUSES.YELLOW_WAITING_APPROVAL]: 'bg-yellow-500 border-yellow-500',
  [REPAIR_STATUSES.PENDING_PAYMENT]: 'bg-orange-500 border-orange-500',
  [REPAIR_STATUSES.GREEN_COMPLETE]: 'bg-green-600 border-green-600',
};

// הסטטוסים שנחשבים "סגורים" במסלול המהיר — אחריהם אין עוד עבודה
export const QUICK_CLOSED_STATUSES = [
  REPAIR_STATUSES.PENDING_PAYMENT,
  REPAIR_STATUSES.GREEN_COMPLETE,
];

// ============================================================
// מיקום ביצוע התיקון ("איפה")
// ============================================================
// EXTERNAL — "במעבדת חוץ": המכשיר יוצא מאיתנו לגורם חיצוני (מעבדה חיצונית או בית מלאכה)
// שמבצע את התיקון עבורנו. בניגוד לשני האחרים, המכשיר פיזית לא אצלנו — ולכן נדרש
// מעקב שליחה/חזרה ועלות הגורם החיצוני.
export const SERVICE_LOCATIONS = {
  LAB: 'lab',
  ONSITE: 'onsite',
  EXTERNAL: 'external',
};

export const SERVICE_LOCATION_LABELS = {
  [SERVICE_LOCATIONS.LAB]: 'במעבדה',
  [SERVICE_LOCATIONS.ONSITE]: 'באתר הלקוח',
  [SERVICE_LOCATIONS.EXTERNAL]: 'במעבדת חוץ',
};

// ============================================================
// TIMELINE — מי / מתי / איפה, לכל פעולה משמעותית בתיקון
// ============================================================
export const TIMELINE_ACTIONS = {
  OPENED: 'opened',
  STATUS: 'status',
  SENT_EXTERNAL: 'sent_external',
  RETURNED_EXTERNAL: 'returned_external',
  CLOSED: 'closed',
  PAYMENT: 'payment',
};

export const TIMELINE_ACTION_LABELS = {
  [TIMELINE_ACTIONS.OPENED]: 'נפתח',
  [TIMELINE_ACTIONS.STATUS]: 'שינוי סטטוס',
  [TIMELINE_ACTIONS.SENT_EXTERNAL]: 'נשלח למעבדת חוץ',
  [TIMELINE_ACTIONS.RETURNED_EXTERNAL]: 'חזר ממעבדת חוץ',
  [TIMELINE_ACTIONS.CLOSED]: 'נסגר',
  [TIMELINE_ACTIONS.PAYMENT]: 'נרשם תשלום',
};

// ברירת המחדל לאחריות על תיקון מהיר — 3 חודשים
export const DEFAULT_QUICK_WARRANTY_MONTHS = 3;

// בונה רשומת timeline חתומה. detail — טקסט חופשי אופציונלי (למשל הסטטוס החדש).
export const buildTimelineEntry = (action, currentUser, repair, detail = '') => ({
  at: new Date().toISOString(),
  user_id: currentUser?.id || '',
  user_name: currentUser?.name || 'מערכת',
  action,
  location: repair?.service_location || SERVICE_LOCATIONS.LAB,
  detail,
});

// מוסיף רשומת timeline לתיקון ומחזיר את המערך המעודכן
export const appendTimeline = (repair, action, currentUser, detail = '') => [
  ...(repair.timeline || []),
  buildTimelineEntry(action, currentUser, repair, detail),
];

// מזהה ייחודי קצר לרשומות פנימיות (עדכונים / פעולות) בתוך תיקון
export const generateEntryId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

// ============================================================
// מעבדת חוץ — מצב השהייה אצל הגורם החיצוני
// ============================================================

// המכשיר נמצא כרגע אצל הגורם החיצוני: נשלח וטרם חזר
export const isAtExternalProvider = (repair) =>
  repair?.service_location === SERVICE_LOCATIONS.EXTERNAL &&
  !!repair?.external_sent_at &&
  !repair?.external_returned_at;

// חרג מתאריך החזרה הצפוי (todayDate בפורמט YYYY-MM-DD)
export const isExternalOverdue = (repair, todayDate) =>
  isAtExternalProvider(repair) &&
  !!repair?.external_expected_return &&
  repair.external_expected_return < todayDate;
