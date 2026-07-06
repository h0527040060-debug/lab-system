import { useAppContext } from '../store/AppContext';

// תצוגת תמונה ממוזערת למכשיר — לפי תמונת הדגם הראשית בקטלוג (מקביל ל-PartThumbnail)
export default function DeviceThumbnail({ device, size = 'sm', className = '', onClick }) {
  const { state } = useAppContext();

  const model = state.models.find(m =>
    m.name.toLowerCase() === (device?.model || '').toLowerCase() &&
    state.manufacturers.find(mf => mf.id === m.manufacturer_id)?.name.toLowerCase() === (device?.brand || '').toLowerCase()
  );
  const mainIdx = model?.main_image_index || 0;
  const mainImage = model?.images?.[mainIdx];
  const isRealImage = mainImage && (mainImage.startsWith('data:image/') || mainImage.startsWith('http'));

  const sizeClass = {
    xs: 'w-6 h-6',
    sm: 'w-9 h-9',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32',
  }[size] || 'w-9 h-9';

  const inner = isRealImage ? (
    <div className={`${sizeClass} bg-slate-100 rounded border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center relative ${className}`}>
      <img src={mainImage} alt={device?.model || ''} className="w-full h-full object-contain" />
      {onClick && <span className="absolute inset-0 bg-black/0 hover:bg-black/15 transition-colors" />}
    </div>
  ) : (
    <div className={`${sizeClass} bg-slate-100 rounded border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400 ${className}`}>
      🔧
    </div>
  );

  return onClick ? (
    <button type="button" onClick={onClick} className="cursor-pointer flex-shrink-0" title="הצג פרטי מכשיר">
      {inner}
    </button>
  ) : inner;
}
