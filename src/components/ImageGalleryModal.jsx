import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageGalleryModal({ images = [], startIndex = 0, altText = '', onClose }) {
  const realImages = images.filter(img => img && (img.startsWith('data:image/') || img.startsWith('http')));
  const clampedStart = Math.min(startIndex, realImages.length - 1);
  const [current, setCurrent] = useState(clampedStart >= 0 ? clampedStart : 0);

  if (realImages.length === 0) return null;

  const prev = (e) => { e?.stopPropagation?.(); setCurrent(i => (i - 1 + realImages.length) % realImages.length); };
  const next = (e) => { e?.stopPropagation?.(); setCurrent(i => (i + 1) % realImages.length); };

  const handleKey = (e) => {
    if (e.key === 'ArrowLeft') next(e);
    if (e.key === 'ArrowRight') prev(e);
    if (e.key === 'Escape') onClose();
  };

  const stop = (e) => e.stopPropagation();

  // lightbox מסך-מלא — לחיצה בכל מקום פנוי סוגרת, X קבוע למעלה תמיד נגיש
  // מרונדר דרך Portal ל-body כדי לברוח מאבות עם transform (שמשבשים position:fixed)
  return createPortal(
    <div
      className="fixed inset-0 bg-black/90 z-[110] flex flex-col animate-fade-in"
      onClick={onClose}
      onKeyDown={handleKey}
      tabIndex={-1}
    >
      {/* סרגל עליון — כותרת + מונה + כפתור סגירה */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 text-white" onClick={stop}>
        <span className="text-sm font-semibold truncate">{altText}</span>
        <div className="flex items-center gap-3">
          {realImages.length > 1 && (
            <span className="text-xs text-white/70">{current + 1} / {realImages.length}</span>
          )}
          <button
            onClick={onClose}
            aria-label="סגור"
            className="p-2 rounded-full bg-white/10 hover:bg-white/25 transition-colors"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* אזור התמונה — ממורכז, תמיד נכנס למסך */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-3 relative">
        <img
          src={realImages[current]}
          alt={`${altText} ${current + 1}`}
          onClick={stop}
          className="max-w-full max-h-full object-contain select-none"
        />

        {realImages.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="הקודם"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/15 hover:bg-white/30 text-white rounded-full p-2.5 transition-colors"
            >
              <ChevronRight size={24} />
            </button>
            <button
              onClick={next}
              aria-label="הבא"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/15 hover:bg-white/30 text-white rounded-full p-2.5 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
          </>
        )}
      </div>

      {/* תמונות ממוזערות */}
      {realImages.length > 1 && (
        <div className="flex gap-2 px-4 py-3 justify-center overflow-x-auto shrink-0" onClick={stop}>
          {realImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`w-12 h-12 rounded border-2 overflow-hidden flex-shrink-0 transition-colors ${
                idx === current ? 'border-orange-500' : 'border-white/30 hover:border-white/60'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-contain bg-black/40" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
