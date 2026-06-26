import { useState, useMemo, useEffect } from 'react';
import { loadLogs, clearLogs } from '../../store/storage';
import { formatDateTime } from '../../utils/formatters';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { ClipboardList, Trash2, Download, RefreshCw } from 'lucide-react';

const ENTITY_LABELS = {
  repair:     'תיקון',
  customer:   'לקוח',
  device:     'מכשיר',
  part:       'חלק',
  stock:      'מלאי',
  supplier:   'ספק',
  purchase:   'רכש',
  expense:    'הוצאה',
  work:       'קטלוג עבודות',
  service:    'שירות',
  technician: 'טכנאי',
  appeal:     'ערעור',
  settings:   'הגדרות',
  user:       'משתמש',
  status:     'סטטוס',
  auth:       'כניסה/יציאה',
};

const ENTITY_COLORS = {
  repair:     'bg-orange-100 text-orange-800',
  customer:   'bg-blue-100 text-blue-800',
  device:     'bg-purple-100 text-purple-800',
  part:       'bg-yellow-100 text-yellow-800',
  stock:      'bg-yellow-100 text-yellow-800',
  supplier:   'bg-slate-100 text-slate-700',
  purchase:   'bg-slate-100 text-slate-700',
  expense:    'bg-red-100 text-red-800',
  work:       'bg-teal-100 text-teal-800',
  service:    'bg-teal-100 text-teal-800',
  technician: 'bg-indigo-100 text-indigo-800',
  appeal:     'bg-orange-100 text-orange-800',
  settings:   'bg-gray-100 text-gray-700',
  user:       'bg-green-100 text-green-800',
  status:     'bg-pink-100 text-pink-800',
  auth:       'bg-green-100 text-green-800',
};

const PAGE_SIZE = 50;

export default function OfficeLogs() {
  const [logs, setLogs] = useState(() => loadLogs());

  // רענון בכל כניסה לעמוד
  useEffect(() => { setLogs(loadLogs()); }, []);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [confirmClear, setConfirmClear] = useState(false);

  const uniqueUsers = useMemo(() => {
    const names = [...new Set(logs.map(l => l.user_name).filter(Boolean))];
    return names.sort();
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (entityFilter !== 'all' && l.entity_type !== entityFilter) return false;
      if (userFilter !== 'all' && l.user_name !== userFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          l.description?.toLowerCase().includes(q) ||
          l.user_name?.toLowerCase().includes(q) ||
          l.customer_name?.toLowerCase().includes(q) ||
          l.entity_id?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, entityFilter, userFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleClear = () => {
    clearLogs();
    setLogs([]);
    setConfirmClear(false);
  };

  const handleExportCSV = () => {
    const header = 'תאריך,מבצע,לקוח,סוג,תיאור,מזהה';
    const rows = filtered.map(l =>
      [
        formatDateTime(l.timestamp),
        l.user_name,
        l.customer_name || '',
        ENTITY_LABELS[l.entity_type] || l.entity_type,
        l.description,
        l.entity_id,
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    );
    const csv = '﻿' + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="יומן פעולות"
        subtitle={`${logs.length} פעולות מתועדות`}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setLogs(loadLogs())}
              className="flex items-center gap-1.5 text-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg font-semibold"
            >
              <RefreshCw size={15} /> רענן
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg font-semibold"
            >
              <Download size={15} /> ייצא CSV
            </button>
            <button
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-1.5 text-sm bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg font-semibold"
            >
              <Trash2 size={15} /> נקה לוגים
            </button>
          </div>
        }
      />

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="grid md:grid-cols-4 gap-3">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="חיפוש בתיאור, משתמש, לקוח..."
            className="md:col-span-2"
          />
          <select
            value={entityFilter}
            onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">כל הסוגים</option>
            {Object.entries(ENTITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={userFilter}
            onChange={e => { setUserFilter(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">כל המשתמשים</option>
            {uniqueUsers.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="אין פעולות מתועדות"
            description={logs.length === 0 ? 'פעולות יתועדו כאן מהרגע שתבוצענה' : 'לא נמצאו תוצאות בחיפוש'}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-right p-3 font-semibold text-slate-700">תאריך ושעה</th>
                    <th className="text-right p-3 font-semibold text-slate-700">מבצע הפעולה</th>
                    <th className="text-right p-3 font-semibold text-slate-700">לקוח</th>
                    <th className="text-right p-3 font-semibold text-slate-700">סוג</th>
                    <th className="text-right p-3 font-semibold text-slate-700">תיאור</th>
                    <th className="text-right p-3 font-semibold text-slate-700">מזהה</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map(l => (
                    <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(l.timestamp)}</td>
                      <td className="p-3 font-medium text-slate-800">{l.user_name}</td>
                      <td className="p-3 text-xs text-slate-600">{l.customer_name || '—'}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ENTITY_COLORS[l.entity_type] || 'bg-slate-100 text-slate-700'}`}>
                          {ENTITY_LABELS[l.entity_type] || l.entity_type}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-700">{l.description}</td>
                      <td className="p-3 font-mono text-xs text-slate-500">{l.entity_id || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t border-slate-200 text-sm text-slate-600">
                <span>{filtered.length} תוצאות • עמוד {page} מתוך {totalPages}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
                  >
                    הקודם
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
                  >
                    הבא
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="נקה את כל הלוגים?"
        message="פעולה זו תמחק את כל יומן הפעולות לצמיתות. לא ניתן לשחזר."
        confirmLabel="נקה הכל"
        variant="danger"
        onConfirm={handleClear}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
