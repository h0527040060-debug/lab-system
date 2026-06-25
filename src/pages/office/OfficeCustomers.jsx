import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import EmptyState from '../../components/EmptyState';
import { formatDateTime } from '../../utils/formatters';
import DeviceQuickModal from '../../components/DeviceQuickModal';
import { Users, Phone, Mail, MapPin, Wrench, FileText } from 'lucide-react';

export default function OfficeCustomers() {
  const { state } = useAppContext();
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [quickDevice, setQuickDevice] = useState(null);

  const filteredCustomers = state.customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCustomer = state.customers.find(c => c.id === selectedCustomerId);
  const customerDevices = selectedCustomer ? state.devices.filter(d => d.owner_customer_id === selectedCustomer.id) : [];
  const customerRepairs = selectedCustomer ? state.repairs.filter(r => r.customer_id === selectedCustomer.id) : [];

  return (
    <div>
      <PageHeader title="ניהול לקוחות" subtitle={`${state.customers.length} לקוחות במערכת`} />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* רשימת לקוחות */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-4">
          <SearchInput value={search} onChange={setSearch} placeholder="חיפוש לפי שם, טלפון, מייל..." className="mb-3" />

          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="אין לקוחות"
                description={state.customers.length === 0 ? 'עוד לא נקלטו לקוחות במערכת' : 'לא נמצאו תוצאות'}
              />
            ) : (
              filteredCustomers.map(c => {
                const repairsCount = state.repairs.filter(r => r.customer_id === c.id).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className={`w-full text-right p-3 rounded-lg border ${selectedCustomerId === c.id ? 'bg-orange-50 border-orange-300' : 'border-transparent hover:bg-slate-50'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-semibold text-slate-900">{c.name}</p>
                      <span className="text-xs font-mono text-slate-400">{c.id}</span>
                    </div>
                    <p className="text-xs text-slate-500">{c.phone}</p>
                    {repairsCount > 0 && (
                      <p className="text-xs text-orange-600 mt-1">{repairsCount} תיקונים</p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* פרטי לקוח */}
        <div className="lg:col-span-2">
          {!selectedCustomer ? (
            <div className="bg-white rounded-xl shadow-sm">
              <EmptyState
                icon={Users}
                title="בחר לקוח מהרשימה"
                description="הצג פרטים, מכשירים והיסטוריית תיקונים"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* פרטי לקוח */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedCustomer.name}</h2>
                    <p className="text-xs font-mono text-slate-400 mt-1">{selectedCustomer.id}</p>
                  </div>
                  <div className="text-left text-xs text-slate-500">
                    <p>נוצר ב-{formatDateTime(selectedCustomer.created_date)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone size={14} /> {selectedCustomer.phone}
                    </div>
                  )}
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail size={14} /> {selectedCustomer.email}
                    </div>
                  )}
                  {selectedCustomer.address && (
                    <div className="flex items-center gap-2 text-slate-600 col-span-2">
                      <MapPin size={14} /> {selectedCustomer.address}
                    </div>
                  )}
                </div>

                {selectedCustomer.notes && (
                  <p className="mt-3 text-sm text-slate-600 bg-slate-50 p-2 rounded">{selectedCustomer.notes}</p>
                )}
              </div>

              {/* מכשירים */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Wrench size={18} />
                  מכשירים ({customerDevices.length})
                </h3>
                {customerDevices.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">אין מכשירים רשומים</p>
                ) : (
                  <div className="space-y-2">
                    {customerDevices.map(d => {
                      const deviceRepairs = state.repairs.filter(r => r.device_id === d.id);
                      return (
                        <button
                          key={d.id}
                          onClick={() => setQuickDevice({ device: d, customer: selectedCustomer })}
                          className="w-full text-right border border-slate-200 rounded-lg p-3 text-sm hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                        >
                          <div className="flex justify-between mb-1">
                            <p className="font-semibold group-hover:text-blue-700">{d.brand} {d.model}</p>
                            <span className="text-xs font-mono text-slate-400">{d.id}</span>
                          </div>
                          <p className="text-xs text-slate-500">{d.type} {d.manufacturer_serial && `• Serial: ${d.manufacturer_serial}`}</p>
                          {deviceRepairs.length > 0 && (
                            <p className="text-xs text-orange-600 mt-1">{deviceRepairs.length} תיקונים</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* היסטוריית תיקונים */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText size={18} />
                  היסטוריית תיקונים ({customerRepairs.length})
                </h3>
                {customerRepairs.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">אין תיקונים</p>
                ) : (
                  <div className="space-y-2">
                    {customerRepairs.map(r => {
                      const device = state.devices.find(d => d.id === r.device_id);
                      return (
                        <div key={r.id} className="border border-slate-200 rounded-lg p-3 text-sm">
                          <div className="flex justify-between mb-1">
                            <span className="font-mono text-xs text-orange-600">{r.id}</span>
                            <span className="text-xs text-slate-500">{formatDateTime(r.date_intake)}</span>
                          </div>
                          <p className="text-slate-700">{r.complaint}</p>
                          {device && <p className="text-xs text-slate-500 mt-1">{device.brand} {device.model}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {quickDevice && (
        <DeviceQuickModal
          device={quickDevice.device}
          customer={quickDevice.customer}
          repairs={state.repairs}
          onClose={() => setQuickDevice(null)}
        />
      )}
    </div>
  );
}
