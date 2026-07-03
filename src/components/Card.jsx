/**
 * Card — כרטיס בסיסי עם גרסאות hover ו-clickable
 */

export function Card({ children, className = '', hover = false, onClick, padding = 'p-4' }) {
  const base = `bg-white rounded-xl border border-slate-200 shadow-sm ${padding}`;
  const hoverClasses = hover || onClick ? 'card-hover cursor-pointer' : '';
  return (
    <div className={`${base} ${hoverClasses} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      <div>
        <h3 className="text-base font-semibold text-slate-800 leading-tight">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardDivider() {
  return <hr className="border-slate-200 my-3" />;
}

export function SectionCard({ title, action, children, className = '' }) {
  return (
    <Card className={className}>
      {title && (
        <>
          <CardHeader title={title} action={action} className="mb-3" />
          <CardDivider />
        </>
      )}
      {children}
    </Card>
  );
}
