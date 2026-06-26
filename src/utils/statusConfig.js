import { STATUS_LABELS, STATUS_COLORS } from '../constants/statuses';

export const COLOR_MAP = {
  red:    { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  green:  { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300' },
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300' },
  slate:  { bg: 'bg-slate-200',  text: 'text-slate-700',  border: 'border-slate-400' },
};

export function getStatusDisplay(statusId, statusConfig) {
  const found = statusConfig?.find(s => s.id === statusId);
  if (found) {
    return {
      label: found.label,
      emoji: found.emoji,
      ...(COLOR_MAP[found.color] || COLOR_MAP.slate),
    };
  }
  const colors = STATUS_COLORS[statusId] || { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', emoji: '⚪' };
  return {
    label: STATUS_LABELS[statusId] || statusId,
    emoji: colors.emoji,
    bg: colors.bg,
    text: colors.text,
    border: colors.border,
  };
}

// מחליף placeholders בהודעה עם נתוני תיקון אמיתיים
export function fillMessage(template, { repair, customer, device, settings } = {}) {
  if (!template) return '';
  return template
    .replace(/\[שם\]/g, customer?.name || '')
    .replace(/\[קוד\]/g, repair?.id || '')
    .replace(/\[מכשיר\]/g, device ? `${device.brand || ''} ${device.model || ''}`.trim() : '')
    .replace(/\[סכום\]/g, repair?.final_price != null ? `${repair.final_price}₪` : '')
    .replace(/\[כתובת\]/g, settings?.business_address || '')
    .replace(/\[טלפון_עסק\]/g, settings?.business_phone || '');
}

export const PLACEHOLDER_TAGS = ['[שם]', '[קוד]', '[מכשיר]', '[סכום]', '[כתובת]', '[טלפון_עסק]'];

export const DEFAULT_STATUS_CONFIG = [
  {
    id: 'red_intake', label: 'קליטה', emoji: '🔴', color: 'red', is_system: true,
    customer_message: 'שלום [שם], קריאת השירות שלך נקלטה במעבדה. קוד התיקון: [קוד]. נעדכן אותך בהתקדמות.',
    technician_message: 'קריאה חדשה נקלטה: [קוד] — [מכשיר]. ממתינה לאבחון.',
  },
  {
    id: 'yellow_diagnosis', label: 'באבחון', emoji: '🟡', color: 'yellow', is_system: true,
    customer_message: 'שלום [שם], המכשיר שלך ([מכשיר]) נמצא כעת באבחון. נעדכן אותך עם הצעת מחיר בהקדם. קוד: [קוד]',
    technician_message: 'קריאה [קוד] — [מכשיר] ממתינה לאבחון שלך.',
  },
  {
    id: 'yellow_appeal', label: 'ערעור אחריות', emoji: '⚠️', color: 'orange', is_system: true,
    customer_message: '',
    technician_message: '',
  },
  {
    id: 'yellow_waiting_approval', label: 'ממתין אישור לקוח', emoji: '🟡', color: 'yellow', is_system: true,
    customer_message: 'שלום [שם], הצעת המחיר עבור [מכשיר] מוכנה! עלות: [סכום]. אנא צור קשר לאישור: [טלפון_עסק]',
    technician_message: '',
  },
  {
    id: 'yellow_ready_to_work', label: 'מוכן לעבודה', emoji: '🟢', color: 'green', is_system: true,
    customer_message: '',
    technician_message: 'קריאה [קוד] — [מכשיר] אושרה ועברה לתור שלך לביצוע.',
  },
  {
    id: 'in_work', label: 'בעבודה', emoji: '⚙️', color: 'blue', is_system: true,
    customer_message: 'שלום [שם], הטכנאי שלנו התחיל לעבוד על [מכשיר]. נעדכן אותך בסיום.',
    technician_message: '',
  },
  {
    id: 'pending_release_docs', label: 'ממתין תיעוד תקינות', emoji: '📸', color: 'orange', is_system: true,
    customer_message: '',
    technician_message: 'קריאה [קוד] ממתינה לתיעוד תקינות לפני שחרור.',
  },
  {
    id: 'pending_payment', label: 'ממתין תשלום', emoji: '💰', color: 'orange', is_system: true,
    customer_message: 'שלום [שם], התיקון של [מכשיר] הושלם! המכשיר מוכן לאיסוף. לתשלום ואיסוף: [כתובת] | [טלפון_עסק]',
    technician_message: '',
  },
  {
    id: 'paid_waiting_pickup', label: 'שולם ממתין לאיסוף/משלוח', emoji: '📦', color: 'green', is_system: true,
    customer_message: 'שלום [שם], התשלום עבור [מכשיר] התקבל! המכשיר מוכן לאיסוף. כתובת: [כתובת] | [טלפון_עסק]',
    technician_message: '',
  },
  {
    id: 'green_complete', label: 'הושלם', emoji: '✅', color: 'green', is_system: true,
    customer_message: 'שלום [שם], קיבלנו את התשלום. תודה על הפנייה! נשמח לשרת אותך שוב. — [טלפון_עסק]',
    technician_message: '',
  },
  {
    id: 'red_cancelled', label: 'בוטל', emoji: '❌', color: 'slate', is_system: true,
    customer_message: 'שלום [שם], קריאת השירות [קוד] בוטלה. לפרטים: [טלפון_עסק]',
    technician_message: '',
  },
  {
    id: 'customer_refused', label: 'לקוח מסרב', emoji: '🚫', color: 'red', is_system: true,
    customer_message: 'שלום [שם], קיבלנו את החלטתך. ניתן לאסוף את [מכשיר] מאצלנו. לתיאום: [טלפון_עסק]',
    technician_message: '',
  },
  {
    id: 'bought_new', label: 'קנה חדש', emoji: '🛒', color: 'slate', is_system: true,
    customer_message: 'שלום [שם], קריאת השירות נסגרה. תודה על הפנייה ובהצלחה עם המכשיר החדש!',
    technician_message: '',
  },
];
