import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:   'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-sm',
  secondary: 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm',
  danger:    'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm',
  ghost:     'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-600',
  success:   'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-sm',
};

const SIZES = {
  xs: 'text-xs px-2.5 py-1 gap-1',
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-base px-5 py-2.5 gap-2',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconEnd,
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-semibold rounded-lg transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        ${VARIANTS[variant] || VARIANTS.primary}
        ${SIZES[size] || SIZES.md}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0 leading-none">{icon}</span>
      ) : null}
      {children}
      {!loading && iconEnd && <span className="shrink-0 leading-none">{iconEnd}</span>}
    </button>
  );
}
