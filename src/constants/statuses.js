// סטטוסים של תיקון - לפי האפיון המחייב
export const REPAIR_STATUSES = {
  RED_INTAKE: 'red_intake',
  YELLOW_DIAGNOSIS: 'yellow_diagnosis',
  YELLOW_APPEAL: 'yellow_appeal',
  YELLOW_WAITING_APPROVAL: 'yellow_waiting_approval',
  YELLOW_READY_TO_WORK: 'yellow_ready_to_work',
  IN_WORK: 'in_work',
  PENDING_RELEASE_DOCS: 'pending_release_docs',
  PENDING_PAYMENT: 'pending_payment',
  PAID_WAITING_PICKUP: 'paid_waiting_pickup',
  GREEN_COMPLETE: 'green_complete',
  RED_CANCELLED: 'red_cancelled',
  CUSTOMER_REFUSED: 'customer_refused',
  BOUGHT_NEW: 'bought_new',
};

export const STATUS_LABELS = {
  [REPAIR_STATUSES.RED_INTAKE]: 'קליטה',
  [REPAIR_STATUSES.YELLOW_DIAGNOSIS]: 'באבחון',
  [REPAIR_STATUSES.YELLOW_APPEAL]: 'ערעור אחריות',
  [REPAIR_STATUSES.YELLOW_WAITING_APPROVAL]: 'ממתין אישור לקוח',
  [REPAIR_STATUSES.YELLOW_READY_TO_WORK]: 'מוכן לעבודה',
  [REPAIR_STATUSES.IN_WORK]: 'בעבודה',
  [REPAIR_STATUSES.PENDING_RELEASE_DOCS]: 'ממתין תיעוד תקינות',
  [REPAIR_STATUSES.PENDING_PAYMENT]: 'ממתין תשלום',
  [REPAIR_STATUSES.PAID_WAITING_PICKUP]: 'שולם ממתין לאיסוף/משלוח',
  [REPAIR_STATUSES.GREEN_COMPLETE]: 'נאסף / הושלם',
  [REPAIR_STATUSES.RED_CANCELLED]: 'בוטל',
  [REPAIR_STATUSES.CUSTOMER_REFUSED]: 'לקוח מסרב',
  [REPAIR_STATUSES.BOUGHT_NEW]: 'קנה חדש',
};

// מעברי סטטוס מותרים — מניעת דילוג על שלבים קריטיים
export const ALLOWED_TRANSITIONS = {
  [REPAIR_STATUSES.RED_INTAKE]:              [REPAIR_STATUSES.YELLOW_DIAGNOSIS, REPAIR_STATUSES.RED_CANCELLED],
  [REPAIR_STATUSES.YELLOW_DIAGNOSIS]:        [REPAIR_STATUSES.RED_INTAKE, REPAIR_STATUSES.YELLOW_APPEAL, REPAIR_STATUSES.YELLOW_WAITING_APPROVAL, REPAIR_STATUSES.RED_CANCELLED],
  [REPAIR_STATUSES.YELLOW_APPEAL]:           [REPAIR_STATUSES.YELLOW_DIAGNOSIS, REPAIR_STATUSES.YELLOW_WAITING_APPROVAL, REPAIR_STATUSES.RED_CANCELLED],
  [REPAIR_STATUSES.YELLOW_WAITING_APPROVAL]: [REPAIR_STATUSES.YELLOW_READY_TO_WORK, REPAIR_STATUSES.CUSTOMER_REFUSED, REPAIR_STATUSES.BOUGHT_NEW, REPAIR_STATUSES.RED_CANCELLED],
  [REPAIR_STATUSES.YELLOW_READY_TO_WORK]:    [REPAIR_STATUSES.IN_WORK, REPAIR_STATUSES.YELLOW_DIAGNOSIS, REPAIR_STATUSES.RED_CANCELLED],
  [REPAIR_STATUSES.IN_WORK]:                 [REPAIR_STATUSES.YELLOW_READY_TO_WORK, REPAIR_STATUSES.PENDING_RELEASE_DOCS, REPAIR_STATUSES.RED_CANCELLED],
  [REPAIR_STATUSES.PENDING_RELEASE_DOCS]:    [REPAIR_STATUSES.IN_WORK, REPAIR_STATUSES.PENDING_PAYMENT, REPAIR_STATUSES.RED_CANCELLED],
  [REPAIR_STATUSES.PENDING_PAYMENT]:         [REPAIR_STATUSES.PENDING_RELEASE_DOCS, REPAIR_STATUSES.PAID_WAITING_PICKUP],
  [REPAIR_STATUSES.PAID_WAITING_PICKUP]:     [REPAIR_STATUSES.PENDING_PAYMENT, REPAIR_STATUSES.GREEN_COMPLETE],
  [REPAIR_STATUSES.GREEN_COMPLETE]:          [],
  [REPAIR_STATUSES.RED_CANCELLED]:           [],
  [REPAIR_STATUSES.CUSTOMER_REFUSED]:        [],
  [REPAIR_STATUSES.BOUGHT_NEW]:              [],
};

