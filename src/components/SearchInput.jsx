import { Search, X } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'חיפוש...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-slate-300 rounded-lg pr-9 pl-8 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400
          placeholder:text-slate-400 transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
