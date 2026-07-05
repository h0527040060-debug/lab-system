import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { REPAIR_STATUSES } from '../../constants/statuses';
import { formatDateTime, formatMoney } from '../../utils/formatters';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import SearchInput from '../../components/SearchInput';
import CustomerQuickModal from '../../components/CustomerQuickModal';
import DeviceQuickModal from '../../components/DeviceQuickModal';
import { Package } from 'lucide-react';

const PAYMENT_METHOD_LABELS = {
  cash: '💵 מזומן',
  credit: '💳 אשראי',
  transfer: '🏦 העברה',
  waived: '✅ ללא חיוב',
};

export default function OfficePickup() {
  const { state, dispatch } = useAppContext();
  const [search, setSearch] = useState('');
  const [quickCustomer, setQuickCustomer] = useState(null);
  const [quickDevice, setQuickDevice] = useState(null);

  const waitingPickup = state.repairs
    .filter(r => r.status === REPAIR_STATUSES.PAID_WAITING_PICKUP)
    .filter(r => {
      if (!search) return true;
      const customer = state.customers.find(c => c.id === r.customer_id);
      const device = state.devices.find(d => d.id === r.device_id);
      const s = search.toLowerCase();
      return (
        r.id.toLowerCase().includes(s) ||
        customer?.name?.toLowerCase().includes(s) ||
        customer?.phone?.includes(search) ||
        device?.brand?.toLowerCase().includes(s) ||
        device?.model?.toLowerCase().includes(s) ||
        device?.manufacturer_serial?.toLowerCase().includes(s)
      );
    })
    .sort((a, b) => new Date(b.payment_at || b.date_intake) - new Date(a.payment_at || a.date_intake));

  const handleCollected = (repair) => {
    dispatch({
      type: 'UPDATE_REPAIR',
      payload: {
        id: repair.id,
        status: REPAIR_STATUSES.GREEN_COMPLETE,
        collected_at: new Date().toISOString(),
      },
    });
  };

  return (
    <div>
      <PageHeader
        title="איסוף / משלוח"
        subtitle={`${waitingPickup.length} תיקונים ממתינים לאיסוף`}
      />

      <div className="bg-white rounded-xl shadow-sm p-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="חיפוש לפי לקוח, מכשיר, קוד..." />
      </div>

      {waitingPickup.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm">
          <EmptyState
            icon={Package}
            title={search ? 'לא נמצאו תוצאות' : 'אין תיקונים ממתינים לאיסוף'}
            description={search ? 'נסה חיפוש אחר' : 'לאחר ביצוע גביה, התיקונים יופיעו כאן עד לאיסופם'}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {waitingPickup.map(repair => {
            const customer = state.customers.find(c => c.id === repair.customer_id);
            const device = state.devices.find(d => d.id === repair.device_id);

            return (
              <div key={repair.id} className="bg-white rounded-xl shadow-sm border border-green-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-green-600 font-bold text-sm">📦</span>
                      <span className="font-semibold text-slate-800">{repair.id}</span>
                      <span className="text-slate-400 text-xs">{formatDateTime(repair.payment_at)}</span>
                    </div>

                    <button
                      onClick={() => customer && setQuickCustomer(customer)}
                      disabled={!customer}
                      className="text-base font-bold text-slate-900 mb-0.5 text-right hover:text-blue-600 hover:underline disabled:hover:text-slate-900 disabled:hover:no-underline"
                    >
                      {customer?.name || '—'}
                    </button>
                    <div className="text-sm text-slate-600 mb-2">
                      <button
                        onClick={() => device && setQuickDevice({ device, customer })}
                        disabled={!device}
                        className="text-right hover:text-blue-600 hover:underline disabled:hover:text-slate-600 disabled:hover:no-underline"
                      >
                        {device ? (device.type || `${device.brand} ${device.model}`) : '—'}
                      </button>
                      {device?.manufacturer_serial && (
                        <span className="text-slate-400 mr-2">• {device.manufacturer_serial}</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="bg-green-50 text-green-800 px-2 py-0.5 rounded-md font-medium">
                        שולם: {formatMoney(repair.final_price ?? 0)}
                      </span>
                      {repair.payment_method && (
                        <span className="text-slate-500">
                          {PAYMENT_METHOD_LABELS[repair.payment_method] || repair.payment_method}
                        </span>
                      )}
                    </div>

                    {customer?.phone && (
                      <div className="text-xs text-slate-400 mt-1">{customer.phone}</div>
                    )}
                  </div>

                  <button
                    onClick={() => handleCollected(repair)}
                    className="flex-shrink-0 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
                  >
                    ✅ סמן כנאסף
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {quickCustomer && (
        <CustomerQuickModal customer={quickCustomer} repairs={state.repairs} devices={state.devices} onClose={() => setQuickCustomer(null)} />
      )}
      {quickDevice && (
        <DeviceQuickModal device={quickDevice.device} customer={quickDevice.customer} repairs={state.repairs} onClose={() => setQuickDevice(null)} />
      )}
    </div>
  );
}
