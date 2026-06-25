import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { REPAIR_STATUSES } from '../../constants/statuses';
import { WARRANTY_TYPES } from '../../constants/warranty';
import { formatDateTime } from '../../utils/formatters';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import InfoCard from '../../components/InfoCard';
import ConfirmDialog from '../../components/ConfirmDialog';
import { ShieldAlert, User, Wrench, Check, X } from 'lucide-react';

export default function OfficeAppeals() {
  const { state, dispatch } = useAppContext();
  const [viewingAppeal, setViewingAppeal] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const appeals = state.repairs
    .filter(r => r.status === REPAIR_STATUSES.YELLOW_APPEAL)
    .sort((a, b) => new Date(b.warranty_appeal?.submitted_at || b.date_intake) - new Date(a.warranty_appeal?.submitted_at || a.date_intake));

  const handleReject = (repair) => {
    dispatch({
      type: 'UPDATE_REPAIR',
      payload: {
        id: repair.id,
        status: REPAIR_STATUSES.YELLOW_DIAGNOSIS,
        warranty_appeal: {
          ...repair.warranty_appeal,
          status: 'rejected',
          office_decision_date: new Date().toISOString(),
        },
      },
    });
    setConfirmAction(null);
    setViewingAppeal(null);
  };

  const handleAccept = (repair) => {
    dispatch({
      type: 'UPDATE_REPAIR',
      payload: {
        id: repair.id,
        status: REPAIR_STATUSES.YELLOW_DIAGNOSIS,
        warranty_type: WARRANTY_TYPES.PAID_WARRANTY,
        warranty_appeal: {
          ...repair.warranty_appeal,
          status: 'accepted',
          office_decision_date: new Date().toISOString(),
        },
      },
    });
    setConfirmAction(null);
    setViewingAppeal(null);
  };

  return (
    <div>
      <PageHeader
        title="ערעורי אחריות"
        subtitle={`${appeals.length} ערעורים ממתינים להחלטה`}
      />

      {appeals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm">
          <EmptyState
            icon={ShieldAlert}
            title="אין ערעורי אחריות"
            description="ערעורים יופיעו כאן כשטכנאי מגיש ערעור על קריאת אחריות"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {appeals.map(r => {
            const customer = state.customers.find(c => c.id === r.customer_id);
            const device = state.devices.find(d => d.id === r.device_id);
            return (
              <div key={r.id} className="bg-white rounded-xl shadow-sm border-r-4 border-orange-400 overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldAlert className="text-orange-500" size={20} />
                        <span className="font-mono text-sm font-bold text-orange-600">{r.id}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="font-mono text-xs text-slate-500">{device?.id}</span>
                      </div>
                      <p className="font-semibold">{customer?.name} • {customer?.phone}</p>
                      <p className="text-sm text-slate-600 mt-1">{device?.brand} {device?.model}</p>
                    </div>
                    <div className="text-left text-xs">
                      <p className="text-slate-500">ערעור הוגש</p>
                      <p className="font-semibold">{formatDateTime(r.warranty_appeal?.submitted_at)}</p>
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                    <p className="text-xs font-bold text-orange-800 mb-1">סיבת הערעור:</p>
                    <p className="text-sm text-orange-900">{r.warranty_appeal?.reason}</p>
                  </div>

                  {r.warranty_appeal?.evidence_photos?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-bold text-slate-600 mb-1">
                        תמונות הוכחה ({r.warranty_appeal.evidence_photos.length}):
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {r.warranty_appeal.evidence_photos.slice(0, 4).map((p, idx) => (
                          <img key={idx} src={p} alt={`ראיה ${idx + 1}`} className="w-full h-20 object-cover rounded border" />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end pt-2 border-t border-slate-200">
                    <button
                      onClick={() => setViewingAppeal(r)}
                      className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg font-semibold text-sm"
                    >
                      צפה בפרטים
                    </button>
                    <button
                      onClick={() => setConfirmAction({ repair: r, action: 'reject' })}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-sm flex items-center gap-1"
                    >
                      <X size={16} />
                      דחה ערעור
                    </button>
                    <button
                      onClick={() => setConfirmAction({ repair: r, action: 'accept' })}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-sm flex items-center gap-1"
                    >
                      <Check size={16} />
                      קבל ערעור
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewingAppeal && (
        <AppealDetailsModal
          repair={viewingAppeal}
          onClose={() => setViewingAppeal(null)}
          onAccept={() => setConfirmAction({ repair: viewingAppeal, action: 'accept' })}
          onReject={() => setConfirmAction({ repair: viewingAppeal, action: 'reject' })}
        />
      )}

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.action === 'accept' ? 'קבלת ערעור' : 'דחיית ערעור'}
        message={
          confirmAction?.action === 'accept'
            ? 'הערעור יתקבל וסוג האחריות ישתנה ל"אחריות בתשלום". יש לפנות ללקוח לאישור.'
            : 'הערעור יידחה והקריאה תטופל כאחריות מלאה.'
        }
        confirmLabel={confirmAction?.action === 'accept' ? 'כן, קבל' : 'כן, דחה'}
        variant={confirmAction?.action === 'reject' ? 'danger' : 'default'}
        onConfirm={() => {
          if (confirmAction.action === 'accept') handleAccept(confirmAction.repair);
          else handleReject(confirmAction.repair);
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}

function AppealDetailsModal({ repair, onClose, onAccept, onReject }) {
  const { state } = useAppContext();
  const customer = state.customers.find(c => c.id === repair.customer_id);
  const device = state.devices.find(d => d.id === repair.device_id);

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`ערעור אחריות - ${repair.id}`}
      subtitle={`${customer?.name} • ${device?.brand} ${device?.model}`}
      maxWidth="max-w-4xl"
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onReject}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1"
          >
            <X size={16} />
            דחה ערעור
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold flex items-center gap-1"
          >
            <Check size={16} />
            קבל ערעור
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InfoCard title="לקוח" icon={User}>
            <p className="font-semibold">{customer?.name}</p>
            <p className="text-xs text-slate-500">{customer?.phone}</p>
          </InfoCard>
          <InfoCard title="מכשיר" icon={Wrench}>
            <p className="font-semibold">{device?.brand} {device?.model}</p>
            <p className="text-xs text-slate-500">{device?.type}</p>
          </InfoCard>
        </div>

        <InfoCard title="תלונה מקורית">
          <p className="text-sm">{repair.complaint}</p>
        </InfoCard>

        <InfoCard title="אבחון הטכנאי">
          <p className="text-sm">{repair.diagnosis || '—'}</p>
        </InfoCard>

        <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
          <p className="text-sm font-bold text-orange-900 mb-2">🚨 סיבת הערעור:</p>
          <p className="text-sm text-orange-800">{repair.warranty_appeal?.reason}</p>
        </div>

        {repair.warranty_appeal?.evidence_photos?.length > 0 && (
          <div>
            <p className="text-sm font-bold mb-2">📷 תמונות הוכחה:</p>
            <div className="grid grid-cols-3 gap-2">
              {repair.warranty_appeal.evidence_photos.map((p, idx) => (
                <img key={idx} src={p} alt={`ראיה ${idx + 1}`} className="w-full h-32 object-cover rounded border" />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
