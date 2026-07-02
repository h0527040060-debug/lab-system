import { useAppContext } from '../../store/AppContext';
import { REPAIR_STATUSES } from '../../constants/statuses';
import { formatDateTime, formatMoney } from '../../utils/formatters';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { Package } from 'lucide-react';

const PAYMENT_METHOD_LABELS = {
  cash: '💵 מזומן',
  credit: '💳 אשראי',
  transfer: '🏦 העברה',
  waived: '✅ ללא חיוב',
};

export default function OfficePickup() {
  const { state, dispatch } = useAppContext();

  const waitingPickup = state.repairs
    .filter(r => r.status === REPAIR_STATUSES.PAID_WAITING_PICKUP)
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

      {waitingPickup.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm">
          <EmptyState
            icon={Package}
            title="אין תיקונים ממתינים לאיסוף"
            description="לאחר ביצוע גביה, התיקונים יופיעו כאן עד לאיסופם"
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

                    <div className="text-base font-bold text-slate-900 mb-0.5">
                      {customer?.name || '—'}
                    </div>
                    <div className="text-sm text-slate-600 mb-2">
                      {device ? `${device.brand} ${device.model}` : '—'}
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
    </div>
  );
}
