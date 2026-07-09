import { useState, useEffect } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import { acquire } from '../pwa/dirtyTracker';

// useUnsavedGuard — עוטף מודל עריכה עם הגנה מפני יציאה בטעות כשיש שינויים לא-שמורים.
// isDirty=false → requestClose סוגר מיד (התנהגות רגילה).
// isDirty=true → requestClose מציג דיאלוג אישור לפני קריאה בפועל ל-onClose.
// מדווח גם ל-dirtyTracker הגלובלי כדי ש-updateController ידע לדחות עדכון SW בזמן שהטופס פתוח.
export function useUnsavedGuard(isDirty, onClose) {
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!isDirty) return;
    const release = acquire();
    return release;
  }, [isDirty]);

  const requestClose = () => {
    if (isDirty) setShowConfirm(true);
    else onClose();
  };

  const confirmDialog = (
    <ConfirmDialog
      open={showConfirm}
      variant="danger"
      title="לצאת בלי לשמור?"
      message="השינויים שביצעת לא יישמרו. להמשיך?"
      confirmLabel="צא בלי לשמור"
      cancelLabel="המשך עריכה"
      onConfirm={() => { setShowConfirm(false); onClose(); }}
      onCancel={() => setShowConfirm(false)}
    />
  );

  return { requestClose, confirmDialog };
}
