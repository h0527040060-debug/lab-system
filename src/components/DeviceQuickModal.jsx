import { useState } from 'react';
import { X, Hash, Cpu, User, Edit2 } from 'lucide-react';
import { formatDateTime } from '../utils/formatters';
import StatusBadge from './StatusBadge';
import { DeviceEditModal } from './DeviceEditModal';

export default function DeviceQuickModal({ device, customer, repairs = [], onClose }) {
  const [showEdit, setShowEdit] = useState(false);
  if (!device) return null;

  const deviceRepairs = repairs
    .filter(r => r.device_id === device.id)
    .sort((a, b) => new Date(b.date_intake) - new Date(a.date_intake));

  return (
    <>
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h2 className="font-bold text-lg text-slate-800">{device.brand} {device.model}</h2>
            <p className="font-mono text-xs text-slate-400">{device.id}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowEdit(true)}
              className="p-1.5 hover:bg-orange-100 rounded-lg text-slate-400 hover:text-orange-600"
              title="ערוך מכשיר"
            >
              <Edit2 size={16} />
            </button>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {device.type && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Cpu size={14} className="text-slate-400 shrink-0" />
                <span>{device.type}</span>
              </div>
            )}
            {device.serial && (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Hash size={14} className="text-slate-400 shrink-0" />
                <span dir="ltr" className="font-mono text-xs">{device.serial}</span>
              </div>
            )}
            {customer && (
              <div className="flex items-center gap-2 text-sm text-slate-700 col-span-2">
                <User size={14} className="text-slate-400 shrink-0" />
                <span>{customer.name}</span>
                {customer.phone && <span className="text-slate-400 text-xs" dir="ltr">{customer.phone}</span>}
              </div>
            )}
          </div>

          {device.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-slate-700">
              {device.notes}
            </div>
          )}

          {deviceRepairs.length > 0 ? (
            <div>
              <h3 className="font-semibold text-sm text-slate-600 mb-2">היסטוריית תיקונים ({deviceRepairs.length})</h3>
              <div className="space-y-1">
                {deviceRepairs.map(r => (
                  <div key={r.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-xs">
                    <span className="font-mono font-bold text-orange-600">{r.id}</span>
                    <span className="text-slate-500">{formatDateTime(r.date_intake)}</span>
                    <StatusBadge status={r.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-slate-400 py-3">אין תיקונים קודמים</p>
          )}
        </div>
      </div>
    </div>
    {showEdit && <DeviceEditModal device={device} onClose={() => setShowEdit(false)} />}
    </>
  );
}
