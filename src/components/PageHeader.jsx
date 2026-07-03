export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-5 gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-slate-900 leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
