import { useState, useEffect } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';

// דחייה זמנית לסשן הנוכחי בלבד — בכניסה הבאה ההצעה תחזור כל עוד האפליקציה לא מותקנת
const SNOOZE_KEY = 'horovitz_pwa_install_snoozed';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [iosGuide, setIosGuide] = useState(false);

  useEffect(() => {
    // כבר מותקן כ-PWA — לא להציע
    if (isStandalone()) return;
    // נדחה כבר בסשן הזה — לא לנדנד שוב עד הכניסה הבאה
    if (sessionStorage.getItem(SNOOZE_KEY)) return;

    // iOS/Safari לא תומך ב-beforeinstallprompt — מציגים הוראות ידניות
    if (isIOS()) {
      setIosGuide(true);
      setVisible(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const onInstalled = () => setVisible(false);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  // דחייה — מוסתר עד הכניסה הבאה (סשן חדש)
  const handleDismiss = () => {
    sessionStorage.setItem(SNOOZE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  // הוראות התקנה ל-iPhone / iPad
  if (iosGuide) {
    return (
      <div className="fixed bottom-4 right-4 left-4 z-50 flex justify-center">
        <div className="bg-blue-800 text-white rounded-2xl shadow-2xl p-4 max-w-sm w-full">
          <div className="flex items-start gap-3">
            <div className="bg-blue-600 rounded-xl p-2 shrink-0">
              <Download size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight">התקן את האפליקציה על המסך הראשי</p>
              <p className="text-blue-100 text-xs mt-1 leading-relaxed">
                הקש על כפתור השיתוף <Share size={13} className="inline mx-0.5" /> בתחתית הדפדפן,
                ואז בחר <span className="font-semibold">"הוסף למסך הבית" <Plus size={12} className="inline" /></span>.
              </p>
            </div>
            <button onClick={handleDismiss} className="text-blue-300 shrink-0" aria-label="סגור">
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 z-50 flex justify-center">
      <div className="bg-blue-800 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 max-w-sm w-full">
        <div className="bg-blue-600 rounded-xl p-2 shrink-0">
          <Download size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight">התקן את האפליקציה</p>
          <p className="text-blue-200 text-xs mt-0.5">גישה מהירה ישירות מהמסך הראשי</p>
        </div>
        <button
          onClick={handleInstall}
          className="bg-white text-blue-800 font-bold text-sm px-3 py-1.5 rounded-lg shrink-0"
        >
          התקן
        </button>
        <button onClick={handleDismiss} className="text-blue-300 shrink-0" aria-label="סגור">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
