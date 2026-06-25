import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { formatDate } from '../../utils/formatters';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import EmptyState from '../../components/EmptyState';
import CustomerQuickModal from '../../components/CustomerQuickModal';
import DeviceQuickModal from '../../components/DeviceQuickModal';
import { Wrench, ShieldCheck, AlertCircle } from 'lucide-react';

export default function OfficeDevices() {
  const { state } = useAppContext();
  const [search, setSearch] = useState('');
  const [quickCustomer, setQuickCustomer] = useState(null);
  const [quickDevice, setQuickDevice] = useState(null);

  const filteredDevices = [...state.devices]
    .filter(d => {
      if (!search) return true;
      const owner = state.customers.find(c => c.id === d.owner_customer_id);
      const s = search.toLowerCase();
      return (
        d.id.toLowerCase().includes(s) ||
        d.brand?.toLowerCase().includes(s) ||
        d.model?.toLowerCase().includes(s) ||
        d.type?.toLowerCase().includes(s) ||
        d.manufacturer_serial?.toLowerCase().includes(s) ||
        owner?.name?.toLowerCase().includes(s)
      );
    })
    .sort((a, b) => {
      const aCount = state.repairs.filter(r => r.device_id === a.id).length;
      const bCount = state.repairs.filter(r => r.device_id === b.id).length;
      return bCount - aCount;
    });

  const isInWarranty = (device) => {
    if (!device.warranty_until) return false;
    return new Date(device.warranty_until) > new Date();
  };

  return (
    <div>
      <PageHeader title="מאגר מכשירים" subtitle={`${state.devices.length} מכשירים במערכת`} />

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="חיפוש לפי קוד, יצרן, דגם, סוג, serial, בעלים..." />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredDevices.length === 0 ? (
          <EmptyState icon={Wrench} title="אין מכשירים" description={state.devices.length === 0 ? 'עוד לא נוספו מכשירים' : 'לא נמצאו תוצאות'} />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-right p-3 font-semibold">קוד מכשיר</th>
                <th className="text-right p-3 font-semibold">סוג</th>
                <th className="text-right p-3 font-semibold">יצרן / דגם</th>
                <th className="text-right p-3 font-semibold">Serial יצרן</th>
                <th className="text-right p-3 font-semibold">בעלים</th>
                <th className="text-right p-3 font-semibold">תיקונים</th>
                <th className="text-right p-3 font-semibold">אחריות יצרן</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map(d => {
                const owner = state.customers.find(c => c.id === d.owner_customer_id);
                const repairsCount = state.repairs.filter(r => r.device_id === d.id).length;
                const inWarranty = isInWarranty(d);
                const problematic = repairsCount >= 3;

                return (
                  <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3">
                      <button
                        onClick={() => setQuickDevice({ device: d, customer: owner })}
                        className="font-mono text-xs font-bold text-orange-600 hover:underline"
                      >{d.id}</button>
                    </td>
                    <td className="p-3">{d.type}</td>
                    <td className="p-3">
                      <button
                        onClick={() => setQuickDevice({ device: d, customer: owner })}
                        className="text-right hover:text-blue-600 group"
                      >
                        <p className="font-semibold group-hover:underline">{d.brand}</p>
                        <p className="text-xs text-slate-500">{d.model}</p>
                      </button>
                    </td>
                    <td className="p-3 font-mono text-xs">{d.manufacturer_serial || '—'}</td>
                    <td className="p-3 text-xs">
                      {owner ? (
                        <button
                          onClick={() => setQuickCustomer(owner)}
                          className="hover:text-blue-600 hover:underline"
                        >{owner.name}</button>
                      ) : '—'}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <span className={`font-bold ${problematic ? 'text-red-600' : repairsCount > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                          {repairsCount}
                        </span>
                        {problematic && <AlertCircle size={14} className="text-red-500" />}
                      </div>
                      {problematic && <p className="text-xs text-red-500">בעייתי</p>}
                    </td>
                    <td className="p-3">
                      {d.warranty_until ? (
                        <div className={`flex items-center gap-1 text-xs ${inWarranty ? 'text-green-600' : 'text-slate-400'}`}>
                          <ShieldCheck size={12} />
                          {inWarranty ? `עד ${formatDate(d.warranty_until)}` : 'פגה'}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {quickCustomer && (
        <CustomerQuickModal customer={quickCustomer} repairs={state.repairs} devices={state.devices} onClose={() => setQuickCustomer(null)} />
      )}
      {quickDevice && (
        <DeviceQuickModal device={quickDevice.device} customer={quickDevice.customer} repairs={state.repairs} onClose={() => setQuickDevice(null)} />
      )}
    </div>
  );
}
