import { useState, useRef, useEffect } from 'react';

export default function AutocompleteInput({
  value,
  onChange,
  suggestions = [],
  placeholder = '',
  allowNew = false,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = suggestions.filter(s =>
    s && s.toLowerCase().includes((value || '').toLowerCase())
  );
  const showAddNew = allowNew && value && !suggestions.some(s => s?.toLowerCase() === value.toLowerCase());

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded-lg px-3 py-2"
        autoComplete="off"
      />
      {open && (filtered.length > 0 || showAddNew) && (
        <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
          {filtered.map(s => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={() => select(s)}
                className="w-full text-right px-3 py-2 text-sm hover:bg-orange-50 hover:text-orange-800"
              >
                {s}
              </button>
            </li>
          ))}
          {showAddNew && (
            <li>
              <button
                type="button"
                onMouseDown={() => select(value)}
                className="w-full text-right px-3 py-2 text-sm text-orange-600 font-semibold hover:bg-orange-50 border-t border-slate-100"
              >
                + הוסף: {value}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
