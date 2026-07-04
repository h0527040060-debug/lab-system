import { WifiOff } from 'lucide-react';

// באנר חיווי כשאין חיבור לשרת — הנתונים נשמרים מקומית ויסונכרנו כשהחיבור יחזור
export default function OfflineBanner() {
  return (
    <div className="fixed top-0 inset-x-0 z-[60] bg-amber-500 text-white text-center text-sm font-semibold px-4 py-1.5 flex items-center justify-center gap-2 shadow-md">
      <WifiOff size={15} className="shrink-0" />
      <span>אין חיבור לשרת — השינויים נשמרים במכשיר ויסונכרנו אוטומטית כשהחיבור יחזור</span>
    </div>
  );
}
