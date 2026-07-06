import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { getTotalStock } from '../utils/fifo';
import { filterPartsForDevice } from '../utils/deviceCompat';
import Modal from './Modal';
import PartThumbnail from './PartThumbnail';
import PartQuickModal from './PartQuickModal';
import EmptyState from './EmptyState';
import { Package } from 'lucide-react';

// רשימת חלקים תואמים למכשיר ספציפי (כולל חלקים כלליים) — נפתח מכרטיס מכשיר
export default function DeviceCompatiblePartsModal({ device, onClose }) {
  const { state } = useAppContext();
  const [viewingPart, setViewingPart] = useState(null);

  const compatibleParts = filterPartsForDevice(state.parts, device);

  return (
    <>
      <Modal
        open={true}
        onClose={onClose}
        title="חלקים מתאימים"
        subtitle={`${device?.brand || ''} ${device?.model || ''}`.trim() || device?.type}
        maxWidth="max-w-2xl"
      >
        {compatibleParts.length === 0 ? (
          <EmptyState icon={Package} title="לא נמצאו חלקים תואמים" description="אין חלקים משויכים למכשיר זה במלאי" />
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
