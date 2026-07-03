import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight, ChevronLeft } from 'lucide-react';
import EmptyState from './EmptyState';
import { FileText } from 'lucide-react';

/**
 * DataTable — טבלת נתונים מודרנית
 *
 * columns: [{ key, label, sortable?, render?, mobileLabel?, hideMobile?, className? }]
 * data: שורות נתונים (כבר מסוננות חיצונית)
 * pageSize: מספר שורות בעמוד (ברירת מחדל 25)
 * onRowClick: callback בלחיצה על שורה
 * mobileCard: (row, index) => JSX — תצוגת כרטיס למובייל (אופציונלי)
 * emptyTitle / emptyDescription: טקסט מצב ריק
 */
export default function DataTable({
  columns,
  data,
  pageSize = 25,
  onRowClick,
  mobileCard,
  emptyTitle = 'אין נתונים',
  emptyDescription = '',
  emptyAction,
  className = '',
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), 'he', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return <ChevronsUpDown size={12} className="text-slate-400 shrink-0" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-orange-500 shrink-0" />
      : <ChevronDown size={12} className="text-orange-500 shrink-0" />;
  };

  if (data.length === 0) {
    return <EmptyState icon={FileText} title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  const visibleMobileCols = columns.filter(c => !c.hideMobile);

  return (
    <div className={className}>
      {/* Desktop / tablet — טבלה */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`text-right px-3 py-2.5 font-semibold text-slate-600 whitespace-nowrap select-none ${col.className || ''} ${col.sortable ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''}`}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <div className="flex items-center gap-1 justify-start">
                    <span>{col.label}</span>
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr
                key={row.id ?? i}
                className={`border-b border-slate-100 last:border-0 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-orange-50/40' : 'hover:bg-slate-50'}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map(col => (
                  <td key={col.key} className={`px-3 py-2.5 ${col.className || ''}`} onClick={col.stopPropagation ? e => e.stopPropagation() : undefined}>
                    {col.render ? col.render(row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile — כרטיסים */}
      <div className="sm:hidden divide-y divide-slate-100">
        {paged.map((row, i) => (
          <div
            key={row.id ?? i}
            className={`p-3 ${onRowClick ? 'cursor-pointer active:bg-orange-50' : ''}`}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {mobileCard ? mobileCard(row, i) : (
              <div className="space-y-1">
                {visibleMobileCols.map(col => (
                  <div key={col.key} className="flex justify-between gap-2 text-sm">
                    <span className="text-slate-400 shrink-0 text-xs">{col.mobileLabel || col.label}</span>
                    <span className="text-slate-800 text-right">
                      {col.render ? col.render(row) : (row[col.key] ?? '—')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2.5 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
          <span>{sorted.length} רשומות • עמוד {safePage} מתוך {totalPages}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = safePage <= 3 ? i + 1 : safePage + i - 2;
              if (pg < 1 || pg > totalPages) return null;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${pg === safePage ? 'bg-orange-500 text-white' : 'hover:bg-slate-200'}`}
                >
                  {pg}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
