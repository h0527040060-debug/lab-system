// updateController — שולט מתי בדיוק להחיל עדכון גרסה חדש של האפליקציה.
// registerType: 'prompt' ב-vite.config.js אומר שה-Service Worker החדש נכנס למצב
// "waiting" ולא משתלט אוטומטית. אנחנו מפעילים אותו (updateSW(true) — skipWaiting + reload)
// רק כשבטוח: אין כרגע חלון עריכה פתוח עם שינויים לא-שמורים (ראה dirtyTracker.js).
// אין UI "יש עדכון, לחץ לרענון" — הכל שקט, בדיוק לפי הדרישה שהמשתמש לא ייקטע.
import { registerSW } from 'virtual:pwa-register';
import { isDirty, onClean } from './dirtyTracker';

// רשת ביטחון — לא נשארים תקועים לנצח על גרסה ישנה אם טופס נשאר פתוח לאורך זמן.
const SAFETY_MS = 15 * 60 * 1000;

// אירועי window פנימיים — לצפייה/בדיקה (dev tools, אימות ידני). לא נצרכים על ידי שום קוד ייצור.
const notify = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));

export function initPwaUpdate() {
  const updateSW = registerSW({
    onNeedRefresh() {
      notify('pwa:need-refresh');
      scheduleUpdate(updateSW);
    },
    onRegisterError(error) {
      console.error('PWA: כשל ברישום Service Worker', error);
    },
  });
}

function scheduleUpdate(updateSW) {
  if (!isDirty()) {
    notify('pwa:update-applying', { reason: 'clean-immediately' });
    updateSW(true);
    return;
  }

  notify('pwa:update-deferred');
  let applied = false;
  const apply = (reason) => {
    if (applied) return;
    applied = true;
    notify('pwa:update-applying', { reason });
    updateSW(true);
  };

  const unsubscribe = onClean(() => apply('became-clean'));
  setTimeout(() => {
    unsubscribe();
    apply('safety-timeout');
  }, SAFETY_MS);
}
