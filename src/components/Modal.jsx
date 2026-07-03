import { X } from 'lucide-react';

/**
 * Modal — חלון צף
 * sheet={true} → bottom sheet במובייל (נפתח מלמטה)
 */
export default function Modal({ open, onClose, title, subtitle, children, maxWidth = 'max-w-3xl', footer, sheet = false }) {
  if (!open) return null;

  if (sheet) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center sm:p-4 animate-fade-in">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" onClick={onClose} />
        {/* Mobile: bottom sheet */}
        <div className={`relative bg-white w-full sm:rounded-2xl sm:shadow-xl sm:w-full sm:${maxWidth} sm:max-h-[90vh] max-h-[92vh] flex flex-col rounded-t-2xl animate-slide-up sm:animate-scale-in`}>
          <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200">
            {/* drag handle — מובייל בלבד */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-300 rounded-full sm:hidden" />
            <div className="mt-2 sm:mt-0">
              <h2 className="text-base font-bold text-slate-900 leading-tight">{title}</h2>
              {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <div className="border-t border-slate-200 px-5 py-4 bg-slate-50 rounded-b-2xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${maxWidth} max-h-[90vh] flex flex-col animate-scale-in`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1 transition-colors mt-0.5"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