export const TRANSITION_REQUIREMENTS = {
  [REPAIR_STATUSES.YELLOW_APPEAL]:           [{ field: 'diagnosis', label: 'אבחון ראשוני' }],
  [REPAIR_STATUSES.YELLOW_WAITING_APPROVAL]: [{ field: 'diagnosis', label: 'אבחון ראשוני' }, { field: 'final_price', label: 'תמחור' }],
  [REPAIR_STATUSES.YELLOW_READY_TO_WORK]:    [{ field: 'diagnosis', label: 'אבחון ראשוני' }, { field: 'final_price', label: 'תמחור' }],
  [REPAIR_STATUSES.IN_WORK]:                 [{ field: 'diagnosis', label: 'אבחון ראשוני' }, { field: 'final_price', label: 'תמחור' }],
  [REPAIR_STATUSES.PENDING_RELEASE_DOCS]:    [{ field: 'diagnosis', label: 'אבחון ראשוני' }],
};

export const TERMINAL_STATUSES = new Set([
  REPAIR_STATUSES.GREEN_COMPLETE,
  REPAIR_STATUSES.RED_CANCELLED,
  REPAIR_STATUSES.CUSTOMER_REFUSED,
  REPAIR_STATUSES.BOUGHT_NEW,
]);

export const STATUS_COLORS = {
  [REPAIR_STATUSES.RED_INTAKE]: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', emoji: '🔴' },
  [REPAIR_STATUSES.YELLOW_DIAGNOSIS]: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', emoji: '🟡' },
  [REPAIR_STATUSES.YELLOW_APPEAL]: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', emoji: '⚠️' },
  [REPAIR_STATUSES.YELLOW_WAITING_APPROVAL]: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', emoji: '🟡' },
  [REPAIR_STATUSES.YELLOW_READY_TO_WORK]: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', emoji: '🟢' },
  [REPAIR_STATUSES.IN_WORK]: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', emoji: '⚙️' },
  [REPAIR_STATUSES.PENDING_RELEASE_DOCS]: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', emoji: '📸' },
  [REPAIR_STATUSES.PENDING_PAYMENT]: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', emoji: '💰' },
  [REPAIR_STATUSES.PAID_WAITING_PICKUP]: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', emoji: '📦' },
  [REPAIR_STATUSES.GREEN_COMPLETE]: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', emoji: '✅' },
  [REPAIR_STATUSES.RED_CANCELLED]: { bg: 'bg-slate-200', text: 'text-slate-700', border: 'border-slate-400', emoji: '❌' },
  [REPAIR_STATUSES.CUSTOMER_REFUSED]: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', emoji: '🚫' },
  [REPAIR_STATUSES.BOUGHT_NEW]: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', emoji: '🛒' },
};
