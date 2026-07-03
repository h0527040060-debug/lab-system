import { useState, useEffect } from 'react';
import { useAppContext } from '../../store/AppContext';
import { STATUS_LABELS, REPAIR_STATUSES } from '../../constants/statuses';
import { WARRANTY_LABELS } from '../../constants/warranty';
import { formatDateTime } from '../../utils/formatters';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import DiagnosisModal from '../../components/DiagnosisModal';
import WorkSessionModal from '../../components/WorkSessionModal';
import ReleaseDocsModal from '../../components/ReleaseDocsModal';
import PrintStickerModal from '../../components/PrintStickerModal';
import CustomerQuickModal from '../../components/CustomerQuickModal';
import DeviceQuickModal from '../../components/DeviceQuickModal';
import StatusPickerPopover from '../../components/StatusPickerPopover';
import WhatsAppButton from '../../components/WhatsAppButton';
import { FileText, Stethoscope, Wrench, Camera, Printer, Edit2, MoreVertical, Trash2 } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import { RepairEditModal } from '../../components/RepairEditModal';

const getActionForStatus = (status) => {
  if ([REPAIR_STATUSES.RED_INTAKE, REPAIR_STATUSES.YELLOW_DIAGNOSIS, REPAIR_STATUSES.YELLOW_APPEAL].includes(status))
    return 'diagnosis';
  if ([REPAIR_STATUSES.YELLOW_READY_TO_WORK, REPAIR_STATUSES.IN_WORK].includes(status))
    return 'work';
  if (status === REPAIR_STATUSES.PENDING_RELEASE_DOCS)
    return 'docs';
  return null;
};

