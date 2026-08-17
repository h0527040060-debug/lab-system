import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { formatDateTime, formatMoney, formatDate } from '../utils/formatters';
import {
  QUICK_STATUS_FLOW, QUICK_STATUS_LABELS, QUICK_STATUS_STYLES, QUICK_CLOSED_STATUSES,
  SERVICE_LOCATIONS, SERVICE_LOCATION_LABELS,
  TIMELINE_ACTIONS, TIMELINE_ACTION_LABELS, appendTimeline,
} from '../constants/quickRepair';
import { PAYMENT_METHOD_LABELS } from '../constants/payment';
import { REPAIR_STATUSES } from '../constants/statuses';
import StatusBadge from './StatusBadge';
import WorkNotes from './WorkNotes';
import NextActionsList, { NextActionSummary } from './NextActionsList';
import QuickCloseModal from './QuickCloseModal';
import {
  ChevronDown, ChevronUp, MapPin, Home, Phone, History,
  CheckCircle2, Banknote, Zap,
} from 'lucide-react';

// QuickRepairCard — שורת תיקון מהיר: סטטוסים בסיסיים, עדכונים, רשימת פעולות וסגירה.
export default function QuickRepairCard({ repair, defaultOpen = false }) {
  const { state, dispatch } = useAppContext();
  const [expanded, setExpanded] = useState(defaultOpen);
  const [closeMode, setCloseMode] = useState(null); // 'close' | 'payment' | null

  const customer = state.customers.find(c => c.id === repair.customer_id);
  const device = state.devices.find(d => d.id === repair.device_id);
  const deviceLabel = device ? (device.type ? `${device.type} · ${device.brand} ${device.model}` : `${device.brand} ${device.model}`) : '—';

  const isOnsite = repair.service_location === SERVICE_LOCATIONS.ONSITE;
  const isClosed = QUICK_CLOSED_STATUSES.includes(repair.status);
  const awaitingPayment = repair.status === REPAIR_STATUSES.PENDING_PAYMENT;
  const inQuickFlow = QUICK_STATUS_FLOW.includes(repair.status);

  const changeStatus = (status) => {
    if (status === repair.status) return;
    dispatch({
      type: 'UPDATE_REPAIR',
      payload: {
        id: repair.id,
        status,
        timeline: appendTimeline(repair, TIMELINE_ACTIONS.STATUS, state.currentUser, QUICK_STATUS_LABELS[status]),
      },
    });
  };

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* כותרת השורה */}
        <div className="p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5">
                  <Zap size={11} /> מהיר
                </span>
                <span className="font-mono text-xs font-bold text-slate-700">{repair.id}</span>
                <span className="text-xs text-slate-400">{formatDateTime(repair.date_intake)}</span>
                {!inQuickFlow && <StatusBadge status={repair.status} size="sm" />}
              </div>
              <p className="font-semibold text-sm text-slate-900 truncate">{customer?.name || 'ללא לקוח'}</p>
              <p className="text-xs text-slate-500 truncate">{deviceLabel}</p>
            </div>

            <button
              onClick={() => setExpanded(v => !v)}
              aria-label={expanded ? 'סגור פרטים' : 'פתח פרטים'}
              className="shrink-0 text-slate-400 hover:text-slate-700 p-1"
            >
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

          {/* מיקום ביצוע */}
          <div className="flex items-center gap-2 flex-wrap mb-2 text-xs">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold border ${
              isOnsite ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              {isOnsite ? <MapPin size={11} /> : <Home size={11} />}
              {SERVICE_LOCATION_LABELS[repair.service_location] || SERVICE_LOCATION_LABELS[SERVICE_LOCATIONS.LAB]}
            </span>
            {isOnsite && repair.onsite_contact_name && (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Phone size={11} /> {repair.onsite_contact_name}
              </span>
            )}
            {isOnsite && repair.onsite_address && (
              <span className="text-slate-500 truncate">{repair.onsite_address}</span>
            )}
          </div>

          {/* סטטוסים בסיסיים */}
          <div className="flex gap-1.5 flex-wrap mb-2">
            {QUICK_STATUS_FLOW.map(status => (
              <button
                key={status}
                onClick={() => changeStatus(status)}
                className={`px-2 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  repair.status === status
                    ? `${QUICK_STATUS_STYLES[status]} text-white`
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                }`}
              >
                {QUICK_STATUS_LABELS[status]}
              </button>
            ))}
          </div>

          {/* הפעולה הבאה + מחיר */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <NextActionSummary repair={repair} />
            {repair.final_price != null && (
              <span className="text-xs font-bold text-slate-700">{formatMoney(repair.final_price)}</span>
            )}
          </div>
        </div>

        {/* פרטים מורחבים */}
        {expanded && (
          <div className="border-t border-slate-100 p-3 space-y-4 bg-slate-50/50">
            {repair.complaint && (
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-2.5">
                <p className="text-xs font-bold text-orange-700 mb-0.5">תלונת לקוח</p>
                <p className="text-sm text-slate-700">{repair.complaint}</p>
              </div>
            )}

            {isClosed && (
              <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-1.5 text-sm">
                {repair.actual_fault && (
                  <div><span className="text-xs font-bold text-slate-500">התקלה בפועל: </span><span className="text-slate-700">{repair.actual_fault}</span></div>
                )}
                {repair.work_summary && (
                  <div><span className="text-xs font-bold text-slate-500">מה בוצע: </span><span className="text-slate-700">{repair.work_summary}</span></div>
                )}
                {repair.parts_note && (
                  <div><span className="text-xs font-bold text-slate-500">חלקים: </span><span className="text-slate-700">{repair.parts_note}</span></div>
                )}
                {repair.payment_method && (
                  <div className="text-xs text-slate-500">
                    שולם ב{PAYMENT_METHOD_LABELS[repair.payment_method]}
                    {repair.payment_date && ` · ${formatDate(repair.payment_date)}`}
                  </div>
                )}
                {repair.closed_by_name && (
                  <div className="text-xs text-slate-400">נסגר ע"י {repair.closed_by_name} · {formatDateTime(repair.closed_at)}</div>
                )}
              </div>
            )}

            <WorkNotes repair={repair} />
            <NextActionsList repair={repair} />

            {/* תיעוד: מי / מתי / איפה */}
            {(repair.timeline || []).length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <History size={14} className="text-slate-500" />
                  <h4 className="text-xs font-bold text-slate-600">תיעוד פעולות</h4>
                </div>
                <div className="space-y-1">
                  {repair.timeline.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
                      <span className="text-slate-400">{formatDateTime(entry.at)}</span>
                      <span>·</span>
                      <span className="font-semibold text-slate-700">{entry.user_name}</span>
                      <span>·</span>
                      <span>{TIMELINE_ACTION_LABELS[entry.action] || entry.action}</span>
                      {entry.detail && <span className="text-slate-400">({entry.detail})</span>}
                      <span>·</span>
                      <span>{SERVICE_LOCATION_LABELS[entry.location] || entry.location}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* פעולות */}
            <div className="flex gap-2 flex-wrap pt-1">
              <button
                onClick={() => setCloseMode('close')}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold"
              >
                <CheckCircle2 size={15} />
                {isClosed ? 'ערוך סגירה' : 'סגור תיקון'}
              </button>
              {awaitingPayment && (
                <button
                  onClick={() => setCloseMode('payment')}
                  className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold"
                >
                  <Banknote size={15} />
                  רשום תשלום
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {closeMode && (
        <QuickCloseModal
          repair={repair}
          mode={closeMode}
          onClose={() => setCloseMode(null)}
        />
      )}
    </>
  );
}
