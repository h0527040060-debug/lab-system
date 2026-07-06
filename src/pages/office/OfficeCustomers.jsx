import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { useStagger } from '../../hooks/useStagger';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import EmptyState from '../../components/EmptyState';
import { formatDateTime } from '../../utils/formatters';
import DeviceQuickModal from '../../components/DeviceQuickModal';
import { CustomerEditModal } from '../../components/CustomerEditModal';
import { DeviceEditModal } from '../../components/DeviceEditModal';
import DeviceThumbnail from '../../components/DeviceThumbnail';
import { Users, Phone, Mail, MapPin, Wrench, FileText, Edit2 } from 'lucide-react';
import { FAB } from '../../components/FAB';

export default function OfficeCustomers() {
  const { state } = useAppContext();
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [quickDevice, setQuickDevice] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);
  const stagger = useStagger(40);

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
                description={state.customers.length === 0 ? 'הוסף את הלקוח הראשון שלך' : 'לא נמצאו תוצאות'}
                action={state.customers.length === 0 ? (
                  <button onClick={() => setEditingCustomer({})} className="mt-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors">
                    הוסף לקוח חדש
                  </button>
                ) : null}
              />
            ) : (
              filteredCustomers.map((c, i) => {
                const repairsCount = state.repairs.filter(r => r.customer_id === c.id).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    style={stagger(i)}
                    className={`w-full text-right p-3 rounded-lg border animate-fade-in ${selectedCustomerId === c.id ? 'bg-orange-50 border-orange-300' : 'border-transparent hover:bg-slate-50'}`}
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingCustomer(selectedCustomer)}
                      className="flex items-center gap-1 text-xs bg-orange-50 hover:bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg font-semibold border border-orange-200"
                    >
                      <Edit2 size={12} /> ערוך לקוח
                    </button>
                    <div className="text-left text-xs text-slate-500">
                      <p>נוצר ב-{formatDateTime(selectedCustomer.created_date)}</p>
                    </div>
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
                        <div key={d.id} className="border border-slate-200 rounded-lg p-3 text-sm hover:border-blue-200 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <button
                              onClick={() => setQuickDevice({ device: d, customer: selectedCustomer })}
                              className="flex items-center gap-2 text-right hover:text-blue-700 flex-1 min-w-0"
                            >
                              <DeviceThumbnail device={d} size="sm" />
                              <span className="min-w-0">
                                <p className="font-semibold truncate">{d.type || `${d.brand} ${d.model}`}</p>
                                <p className="text-xs text-slate-500 mt-0.5 truncate">
                                  {d.type && `${d.brand} ${d.model} • `}{d.manufacturer_serial && `Serial: ${d.manufacturer_serial}`}
                                </p>
                                {deviceRepairs.length > 0 && (
                                  <p className="text-xs text-orange-600 mt-1">{deviceRepairs.length} תיקונים</p>
                                )}
                              </span>
                            </button>
                            <div className="flex items-center gap-1 mr-2">
                              <span className="text-xs font-mono text-slate-400">{d.id}</span>
                              <button
                                onClick={() => setEditingDevice(d)}
                                className="p-1 hover:bg-orange-100 rounded text-slate-400 hover:text-orange-600"
                                title="ערוך מכשיר"
                                aria-label="ערוך מכשיר"
                              >
                                <Edit2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
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
                          {device && <p className="text-xs text-slate-500 mt-1">{device.type || `${device.brand} ${device.model}`}</p>}
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
      {editingCustomer && (
        <CustomerEditModal customer={editingCustomer} onClose={() => setEditingCustomer(null)} />
      )}
      {editingDevice && (
        <DeviceEditModal device={editingDevice} onClose={() => setEditingDevice(null)} />
      )}
      <FAB label="לקוח חדש" onClick={() => setEditingCustomer({})} title="הוספת לקוח חדש" />
    </div>
  );
}
