import { useState } from 'react';
import { X, MapPin, Barcode, Tag, Truck, BookOpen, Layers } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { formatMoney } from '../utils/formatters';
import { getTotalStock } from '../utils/fifo';
import { getDefaultSupplier, isPartLowStock, calculateWeightedAvgCost } from '../utils/inventory';
import ImageGalleryModal from './ImageGalleryModal';
import AssemblyInstructionsViewer from './AssemblyInstructionsViewer';

// כרטיס מוצר מהיר — תצוגה בלבד עם תמונות, לצורך הצגה למוכר בחנות החלקים
export default function PartQuickModal({ part, onClose }) {
  const { state } = useAppContext();
  const [galleryIndex, setGalleryIndex] = useState(null);
  const [showAssembly, setShowAssembly] = useState(false);
  if (!part) return null;

  const realImages = (part.images || []).filter(img => img && (img.startsWith('data:image/') || img.startsWith('http')));
  const stock = getTotalStock(part.id, state.stockBatches);
  const lowStock = isPartLowStock(part, state.stockBatches);
  const supplier = getDefaultSupplier(part);
  const avgCost = calculateWeightedAvgCost(part.id, state.stockBatches);
  const sellingPrice = part.selling_price || (avgCost * (1 + (part.selling_markup_percent || 0) / 100));
  const hasAssembly = part.assembly_instructions?.text || part.assembly_instructions?.images?.length > 0 || part.assembly_instructions?.video_url;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="min-w-0">
              <h2 className="font-bold text-lg text-slate-800 truncate">{part.name}</h2>
              {part.manufacturer_sku && <p className="text-xs text-slate-500 truncate">{part.manufacturer_sku}</p>}
            </div>
            <button onClick={onClose} aria-label="סגור" className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 flex-shrink-0">
              <X size={18} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* תמונות */}
            {realImages.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {realImages.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={part.name}
                    onClick={() => setGalleryIndex(i)}
                    className="w-24 h-24 object-contain rounded-lg border border-slate-200 bg-slate-50 cursor-zoom-in hover:border-orange-300"
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-5xl">{part.images?.[0] || '📦'}</span>
              </div>
            )}

            {/* פרטים */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {part.internal_barcode && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Barcode size={14} className="text-slate-400 shrink-0" />
                  <span className="font-mono text-xs">{part.internal_barcode}</span>
                </div>
              )}
              {part.category && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Tag size={14} className="text-slate-400 shrink-0" />
                  <span>{part.category}</span>
                </div>
              )}
              {(part.shelf || part.zone) && (
                <div className="flex items-center gap-2 text-slate-700 col-span-2">
                  <MapPin size={14} className="text-slate-400 shrink-0" />
                  <span>
                    {part.shelf && `מדף ${part.shelf}`}{part.bin && `, תא ${part.bin}`}{part.zone && ` (${part.zone})`}
                  </span>
                </div>
              )}
            </div>

            {/* מלאי ומחיר */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Layers size={13} className="text-slate-500" />
                  <p className="text-xs text-slate-500">מלאי נוכחי</p>
                </div>
                <p className={`font-bold text-xl ${lowStock ? 'text-red-600' : stock > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                  {stock}
                </p>
                <p className="text-xs text-slate-500">מינ׳ {part.min_stock || 0}{lowStock && ' • חוסר'}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xs text-green-700 mb-1">מחיר ללקוח</p>
                <p className="font-bold text-xl text-green-700">{formatMoney(sellingPrice)}</p>
                <p className="text-xs text-slate-500">עלות: {formatMoney(avgCost)}</p>
              </div>
            </div>

            {/* ספק */}
            {supplier && (
              <div className="flex items-center gap-2 text-sm bg-slate-50 rounded-xl p-3">
                <Truck size={14} className="text-slate-400 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800">{supplier.supplier_name}</p>
                  <p className="text-xs text-slate-500">{formatMoney(supplier.price)}</p>
                </div>
              </div>
            )}

            {part.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-slate-700">
                {part.notes}
              </div>
            )}

            {hasAssembly && (
              <button
                onClick={() => setShowAssembly(true)}
                className="w-full flex items-center justify-center gap-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-3 py-2 rounded-xl border border-blue-200"
              >
                <BookOpen size={15} /> הצג הוראות הרכבה
              </button>
            )}
          </div>
        </div>
      </div>

      {galleryIndex !== null && (
        <ImageGalleryModal
          images={realImages}
          startIndex={galleryIndex}
          altText={part.name}
          onClose={() => setGalleryIndex(null)}
        />
      )}
      {showAssembly && (
        <AssemblyInstructionsViewer part={part} onClose={() => setShowAssembly(false)} />
      )}
    </>
  );
}
