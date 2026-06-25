import { useAppContext } from '../store/AppContext';
import { getStatusDisplay } from '../utils/statusConfig';

export default function StatusBadge({ status, size = 'md' }) {
  const { state } = useAppContext();
  const { label, emoji, bg, text, border } = getStatusDisplay(status, state.statusConfig);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${bg} ${text} ${border} ${sizeClasses[size]}`}>
      <span>{emoji}</span>
      <span>{label}</span>
    </span>
  );
}
