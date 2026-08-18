import { useState, useMemo } from 'react';
import { useAppContext } from '../../store/AppContext';
import { loadFromStorage, storageKeys } from '../../store/storage';
import {
  generateCustomerId, generateDeviceId, generateRepairId, generateEngravingNumber,
} from '../../utils/idGenerators';
import { findActiveWarrantyRepair } from '../../utils/warrantyHelpers';
import { formatDate, toDateInputValue } from '../../utils/formatters';
import { REPAIR_STATUSES, TERMINAL_STATUSES } from '../../constants/statuses';
import { WARRANTY_TYPES } from '../../constants/warranty';
import {
  SERVICE_LOCATIONS, SERVICE_LOCATION_LABELS,
  TIMELINE_ACTIONS, buildTimelineEntry, isAtExternalProvider,
} from '../../constants/quickRepair';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import EmptyState from '../../components/EmptyState';
import ManufacturerModelPicker from '../../components/ManufacturerModelPicker';
import QuickRepairCard from '../../components/QuickRepairCard';
import { Zap, Plus, Home, MapPin, Building2, AlertTriangle, UserPlus, X } from 'lucide-react';

const EMPTY_NEW_CUSTOMER = { name: '', phone: '' };
const EMPTY_NEW_DEVICE = { brand: '', model: '', type: '' };

const LOCATION_ICONS = {
  [SERVICE_LOCATIONS.LAB]: Home,
  [SERVICE_LOCATIONS.ONSITE]: MapPin,
  [SERVICE_LOCATIONS.EXTERNAL]: Building2,
};

