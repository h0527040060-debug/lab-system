import { QRCodeSVG } from 'qrcode.react';
import { formatDateTime } from '../utils/formatters';
import { Printer, X } from 'lucide-react';

export default function PrintStickerModal({ repair, customer, device, onClose }) {
  if (!repair) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
        {/* כותרת */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800">מדבקת QR לתיקון</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X size={20} />
          </button>
        </div>

        {/* תצוגה מקדימה + תוכן להדפסה */}
        <div className="p-6 flex justify-center">
          <div
            className="print-sticker border-2 border-slate-300 rounded-lg p-4 w-72 text-right"
            style={{ direction: 'rtl', fontFamily: 'Heebo, sans-serif' }}
          >
            {/* QR */}
            <div className="flex justify-center mb-3">
              <QRCodeSVG
                value={`${window.location.origin}${window.location.pathname}#/repair/${repair.id}`}
                size={130}
                level="M"
              />
            </div>

            {/* קוד תיקון */}
            <div className="text-center mb-3">
              <p className="font-mono text-lg font-bold text-orange-600 tracking-wide">{repair.id}</p>
            </div>

            <div className="border-t border-slate-200 pt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">{customer?.name}</span>
                <span className="text-slate-500 text-xs">{customer?.phone}</span>
              </div>
              <p className="text-slate-700">{device?.brand} {device?.model}</p>
              {device?.type && <p className="text-slate-500 text-xs">{device.type}</p>}
              <p className="text-slate-400 text-xs">{formatDateTime(repair.date_intake)}</p>
            </div>
          </div>
        </div>

        {/* כפתורים */}
        <div className="flex gap-3 p-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-semibold"
          >
            סגור
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2"
          >
            <Printer size={16} />
            הדפס מדבקה
          </button>
        </div>
      </div>
    </div>
  );
}
