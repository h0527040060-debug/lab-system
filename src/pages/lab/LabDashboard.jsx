import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { useStagger } from '../../hooks/useStagger';
import { REPAIR_STATUSES } from '../../constants/statuses';
import { formatDateTime } from '../../utils/formatters';
import PageHeader from '../../components/PageHeader';
import DiagnosisModal from '../../components/DiagnosisModal';
import WorkSessionModal from '../../components/WorkSessionModal';
import ReleaseDocsModal from '../../components/ReleaseDocsModal';
import RepairDetailModal from '../../components/RepairDetailModal';
import { isDeviceMissingPhoto } from '../../utils/devicePhoto';
import { AlertTriangle, Clock } from 'lucide-react';

export default function LabDashboard() {
  const { state } = useAppContext();
  const [diagnosingRepair, setDiagnosingRepair] = useState(null);
  const [workingOnRepair, setWorkingOnRepair] = useState(null);
  const [releaseDocsRepair, setReleaseDocsRepair] = useState(null);
  const [detailRepairId, setDetailRepairId] = useState(null);

  const newRepairs = state.repairs.filter(r => r.status === REPAIR_STATUSES.RED_INTAKE);
  const inDiagnosis = state.repairs.filter(r =>
    [REPAIR_STATUSES.YELLOW_DIAGNOSIS, REPAIR_STATUSES.YELLOW_APPEAL].includes(r.status)
  );
  const readyForWork = state.repairs.filter(r => r.status === REPAIR_STATUSES.YELLOW_READY_TO_WORK);
  const inWork = state.repairs.filter(r => r.status === REPAIR_STATUSES.IN_WORK);
  const pendingDocs = state.repairs.filter(r => r.status === REPAIR_STATUSES.PENDING_RELEASE_DOCS);

  const handleAction = (repairId, modal) => {
    const repair = state.repairs.find(r => r.id === repairId);
    if (!repair) return;
    if (modal === 'diagnosis') setDiagnosingRepair(repair);
    else if (modal === 'work') setWorkingOnRepair(repair);
    else if (modal === 'docs') setReleaseDocsRepair(repair);
  };

  const handleSelect = (r, onSelect) => {
    const device = state.devices.find(d => d.id === r.device_id);
    if (isDeviceMissingPhoto(device)) {
      setDetailRepairId(r.id);
    } else {
      onSelect(r);
    }
  };

  const detailRepair = detailRepairId ? state.repairs.find(r => r.id === detailRepairId) : null;
  const detailCustomer = detailRepair ? state.customers.find(c => c.id === detailRepair.customer_id) : null;
  const detailDevice = detailRepair ? state.devices.find(d => d.id === detailRepair.device_id) : null;

  const stuckRepairs = state.repairs.filter(r => {
    const completed = [REPAIR_STATUSES.GREEN_COMPLETE, REPAIR_STATUSES.RED_CANCELLED].includes(r.status);
    if (completed) return false;
    const daysSince = (Date.now() - new Date(r.date_intake)) / (1000 * 60 * 60 * 24);
    return daysSince > state.settings.alert_stuck_repair_days;
  });

  return (
    <div>
      <PageHeader title="דשבורד מעבדה" subtitle="קריאות פעילות במעבדה" />

      {stuckRepairs.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle size={20} />
            <p className="font-bold">יש {stuckRepairs.length} קריאות תקועות יותר מ-{state.settings.alert_stuck_repair_days} ימים</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <KanbanColumn
          title="חדשות באבחון"
          count={newRepairs.length}
          repairs={newRepairs}
          state={state}
          onSelect={r => handleSelect(r, setDiagnosingRepair)}
          color="red"
        />
        <KanbanColumn
          title="באבחון / ערעור"
          count={inDiagnosis.length}
          repairs={inDiagnosis}
          state={state}
          onSelect={r => handleSelect(r, setDiagnosingRepair)}
          color="yellow"
        />
        <KanbanColumn
          title="מוכן לעבודה"
          count={readyForWork.length}
          repairs={readyForWork}
          state={state}
          onSelect={r => handleSelect(r, setWorkingOnRepair)}
          color="green"
        />
        <KanbanColumn
          title="בעבודה"
          count={inWork.length}
          repairs={inWork}
          state={state}
          onSelect={r => handleSelect(r, setWorkingOnRepair)}
          color="blue"
        />
        <KanbanColumn
          title="📸 ממתין תיעוד"
          count={pendingDocs.length}
          repairs={pendingDocs}
          state={state}
          onSelect={r => handleSelect(r, setReleaseDocsRepair)}
          color="orange"
        />
      </div>

      {diagnosingRepair && (
        <DiagnosisModal
          repair={diagnosingRepair}
          onClose={() => setDiagnosingRepair(null)}
        />
      )}

      {workingOnRepair && (
        <WorkSessionModal
          repair={workingOnRepair}
          onClose={() => setWorkingOnRepair(null)}
        />
      )}

      {releaseDocsRepair && (
        <ReleaseDocsModal
          repair={releaseDocsRepair}
          onClose={() => setReleaseDocsRepair(null)}
        />
      )}

      {detailRepair && (
        <RepairDetailModal
          repair={detailRepair}
          customer={detailCustomer}
          device={detailDevice}
          onClose={() => setDetailRepairId(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}

function KanbanColumn({ title, count, repairs, state, onSelect, color, disabled }) {
  const stagger = useStagger(35);
  const colorMap = {
    red: 'border-red-200 bg-red-50',
    yellow: 'border-yellow-200 bg-yellow-50',
    green: 'border-green-200 bg-green-50',
    blue: 'border-blue-200 bg-blue-50',
    orange: 'border-orange-200 bg-orange-50',
  };

  const emoji = { red: '🔴', yellow: '🟡', green: '🟢', blue: '⚙️', orange: '' };

  return (
    <div className={`rounded-xl border-2 ${colorMap[color]} p-3`}>
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
        <h3 className="font-bold text-slate-800 text-sm">{emoji[color]} {title}</h3>
        <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold">{count}</span>
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {repairs.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-6">אין כעת</p>
        ) : (
          repairs.map((r, i) => {
            const customer = state.customers.find(c => c.id === r.customer_id);
            const device = state.devices.find(d => d.id === r.device_id);
            const needsPhoto = isDeviceMissingPhoto(device);
            return (
              <button
                key={r.id}
                onClick={() => !disabled && onSelect(r)}
                disabled={disabled}
                style={stagger(i)}
                className={`w-full text-right bg-white rounded-lg p-3 border border-slate-200 transition-all animate-fade-in ${
                  disabled ? 'opacity-60 cursor-default' : 'hover:border-orange-300 hover:shadow-md cursor-pointer'
                }`}
              >
                <div className="flex justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-orange-600">{r.id}</span>
                  <div className="flex items-center gap-1">
                    {r.repair_type === 'internal_used' && (
                      <span className="bg-purple-100 text-purple-700 text-xs font-bold px-1.5 py-0.5 rounded">🛒 פנימי</span>
                    )}
                    <Clock size={12} className="text-slate-400" />
                  </div>
                </div>
                <p className="font-semibold text-sm">{r.repair_type === 'internal_used' ? '— פנימי —' : customer?.name}</p>
                <p className="text-xs text-slate-600 mt-1">{device?.type || `${device?.brand} ${device?.model}`}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.complaint}</p>
                <p className="text-xs text-slate-400 mt-1">{formatDateTime(r.date_intake)}</p>
                {needsPhoto && (
                  <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg font-semibold mt-2">
                    📷 נדרשת תמונה
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
