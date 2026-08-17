// פורמט תאריך: DD/MM/YYYY HH:MM
export const formatDateTime = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// פורמט תאריך בלבד (ללא שעה)
export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// ערך ל-<input type="date"> — YYYY-MM-DD לפי השעון המקומי ולא UTC,
// אחרת בשעות הלילה בישראל היה מתקבל תאריך של יום קודם.
export const toDateInputValue = (dateInput = new Date()) => {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

// פורמט כסף: "1500₪"
export const formatMoney = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0₪';
  return `${Math.round(amount).toLocaleString('he-IL')}₪`;
};

// פורמט כסף עם 2 ספרות אחרי הנקודה
export const formatMoneyPrecise = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0.00₪';
  return `${amount.toFixed(2)}₪`;
};

// פורמט אחוזים
export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
};

// פורמט שעות (לסטופר): "2.5 שעות"
export const formatHours = (hours) => {
  if (!hours || isNaN(hours)) return '0 שעות';
  return `${hours.toFixed(1)} שעות`;
};

// פורמט שעות:דקות
export const formatHoursMinutes = (totalHours) => {
  if (!totalHours || isNaN(totalHours)) return '0:00';
  const h = Math.floor(totalHours);
  const m = Math.round((totalHours - h) * 60);
  return `${h}:${String(m).padStart(2, '0')}`;
};
