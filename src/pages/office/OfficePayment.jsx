import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { REPAIR_STATUSES } from '../../constants/statuses';
import { WARRANTY_TYPES } from '../../constants/warranty';
import { formatDateTime, formatMoney } from '../../utils/formatters';
import { calculateInvoiceBreakdown } from '../../utils/pricing';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import PriceBreakdown from '../../components/PriceBreakdown';
import EditInvoiceModal from '../../components/EditInvoiceModal';
import CustomerQuickModal from '../../components/CustomerQuickModal';
import DeviceQuickModal from '../../components/DeviceQuickModal';
import PaymentModal from '../../components/PaymentModal';
import { DollarSign, Receipt, Pencil } from 'lucide-react';
import WhatsAppButton from '../../components/WhatsAppButton';

export default function OfficePayment() {
  const { state } = useAppContext();
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [editingInvoiceRepair, setEditingInvoiceRepair] = useState(null);
  const [quickCustomer, setQuickCustomer] = useState(null);
  const [quickDevice, setQuickDevice] = useState(null);

  const pendingPayments = state.repairs
    .filter(r =>
      (r.status === REPAIR_STATUSES.PENDING_PAYMENT || r.status === REPAIR_STATUSES.CUSTOMER_REFUSED) &&
      r.repair_type !== 'internal_used'
    )
    .sort((a, b) => new Date(b.work_end || b.refused_at || b.date_intake) - new Date(a.work_end || a.refused_at || a.date_intake));

  return (
    <div>
      <PageHeader
        title="גביה ושחרור"
        subtitle={`${pendingPayments.length} תיקונים ממתינים לתשלום ושחרור`}
      />

      {pendingPayments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm">
          <EmptyState
            icon={DollarSign}
            title="אין תיקונים לגביה"
            description="תיקונים מוכנים יופיעו כאן אחרי תיעוד תקינות"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {pendingPayments.map(r => {
            const customer = state.customers.find(c => c.id === r.customer_id);
            const device = state.devices.find(d => d.id === r.device_id);
            const isRefused = r.status === REPAIR_STATUSES.CUSTOMER_REFUSED;
            const breakdown = isRefused ? null : calculateInvoiceBreakdown(r, state);
            const vatPercent = state.settings.vat_percent_display || 17;
            const diagnosticFee = r.diagnostic_fee || 0;
            const diagnosticCredit = (!isRefused && r.diagnostic_fee_credited) ? diagnosticFee : 0;
            const baseTotal = isRefused ? diagnosticFee : (breakdown.grandTotal - diagnosticCredit);
            const vatAmount = baseTotal * (vatPercent / 100);
            const totalWithVat = baseTotal + vatAmount;
            const isWarrantyFree = r.warranty_type === WARRANTY_TYPES.FULL_WARRANTY;

            return (
              <div key={r.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-bold text-orange-600">{r.id}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="font-mono text-xs text-slate-500">{device?.id}</span>
                        {isRefused && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">🚫 לקוח מסרב</span>
                        )}
                      </div>
                      <button onClick={() => setQuickCustomer(customer)} className="text-right hover:text-blue-600 group block">
                        <p className="font-semibold group-hover:underline">{customer?.name}</p>
                        <p className="text-xs text-slate-500" dir="ltr">{customer?.phone}</p>
                      </button>
                      <button onClick={() => setQuickDevice({ device, customer })} className="text-right hover:text-blue-600 group block mt-1">
                        <p className="text-xs text-slate-500 group-hover:underline">{device?.type || `${device?.brand} ${device?.model}`}</p>
                      </button>
                    </div>
                    <div className="text-left">
                      {isRefused ? (
                        <>
                          <p className="text-xs text-slate-500">סירב בתאריך</p>
                          <p className="text-xs font-semibold">{formatDateTime(r.refused_at)}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-slate-500">תיעוד הסתיים</p>
                          <p className="text-xs font-semibold">{formatDateTime(r.release_docs_at)}</p>
                        </>
                      )}
                      {isWarrantyFree && (
                        <p className="text-xs font-bold text-green-600 mt-1">✓ ללא תשלום (אחריות מלאה)</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  {isRefused ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs font-bold text-red-900 mb-2">🚫 לקוח מסרב — גביית דמי בדיקה:</p>
                      <div className="flex justify-between text-sm font-bold text-red-800">
                        <span>דמי בדיקה:</span>
                        <span>{formatMoney(diagnosticFee)}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-bold text-slate-800 mb-2">פירוט המחיר:</h4>
                      <PriceBreakdown breakdown={breakdown} diagnosticCredit={diagnosticCredit} />
                    </>
                  )}

                  {!isWarrantyFree && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs font-bold text-blue-900 mb-2">💰 לתצוגה ללקוח (כולל מע"מ):</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-700">סה"כ:</span>
                          <span className="font-semibold">{formatMoney(baseTotal)}</span>
                        </div>
                        <div className="flex justify-between text-blue-700">
                          <span>מע"מ ({vatPercent}%):</span>
                          <span>{formatMoney(vatAmount)}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-blue-300 font-bold text-blue-900">
                          <span>לתשלום (כולל מע"מ):</span>
                          <span className="text-base">{formatMoney(totalWithVat)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-blue-700 mt-2 text-center italic">
                        מע"מ לתצוגה בלבד - חשבונית מופקת בנפרד במערכת החשבונאות
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {!isRefused && (
                      <button
                        onClick={() => setEditingInvoiceRepair(r)}
                        className="text-sm text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                      >
                        <Pencil size={15} />
                        ערוך חשבון
                      </button>
                    )}
                    <WhatsAppButton repair={r} customer={customer} device={device} type="customer" />
                  </div>
                  <div>
                    <button
                      onClick={() => setSelectedRepair(r)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
                    >
                      <Receipt size={18} />
                      מסך גביה ושחרור
                    </button>
                  </div>
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

      {selectedRepair && (
        <PaymentModal
          repair={selectedRepair}
          onClose={() => setSelectedRepair(null)}
        />
      )}

      {editingInvoiceRepair && (
        <EditInvoiceModal
          repair={editingInvoiceRepair}
          onClose={() => setEditingInvoiceRepair(null)}
        />
      )}
    </div>
  );
}