export default function QuickRepair() {
  const { state, dispatch } = useAppContext();

  // --- טופס הפתיחה ---
  const [customerMode, setCustomerMode] = useState('select'); // select | new
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [newCustomer, setNewCustomer] = useState(EMPTY_NEW_CUSTOMER);

  const [deviceMode, setDeviceMode] = useState('new'); // select | new
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [newDevice, setNewDevice] = useState(EMPTY_NEW_DEVICE);
  const [pickerKey, setPickerKey] = useState(0); // איפוס בורר היצרן/דגם אחרי שמירה

  const [complaint, setComplaint] = useState('');
  const [serviceLocation, setServiceLocation] = useState(SERVICE_LOCATIONS.LAB);
  const [onsiteContact, setOnsiteContact] = useState('');
  const [onsiteAddress, setOnsiteAddress] = useState('');
  const [externalProvider, setExternalProvider] = useState('');
  const [externalContact, setExternalContact] = useState('');
  const [externalSentAt, setExternalSentAt] = useState(toDateInputValue());
  const [externalExpectedReturn, setExternalExpectedReturn] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- רשימת התיקונים ---
  const [listFilter, setListFilter] = useState('open'); // open | closed | all
  const [listSearch, setListSearch] = useState('');
  const [lastCreatedId, setLastCreatedId] = useState(null);

  const selectedCustomer = state.customers.find(c => c.id === selectedCustomerId);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return [];
    const q = customerSearch.toLowerCase();
    return state.customers
      .filter(c => c.name.toLowerCase().includes(q) || (c.phone || '').includes(customerSearch))
      .slice(0, 8);
  }, [state.customers, customerSearch]);

  const customerDevices = useMemo(
    () => selectedCustomerId ? state.devices.filter(d => d.owner_customer_id === selectedCustomerId) : [],
    [state.devices, selectedCustomerId]
  );

  // מעבדות חוץ שכבר עבדנו איתן — הצעות השלמה, כדי לא להקליד את אותו שם מחדש
  const knownExternalProviders = useMemo(() => {
    const names = state.repairs
      .map(r => r.external_provider_name)
      .filter(Boolean);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b, 'he'));
  }, [state.repairs]);

  // אזהרת תיקון חוזר — מכשיר קיים שיש עליו תיקון קודם שהאחריות עדיין בתוקף
  const warrantyWarning = useMemo(() => {
    if (deviceMode !== 'select' || !selectedDeviceId) return null;
    return findActiveWarrantyRepair(state.repairs, selectedDeviceId);
  }, [state.repairs, selectedDeviceId, deviceMode]);

  const handleSelectCustomer = (id) => {
    setSelectedCustomerId(id);
    setSelectedDeviceId('');
    const devices = state.devices.filter(d => d.owner_customer_id === id);
    setDeviceMode(devices.length > 0 ? 'select' : 'new');
    // כתובת האתר מולאת מראש מפרטי הלקוח
    const customer = state.customers.find(c => c.id === id);
    if (customer) {
      setOnsiteAddress(prev => prev || customer.address || '');
      setOnsiteContact(prev => prev || customer.name || '');
    }
  };

  // --- ולידציה ---
  const customerValid = customerMode === 'select'
    ? !!selectedCustomerId
    : !!(newCustomer.name.trim() && newCustomer.phone.trim());
  const deviceValid = deviceMode === 'select'
    ? !!selectedDeviceId
    : !!(newDevice.brand && newDevice.model);
  const onsiteValid = serviceLocation !== SERVICE_LOCATIONS.ONSITE
    || !!(onsiteContact.trim() && onsiteAddress.trim());
  const externalValid = serviceLocation !== SERVICE_LOCATIONS.EXTERNAL
    || !!(externalProvider.trim() && externalSentAt);
  const canSave = customerValid && deviceValid && !!complaint.trim()
    && onsiteValid && externalValid && !isSubmitting;

  const resetForm = () => {
    setCustomerMode('select');
    setSelectedCustomerId('');
    setCustomerSearch('');
    setNewCustomer(EMPTY_NEW_CUSTOMER);
    setDeviceMode('new');
    setSelectedDeviceId('');
    setNewDevice(EMPTY_NEW_DEVICE);
    setPickerKey(k => k + 1);
    setComplaint('');
    setServiceLocation(SERVICE_LOCATIONS.LAB);
    setOnsiteContact('');
    setOnsiteAddress('');
    setExternalProvider('');
    setExternalContact('');
    setExternalSentAt(toDateInputValue());
    setExternalExpectedReturn('');
  };

  const handleSave = () => {
    if (!canSave) return;
    setIsSubmitting(true);

    let customerId = selectedCustomerId;
    if (customerMode === 'new') {
      customerId = generateCustomerId(state.customers.map(c => c.id));
      dispatch({
        type: 'ADD_CUSTOMER',
        payload: {
          id: customerId,
          name: newCustomer.name.trim(),
          phone: newCustomer.phone.trim(),
          created_date: new Date().toISOString(),
        },
      });
    }

    let deviceId = selectedDeviceId;
    if (deviceMode === 'new') {
      deviceId = generateDeviceId(state.devices.map(d => d.id));
      dispatch({
        type: 'ADD_DEVICE',
        payload: {
          id: deviceId,
          brand: newDevice.brand,
          model: newDevice.model,
          type: newDevice.type || '',
          manufacturer_serial: generateEngravingNumber(state.devices),
          owner_customer_id: customerId,
          images: [],
          created_date: new Date().toISOString(),
        },
      });
    }

    // קריאה ישירה מ-localStorage לוודא freshness (state עלול להיות stale בגלל React batching)
    const freshRepairs = loadFromStorage(storageKeys.REPAIRS, state.repairs);
    const repairId = generateRepairId(freshRepairs.map(r => r.id));
    const isOnsite = serviceLocation === SERVICE_LOCATIONS.ONSITE;
    const isExternal = serviceLocation === SERVICE_LOCATIONS.EXTERNAL;

    const repair = {
      id: repairId,
      customer_id: customerId,
      device_id: deviceId,
      is_quick: true,
      complaint: complaint.trim(),
      status: REPAIR_STATUSES.RED_INTAKE,
      warranty_type: WARRANTY_TYPES.PAID,
      date_intake: new Date().toISOString(),
      intake_by_user_id: state.currentUser?.id || '',
      intake_by_name: state.currentUser?.name || 'מערכת',
      service_location: serviceLocation,
      onsite_contact_name: isOnsite ? onsiteContact.trim() : '',
      onsite_address: isOnsite ? onsiteAddress.trim() : '',
      external_provider_name: isExternal ? externalProvider.trim() : '',
      external_contact: isExternal ? externalContact.trim() : '',
      external_sent_at: isExternal ? externalSentAt : '',
      external_expected_return: isExternal ? externalExpectedReturn : '',
      external_returned_at: '',
      external_cost: null,
      work_notes: [],
      next_actions: [],
      timeline: [],
    };
    repair.timeline = [buildTimelineEntry(TIMELINE_ACTIONS.OPENED, state.currentUser, repair)];
    // יציאה לגורם חיצוני היא אירוע בפני עצמו — נרשם כבר בפתיחה
    if (isExternal) {
      repair.timeline.push(
        buildTimelineEntry(TIMELINE_ACTIONS.SENT_EXTERNAL, state.currentUser, repair, externalProvider.trim())
      );
    }

    dispatch({ type: 'ADD_REPAIR', payload: repair });
    setLastCreatedId(repairId);
    resetForm();
    setIsSubmitting(false);
  };

  // --- רשימת התיקונים המהירים ---
  const quickRepairs = useMemo(() => {
    const q = listSearch.toLowerCase();
    return state.repairs
      .filter(r => r.is_quick)
      .filter(r => {
        if (listFilter === 'open') return !TERMINAL_STATUSES.has(r.status);
        if (listFilter === 'closed') return TERMINAL_STATUSES.has(r.status);
        if (listFilter === 'external') return isAtExternalProvider(r);
        return true;
      })
      .filter(r => {
        if (!q) return true;
        const customer = state.customers.find(c => c.id === r.customer_id);
        const device = state.devices.find(d => d.id === r.device_id);
        return (
          r.id.toLowerCase().includes(q) ||
          (customer?.name || '').toLowerCase().includes(q) ||
          `${device?.brand || ''} ${device?.model || ''} ${device?.type || ''}`.toLowerCase().includes(q) ||
          (r.complaint || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.date_intake) - new Date(a.date_intake));
  }, [state.repairs, state.customers, state.devices, listFilter, listSearch]);

  const openCount = state.repairs.filter(r => r.is_quick && !TERMINAL_STATUSES.has(r.status)).length;
  // מכשירים שנמצאים כרגע פיזית אצל גורם חיצוני — השאלה שהכי חשוב לענות עליה מהר
  const atExternalCount = state.repairs.filter(r => r.is_quick && isAtExternalProvider(r)).length;

  return (
    <div className="w-full">
      <PageHeader
        title="תיקון מהיר"
        subtitle="פתיחה בשדות בודדים — הפרטים המלאים נרשמים בסגירה"
      />

      {/* ============ טופס פתיחה ============ */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5 max-w-4xl">
        <div className="flex items-center gap-1.5 mb-3">
          <Zap size={16} className="text-orange-500" />
          <h2 className="font-bold text-slate-900">פתיחת תיקון חדש</h2>
        </div>

        <div className="space-y-3">
          {/* לקוח + מכשיר — זה לצד זה במסכים רחבים */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* לקוח */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-600">לקוח *</label>
              <button
                onClick={() => {
                  setCustomerMode(m => m === 'new' ? 'select' : 'new');
                  setSelectedCustomerId('');
                  setNewCustomer(EMPTY_NEW_CUSTOMER);
                }}
                className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
              >
                {customerMode === 'new' ? <><X size={12} /> בחר קיים</> : <><UserPlus size={12} /> לקוח חדש</>}
              </button>
            </div>

            {customerMode === 'select' ? (
              selectedCustomer ? (
                <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-900 truncate">{selectedCustomer.name}</p>
                    <p className="text-xs text-slate-500" dir="ltr">{selectedCustomer.phone}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedCustomerId(''); setSelectedDeviceId(''); setDeviceMode('new'); }}
                    aria-label="בחר לקוח אחר"
                    className="text-slate-400 hover:text-red-600 shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <SearchInput value={customerSearch} onChange={setCustomerSearch} placeholder="חפש לפי שם או טלפון..." />
                  {filteredCustomers.length > 0 && (
                    <div className="mt-1.5 border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-44 overflow-y-auto">
                      {filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          onClick={() => handleSelectCustomer(c.id)}
                          className="w-full text-right px-3 py-2 hover:bg-slate-50 flex items-center justify-between gap-2"
                        >
                          <span className="text-sm text-slate-800 truncate">{c.name}</span>
                          <span className="text-xs text-slate-400 shrink-0" dir="ltr">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={e => setNewCustomer(c => ({ ...c, name: e.target.value }))}
                  placeholder="שם הלקוח *"
                  className="border border-slate-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-orange-400"
                />
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={e => setNewCustomer(c => ({ ...c, phone: e.target.value }))}
                  placeholder="טלפון *"
                  dir="ltr"
                  className="border border-slate-300 rounded-lg px-2.5 py-2 text-sm text-right focus:outline-none focus:border-orange-400"
                />
              </div>
            )}
          </div>

          {/* מכשיר */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-600">מכשיר — יצרן ודגם *</label>
              {customerDevices.length > 0 && (
                <button
                  onClick={() => {
                    setDeviceMode(m => m === 'new' ? 'select' : 'new');
                    setSelectedDeviceId('');
                    setNewDevice(EMPTY_NEW_DEVICE);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
                >
                  {deviceMode === 'new' ? <><X size={12} /> מכשיר קיים</> : <><Plus size={12} /> מכשיר חדש</>}
                </button>
              )}
            </div>

            {deviceMode === 'select' && customerDevices.length > 0 ? (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-44 overflow-y-auto">
                {customerDevices.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDeviceId(d.id)}
                    className={`w-full text-right px-3 py-2 flex items-center justify-between gap-2 ${
                      selectedDeviceId === d.id ? 'bg-orange-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm text-slate-800 truncate">
                      {d.type ? `${d.type} · ` : ''}{d.brand} {d.model}
                    </span>
                    <span className="font-mono text-xs text-slate-400 shrink-0">{d.id}</span>
                  </button>
                ))}
              </div>
            ) : (
              <ManufacturerModelPicker
                key={pickerKey}
                allowAdd
                onSelect={({ brand, model, type }) => setNewDevice({ brand, model, type })}
              />
            )}
          </div>
          </div>

          {/* אזהרת תיקון חוזר באחריות */}
          {warrantyWarning && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                <p className="text-xs font-bold text-amber-900">
                  תיקון חוזר — {warrantyWarning.repair.id} באחריות עד {formatDate(warrantyWarning.warranty.expiry)}
                </p>
              </div>
              <div className="text-xs text-amber-800 space-y-0.5 pr-5">
                {warrantyWarning.repair.actual_fault && <p>תקלה: {warrantyWarning.repair.actual_fault}</p>}
                {warrantyWarning.repair.work_summary && <p>בוצע: {warrantyWarning.repair.work_summary}</p>}
                {warrantyWarning.repair.parts_note && <p>חלקים: {warrantyWarning.repair.parts_note}</p>}
              </div>
            </div>
          )}

          {/* תלונה + מיקום ביצוע — זה לצד זה במסכים רחבים */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* תלונה */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">מה הבעיה? *</label>
            <textarea
              value={complaint}
              onChange={e => setComplaint(e.target.value)}
              rows={2}
              placeholder="תלונת הלקוח"
              className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm resize-y focus:outline-none focus:border-orange-400"
            />
          </div>

          {/* מיקום ביצוע */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">מיקום ביצוע *</label>
            <div className="grid grid-cols-3 gap-2">
              {[SERVICE_LOCATIONS.LAB, SERVICE_LOCATIONS.ONSITE, SERVICE_LOCATIONS.EXTERNAL].map(loc => {
                const Icon = LOCATION_ICONS[loc];
                return (
                  <button
                    key={loc}
                    onClick={() => setServiceLocation(loc)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg border-2 text-xs sm:text-sm font-semibold transition-colors ${
                      serviceLocation === loc
                        ? 'border-orange-500 bg-orange-50 text-orange-900'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Icon size={15} className="shrink-0" />
                    {SERVICE_LOCATION_LABELS[loc]}
                  </button>
                );
              })}
            </div>

            {serviceLocation === SERVICE_LOCATIONS.ONSITE && (
              <div className="grid sm:grid-cols-2 gap-2 mt-2">
                <input
                  type="text"
                  value={onsiteContact}
                  onChange={e => setOnsiteContact(e.target.value)}
                  placeholder="איש קשר באתר *"
                  className="border border-slate-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-orange-400"
                />
                <input
                  type="text"
                  value={onsiteAddress}
                  onChange={e => setOnsiteAddress(e.target.value)}
                  placeholder="כתובת האתר *"
                  className="border border-slate-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-orange-400"
                />
              </div>
            )}

            {serviceLocation === SERVICE_LOCATIONS.EXTERNAL && (
              <div className="mt-2 bg-indigo-50 border border-indigo-200 rounded-lg p-2.5 space-y-2">
                <p className="text-xs text-indigo-900">
                  המכשיר יוצא מאיתנו לגורם חיצוני. נעקוב מתי נשלח, מתי אמור לחזור ומתי חזר בפועל.
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={externalProvider}
                    onChange={e => setExternalProvider(e.target.value)}
                    list="external-providers"
                    placeholder="שם מעבדת החוץ / בית המלאכה *"
                    className="border border-slate-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-orange-400"
                  />
                  <datalist id="external-providers">
                    {knownExternalProviders.map(name => <option key={name} value={name} />)}
                  </datalist>
                  <input
                    type="text"
                    value={externalContact}
                    onChange={e => setExternalContact(e.target.value)}
                    placeholder="איש קשר / טלפון"
                    className="border border-slate-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-orange-400"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  <label className="text-xs text-slate-600">
                    נשלח בתאריך *
                    <input
                      type="date"
                      value={externalSentAt}
                      onChange={e => setExternalSentAt(e.target.value)}
                      className="w-full mt-0.5 border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-orange-400"
                    />
                  </label>
                  <label className="text-xs text-slate-600">
                    צפוי לחזור
                    <input
                      type="date"
                      value={externalExpectedReturn}
                      onChange={e => setExternalExpectedReturn(e.target.value)}
                      className="w-full mt-0.5 border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-orange-400"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-1.5"
          >
            <Plus size={16} />
            פתח תיקון מהיר
          </button>
        </div>
      </div>

      {/* ============ רשימת התיקונים ============ */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h2 className="font-bold text-slate-900">
            תיקונים מהירים <span className="text-sm font-normal text-slate-400">({openCount} פתוחים)</span>
          </h2>
          <div className="flex gap-1 flex-wrap">
            {[
              { key: 'open', label: 'פתוחים' },
              { key: 'external', label: `במעבדת חוץ${atExternalCount > 0 ? ` (${atExternalCount})` : ''}` },
              { key: 'closed', label: 'סגורים' },
              { key: 'all', label: 'הכל' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setListFilter(f.key)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                  listFilter === f.key
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <SearchInput
          value={listSearch}
          onChange={setListSearch}
          placeholder="חפש לפי מזהה, לקוח, מכשיר או תלונה..."
          className="mb-3"
        />

        {quickRepairs.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="אין תיקונים מהירים להצגה"
            description={listSearch ? 'לא נמצאו תוצאות בחיפוש' : 'פתח תיקון מהיר בטופס שלמעלה'}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 items-start">
            {quickRepairs.map(repair => (
              <QuickRepairCard
                key={repair.id}
                repair={repair}
                defaultOpen={repair.id === lastCreatedId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
