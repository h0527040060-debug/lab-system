/**
 * FormField — עוטף label + input/select/textarea עם עיצוב אחיד
 *
 * שימוש בסיסי:
 *   <FormField label="שם לקוח" required>
 *     <Input value={name} onChange={e => setName(e.target.value)} />
 *   </FormField>
 *
 * כל הקומפוננטות (Input, Select, Textarea) אפשר גם בנפרד ללא FormField.
 */

export function FormField({ label, required, hint, error, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-slate-700 leading-none">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const BASE_INPUT = `
  w-full rounded-lg border border-slate-300 bg-white px-3 py-2
  text-sm text-slate-800 placeholder:text-slate-400
  focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400
  disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
  transition-colors
`.trim();

export function Input({ className = '', ...props }) {
  return <input className={`${BASE_INPUT} ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${BASE_INPUT} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className = '', rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={`${BASE_INPUT} resize-none ${className}`}
      {...props}
    />
  );
}
