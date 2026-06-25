import { STATUS_LABELS, STATUS_COLORS } from '../constants/statuses';

export default function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_COLORS[status] || { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', emoji: '⚪' };
  const label = STATUS_LABELS[status] || 'לא ידוע';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}>
      <span>{config.emoji}</span>
      <span>{label}</span>
    </span>
  );
}
