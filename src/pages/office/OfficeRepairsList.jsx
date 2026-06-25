import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { STATUS_LABELS } from '../../constants/statuses';
import { WARRANTY_LABELS } from '../../constants/warranty';
import { formatDateTime } from '../../utils/formatters';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { FileText } from 'lucide-react';

export default function OfficeRepairsList() {
  const { state } = useAppContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredRepairs = state.repairs
    .filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!search) return true;
      const customer = state.customers.find(c => c.id === r.customer_id);
      const device = state.devices.find(d => d.id === r.device_id);
      const searchLower = search.toLowerCase();
      return (
        r.id.toLowerCase().includes(searchLower) ||
        r.complaint?.toLowerCase().includes(searchLower) ||
        customer?.name?.toLowerCase().includes(searchLower) ||
        customer?.phone?.includes(search) ||
        device?.brand?.toLowerCase().includes(searchLower) ||
        device?.model?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => new Date(b.date_intake) - new Date(a.date_intake));

  return (
    <div>
      <PageHeader title="כל הקריאות" subtitle={`${state.repairs.length} קריאות במערכת`} />

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="grid md:grid-cols-3 gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="קוד, לקוח, מכשיר, תלונה..."
            className="md:col-span-2"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2"
          >
            <option value="all">כל הסטטוסים</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredRepairs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="אין קריאות"
            description={state.repairs.length === 0 ? 'עוד לא נקלטו קריאות תיקון' : 'לא נמצאו תוצאות בחיפוש'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-right p-3 font-semibold text-slate-700">קוד תיקון</th>
                  <th className="text-right p-3 font-semibold text-slate-700">תאריך</th>
                  <th className="text-right p-3 font-semibold text-slate-700">לקוח</th>
                  <th className="text-right p-3 font-semibold text-slate-700">מכשיר</th>
                  <th className="text-right p-3 font-semibold text-slate-700">תלונה</th>
                  <th className="text-right p-3 font-semibold text-slate-700">אחריות</th>
                  <th className="text-right p-3 font-semibold text-slate-700">עובדים</th>
                  <th className="text-right p-3 font-semibold text-slate-700">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {filteredRepairs.map(r => {
                  const customer = state.customers.find(c => c.id === r.customer_id);
                  const device = state.devices.find(d => d.id === r.device_id);
                  return (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs font-bold text-orange-600">{r.id}</td>
                      <td className="p-3 text-xs text-slate-600">{formatDateTime(r.date_intake)}</td>
                      <td className="p-3">
                        <p className="font-medium">{customer?.name || '—'}</p>
                        <p className="text-xs text-slate-500">{customer?.phone}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-xs">{device?.brand} {device?.model}</p>
                        <p className="text-xs text-slate-500 font-mono">{device?.id}</p>
                      </td>
                      <td className="p-3 text-xs max-w-xs truncate">{r.complaint}</td>
                      <td className="p-3 text-xs">{WARRANTY_LABELS[r.warranty_type] || '—'}</td>
                      <td className="p-3 text-xs text-slate-500">
                        {r.intake_by_name && <div>קליטה: {r.intake_by_name}</div>}
                        {r.performed_by_name && <div>ביצוע: {r.performed_by_name}</div>}
                      </td>
                      <td className="p-3"><StatusBadge status={r.status} size="sm" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
