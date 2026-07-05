import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useAppContext } from '../store/AppContext';

// חיווי מצב הסנכרון בהדר — מראה בוודאות אם הכל נשמר בענן או שיש שינויים ממתינים
export default function SyncIndicator() {
  const { isOffline, pendingSyncCount } = useAppContext();

  // מנותק — הנתונים נשמרים במכשיר וימתינו לסנכרון
  if (isOffline) {
    return (
      <div
        title="אין חיבור לשרת — השינויים נשמרים במכשיר ויסונכרנו כשהחיבור יחזור"
        className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1"
      >
        <CloudOff size={14} className="shrink-0" />
        <span className="hidden sm:inline">
          {pendingSyncCount > 0 ? `${pendingSyncCount} ממתינים` : 'אין חיבור'}
        </span>
      </div>
    );
  }

  // יש שינויים שממתינים לסנכרון
  if (pendingSyncCount > 0) {
    return (
      <div
        title={`${pendingSyncCount} שינויים ממתינים לסנכרון לענן`}
        className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2.5 py-1"
      >
        <RefreshCw size={14} className="shrink-0 animate-spin" style={{ animationDuration: '1.5s' }} />
        <span className="hidden sm:inline">{pendingSyncCount} ממתינים</span>
      </div>
    );
  }

  // הכל מסונכרן
  return (
    <div
      title="כל הנתונים מסונכרנים בענן"
      className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1"
    >
      <Cloud size={14} className="shrink-0" />
      <span className="hidden sm:inline">מסונכרן</span>
    </div>
  );
}
