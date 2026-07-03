import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../store/AppContext';
import { setSearchBridge } from '../utils/searchBridge';
import { Search, Wrench, Users, Package, Monitor } from 'lucide-react';

const TYPE_LABEL = { customer: 'לקוח', repair: 'תיקון', device: 'מכשיר' };
const TYPE_ICON = { customer: Users, repair: Wrench, device: Package };

export function CommandPalette({ isOpen, onClose, onNavigate }) {
  const { state } = useAppContext();
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const results = [];

  if (q) {
    state.customers
      .filter(c => c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.id?.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach(c => results.push({ type: 'customer', label: c.name, sub: c.phone, nav: 'customers' }));

    state.repairs
      .filter(r => {
        const cust = state.customers.find(c => c.id === r.customer_id);
        return r.id.toLowerCase().includes(q) || cust?.name?.toLowerCase().includes(q) || r.complaint?.toLowerCase().includes(q);
      })
      .slice(0, 3)
      .forEach(r => {
        const cust = state.customers.find(c => c.id === r.customer_id);
        results.push({ type: 'repair', label: r.id, sub: cust?.name || '', nav: 'repairs' });
      });

    state.devices
      .filter(d => d.id.toLowerCase().includes(q) || d.brand?.toLowerCase().includes(q) || d.model?.toLowerCase().includes(q) || d.manufacturer_serial?.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach(d => results.push({ type: 'device', label: `${d.brand} ${d.model}`, sub: d.id, nav: 'devices' }));
  }

  const jumpToSearch = () => {
    setSearchBridge(query);
    onNavigate('search');
    onClose();
  };

  const handleSelect = (item) => {
    setSearchBridge(query);
    onNavigate('search');
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { setSelectedIdx(i => Math.min(i + 1, results.length - 1)); e.preventDefault(); return; }
    if (e.key === 'ArrowUp') { setSelectedIdx(i => Math.max(i - 1, 0)); e.preventDefault(); return; }
    if (e.key === 'Enter') {
      if (results[selectedIdx]) handleSelect(results[selectedIdx]);
      else if (query) jumpToSearch();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-[12vh] px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* שורת חיפוש */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Search size={18} className="text-orange-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKeyDown}
            placeholder="חיפוש מהיר — לקוח, תיקון, מכשיר..."
            className="flex-1 text-sm outline-none placeholder-slate-400 bg-transparent"
            dir="rtl"
          />
          <kbd className="text-xs text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 font-mono">Esc</kbd>
        </div>

        {/* תוצאות */}
        {results.length > 0 && (
          <ul className="max-h-72 overflow-y-auto py-2">
            {results.map((item, i) => {
              const Icon = TYPE_ICON[item.type] || Monitor;
              const active = i === selectedIdx;
              return (
                <li key={i}>
                  <button
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIdx(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors ${
                      active ? 'bg-orange-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={15} className={`shrink-0 ${active ? 'text-orange-500' : 'text-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-tight ${active ? 'text-orange-700' : 'text-slate-800'}`}>{item.label}</p>
                      {item.sub && <p className="text-xs text-slate-500 truncate">{item.sub}</p>}
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{TYPE_LABEL[item.type]}</span>
                  </button>
                </li>
              );
            })}
            {query && (
              <li>
                <button
                  onClick={jumpToSearch}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-right hover:bg-slate-50 border-t border-slate-100 transition-colors"
                >
                  <Search size={15} className="text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-600">חיפוש מלא עבור <strong className="text-slate-800">"{query}"</strong></span>
                </button>
              </li>
            )}
          </ul>
        )}

        {/* ריק */}
        {query && results.length === 0 && (
          <div className="py-6 text-center">
            <p className="text-slate-400 text-sm mb-3">לא נמצאו תוצאות</p>
            <button onClick={jumpToSearch} className="text-orange-500 text-sm hover:underline">
              חיפוש מלא עבור "{query}"
            </button>
          </div>
        )}

        {/* footer hint */}
        {!query && (
          <div className="px-4 py-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100">
            <span>הקלד לחיפוש מהיר</span>
            <span className="flex items-center gap-1">
              <kbd className="border border-slate-200 rounded px-1 font-mono">↑↓</kbd> ניווט
              <span className="mx-1">·</span>
              <kbd className="border border-slate-200 rounded px-1 font-mono">Enter</kbd> בחר
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
