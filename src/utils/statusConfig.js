import { STATUS_LABELS, STATUS_COLORS } from '../constants/statuses';

export const COLOR_MAP = {
  red:    { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  green:  { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300' },
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300' },
  slate:  { bg: 'bg-slate-200',  text: 'text-slate-700',  border: 'border-slate-400' },
};

export function getStatusDisplay(statusId, statusConfig) {
  const found = statusConfig?.find(s => s.id === statusId);
  if (found) {
    return {
      label: found.label,
      emoji: found.emoji,
      ...(COLOR_MAP[found.color] || COLOR_MAP.slate),
    };
  }
  const colors = STATUS_COLORS[statusId] || { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', emoji: '⚪' };
  return {
    label: STATUS_LABELS[statusId] || statusId,
    emoji: colors.emoji,
    bg: colors.bg,
    text: colors.text,
    border: colors.border,
  };
}

export const DEFAULT_STATUS_CONFIG = [
  { id: 'red_intake',              label: 'קליטה',                 emoji: '🔴', color: 'red',    is_system: true },
  { id: 'yellow_diagnosis',        label: 'באבחון',                emoji: '🟡', color: 'yellow', is_system: true },
  { id: 'yellow_appeal',           label: 'ערעור אחריות',          emoji: '⚠️', color: 'orange', is_system: true },
  { id: 'yellow_waiting_approval', label: 'ממתין אישור לקוח',      emoji: '🟡', color: 'yellow', is_system: true },
  { id: 'yellow_ready_to_work',    label: 'מוכן לעבודה',           emoji: '🟢', color: 'green',  is_system: true },
  { id: 'in_work',                 label: 'בעבודה',                emoji: '⚙️', color: 'blue',   is_system: true },
  { id: 'pending_release_docs',    label: 'ממתין תיעוד תקינות',    emoji: '📸', color: 'orange', is_system: true },
  { id: 'pending_payment',         label: 'ממתין תשלום',           emoji: '💰', color: 'orange', is_system: true },
  { id: 'green_complete',          label: 'הושלם',                 emoji: '✅', color: 'green',  is_system: true },
  { id: 'red_cancelled',           label: 'בוטל',                  emoji: '❌', color: 'slate',  is_system: true },
];
