import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
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
import { STATUS_LABELS, STATUS_COLORS, REPAIR_STATUSES } from '../../constants/statuses';
import { getStatusDisplay } from '../../utils/statusConfig';
import { formatDateTime } from '../../utils/formatters';
import WhatsAppButton from '../../components/WhatsAppButton';
import DiagnosisModal from '../../components/DiagnosisModal';
import WorkSessionModal from '../../components/WorkSessionModal';
import ReleaseDocsModal from '../../components/ReleaseDocsModal';
import { Stethoscope, Wrench, Camera, RotateCcw, Search, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';

// סטטוסים ברירת מחדל לפי תפקיד
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

const getActionForStatus = (status) => {
  if ([REPAIR_STATUSES.RED_INTAKE, REPAIR_STATUSES.YELLOW_DIAGNOSIS, REPAIR_STATUSES.YELLOW_APPEAL].includes(status))
    return 'diagnosis';
  if ([REPAIR_STATUSES.YELLOW_READY_TO_WORK, REPAIR_STATUSES.IN_WORK].includes(status))
    return 'work';
  if (status === REPAIR_STATUSES.PENDING_RELEASE_DOCS)
    return 'docs';
  return null;
};

// ─── כרטיס תיקון ──────────────────────────────────────────────────────────────
function KanbanCard({ repair, customer, device, isDragging, onAction, search }) {
  const { state } = useAppContext();
  const statusDisplay = getStatusDisplay(repair.status, state.statusConfig);
  const action = getActionForStatus(repair.status);
  const dimmed = search && !(
    repair.id.toLowerCase().includes(search.toLowerCase()) ||
    customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    device?.brand?.toLowerCase().includes(search.toLowerCase()) ||
    device?.model?.toLowerCase().includes(search.toLowerCase()) ||
    repair.complaint?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all
        ${isDragging ? 'opacity-50 rotate-1 shadow-lg' : ''}
        ${dimmed ? 'opacity-20' : 'opacity-100'}
      `}
    >
      <div className={`h-1 ${statusDisplay.bg.replace('bg-', 'bg-').replace('-100', '-400')}`} />
      <div className="p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-xs font-bold text-orange-600">{repair.id}</span>
          <span className="text-xs text-slate-400">{formatDateTime(repair.date_intake).slice(0, 10)}</span>
        </div>
        <p className="font-semibold text-sm text-slate-800 truncate">{customer?.name || '—'}</p>
        <p className="text-xs text-slate-500 truncate">{device?.brand} {device?.model}</p>
        {repair.complaint && (
          <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">{repair.complaint}</p>
        )}
        <div className="flex gap-1 mt-2 flex-wrap">
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
      </div>
    </div>
  );
}

// ─── כרטיס Sortable ───────────────────────────────────────────────────────────
function SortableCard({ repair, customer, device, onAction, search }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: repair.id,
    data: { type: 'card', statusId: repair.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard
        repair={repair}
        customer={customer}
        device={device}
        isDragging={isDragging}
        onAction={onAction}
        search={search}
      />
    </div>
  );
}

// ─── עמודת סטטוס ──────────────────────────────────────────────────────────────
function KanbanColumn({ statusId, repairs, customers, devices, collapsed, onToggleCollapse, onAction, search }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: statusId,
    data: { type: 'column' },
  });

  const { state } = useAppContext();
  const statusDisplay = getStatusDisplay(statusId, state.statusConfig);
  const cardIds = repairs.map(r => r.id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (collapsed) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex flex-col items-center gap-2 w-12 flex-shrink-0"
      >
        <div
          className={`w-full rounded-xl ${statusDisplay.bg} ${statusDisplay.border} border p-2 flex flex-col items-center gap-1 cursor-pointer`}
          onClick={onToggleCollapse}
          title={statusDisplay.label}
        >
          <span className="text-base">{statusDisplay.emoji}</span>
          <span className={`text-xs font-bold ${statusDisplay.text}`}>{repairs.length}</span>
          <ChevronRight size={14} className={statusDisplay.text} />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col flex-shrink-0 w-72"
    >
      <div
        className={`rounded-xl border ${statusDisplay.border} ${statusDisplay.bg} p-2.5 mb-2 flex items-center justify-between select-none`}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-1.5">
          <GripVertical size={14} className={`${statusDisplay.text} opacity-50`} />
          <span>{statusDisplay.emoji}</span>
          <span className={`font-bold text-sm ${statusDisplay.text}`}>{statusDisplay.label}</span>
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full bg-white bg-opacity-60 ${statusDisplay.text}`}>
            {repairs.length}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
          className={`${statusDisplay.text} opacity-60 hover:opacity-100`}
          title="כווץ עמודה"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-20 pb-2 pr-0.5" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {repairs.map(r => {
            const customer = customers.find(c => c.id === r.customer_id);
            const device = devices.find(d => d.id === r.device_id);
            return (
              <SortableCard
                key={r.id}
                repair={r}
                customer={customer}
                device={device}
                onAction={onAction}
                search={search}
              />
            );
          })}
          {repairs.length === 0 && (
            <div className="text-center text-xs text-slate-400 py-6 border-2 border-dashed border-slate-200 rounded-xl">
              ריק
            </div>
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
  const [activeId, setActiveId] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [activeRepairId, setActiveRepairId] = useState(null);

  // סדר כרטיסים לכל עמודה
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

  // בניית רשימת תיקונים לכל עמודה (ממוינת לפי סדר שמור)
  const columnRepairs = useMemo(() => {
    const result = {};
    columnOrder.forEach(statusId => {
      const all = state.repairs.filter(r => r.status === statusId);
      const savedOrder = cardOrders[statusId];
      if (savedOrder) {
        const ordered = savedOrder
          .map(id => all.find(r => r.id === id))
          .filter(Boolean);
        const rest = all.filter(r => !savedOrder.includes(r.id))
          .sort((a, b) => new Date(a.date_intake) - new Date(b.date_intake));
        result[statusId] = [...ordered, ...rest];
      } else {
        result[statusId] = all.sort((a, b) => new Date(a.date_intake) - new Date(b.date_intake));
      }
    });
    return result;
  }, [state.repairs, columnOrder, cardOrders]);

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
      // גרירת עמודה
      if (active.id !== over.id) {
        const oldIdx = columnOrder.indexOf(active.id);
        const newIdx = columnOrder.indexOf(over.id);
        if (oldIdx !== -1 && newIdx !== -1) {
          saveColumnOrder(arrayMove(columnOrder, oldIdx, newIdx));
        }
      }
      return;
    }

    if (activeData?.type === 'card') {
      const fromStatus = activeData.statusId;
      // מציאת הסטטוס היעד
      let toStatus = overData?.statusId || overData?.id;
      if (!toStatus || !columnOrder.includes(toStatus)) {
        // over הוא כרטיס — מוצאים את הסטטוס שלו
        const overRepair = state.repairs.find(r => r.id === over.id);
        toStatus = overRepair?.status || fromStatus;
      }

      if (fromStatus === toStatus) {
        // גרירה בתוך אותה עמודה
        const ids = columnRepairs[fromStatus].map(r => r.id);
        const oldIdx = ids.indexOf(active.id);
        const newIdx = ids.indexOf(over.id);
        if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
          saveCardOrder(fromStatus, arrayMove(ids, oldIdx, newIdx));
        }
      } else {
        // גרירה בין עמודות — עדכון סטטוס
        dispatch({ type: 'UPDATE_REPAIR', payload: { id: active.id, status: toStatus } });
        // עדכון סדר כרטיסים ביעד
        const destIds = (columnRepairs[toStatus] || []).map(r => r.id);
        const overIdx = destIds.indexOf(over.id);
        const insertIdx = overIdx >= 0 ? overIdx : destIds.length;
        const newDestIds = [...destIds.slice(0, insertIdx), active.id, ...destIds.slice(insertIdx)];
        saveCardOrder(toStatus, newDestIds);
        // הסר מסדר מקור
        const srcIds = columnRepairs[fromStatus].map(r => r.id).filter(id => id !== active.id);
        saveCardOrder(fromStatus, srcIds);
      }
    }
  };

  const handleAction = (repairId, modal) => {
    setActiveRepairId(repairId);
    setActiveModal(modal);
  };

  const toggleCollapse = (statusId) => {
    setCollapsed(prev => ({ ...prev, [statusId]: !prev[statusId] }));
  };

  const resetOrder = () => {
    const def = DEFAULT_COLUMNS[effectiveRole] || DEFAULT_COLUMNS.office;
    saveColumnOrder(def);
  };

  const activeRepair = activeRepairId ? state.repairs.find(r => r.id === activeRepairId) : null;

  // כרטיס overlay בזמן גרירה
  const draggedRepair = activeId && activeType === 'card'
    ? state.repairs.find(r => r.id === activeId)
    : null;
  const draggedCustomer = draggedRepair ? state.customers.find(c => c.id === draggedRepair.customer_id) : null;
  const draggedDevice = draggedRepair ? state.devices.find(d => d.id === draggedRepair.device_id) : null;

  return (
    <div className="flex flex-col h-full -m-6 p-4">
      {/* סרגל עליון */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-slate-900">🗂️ תצוגת לוח</h1>
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש תיקון, לקוח..."
            className="w-full border border-slate-300 rounded-lg pr-9 pl-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
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
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-3 overflow-x-auto pb-4 flex-1 items-start">
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
                search={search}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {draggedRepair && (
            <div className="w-72 rotate-2 shadow-2xl">
              <KanbanCard
                repair={draggedRepair}
                customer={draggedCustomer}
                device={draggedDevice}
                isDragging={false}
                onAction={() => {}}
                search=""
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* מודאלים */}
      {activeRepair && activeModal === 'diagnosis' && (
        <DiagnosisModal repair={activeRepair} onClose={() => { setActiveRepairId(null); setActiveModal(null); }} />
      )}
      {activeRepair && activeModal === 'work' && (
        <WorkSessionModal repair={activeRepair} onClose={() => { setActiveRepairId(null); setActiveModal(null); }} />
      )}
      {activeRepair && activeModal === 'docs' && (
        <ReleaseDocsModal repair={activeRepair} onClose={() => { setActiveRepairId(null); setActiveModal(null); }} />
      )}
    </div>
  );
}