export default function OfficeRepairsList() {
  const { state, dispatch } = useAppContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeRepairId, setActiveRepairId] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [printRepair, setPrintRepair] = useState(null);
  const [quickCustomer, setQuickCustomer] = useState(null);
  const [quickDevice, setQuickDevice] = useState(null);
  const [statusPickerRepairId, setStatusPickerRepairId] = useState(null);
  const [editRepair, setEditRepair] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteRepairId, setDeleteRepairId] = useState(null);

  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenuId]);

  const activeRepair = activeRepairId ? state.repairs.find(r => r.id === activeRepairId) : null;
  const statusPickerRepair = statusPickerRepairId ? state.repairs.find(r => r.id === statusPickerRepairId) : null;

  const openModal = (repairId, modal) => {
    setActiveRepairId(repairId);
    setActiveModal(modal);
  };
  const closeModal = () => {
    setActiveRepairId(null);
    setActiveModal(null);
  };

  const filteredRepairs = state.repairs
    .filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!search) return true;
      const customer = state.customers.find(c => c.id === r.customer_id);
      const device = state.devices.find(d => d.id === r.device_id);
      const searchLower = search.toLowerCase();
      return (
        r.id.toLowerCase().includes(searchLower) ||
        r.complaint?.toLowerCase().includes(searchLower) ||
        customer?.name?.toLowerCase().includes(searchLower) ||
        customer?.phone?.includes(search) ||
        device?.brand?.toLowerCase().includes(searchLower) ||
        device?.model?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => new Date(b.date_intake) - new Date(a.date_intake));

  return (
    <div>
      <PageHeader title="כל הקריאות" subtitle={`${state.repairs.length} קריאות במערכת`} />

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 animate-fade-in">
        <div className="grid md:grid-cols-3 gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="קוד, לקוח, מכשיר, תלונה..."
            className="md:col-span-2"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2"
          >
            <option value="all">כל הסטטוסים</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: '80ms' }}>
        {filteredRepairs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="אין קריאות"
            description={state.repairs.length === 0 ? 'עוד לא נקלטו קריאות תיקון' : 'לא נמצאו תוצאות בחיפוש'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-right p-3 font-semibold text-slate-700">קוד תיקון</th>
                  <th className="text-right p-3 font-semibold text-slate-700">תאריך</th>
                  <th className="text-right p-3 font-semibold text-slate-700">לקוח</th>
                  <th className="text-right p-3 font-semibold text-slate-700">מכשיר</th>
                  <th className="text-right p-3 font-semibold text-slate-700">תלונה</th>
                  <th className="text-right p-3 font-semibold text-slate-700">אחריות</th>
                  <th className="text-right p-3 font-semibold text-slate-700">עובדים</th>
                  <th className="text-right p-3 font-semibold text-slate-700">סטטוס</th>
                  <th className="text-right p-3 font-semibold text-slate-700">פעולה</th>
                </tr>
              </thead>
              <tbody>
                {filteredRepairs.map(r => {
                  const customer = state.customers.find(c => c.id === r.customer_id);
                  const device = state.devices.find(d => d.id === r.device_id);
                  return (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs font-bold text-orange-600">{r.id}</td>
                      <td className="p-3 text-xs text-slate-600">{formatDateTime(r.date_intake)}</td>

                      <td className="p-3">
                        <button
                          onClick={() => setQuickCustomer(customer)}
                          className="text-right hover:text-blue-600 transition-colors group"
                        >
                          <p className="font-medium group-hover:underline">{customer?.name || '—'}</p>
                          <p className="text-xs text-slate-500" dir="ltr">{customer?.phone}</p>
                        </button>
                      </td>

                      <td className="p-3">
                        <button
                          onClick={() => setQuickDevice({ device, customer })}
                          className="text-right hover:text-blue-600 transition-colors group"
                        >
                          <p className="text-xs group-hover:underline">{device?.brand} {device?.model}</p>
                          <p className="text-xs text-slate-500 font-mono">{device?.id}</p>
                        </button>
                      </td>

                      <td className="p-3 text-xs max-w-xs truncate">{r.complaint}</td>
                      <td className="p-3 text-xs">{WARRANTY_LABELS[r.warranty_type] || '—'}</td>
                      <td className="p-3 text-xs text-slate-500">
                        {r.intake_by_name && <div>קליטה: {r.intake_by_name}</div>}
                        {r.performed_by_name && <div>ביצוע: {r.performed_by_name}</div>}
                      </td>

                      <td className="p-3">
                        <div className="relative">
                          <button
                            onClick={() => setStatusPickerRepairId(prev => prev === r.id ? null : r.id)}
                            className="hover:opacity-75 transition-opacity"
                            title="לחץ לשינוי סטטוס"
                          >
                            <StatusBadge status={r.status} size="sm" />
                          </button>
                          {statusPickerRepairId === r.id && statusPickerRepair && (
                            <StatusPickerPopover
                              repair={statusPickerRepair}
                              onClose={() => setStatusPickerRepairId(null)}
                            />
                          )}
                        </div>
                      </td>

                      <td className="p-2 text-center relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(prev => prev === r.id ? null : r.id); }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenuId === r.id && (
                          <div
                            className="absolute left-0 top-8 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[130px] text-right"
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              onClick={() => { setPrintRepair({ repair: r, customer, device }); setOpenMenuId(null); }}
                              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-700"
                            >
                              <Printer size={13} /> הדפס QR
                            </button>
                            <button
                              onClick={() => { setEditRepair(r); setOpenMenuId(null); }}
                              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-700"
                            >
                              <Edit2 size={13} /> עריכה
                            </button>
                            <div className="px-2 py-1">
                              <WhatsAppButton repair={r} customer={customer} device={device} type="customer" className="w-full text-xs" />
                            </div>
                            {getActionForStatus(r.status) === 'diagnosis' && (
                              <button
                                onClick={() => { openModal(r.id, 'diagnosis'); setOpenMenuId(null); }}
                                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-yellow-50 text-yellow-800"
                              >
                                <Stethoscope size={13} /> אבחון
                              </button>
                            )}
                            {getActionForStatus(r.status) === 'work' && (
                              <button
                                onClick={() => { openModal(r.id, 'work'); setOpenMenuId(null); }}
                                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-blue-50 text-blue-800"
                              >
                                <Wrench size={13} /> ביצוע
                              </button>
                            )}
                            {getActionForStatus(r.status) === 'docs' && (
                              <button
                                onClick={() => { openModal(r.id, 'docs'); setOpenMenuId(null); }}
                                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-purple-50 text-purple-800"
                              >
                                <Camera size={13} /> תיעוד
                              </button>
                            )}
                            <div className="border-t border-slate-100 mt-1 pt-1">
                              <button
                                onClick={() => { setDeleteRepairId(r.id); setOpenMenuId(null); }}
                                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-red-50 text-red-600"
                              >
                                <Trash2 size={13} /> מחק קריאה
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editRepair && (
        <RepairEditModal repair={editRepair} onClose={() => setEditRepair(null)} />
      )}
      {activeRepair && activeModal === 'diagnosis' && (
        <DiagnosisModal repair={activeRepair} onClose={closeModal} />
      )}
      {activeRepair && activeModal === 'work' && (
        <WorkSessionModal repair={activeRepair} onClose={closeModal} />
      )}
      {activeRepair && activeModal === 'docs' && (
        <ReleaseDocsModal repair={activeRepair} onClose={closeModal} />
      )}
      {printRepair && (
        <PrintStickerModal
          repair={printRepair.repair}
          customer={printRepair.customer}
          device={printRepair.device}
          onClose={() => setPrintRepair(null)}
        />
      )}
      {quickCustomer && (
        <CustomerQuickModal
          customer={quickCustomer}
          repairs={state.repairs}
          devices={state.devices}
          onClose={() => setQuickCustomer(null)}
        />
      )}
      {quickDevice && (
        <DeviceQuickModal
          device={quickDevice.device}
          customer={quickDevice.customer}
          repairs={state.repairs}
          onClose={() => setQuickDevice(null)}
        />
      )}
      <ConfirmDialog
        open={!!deleteRepairId}
        title="מחיקת קריאה"
        message={`האם אתה בטוח שאתה רוצה למחוק את הקריאה ${deleteRepairId}? פעולה זו אינה ניתנת לביטול.`}
        confirmLabel="מחק לצמיתות"
        variant="danger"
        onConfirm={() => { dispatch({ type: 'DELETE_REPAIR', payload: deleteRepairId }); setDeleteRepairId(null); }}
        onCancel={() => setDeleteRepairId(null)}
      />
    </div>
  );
}
