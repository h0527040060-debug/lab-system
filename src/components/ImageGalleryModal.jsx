import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageGalleryModal({ images = [], startIndex = 0, altText = '', onClose }) {
  const realImages = images.filter(img => img?.startsWith('data:image/'));
  const clampedStart = Math.min(startIndex, realImages.length - 1);
  const [current, setCurrent] = useState(clampedStart >= 0 ? clampedStart : 0);

  if (realImages.length === 0) return null;

  const prev = () => setCurrent(i => (i - 1 + realImages.length) % realImages.length);
  const next = () => setCurrent(i => (i + 1) % realImages.length);

  const handleKey = (e) => {
    if (e.key === 'ArrowLeft') next();
    if (e.key === 'ArrowRight') prev();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={handleKey}
      tabIndex={-1}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <p className="font-semibold text-slate-800 text-sm">{altText}</p>
          <div className="flex items-center gap-3">
            {realImages.length > 1 && (
              <span className="text-xs text-slate-500">{current + 1} מתוך {realImages.length}</span>
            )}
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="relative bg-slate-50 flex items-center justify-center" style={{ minHeight: '320px', maxHeight: '65vh' }}>
          <img
            src={realImages[current]}
            alt={`${altText} ${current + 1}`}
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: '65vh' }}
          />

          {realImages.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md rounded-full p-2 text-slate-700"
              >
                <ChevronRight size={20} />
              </button>
              <button
                onClick={next}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md rounded-full p-2 text-slate-700"
              >
                <ChevronLeft size={20} />
              </button>
            </>
          )}
        </div>

        {realImages.length > 1 && (
          <div className="flex gap-2 p-3 border-t border-slate-200 justify-center overflow-x-auto">
            {realImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`w-12 h-12 rounded border-2 overflow-hidden flex-shrink-0 transition-colors ${
                  idx === current ? 'border-orange-500' : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
