import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { consumeSearchBridge } from '../../utils/searchBridge';
import { formatDateTime } from '../../utils/formatters';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import PartThumbnail from '../../components/PartThumbnail';
import CustomerQuickModal from '../../components/CustomerQuickModal';
import DeviceQuickModal from '../../components/DeviceQuickModal';
import PartQuickModal from '../../components/PartQuickModal';
import RepairDetailModal from '../../components/RepairDetailModal';
import { Search, Wrench, Package, FileText, Users, ExternalLink } from 'lucide-react';

export default function OfficeSearch({ onNavigate }) {
  const { state } = useAppContext();
  const [query, setQuery] = useState(() => consumeSearchBridge());
  const [quickCustomer, setQuickCustomer] = useState(null);
  const [quickDevice, setQuickDevice] = useState(null);
  const [quickPart, setQuickPart] = useState(null);
  const [detailRepairId, setDetailRepairId] = useState(null);

  const detailRepair = detailRepairId ? state.repairs.find(r => r.id === detailRepairId) : null;
  const detailCustomer = detailRepair ? state.customers.find(c => c.id === detailRepair.customer_id) : null;
  const detailDevice = detailRepair ? state.devices.find(d => d.id === detailRepair.device_id) : null;

  if (!query) {
    return (
      <div>
        <PageHeader title="חיפוש גלובלי" subtitle="חיפוש בכל הנתונים במערכת" />
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="חפש לקוח, תיקון, מכשיר, חלק... (שם, טלפון, קוד, ברקוד)"
            autoFocus
          />
        </div>
        <EmptyState
          icon={Search}
          title="חיפוש גלובלי"
          description="הקלד לחיפוש בלקוחות, תיקונים, מכשירים וחלקים"
        />
      </div>
    );
  }

  const q = query.toLowerCase();

  const matchedCustomers = state.customers.filter(c =>
    c.name?.toLowerCase().includes(q) ||
    c.phone?.includes(query) ||
    c.email?.toLowerCase().includes(q) ||
    c.id?.toLowerCase().includes(q)
  );

  const matchedRepairs = state.repairs.filter(r => {
    const customer = state.customers.find(c => c.id === r.customer_id);
    const device = state.devices.find(d => d.id === r.device_id);
    return (
      r.id.toLowerCase().includes(q) ||
      r.complaint?.toLowerCase().includes(q) ||
      customer?.name?.toLowerCase().includes(q) ||
      customer?.phone?.includes(query) ||
      device?.id?.toLowerCase().includes(q) ||
      device?.brand?.toLowerCase().includes(q) ||
      device?.model?.toLowerCase().includes(q) ||
      device?.manufacturer_serial?.toLowerCase().includes(q)
    );
  });

  const matchedDevices = state.devices.filter(d =>
    d.id.toLowerCase().includes(q) ||
    d.brand?.toLowerCase().includes(q) ||
    d.model?.toLowerCase().includes(q) ||
    d.manufacturer_serial?.toLowerCase().includes(q) ||
    d.type?.toLowerCase().includes(q)
  );

  const matchedParts = state.parts.filter(p =>
    p.name?.toLowerCase().includes(q) ||
    p.internal_barcode?.toLowerCase().includes(q) ||
    p.manufacturer_sku?.toLowerCase().includes(q) ||
    p.manufacturer?.toLowerCase().includes(q)
  );

  const totalResults = matchedCustomers.length + matchedRepairs.length + matchedDevices.length + matchedParts.length;

  return (
    <div>
      <PageHeader title="חיפוש גלובלי" subtitle={`${totalResults} תוצאות עבור "${query}"`} />
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder="חיפוש..." autoFocus />
      </div>

      {totalResults === 0 ? (
        <EmptyState icon={Search} title="לא נמצאו תוצאות" description={`אין תוצאות עבור "${query}"`} />
      ) : (
        <div className="space-y-4">
          {/* לקוחות */}
          {matchedCustomers.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Users size={18} />
                  לקוחות ({matchedCustomers.length})
                </h3>
                <button
                  onClick={() => onNavigate?.('customers')}
                  className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                >
                  <ExternalLink size={13} />
                  לטאב לקוחות
                </button>
              </div>
              <div className="space-y-2">
                {matchedCustomers.map(c => {
                  const deviceCount = state.devices.filter(d => d.owner_customer_id === c.id).length;
                  const repairCount = state.repairs.filter(r => r.customer_id === c.id).length;
                  return (
                    <div key={c.id} onClick={() => setQuickCustomer(c)} className="border border-slate-200 rounded-lg p-3 hover:bg-orange-50/50 cursor-pointer transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{c.name}</p>
                          <p className="text-xs text-slate-500">{c.phone}{c.email && ` • ${c.email}`}</p>
                          <p className="text-xs text-slate-400 mt-1">{deviceCount} מכשירים • {repairCount} תיקונים</p>
                        </div>
                        <span className="font-mono text-xs text-slate-400">{c.id}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* תיקונים */}
          {matchedRepairs.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <FileText size={18} />
                  תיקונים ({matchedRepairs.length})
                </h3>
                <button
                  onClick={() => onNavigate?.('repairs')}
                  className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                >
                  <ExternalLink size={13} />
                  לטאב תיקונים
                </button>
              </div>
              <div className="space-y-2">
                {matchedRepairs.map(r => {
                  const customer = state.customers.find(c => c.id === r.customer_id);
                  const device = state.devices.find(d => d.id === r.device_id);
                  return (
                    <div key={r.id} onClick={() => setDetailRepairId(r.id)} className="border border-slate-200 rounded-lg p-3 hover:bg-orange-50/50 cursor-pointer transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-bold text-orange-600">{r.id}</span>
                            <StatusBadge status={r.status} size="sm" />
                          </div>
                          <p className="font-semibold text-sm">{customer?.name}</p>
                          <p className="text-xs text-slate-500">{device?.type || `${device?.brand} ${device?.model}`} • {customer?.phone}</p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{r.complaint}</p>
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">{formatDateTime(r.date_intake)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* מכשירים */}
          {matchedDevices.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Wrench size={18} />
                  מכשירים ({matchedDevices.length})
                </h3>
                <button
                  onClick={() => onNavigate?.('devices')}
                  className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                >
                  <ExternalLink size={13} />
                  לטאב מכשירים
                </button>
              </div>
              <div className="space-y-2">
                {matchedDevices.map(d => {
                  const owner = state.customers.find(c => c.id === d.owner_customer_id);
                  const repairCount = state.repairs.filter(r => r.device_id === d.id).length;
                  return (
                    <div key={d.id} onClick={() => setQuickDevice({ device: d, customer: owner })} className="border border-slate-200 rounded-lg p-3 hover:bg-orange-50/50 cursor-pointer transition-colors">
                      <div className="flex justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-bold text-cyan-600">{d.id}</span>
                            <span className="text-xs text-slate-500">• {repairCount} תיקונים</span>
                          </div>
                          <p className="font-semibold text-sm">{d.brand} {d.model}</p>
                          <p className="text-xs text-slate-500">{d.type} • {owner?.name}</p>
                          {d.manufacturer_serial && (
                            <p className="text-xs font-mono text-slate-500">Serial: {d.manufacturer_serial}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* חלקים */}
          {matchedParts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Package size={18} />
                  חלקים ({matchedParts.length})
                </h3>
                <button
                  onClick={() => onNavigate?.('parts')}
                  className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                >
                  <ExternalLink size={13} />
                  לטאב חלקים
                </button>
              </div>
              <div className="space-y-2">
                {matchedParts.map(p => {
                  const totalStock = state.stockBatches
                    .filter(b => b.part_id === p.id)
                    .reduce((sum, b) => sum + b.quantity_remaining, 0);
                  return (
                    <div key={p.id} onClick={() => setQuickPart(p)} className="border border-slate-200 rounded-lg p-3 hover:bg-orange-50/50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <PartThumbnail part={p} size="sm" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{p.name}</p>
                            <span className="font-mono text-xs text-slate-500">{p.internal_barcode}</span>
                          </div>
                          <p className="text-xs text-slate-500">{p.manufacturer} • {p.manufacturer_sku}</p>
                          {p.shelf && <p className="text-xs text-slate-500">📍 מדף {p.shelf}, תא {p.bin}</p>}
                        </div>
                        <span className={`font-bold text-sm ${totalStock === 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {totalStock} במלאי
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {quickCustomer && (
        <CustomerQuickModal customer={quickCustomer} repairs={state.repairs} devices={state.devices} onClose={() => setQuickCustomer(null)} />
      )}
      {quickDevice && (
        <DeviceQuickModal device={quickDevice.device} customer={quickDevice.customer} repairs={state.repairs} onClose={() => setQuickDevice(null)} />
      )}
      {quickPart && (
        <PartQuickModal part={quickPart} onClose={() => setQuickPart(null)} />
      )}
      {detailRepair && (
        <RepairDetailModal
          repair={detailRepair}
          customer={detailCustomer}
          device={detailDevice}
          onClose={() => setDetailRepairId(null)}
          onAction={() => { setDetailRepairId(null); onNavigate?.('repairs'); }}
        />
      )}
    </div>
  );
}
