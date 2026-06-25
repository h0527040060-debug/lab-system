// תצוגת תמונה/אמוג'י לחלק — תומך גם בbase64 וגם בירושה של אמוג'י
export default function PartThumbnail({ part, size = 'sm', className = '' }) {
  const mainIdx = part?.main_image_index || 0;
  const mainImage = part?.images?.[mainIdx];
  const isRealImage = mainImage && mainImage.startsWith('data:image/');

  const sizeClass = {
    xs: 'w-6 h-6',
    sm: 'w-9 h-9',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32',
  }[size] || 'w-9 h-9';

  const emojiSize = {
    xs: 'text-base',
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  }[size] || 'text-2xl';

  if (isRealImage) {
    return (
      <div className={`${sizeClass} bg-slate-100 rounded border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center ${className}`}>
        <img src={mainImage} alt={part?.name || ''} className="w-full h-full object-contain" />
      </div>
    );
  }

  return (
    <span className={`${emojiSize} flex-shrink-0 ${className}`}>
      {mainImage || '📦'}
    </span>
  );
}
