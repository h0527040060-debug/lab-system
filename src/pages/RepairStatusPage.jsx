import { useState, useEffect } from 'react';
import { loadFromStorage, storageKeys } from '../store/storage';
import { getStatusDisplay, DEFAULT_STATUS_CONFIG } from '../utils/statusConfig';
import { formatDateTime } from '../utils/formatters';

export function RepairStatusPage({ repairId }) {
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const repairs = loadFromStorage(storageKeys.REPAIRS, []);
    const repair = repairs.find(r => r.id === repairId);
    if (!repair) { setNotFound(true); return; }

    const customers = loadFromStorage(storageKeys.CUSTOMERS, []);
    const devices = loadFromStorage(storageKeys.DEVICES, []);
    const statusConfig = loadFromStorage(storageKeys.STATUS_CONFIG, DEFAULT_STATUS_CONFIG);

    setData({
      repair,
      customer: customers.find(c => c.id === repair.customer_id),
      device: devices.find(d => d.id === repair.device_id),
      statusDisplay: getStatusDisplay(repair.status, statusConfig),
    });
  }, [repairId]);

  return (
    <div
      className="min-h-screen bg-slate-100 flex items-center justify-center p-4"
      style={{ direction: 'rtl', fontFamily: 'Heebo, sans-serif' }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* כותרת */}
        <div className="bg-slate-800 text-white text-center py-4 px-6">
          <p className="text-xs text-slate-400 mb-1">מעבדת תיקונים — הורוביץ</p>
          <p className="font-mono font-bold text-orange-400 text-lg tracking-wide">{repairId}</p>
        </div>

        {notFound && (
          <div className="p-8 text-center text-slate-500">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold">תיקון לא נמצא</p>
            <p className="text-sm mt-1">קוד: {repairId}</p>
          </div>
        )}

        {!notFound && !data && (
          <div className="p-8 text-center text-slate-400 text-sm">טוען...</div>
        )}

        {data && (
          <>
            {/* סטטוס */}
            <div className={`mx-4 mt-4 rounded-xl px-4 py-3 text-center ${data.statusDisplay.bg} ${data.statusDisplay.border} border`}>
              <span className="text-2xl">{data.statusDisplay.emoji}</span>
              <p className={`font-bold mt-1 ${data.statusDisplay.text}`}>{data.statusDisplay.label}</p>
            </div>

            {/* פרטים */}
            <div className="p-4 space-y-3 text-sm">
              <Row label="לקוח" value={data.customer?.name} />
              <Row label="טלפון" value={data.customer?.phone} />
              <Row label="מכשיר" value={data.device ? (data.device.type || `${data.device.brand} ${data.device.model}`) : null} />
              {data.device?.serial_number && <Row label="סריאל" value={data.device.serial_number} />}
              <Row label="נקלט" value={formatDateTime(data.repair.date_intake)} />
              {data.repair.customer_note && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-slate-500 text-xs mb-1">הערה ללקוח</p>
                  <p className="text-slate-700">{data.repair.customer_note}</p>
                </div>
              )}
            </div>

            <div className="bg-slate-50 text-center text-xs text-slate-400 py-3 border-t border-slate-100">
              מידע זה מוצג לצורך עדכון סטטוס בלבד
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-800 font-medium text-left">{value}</span>
    </div>
  );
}
