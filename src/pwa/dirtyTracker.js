// מעקב גלובלי: כמה חלונות עריכה פתוחים כרגע עם שינויים לא-שמורים.
// לא Context — singleton פשוט שכל מודל נרשם/משתחרר ממנו דרך useUnsavedGuard,
// וש-updateController קורא כדי להחליט אם בטוח להחיל עדכון גרסה עכשיו.

let counter = 0;
const listeners = new Set();

// נקרא כשמודל הופך "מלוכלך" (יש בו שינוי לא-שמור). מחזיר פונקציית שחרור.
export const acquire = () => {
  counter++;
  let released = false;
  return () => {
    if (released) return; // הגנה מפני שחרור כפול
    released = true;
    release();
  };
};

const release = () => {
  counter = Math.max(0, counter - 1);
  if (counter === 0) listeners.forEach(cb => cb());
};

export const isDirty = () => counter > 0;

// נרשם לאירוע "כל המודלים נהיו נקיים". מחזיר פונקציית ביטול הרשמה.
export const onClean = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
