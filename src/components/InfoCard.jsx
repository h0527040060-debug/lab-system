export default function InfoCard({ title, icon: Icon, children, className = '' }) {
  return (
    <div className={`bg-slate-50 border border-slate-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon size={16} className="text-slate-500" />}
        <h4 className="text-xs font-bold text-slate-700 uppercase">{title}</h4>
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
