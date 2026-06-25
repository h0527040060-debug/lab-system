import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const STORAGE_KEY = 'horovitz_pwa_install_dismissed';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

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
        <button onClick={handleDismiss} className="text-blue-300 shrink-0">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
