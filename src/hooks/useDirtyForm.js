import { useRef } from 'react';

// useDirtyForm — משווה את הערך הנוכחי (אובייקט טופס) לתמונת המצב ההתחלתית שנלכדה
// ברינדור הראשון. מחזיר true אם משהו השתנה מאז שהמודל נפתח.
// הערה: לא לכלול ב-value שדות UI זמניים (טאב פעיל, חיפוש וכו') — רק נתונים אמיתיים של הטופס.
export function useDirtyForm(value) {
  const initialRef = useRef(JSON.stringify(value));
  return JSON.stringify(value) !== initialRef.current;
}
