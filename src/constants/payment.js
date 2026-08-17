// אמצעי תשלום — משותף למסך הגביה המלא ולמסלול התיקון המהיר
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CREDIT: 'credit',
  TRANSFER: 'transfer',
  CHECK: 'check',
  WAIVED: 'waived',
};

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: 'מזומן',
  [PAYMENT_METHODS.CREDIT]: 'אשראי',
  [PAYMENT_METHODS.TRANSFER]: 'העברה בנקאית',
  [PAYMENT_METHODS.CHECK]: 'צ׳ק',
  [PAYMENT_METHODS.WAIVED]: 'ללא חיוב',
};

export const PAYMENT_METHOD_EMOJI = {
  [PAYMENT_METHODS.CASH]: '💵',
  [PAYMENT_METHODS.CREDIT]: '💳',
  [PAYMENT_METHODS.TRANSFER]: '🏦',
  [PAYMENT_METHODS.CHECK]: '🧾',
  [PAYMENT_METHODS.WAIVED]: '🎁',
};

// אמצעי התשלום שניתן לבחור בפועל (WAIVED נקבע אוטומטית, לא נבחר ידנית)
export const SELECTABLE_PAYMENT_METHODS = [
  PAYMENT_METHODS.CASH,
  PAYMENT_METHODS.CREDIT,
  PAYMENT_METHODS.TRANSFER,
  PAYMENT_METHODS.CHECK,
];
