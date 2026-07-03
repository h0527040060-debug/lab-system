import { useRef, useState } from 'react';
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

// צבע ה-ripple לפי variant
const RIPPLE_COLOR = {
  primary:   'bg-white/30',
  secondary: 'bg-slate-400/20',
  danger:    'bg-white/30',
  ghost:     'bg-slate-400/20',
  success:   'bg-white/30',
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
  onClick,
  ...props
}) {
  const isDisabled = disabled || loading;
  const btnRef = useRef(null);
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    if (isDisabled) return;

    // ripple effect
    const rect = btnRef.current.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const id = Date.now();
    setRipples(r => [...r, { id, x, y, size }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 520);

    onClick?.(e);
  };

  return (
    <button
      ref={btnRef}
      disabled={isDisabled}
      onClick={handleClick}
      className={`
        relative overflow-hidden
        inline-flex items-center justify-center font-semibold rounded-lg transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        ${VARIANTS[variant] || VARIANTS.primary}
        ${SIZES[size] || SIZES.md}
        ${className}
      `}
      {...props}
    >
      {/* ripple layers */}
      {ripples.map(rp => (
        <span
          key={rp.id}
          className={`absolute rounded-full pointer-events-none animate-ripple ${RIPPLE_COLOR[variant] || 'bg-white/20'}`}
          style={{ width: rp.size, height: rp.size, top: rp.y, left: rp.x }}
        />
      ))}

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
