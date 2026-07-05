// ============================================================
// Outbox עמיד — תור כתיבות ל-Supabase ששורד רענון/אופליין
// כל שינוי נרשם כאן מיד (סינכרוני) וב-localStorage, ומוסר רק לאחר
// שהענן אישר את הכתיבה. כך שום שינוי לא אובד גם אם הכתיבה נכשלה/נקטעה.
// ============================================================

const QUEUE_KEY = 'horovitz_sync_queue';
let seq = 0;

const read = () => {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '{}'); } catch { return {}; }
};

const write = (q) => {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }
  catch { /* מכסה מלאה — הנתון עדיין ב-localStorage הראשי, נתעלם בשקט */ }
};

// הוספת/עדכון פריט בתור. מחזיר מזהה ייחודי (ts) לצורך dequeue בטוח.
export const enqueueSync = (dbKey, data, op = 'upsert') => {
  const q = read();
  const ts = `${++seq}_${Date.now()}`;
  q[dbKey] = { op, data, ts };
  write(q);
  return ts;
};

// הסרה מהתור — רק אם הפריט לא "עודכן מחדש" בינתיים (ts תואם).
export const dequeueSync = (dbKey, ts) => {
  const q = read();
  if (q[dbKey] && q[dbKey].ts === ts) {
    delete q[dbKey];
    write(q);
  }
};

export const getSyncQueue = () => read();
export const hasPendingSync = (dbKey) => Object.prototype.hasOwnProperty.call(read(), dbKey);
export const syncQueueSize = () => Object.keys(read()).length;
