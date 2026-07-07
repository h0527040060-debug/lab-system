import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { getTotalStock } from '../utils/fifo';
import { isPartAssignedToDevice } from '../utils/deviceCompat';
import Modal from './Modal';
import SearchInput from './SearchInput';
import PartThumbnail from './PartThumbnail';
import PartQuickModal from './PartQuickModal';
import EmptyState from './EmptyState';
import { Package, Edit2, CheckSquare, Square } from 'lucide-react';

// רשימת חלקים ששויכו במפורש למכשיר ספציפי (לא כולל חלקים כלליים — אלה מיועדים לאבחון/עבודה בלבד) — נפתח מכרטיס מכשיר.
// startInEditMode: פותח ישר במצב עריכה (למשל מתוך עריכת מכשיר).
export default function DeviceCompatiblePartsModal({ device, onClose, startInEditMode = false }) {
  const { state, dispatch } = useAppContext();
  const [viewingPart, setViewingPart] = useState(null);
  const [editMode, setEditMode] = useState(startInEditMode);
  const [search, setSearch] = useState('');

  const compatibleParts = state.parts.filter(p => isPartAssignedToDevice(p, device));
  const isAssignedToThisDevice = (part) => isPartAssignedToDevice(part, device);

  const togglePartForDevice = (part) => {
    const cd = part.compatible_devices || [];
    const matchIdx = cd.findIndex(
      d => d.brand?.toLowerCase() === device.brand?.toLowerCase() && d.model?.toLowerCase() === device.model?.toLowerCase()
    );
    const newCd = matchIdx >= 0
      ? cd.filter((_, i) => i !== matchIdx)
      : [...cd, { brand: device.brand, model: device.model }];
    dispatch({ type: 'UPDATE_PART', payload: { id: part.id, compatible_devices: newCd } });
  };

  const editList = state.parts.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.name?.toLowerCase().includes(s) || p.manufacturer?.toLowerCase().includes(s);
  });

  return (
    <>
      <Modal
        open={true}
        onClose={onClose}
        title="חלקים מתאימים"
        subtitle={`${device?.brand || ''} ${device?.model || ''}`.trim() || device?.type}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end">
            <button
              onClick={() => setEditMode(v => !v)}
              className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              <Edit2 size={14} />
              {editMode ? 'סיים עריכה' : 'ערוך רשימת חלקים'}
            </button>
          </div>
        }
      >
        {editMode ? (
          <div>
            <p className="text-xs text-slate-500 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-3">
              סמן חלקים ששייכים למכשיר זה. חלק "כללי" (ללא שיוך לאף מכשיר) משמש באבחון ובעבודה
              בלבד, ולא מוצג כאן אוטומטית — סימון אותו כאן משייך אותו במפורש למכשיר זה.
            </p>
            <SearchInput value={search} onChange={setSearch} placeholder="חיפוש חלק..." />
            <div className="space-y-1 mt-2 max-h-96 overflow-y-auto">
              {editList.map(p => {
                const isGeneral = !p.compatible_devices || p.compatible_devices.length === 0;
                const assigned = isAssignedToThisDevice(p);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePartForDevice(p)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg border text-right ${assigned ? 'bg-orange-50 border-orange-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                  >
                    {assigned ? <CheckSquare size={18} className="text-orange-600 shrink-0" /> : <Square size={18} className="text-slate-400 shrink-0" />}
                    <PartThumbnail part={p} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.manufacturer}</p>
                    </div>
                    {isGeneral && !assigned && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">כללי</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : compatibleParts.length === 0 ? (
          <EmptyState icon={Package} title="לא נמצאו חלקים משויכים" description="אין חלקים ששויכו במפורש למכשיר זה — לחצו 'ערוך רשימת חלקים' כדי לשייך" />
        ) : (
          <div className="space-y-1.5">
            {compatibleParts.map(p => {
              const stock = getTotalStock(p.id, state.stockBatches);
              return (
                <button
                  key={p.id}
                  onClick={() => setViewingPart(p)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-right"
                >
                  <PartThumbnail part={p} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.manufacturer}</p>
                  </div>
                  <span className={`text-xs font-bold shrink-0 ${stock === 0 ? 'text-red-600' : 'text-green-600'}`}>
                    מלאי: {stock}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Modal>
      {viewingPart && <PartQuickModal part={viewingPart} onClose={() => setViewingPart(null)} />}
    </>
  );
}
