import { useState } from 'react';
import { X, Phone, Mail, MapPin, FileText, Edit2 } from 'lucide-react';
import { formatDateTime } from '../utils/formatters';
import StatusBadge from './StatusBadge';
import { CustomerEditModal } from './CustomerEditModal';

export default function CustomerQuickModal({ customer, repairs = [], devices = [], onClose }) {
  const [showEdit, setShowEdit] = useState(false);
  if (!customer) return null;

  const customerDevices = devices.filter(d => d.customer_id === customer.id);
  const customerRepairs = repairs
    .filter(r => r.customer_id === customer.id)
    .sort((a, b) => new Date(b.date_intake) - new Date(a.date_intake))
    .slice(0, 8);

  return (
    <>
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="font-bold text-lg text-slate-800">{customer.name}</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowEdit(true)}
              className="p-1.5 hover:bg-orange-100 rounded-lg text-slate-400 hover:text-orange-600"
              title="ערוך לקוח"
              aria-label="ערוך לקוח"
            >
              <Edit2 size={16} />
            </button>
            <button onClick={onClose} aria-label="סגור" className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Phone size={14} className="text-slate-400 shrink-0" />
                <span dir="ltr">{customer.phone}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Mail size={14} className="text-slate-400 shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-2 text-sm text-slate-700 col-span-2">
                <MapPin size={14} className="text-slate-400 shrink-0" />
                <span>{customer.address}</span>
              </div>
            )}
          </div>

          {customer.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-slate-700">
              {customer.notes}
            </div>
          )}

          {customerDevices.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-slate-600 mb-2">מכשירים ({customerDevices.length})</h3>
              <div className="space-y-1">
                {customerDevices.map(d => (
                  <div key={d.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-sm">
                    <span>{d.brand} {d.model}</span>
                    <span className="font-mono text-xs text-slate-400">{d.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {customerRepairs.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-slate-600 mb-2">היסטוריית תיקונים ({repairs.filter(r => r.customer_id === customer.id).length})</h3>
              <div className="space-y-1">
                {customerRepairs.map(r => (
                  <div key={r.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-xs">
                    <span className="font-mono font-bold text-orange-600">{r.id}</span>
                    <span className="text-slate-500">{formatDateTime(r.date_intake)}</span>
                    <StatusBadge status={r.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {customerDevices.length === 0 && customerRepairs.length === 0 && (
            <div className="text-center py-4 text-sm text-slate-400">
              <FileText size={24} className="mx-auto mb-1 opacity-30" />
              אין היסטוריה
            </div>
          )}
        </div>
      </div>
    </div>
    {showEdit && <CustomerEditModal customer={customer} onClose={() => setShowEdit(false)} />}
    </>
  );
}
