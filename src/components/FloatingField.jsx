/**
 * FloatingField — שדות טופס עם floating label
 *
 * הלייבל יושב בתוך השדה ו"צף" למעלה בעדינות כשהשדה פעיל/מלא.
 * משתמש ב-CSS peer trick של Tailwind.
 *
 * שימוש:
 *   <FloatingInput label="שם לקוח" value={name} onChange={e => setName(e.target.value)} required />
 *   <FloatingSelect label="סטטוס" value={status} onChange={...}><option>...</option></FloatingSelect>
 *   <FloatingTextarea label="הערות" value={notes} onChange={...} />
 */

const BASE = `
  peer w-full rounded-xl border border-slate-300 bg-white
  px-3 pb-2 pt-6 text-sm text-slate-800
  placeholder-transparent
  focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400
  disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
  transition-colors
`.replace(/\s+/g, ' ').trim();

const LABEL = `
  absolute right-3 top-2 text-xs font-medium text-slate-500
  transition-all duration-150
  peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400
  peer-focus:top-2 peer-focus:text-xs peer-focus:text-orange-500
`.replace(/\s+/g, ' ').trim();

const LABEL_ERROR = `
  absolute right-3 top-2 text-xs font-medium text-red-500
  transition-all duration-150
  peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-red-400
  peer-focus:top-2 peer-focus:text-xs peer-focus:text-red-500
`.replace(/\s+/g, ' ').trim();

function Wrapper({ label, required, hint, error, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="relative">{children}</div>
      {hint && !error && <p className="text-xs text-slate-400 px-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 px-1">{error}</p>}
    </div>
  );
}

export function FloatingInput({ label, required, hint, error, className = '', id, ...props }) {
  const fieldId = id || `ff-${label}`;
  return (
    <Wrapper label={label} required={required} hint={hint} error={error} className={className}>
      <input
        id={fieldId}
        placeholder=" "
        className={`${BASE} ${error ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : ''}`}
        {...props}
      />
      <label htmlFor={fieldId} className={error ? LABEL_ERROR : LABEL}>
        {label}{required && <span className="text-red-400 mr-0.5">*</span>}
      </label>
    </Wrapper>
  );
}

export function FloatingSelect({ label, required, hint, error, className = '', id, children, ...props }) {
  const fieldId = id || `ff-${label}`;
  return (
    <Wrapper label={label} required={required} hint={hint} error={error} className={className}>
      <select
        id={fieldId}
        className={`${BASE} ${error ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : ''}`}
        {...props}
      >
        {children}
      </select>
      <label htmlFor={fieldId} className="absolute right-3 top-2 text-xs font-medium text-orange-500 pointer-events-none">
        {label}{required && <span className="text-red-400 mr-0.5">*</span>}
      </label>
    </Wrapper>
  );
}

export function FloatingTextarea({ label, required, hint, error, className = '', id, rows = 3, ...props }) {
  const fieldId = id || `ff-${label}`;
  return (
    <Wrapper label={label} required={required} hint={hint} error={error} className={className}>
      <textarea
        id={fieldId}
        placeholder=" "
        rows={rows}
        className={`${BASE} resize-none ${error ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : ''}`}
        {...props}
      />
      <label htmlFor={fieldId} className={error ? LABEL_ERROR : LABEL}>
        {label}{required && <span className="text-red-400 mr-0.5">*</span>}
      </label>
    </Wrapper>
  );
}
