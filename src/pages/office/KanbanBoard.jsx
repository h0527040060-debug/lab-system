import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  pointerWithin,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppContext } from '../../store/AppContext';
import { loadFromStorage, saveToStorage } from '../../store/storage';
import { REPAIR_STATUSES } from '../../constants/statuses';
import { getStatusDisplay } from '../../utils/statusConfig';
import { formatDateTime } from '../../utils/formatters';
import WhatsAppButton from '../../components/WhatsAppButton';
import DiagnosisModal from '../../components/DiagnosisModal';
import WorkSessionModal from '../../components/WorkSessionModal';
import ReleaseDocsModal from '../../components/ReleaseDocsModal';
import RepairDetailModal from '../../components/RepairDetailModal';
import FloatingScrollbar from '../../components/FloatingScrollbar';
import {
  Stethoscope, Wrench, Camera, RotateCcw, Search,
  ChevronLeft, ChevronRight, GripVertical, MoreVertical, Pencil,
} from 'lucide-react';

const DEFAULT_COLUMNS = {
  office: [
    REPAIR_STATUSES.RED_INTAKE,
    REPAIR_STATUSES.YELLOW_DIAGNOSIS,
    REPAIR_STATUSES.YELLOW_APPEAL,
    REPAIR_STATUSES.YELLOW_WAITING_APPROVAL,
    REPAIR_STATUSES.YELLOW_READY_TO_WORK,
    REPAIR_STATUSES.IN_WORK,
    REPAIR_STATUSES.PENDING_RELEASE_DOCS,
    REPAIR_STATUSES.PENDING_PAYMENT,
  ],
  lab: [
    REPAIR_STATUSES.YELLOW_READY_TO_WORK,
    REPAIR_STATUSES.IN_WORK,
    REPAIR_STATUSES.PENDING_RELEASE_DOCS,
  ],
};
DEFAULT_COLUMNS.admin = DEFAULT_COLUMNS.office;

const SORT_OPTIONS = [
  { value: 'newest', label: 'חדש ביותר' },
  { value: 'oldest', label: 'ישן ביותר (דחיפות)' },
  { value: 'name', label: 'שם לקוח א–ת' },
  { value: 'price', label: 'מחיר גבוה→נמוך' },
];

const getActionForStatus = (status) => {
  if ([REPAIR_STATUSES.RED_INTAKE, REPAIR_STATUSES.YELLOW_DIAGNOSIS, REPAIR_STATUSES.YELLOW_APPEAL].includes(status))
    return 'diagnosis';
  if ([REPAIR_STATUSES.YELLOW_READY_TO_WORK, REPAIR_STATUSES.IN_WORK].includes(status))
    return 'work';
  if (status === REPAIR_STATUSES.PENDING_RELEASE_DOCS)
    return 'docs';
  return null;
};

function getRepairAge(dateIntake) {
  if (!dateIntake) return null;
  const diffMs = Date.now() - new Date(dateIntake);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (hours < 1) return { label: 'נקלט היום', color: 'text-green-600' };
  if (hours < 24) return { label: `נקלט לפני ${hours} שעות`, color: 'text-green-600' };
  if (days === 1) return { label: 'נקלט לפני יום אחד', color: 'text-amber-600' };
  if (days <= 3) return { label: `נקלט לפני ${days} ימים`, color: 'text-amber-600' };
  if (days <= 7) return { label: `נקלט לפני ${days} ימים`, color: 'text-orange-600' };
  return { label: `נקלט לפני ${days} ימים`, color: 'text-red-600 font-bold' };
}

