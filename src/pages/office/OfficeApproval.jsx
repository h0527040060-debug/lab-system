import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { REPAIR_STATUSES } from '../../constants/statuses';
import { WARRANTY_TYPES, WARRANTY_LABELS } from '../../constants/warranty';
import { formatDateTime, formatMoney } from '../../utils/formatters';
import { calculateQuoteBreakdown, getPartSellingPrice } from '../../utils/pricing';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import InfoCard from '../../components/InfoCard';
import PriceBreakdown from '../../components/PriceBreakdown';
import ConfirmDialog from '../../components/ConfirmDialog';
import CustomerQuickModal from '../../components/CustomerQuickModal';
import DeviceQuickModal from '../../components/DeviceQuickModal';
import WhatsAppButton from '../../components/WhatsAppButton';
import PartThumbnail from '../../components/PartThumbnail';
import SearchInput from '../../components/SearchInput';
import { DollarSign, Wrench, FileText, Check, X, ShoppingCart } from 'lucide-react';

export default function OfficeApproval() {
  const { state, dispatch } = useAppContext();
  const [editingRepair, setEditingRepair] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [quickCustomer, setQuickCustomer] = useState(null);
  const [quickDevice, setQuickDevice] = useState(null);

  const pendingRepairs = state.repairs
    .filter(r => r.status === REPAIR_STATUSES.YELLOW_DIAGNOSIS)
    .sort((a, b) => new Date(b.diagnosed_at || b.date_intake) - new Date(a.diagnosed_at || a.date_intake));

  const diagnosticFee = state.settings.diagnostic_fee || 180;

  const handleApprove = (repair) => {
    const isPaid = repair.warranty_type === WARRANTY_TYPES.PAID;
    dispatch({
      type: 'UPDATE_REPAIR',
      payload: {
        id: repair.id,
        status: REPAIR_STATUSES.YELLOW_READY_TO_WORK,
        approved_at: new Date().toISOString(),
        quoted_breakdown: calculateQuoteBreakdown(repair, state),
        ...(isPaid && { diagnostic_fee: diagnosticFee, diagnostic_fee_credited: true }),
      },
    });
    setConfirmAction(null);
  };

  const handleCustomerRefused = (repair) => {
    dispatch({
      type: 'UPDATE_REPAIR',
      payload: {
        id: repair.id,
        status: REPAIR_STATUSES.CUSTOMER_REFUSED,
        refused_at: new Date().toISOString(),
        diagnostic_fee: diagnosticFee,
        diagnostic_fee_credited: false,
      },
    });
    setConfirmAction(null);
  };

  const handleBoughtNew = (repair) => {
    dispatch({
      type: 'UPDATE_REPAIR',
      payload: {
        id: repair.id,
        status: REPAIR_STATUSES.BOUGHT_NEW,
        bought_new_at: new Date().toISOString(),
        diagnostic_fee: diagnosticFee,
        diagnostic_fee_credited: true,
        diagnostic_fee_waived: true,
      },
    });
    setConfirmAction(null);
  };

  return (
    <div>
      <PageHeader
        title="אישור תמחור"
        subtitle={`${pendingRepairs.length} קריאות ממתינות לאישור הלקוח`}
      />

      {pendingRepairs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm">
          <EmptyState
            icon={DollarSign}
            title="אין קריאות לתמחור"
            description="קריאות יופיעו כאן אחרי שהמעבדה תאבחן אותן"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRepairs.map(r => {
            const customer = state.customers.find(c => c.id === r.customer_id);
            const device = state.devices.find(d => d.id === r.device_id);
            const breakdown = calculateQuoteBreakdown(r, state);
            const isWarrantyFree = r.warranty_type === WARRANTY_TYPES.FULL_WARRANTY;

            return (
              <div key={r.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-bold text-orange-600">{r.id}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="font-mono text-xs text-slate-500">{device?.id}</span>
                      </div>
                      <button onClick={() => setQuickCustomer(customer)} className="text-right hover:text-blue-600 group">
                        <p className="font-semibold text-slate-900 group-hover:underline">{customer?.name}</p>
                        <p className="text-xs text-slate-500" dir="ltr">{customer?.phone}</p>
                      </button>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-slate-500">אובחן ב-</p>
                      <p className="text-xs font-semibold">{formatDateTime(r.diagnosed_at)}</p>
                      <p className={`text-xs font-bold mt-1 ${isWarrantyFree ? 'text-green-600' : 'text-slate-600'}`}>
                        {WARRANTY_LABELS[r.warranty_type]}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 grid lg:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <InfoCard title="מכשיר" icon={Wrench}>
                      <button onClick={() => setQuickDevice({ device, customer })} className="text-right hover:text-blue-600 group w-full">
                        <p className="font-semibold group-hover:underline">{device?.type || `${device?.brand} ${device?.model}`}</p>
                        <p className="text-xs text-slate-500">{device?.brand} {device?.model}</p>
                      </button>
                    </InfoCard>

                    <InfoCard title="תלונה" icon={FileText}>
                      <p className="text-sm">{r.complaint}</p>
                    </InfoCard>

                    <InfoCard title="אבחון הטכנאי">
                      <p className="text-sm">{r.diagnosis}</p>
                    </InfoCard>
                  </div>

                  <div>
                    <PriceBreakdown breakdown={breakdown} />
                    {isWarrantyFree && (
                      <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2 text-xs text-green-800">
                        ✓ הלקוח לא משלם — תיקון באחריות מלאה
                      </div>
                    )}
                    {r.warranty_type === WARRANTY_TYPES.PAID && (
                      <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-800">
                        🔍 דמי בדיקה: {formatMoney(diagnosticFee)} — יזוכו אם הלקוח יאשר תיקון
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2 justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEditingRepair(r)}
                      className="text-sm text-orange-600 hover:text-orange-700 font-semibold"
                    >
                      ✏️ ערוך הצעה
                    </button>
                    <WhatsAppButton repair={r} customer={customer} device={device} type="customer" />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {r.warranty_type === WARRANTY_TYPES.PAID && (
                      <>
                        <button
                          onClick={() => setConfirmAction({ repair: r, action: 'refused' })}
                          className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-semibold text-sm flex items-center gap-1"
                        >
                          <X size={16} />
                          לקוח מסרב
                        </button>
                        <button
                          onClick={() => setConfirmAction({ repair: r, action: 'bought_new' })}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-sm flex items-center gap-1"
                        >
                          <ShoppingCart size={16} />
                          קנה חדש
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setConfirmAction({ repair: r, action: 'approve' })}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm flex items-center gap-1"
                    >
                      <Check size={16} />
                      {isWarrantyFree ? 'שחרר לעבודה' : 'הלקוח אישר'}
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

      {editingRepair && (
        <EditQuoteModal
          repair={editingRepair}
          onClose={() => setEditingRepair(null)}
        />
      )}

      <ConfirmDialog
        open={!!confirmAction}
        title={
          confirmAction?.action === 'approve' ? 'אישור הצעה' :
          confirmAction?.action === 'refused' ? 'לקוח מסרב' :
          'לקוח קנה חדש'
        }
        message={
          confirmAction?.action === 'approve'
            ? 'האם הלקוח אישר את ההצעה? הקריאה תועבר למעבדה לביצוע. דמי הבדיקה יזוכו מהחשבון.'
            : confirmAction?.action === 'refused'
            ? `הלקוח מסרב לתיקון. הקריאה תועבר לגביה של ${formatMoney(diagnosticFee)} דמי בדיקה.`
            : 'הלקוח קנה מכשיר חדש. הקריאה תיסגר ללא חיוב — דמי הבדיקה מזוכים.'
        }
        confirmLabel={
          confirmAction?.action === 'approve' ? 'כן, אושר' :
          confirmAction?.action === 'refused' ? 'העבר לגביה' :
          'סגור קריאה'
        }
        variant={confirmAction?.action === 'refused' ? 'danger' : 'default'}
        onConfirm={() => {
          if (confirmAction.action === 'approve') handleApprove(confirmAction.repair);
          else if (confirmAction.action === 'refused') handleCustomerRefused(confirmAction.repair);
          else handleBoughtNew(confirmAction.repair);
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}

function EditQuoteModal({ repair, onClose }) {
  const { state, dispatch } = useAppContext();

  const [workCodes, setWorkCodes] = useState(repair.diagnosed_work_codes || []);
  const [parts, setParts] = useState(repair.diagnosed_parts || []);
  const [services, setServices] = useState(repair.diagnosed_services || []);
  const [partSearch, setPartSearch] = useState('');

  const device = state.devices.find(d => d.id === repair.device_id);

  const filteredParts = state.parts.filter(p => {
    if (!partSearch) return true;
    const s = partSearch.toLowerCase();
    return (
      p.name?.toLowerCase().includes(s) ||
      p.manufacturer?.toLowerCase().includes(s) ||
      p.manufacturer_sku?.toLowerCase().includes(s) ||
      p.internal_barcode?.toLowerCase().includes(s)
    );
  });

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_REPAIR',
      payload: {
        id: repair.id,
        diagnosed_work_codes: workCodes,
        diagnosed_parts: parts,
        diagnosed_services: services,
      },
    });
    onClose();
  };

  const tempRepair = { ...repair, diagnosed_work_codes: workCodes, diagnosed_parts: parts, diagnosed_services: services };
  const breakdown = calculateQuoteBreakdown(tempRepair, state);

  const addWork = (workId) => setWorkCodes(prev => prev.includes(workId) ? prev : [...prev, workId]);
  const removeWork = (workId) => setWorkCodes(prev => prev.filter(w => w !== workId));

  const addPart = (partId) => {
    setParts(prev => {
      if (prev.find(p => p.part_id === partId)) return prev;
      return [...prev, { part_id: partId, quantity: 1 }];
    });
  };
  const removePart = (partId) => setParts(prev => prev.filter(p => p.part_id !== partId));
  const updatePartQty = (partId, qty) => setParts(prev =>
    prev.map(p => p.part_id === partId ? { ...p, quantity: Math.max(1, parseInt(qty) || 1) } : p)
  );

  const addService = (svcId) => setServices(prev => prev.includes(svcId) ? prev : [...prev, svcId]);
  const removeService = (svcId) => setServices(prev => prev.filter(s => s !== svcId));

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`עריכת הצעת מחיר - ${repair.id}`}
      subtitle="הוסף/הסר חלקים, עבודות ושירותים"
      maxWidth="max-w-5xl"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100">ביטול</button>
          <button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold">שמור שינויים</button>
        </div>
      }
    >
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-sm mb-2">🛠️ עבודות מהקטלוג</h4>
            <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
              {state.workCatalog.filter(w =>
                w.brand === device?.brand ||
                w.brand === 'כל היצרנים' ||
                w.brand === '(חופשי)'
              ).map(w => {
                const isSelected = workCodes.includes(w.id);
                return (
                  <button
                    key={w.id}
                    onClick={() => isSelected ? removeWork(w.id) : addWork(w.id)}
                    className={`w-full text-right p-2 border-b last:border-0 text-sm ${isSelected ? 'bg-orange-50' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex justify-between">
                      <span>{w.work_name} - {w.model}</span>
                      <span className="font-bold">{formatMoney(w.price)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-sm mb-2">📦 חלקים</h4>
            <div className="mb-2">
              <SearchInput value={partSearch} onChange={setPartSearch} placeholder="חיפוש חלק לפי שם, יצרן, מק״ט..." />
            </div>
            <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
              {filteredParts.length === 0 && (
                <p className="text-center text-slate-400 text-xs py-4">לא נמצאו חלקים</p>
              )}
              {filteredParts.map(p => {
                const selected = parts.find(sp => sp.part_id === p.id);
                return (
                  <div key={p.id} className={`p-2 border-b last:border-0 text-sm ${selected ? 'bg-orange-50' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => selected ? removePart(p.id) : addPart(p.id)}
                        className="flex-1 text-right flex items-center gap-2 min-w-0"
                      >
                        <PartThumbnail part={p} size="xs" />
                        <span className="truncate">{p.name}</span>
                      </button>
                      <span className="text-xs text-slate-500 flex-shrink-0">{formatMoney(getPartSellingPrice(p))}</span>
                      {selected && (
                        <input
                          type="number"
                          min="1"
                          value={selected.quantity}
                          onChange={(e) => updatePartQty(p.id, e.target.value)}
                          className="w-14 border border-slate-300 rounded px-2 py-1 text-sm"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-sm mb-2">✨ שירותים גנריים</h4>
            <div className="border border-slate-200 rounded-lg max-h-32 overflow-y-auto">
              {state.services.map(s => {
                const isSelected = services.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => isSelected ? removeService(s.id) : addService(s.id)}
                    className={`w-full text-right p-2 border-b last:border-0 text-sm ${isSelected ? 'bg-orange-50' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex justify-between">
                      <span>{s.name}</span>
                      <span className="font-bold">{formatMoney(s.base_price)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-sm mb-2">📋 הצעה נוכחית</h4>
          <PriceBreakdown breakdown={breakdown} />
        </div>
      </div>
    </Modal>
  );
}
