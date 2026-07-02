import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { formatDateTime } from '../../utils/formatters';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { Wrench } from 'lucide-react';

export default function LabHistory() {
  const { state } = useAppContext();
  const [search, setSearch] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  const sortedDevices = [...state.devices].sort((a, b) => {
    const aCount = state.repairs.filter(r => r.device_id === a.id).length;
    const bCount = state.repairs.filter(r => r.device_id === b.id).length;
    return bCount - aCount;
  });

  const filteredDevices = sortedDevices.filter(d => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      d.id.toLowerCase().includes(s) ||
      d.brand?.toLowerCase().includes(s) ||
      d.model?.toLowerCase().includes(s) ||
      d.type?.toLowerCase().includes(s) ||
      d.manufacturer_serial?.toLowerCase().includes(s)
    );
  });

  const selectedDevice = state.devices.find(d => d.id === selectedDeviceId);
  const deviceRepairs = selectedDevice
    ? [...state.repairs]
        .filter(r => r.device_id === selectedDevice.id)
        .sort((a, b) => new Date(b.date_intake) - new Date(a.date_intake))
    : [];
  const owner = selectedDevice
    ? state.customers.find(c => c.id === selectedDevice.owner_customer_id)
    : null;

  return (
    <div>
      <PageHeader title="היסטוריית מכשירים" subtitle="צפייה בכל ההיסטוריה של מכשיר" />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* רשימת מכשירים */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-4">
          <SearchInput value={search} onChange={setSearch} placeholder="חיפוש מכשיר..." className="mb-3" />
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {filteredDevices.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">אין מכשירים</p>
            ) : (
              filteredDevices.map(d => {
                const repairsCount = state.repairs.filter(r => r.device_id === d.id).length;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDeviceId(d.id)}
                    className={`w-full text-right p-3 rounded-lg transition-colors ${
                      selectedDeviceId === d.id
                        ? 'bg-orange-50 border border-orange-300'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between">
                      <p className="font-semibold text-sm">{d.brand} {d.model}</p>
                      <span className="text-xs font-mono text-slate-400">{d.id}</span>
                    </div>
                    <p className="text-xs text-slate-500">{d.type}</p>
                    {repairsCount > 0 && (
                      <p className="text-xs text-orange-600 mt-1">{repairsCount} תיקונים</p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* פרטי מכשיר */}
        <div className="lg:col-span-2">
          {!selectedDevice ? (
            <div className="bg-white rounded-xl shadow-sm">
              <EmptyState icon={Wrench} title="בחר מכשיר" description="לראות את ההיסטוריה המלאה" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-3">{selectedDevice.brand} {selectedDevice.model}</h2>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><span className="text-slate-500">קוד מכשיר:</span> <span className="font-mono font-bold">{selectedDevice.id}</span></p>
                  <p><span className="text-slate-500">סוג:</span> {selectedDevice.type}</p>
                  <p><span className="text-slate-500">Serial יצרן:</span> {selectedDevice.manufacturer_serial || '—'}</p>
                  <p><span className="text-slate-500">בעלים:</span> {owner?.name || '—'}</p>
                  {selectedDevice.purchase_date && (
                    <p><span className="text-slate-500">תאריך רכישה:</span> {selectedDevice.purchase_date}</p>
                  )}
                  {selectedDevice.purchase_cost && (
                    <p><span className="text-slate-500">עלות רכישה:</span> {Number(selectedDevice.purchase_cost).toLocaleString('he-IL')}₪</p>
                  )}
                  {selectedDevice.warranty_until && (
                    <p><span className="text-slate-500">תוקף אחריות:</span> {selectedDevice.warranty_until}</p>
                  )}
                </div>
                {selectedDevice.purchase_cost && deviceRepairs.length > 0 && (() => {
                  const repairTotal = deviceRepairs.reduce((sum, r) => {
                    const labor = (r.work_items || []).reduce((s, w) => s + (Number(w.price) || 0), 0);
                    const parts = (r.parts_used || []).reduce((s, p) => s + (Number(p.price_per_unit) || 0) * (Number(p.quantity) || 1), 0);
                    return sum + labor + parts;
                  }, 0);
                  const grandTotal = Number(selectedDevice.purchase_cost) + repairTotal;
                  return (
                    <div className="mt-3 pt-3 border-t border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">עלות רכישה:</span>
                        <span>{Number(selectedDevice.purchase_cost).toLocaleString('he-IL')}₪</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">סה"כ תיקונים וחלקים:</span>
                        <span>{repairTotal.toLocaleString('he-IL')}₪</span>
                      </div>
                      <div className="flex justify-between font-bold text-purple-700 mt-1 border-t border-slate-300 pt-1">
                        <span>עלות כוללת למכשיר:</span>
                        <span>{grandTotal.toLocaleString('he-IL')}₪</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-bold mb-3">כל התיקונים ({deviceRepairs.length})</h3>
                {deviceRepairs.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">אין תיקונים למכשיר זה</p>
                ) : (
                  <div className="space-y-2">
                    {deviceRepairs.map(r => (
                      <div key={r.id} className="border border-slate-200 rounded-lg p-3 text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-mono text-xs text-orange-600 font-bold">{r.id}</span>
                          <StatusBadge status={r.status} size="sm" />
                        </div>
                        <p className="text-slate-700">{r.complaint}</p>
                        <p className="text-xs text-slate-500 mt-1">{formatDateTime(r.date_intake)}</p>
                        {r.diagnosis && (
                          <p className="text-xs text-slate-600 mt-1">
                            <span className="font-semibold">אבחון:</span> {r.diagnosis}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