// ─── תפריט 3 נקודות ───────────────────────────────────────────────────────────
function CardMenu({ repair, customer, device, onAction, onOpenDetail }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const action = getActionForStatus(repair.status);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        title="פעולות"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute left-0 top-7 z-30 bg-white border border-slate-200 rounded-xl shadow-xl w-44 py-1 text-right"
          onClick={e => e.stopPropagation()}>
          <button
            className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 text-right flex items-center gap-2"
            onClick={() => { setOpen(false); onOpenDetail(repair.id); }}
          >
            <span>📋</span> פרטים מלאים
          </button>
          {action === 'diagnosis' && (
            <button
              className="w-full px-3 py-2 text-xs text-yellow-800 hover:bg-yellow-50 text-right flex items-center gap-2"
              onClick={() => { setOpen(false); onAction(repair.id, 'diagnosis'); }}
            >
              <Stethoscope size={11} /> אבחון
            </button>
          )}
          {action === 'work' && (
            <button
              className="w-full px-3 py-2 text-xs text-blue-800 hover:bg-blue-50 text-right flex items-center gap-2"
              onClick={() => { setOpen(false); onAction(repair.id, 'work'); }}
            >
              <Wrench size={11} /> ביצוע
            </button>
          )}
          {action === 'docs' && (
            <button
              className="w-full px-3 py-2 text-xs text-purple-800 hover:bg-purple-50 text-right flex items-center gap-2"
              onClick={() => { setOpen(false); onAction(repair.id, 'docs'); }}
            >
              <Camera size={11} /> תיעוד
            </button>
          )}
          <div className="border-t border-slate-100 mt-1 pt-1 px-2">
            <WhatsAppButton repair={repair} customer={customer} device={device} type="customer" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── כרטיס תיקון ──────────────────────────────────────────────────────────────
function KanbanCard({ repair, customer, device, isDragging, onAction, onOpenDetail, search }) {
  const { state } = useAppContext();
  const statusDisplay = getStatusDisplay(repair.status, state.statusConfig);
  const action = getActionForStatus(repair.status);
  const age = getRepairAge(repair.date_intake);
  const dimmed = search && !(
    repair.id.toLowerCase().includes(search.toLowerCase()) ||
    customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    device?.brand?.toLowerCase().includes(search.toLowerCase()) ||
    device?.model?.toLowerCase().includes(search.toLowerCase()) ||
    repair.complaint?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all cursor-pointer hover:shadow-md hover:border-slate-300
        ${isDragging ? 'opacity-50 rotate-1 shadow-lg' : ''}
        ${dimmed ? 'opacity-20' : 'opacity-100'}
      `}
      onClick={() => onOpenDetail(repair.id)}
    >
      <div className={`h-1 ${statusDisplay.bg.replace('-100', '-400')}`} />
      <div className="p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-xs font-bold text-orange-600">{repair.id}</span>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <span className="text-xs text-slate-400">{formatDateTime(repair.date_intake).slice(0, 10)}</span>
            <CardMenu repair={repair} customer={customer} device={device} onAction={onAction} onOpenDetail={onOpenDetail} />
          </div>
        </div>
        <p className="font-semibold text-sm text-slate-800 truncate">{customer?.name || '—'}</p>
        <p className="text-xs text-slate-500 truncate">{device?.brand} {device?.model}</p>
        {repair.complaint && (
          <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">{repair.complaint}</p>
        )}
        <div className="flex gap-1 mt-2 flex-wrap items-center" onClick={e => e.stopPropagation()}>
          {/* כפתור עריכה/פרטים תמיד גלוי */}
          <button
            onClick={() => onOpenDetail(repair.id)}
            className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-orange-100 text-slate-600 hover:text-orange-700 px-2 py-1 rounded-lg font-semibold border border-slate-200 hover:border-orange-300 transition-colors"
          >
            <Pencil size={11} /> עריכה
          </button>
          <WhatsAppButton repair={repair} customer={customer} device={device} type="customer" />
          {action === 'diagnosis' && (
            <button
              onClick={() => onAction(repair.id, 'diagnosis')}
              className="flex items-center gap-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded-lg font-semibold"
            >
              <Stethoscope size={11} /> אבחון
            </button>
          )}
          {action === 'work' && (
            <button
              onClick={() => onAction(repair.id, 'work')}
              className="flex items-center gap-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded-lg font-semibold"
            >
              <Wrench size={11} /> ביצוע
            </button>
          )}
          {action === 'docs' && (
            <button
              onClick={() => onAction(repair.id, 'docs')}
              className="flex items-center gap-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 px-2 py-1 rounded-lg font-semibold"
            >
              <Camera size={11} /> תיעוד
            </button>
          )}
        </div>
        {age && (
          <p className={`text-xs mt-2 pt-1.5 border-t border-slate-100 ${age.color}`}>{age.label}</p>
        )}
      </div>
    </div>
  );
}

// ─── כרטיס Sortable ───────────────────────────────────────────────────────────
function SortableCard({ repair, customer, device, onAction, onOpenDetail, search }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: repair.id,
    data: { type: 'card', statusId: repair.status },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="relative"
      {...attributes}
    >
      {/* drag handle — רק כאן מחוברים listeners */}
      <div
        {...listeners}
        className="absolute bottom-2 left-2 z-10 p-1 cursor-grab touch-none text-slate-300 hover:text-slate-500"
        onClick={e => e.stopPropagation()}
        title="גרור"
      >
        <GripVertical size={13} />
      </div>
      <KanbanCard
        repair={repair}
        customer={customer}
        device={device}
        isDragging={isDragging}
        onAction={onAction}
        onOpenDetail={onOpenDetail}
        search={search}
      />
    </div>
  );
}

// ─── עמודת סטטוס ──────────────────────────────────────────────────────────────
function KanbanColumn({ statusId, repairs, customers, devices, collapsed, onToggleCollapse, onAction, onOpenDetail, search }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: statusId,
    data: { type: 'column' },
  });
  const { state } = useAppContext();
  const statusDisplay = getStatusDisplay(statusId, state.statusConfig);
  const cardIds = repairs.map(r => r.id);

  if (collapsed) {
    return (
      <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
        className="flex flex-col items-center gap-2 w-12 flex-shrink-0">
        <div className={`w-full rounded-xl ${statusDisplay.bg} ${statusDisplay.border} border p-2 flex flex-col items-center gap-1 cursor-pointer`}
          onClick={onToggleCollapse} title={statusDisplay.label}>
          <span className="text-base">{statusDisplay.emoji}</span>
          <span className={`text-xs font-bold ${statusDisplay.text}`}>{repairs.length}</span>
          <ChevronRight size={14} className={statusDisplay.text} />
        </div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex flex-col flex-shrink-0 w-72">
      <div className={`rounded-xl border ${statusDisplay.border} ${statusDisplay.bg} p-2.5 mb-2 flex items-center justify-between select-none`}
        {...attributes} {...listeners}>
        <div className="flex items-center gap-1.5">
          <GripVertical size={14} className={`${statusDisplay.text} opacity-50`} />
          <span>{statusDisplay.emoji}</span>
          <span className={`font-bold text-sm ${statusDisplay.text}`}>{statusDisplay.label}</span>
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full bg-white bg-opacity-60 ${statusDisplay.text}`}>
            {repairs.length}
          </span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
          className={`${statusDisplay.text} opacity-60 hover:opacity-100`} title="כווץ עמודה">
          <ChevronLeft size={14} />
        </button>
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-20 pb-2 pr-0.5" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {repairs.map(r => {
            const customer = customers.find(c => c.id === r.customer_id);
            const device = devices.find(d => d.id === r.device_id);
            return (
              <SortableCard key={r.id} repair={r} customer={customer} device={device} onAction={onAction} onOpenDetail={onOpenDetail} search={search} />
            );
          })}
          {repairs.length === 0 && (
            <div className="text-center text-xs text-slate-400 py-6 border-2 border-dashed border-slate-200 rounded-xl">ריק</div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── לוח ראשי ─────────────────────────────────────────────────────────────────
export default function KanbanBoard({ role = 'office' }) {
  const { state, dispatch } = useAppContext();
  const effectiveRole = role === 'admin' ? 'office' : role;
  const storageKey = 'kanban_columns_' + effectiveRole;

  const [columnOrder, setColumnOrder] = useState(() =>
    loadFromStorage(storageKey, DEFAULT_COLUMNS[effectiveRole] || DEFAULT_COLUMNS.office)
  );
  const [collapsed, setCollapsed] = useState({});
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState('newest');
  const [activeId, setActiveId] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [activeRepairId, setActiveRepairId] = useState(null);
  const [detailRepairId, setDetailRepairId] = useState(null);
  const columnsRef = useRef(null);

  const [cardOrders, setCardOrders] = useState(() => {
    const orders = {};
    columnOrder.forEach(statusId => {
      const saved = loadFromStorage('kanban_card_order_' + statusId, null);
      if (saved) orders[statusId] = saved;
    });
    return orders;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sortRepairs = useCallback((repairs, customers) => {
    const arr = [...repairs];
    switch (sortMode) {
      case 'newest': return arr.sort((a, b) => new Date(b.date_intake) - new Date(a.date_intake));
      case 'oldest': return arr.sort((a, b) => new Date(a.date_intake) - new Date(b.date_intake));
      case 'name': return arr.sort((a, b) => {
        const ca = customers.find(c => c.id === a.customer_id)?.name || '';
        const cb = customers.find(c => c.id === b.customer_id)?.name || '';
        return ca.localeCompare(cb, 'he');
      });
      case 'price': return arr.sort((a, b) => (b.final_price || 0) - (a.final_price || 0));
      default: return arr;
    }
  }, [sortMode]);

  const columnRepairs = useMemo(() => {
    const result = {};
    columnOrder.forEach(statusId => {
      const all = state.repairs.filter(r => r.status === statusId);
      if (sortMode !== 'manual') {
        result[statusId] = sortRepairs(all, state.customers);
      } else {
        const savedOrder = cardOrders[statusId];
        if (savedOrder) {
          const ordered = savedOrder.map(id => all.find(r => r.id === id)).filter(Boolean);
          const rest = all.filter(r => !savedOrder.includes(r.id))
            .sort((a, b) => new Date(a.date_intake) - new Date(b.date_intake));
          result[statusId] = [...ordered, ...rest];
        } else {
          result[statusId] = all.sort((a, b) => new Date(a.date_intake) - new Date(b.date_intake));
        }
      }
    });
    return result;
  }, [state.repairs, state.customers, columnOrder, cardOrders, sortMode, sortRepairs]);

  const saveColumnOrder = useCallback((order) => {
    setColumnOrder(order);
    saveToStorage(storageKey, order);
  }, [storageKey]);

  const saveCardOrder = useCallback((statusId, ids) => {
    setCardOrders(prev => ({ ...prev, [statusId]: ids }));
    saveToStorage('kanban_card_order_' + statusId, ids);
  }, []);

  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
    setActiveType(active.data.current?.type);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    setActiveType(null);
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'column') {
      if (active.id !== over.id) {
        const oldIdx = columnOrder.indexOf(active.id);
        const newIdx = columnOrder.indexOf(over.id);
        if (oldIdx !== -1 && newIdx !== -1) saveColumnOrder(arrayMove(columnOrder, oldIdx, newIdx));
      }
      return;
    }

    if (activeData?.type === 'card') {
      const fromStatus = activeData.statusId;
      let toStatus = overData?.statusId || overData?.id;
      if (!toStatus || !columnOrder.includes(toStatus)) {
        const overRepair = state.repairs.find(r => r.id === over.id);
        toStatus = overRepair?.status || fromStatus;
      }

      if (fromStatus === toStatus) {
        const ids = columnRepairs[fromStatus].map(r => r.id);
        const oldIdx = ids.indexOf(active.id);
        const newIdx = ids.indexOf(over.id);
        if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
          saveCardOrder(fromStatus, arrayMove(ids, oldIdx, newIdx));
          setSortMode('manual');
        }
      } else {
        dispatch({ type: 'UPDATE_REPAIR', payload: { id: active.id, status: toStatus } });
        const destIds = (columnRepairs[toStatus] || []).map(r => r.id);
        const overIdx = destIds.indexOf(over.id);
        const insertIdx = overIdx >= 0 ? overIdx : destIds.length;
        saveCardOrder(toStatus, [...destIds.slice(0, insertIdx), active.id, ...destIds.slice(insertIdx)]);
        saveCardOrder(fromStatus, columnRepairs[fromStatus].map(r => r.id).filter(id => id !== active.id));
      }
    }
  };

  const handleAction = (repairId, modal) => { setActiveRepairId(repairId); setActiveModal(modal); };
  const handleOpenDetail = (repairId) => setDetailRepairId(repairId);
  const toggleCollapse = (statusId) => setCollapsed(prev => ({ ...prev, [statusId]: !prev[statusId] }));
  const resetOrder = () => saveColumnOrder(DEFAULT_COLUMNS[effectiveRole] || DEFAULT_COLUMNS.office);

  const activeRepair = activeRepairId ? state.repairs.find(r => r.id === activeRepairId) : null;
  const detailRepair = detailRepairId ? state.repairs.find(r => r.id === detailRepairId) : null;
  const detailCustomer = detailRepair ? state.customers.find(c => c.id === detailRepair.customer_id) : null;
  const detailDevice = detailRepair ? state.devices.find(d => d.id === detailRepair.device_id) : null;
  const draggedRepair = activeId && activeType === 'card' ? state.repairs.find(r => r.id === activeId) : null;
  const draggedCustomer = draggedRepair ? state.customers.find(c => c.id === draggedRepair.customer_id) : null;
  const draggedDevice = draggedRepair ? state.devices.find(d => d.id === draggedRepair.device_id) : null;

  return (
    <div className="flex flex-col h-full -m-6 p-4">
      {/* סרגל עליון */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0 flex-wrap">
        <h1 className="text-xl font-bold text-slate-900">🗂️ תצוגת לוח</h1>
        <div className="relative">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש תיקון, לקוח..."
            className="border border-slate-300 rounded-lg pr-9 pl-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <select
          value={sortMode}
          onChange={e => setSortMode(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          <option value="manual">סדר ידני (גרירה)</option>
        </select>
        <button
          onClick={resetOrder}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-300 rounded-lg px-3 py-1.5"
          title="איפוס סדר עמודות"
        >
          <RotateCcw size={13} /> איפוס סדר
        </button>
        <span className="text-xs text-slate-400 mr-auto">
          {state.repairs.filter(r => columnOrder.includes(r.status)).length} תיקונים פעילים
        </span>
      </div>

      {/* לוח */}
      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
          <div ref={columnsRef} className="flex gap-3 overflow-x-auto pb-4 flex-1 items-start">
            {columnOrder.map(statusId => (
              <KanbanColumn
                key={statusId}
                statusId={statusId}
                repairs={columnRepairs[statusId] || []}
                customers={state.customers}
                devices={state.devices}
                collapsed={!!collapsed[statusId]}
                onToggleCollapse={() => toggleCollapse(statusId)}
                onAction={handleAction}
                onOpenDetail={handleOpenDetail}
                search={search}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {draggedRepair && (
            <div className="w-72 rotate-2 shadow-2xl">
              <KanbanCard repair={draggedRepair} customer={draggedCustomer} device={draggedDevice}
                isDragging={false} onAction={() => {}} onOpenDetail={() => {}} search="" />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {activeRepair && activeModal === 'diagnosis' && (
        <DiagnosisModal repair={activeRepair} onClose={() => { setActiveRepairId(null); setActiveModal(null); }} />
      )}
      {activeRepair && activeModal === 'work' && (
        <WorkSessionModal repair={activeRepair} onClose={() => { setActiveRepairId(null); setActiveModal(null); }} />
      )}
      {activeRepair && activeModal === 'docs' && (
        <ReleaseDocsModal repair={activeRepair} onClose={() => { setActiveRepairId(null); setActiveModal(null); }} />
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
      <FloatingScrollbar targetRef={columnsRef} />
    </div>
  );
}
