import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { generateCustomerId, generateDeviceId, generateRepairId } from '../../utils/idGenerators';
import { REPAIR_STATUSES } from '../../constants/statuses';
import { WARRANTY_TYPES, WARRANTY_LABELS } from '../../constants/warranty';
import { formatDateTime, formatMoney } from '../../utils/formatters';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import { User, Wrench, FileText, ShieldCheck, Camera, Check, Plus } from 'lucide-react';

export default function OfficeIntake() {
  const { state, dispatch } = useAppContext();

  const [step, setStep] = useState(1);

  // נתוני לקוח
  const [customerMode, setCustomerMode] = useState('select');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [newCustomer, setNewCustomer] = useState({
    name: '', phone: '', email: '', address: '', notes: '',
  });

  // נתוני מכשיר
  const [deviceMode, setDeviceMode] = useState('select');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [newDevice, setNewDevice] = useState({
    type: '', brand: '', model: '', manufacturer_serial: '', purchase_date: '', warranty_until: '',
  });

  // נתוני תיקון
  const [complaint, setComplaint] = useState('');
  const [warrantyType, setWarrantyType] = useState(WARRANTY_TYPES.PAID);
  const [intakePhotos, setIntakePhotos] = useState([]);
  const [diagnosticFeeConfirmed, setDiagnosticFeeConfirmed] = useState(false);

  const [successRepair, setSuccessRepair] = useState(null);

  const filteredCustomers = state.customers.filter(c =>
    !customerSearch ||
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const customerDevices = selectedCustomerId
    ? state.devices.filter(d => d.owner_customer_id === selectedCustomerId)
    : [];

  const deviceHistory = selectedDeviceId
    ? state.repairs.filter(r => r.device_id === selectedDeviceId).sort((a, b) =>
        new Date(b.date_intake) - new Date(a.date_intake)
      )
    : [];

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIntakePhotos(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (idx) => {
    setIntakePhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    let customerId = selectedCustomerId;
    if (customerMode === 'new') {
      customerId = generateCustomerId(state.customers.map(c => c.id));
      dispatch({
        type: 'ADD_CUSTOMER',
        payload: { id: customerId, ...newCustomer, created_date: new Date().toISOString() },
      });
    }

    let deviceId = selectedDeviceId;
    if (deviceMode === 'new') {
      deviceId = generateDeviceId(state.devices.map(d => d.id));
      dispatch({
        type: 'ADD_DEVICE',
        payload: { id: deviceId, ...newDevice, owner_customer_id: customerId, created_date: new Date().toISOString() },
      });
    }

    const repairId = generateRepairId(state.repairs.map(r => r.id));
    const repair = {
      id: repairId,
      customer_id: customerId,
      device_id: deviceId,
      complaint,
      warranty_type: warrantyType,
      status: REPAIR_STATUSES.RED_INTAKE,
      date_intake: new Date().toISOString(),
      intake_photos: intakePhotos,
      intake_by_user_id: state.currentUser?.id,
      intake_by_name: state.currentUser?.name,
    };
    dispatch({ type: 'ADD_REPAIR', payload: repair });
    setSuccessRepair(repair);
  };

  const resetForm = () => {
    setStep(1);
    setCustomerMode('select');
    setSelectedCustomerId('');
    setCustomerSearch('');
    setNewCustomer({ name: '', phone: '', email: '', address: '', notes: '' });
    setDeviceMode('select');
    setSelectedDeviceId('');
    setNewDevice({ type: '', brand: '', model: '', manufacturer_serial: '', purchase_date: '', warranty_until: '' });
    setComplaint('');
    setWarrantyType(WARRANTY_TYPES.PAID);
    setIntakePhotos([]);
    setDiagnosticFeeConfirmed(false);
    setSuccessRepair(null);
  };

  const canProceedFromStep1 = customerMode === 'select'
    ? !!selectedCustomerId
    : !!(newCustomer.name && newCustomer.phone);

  const canProceedFromStep2 = deviceMode === 'select'
    ? !!selectedDeviceId
    : !!(newDevice.type && newDevice.brand);

  const requiresFeeConfirm = warrantyType !== WARRANTY_TYPES.FULL_WARRANTY;
  const canSave = !!complaint && intakePhotos.length >= 1 && (!requiresFeeConfirm || diagnosticFeeConfirmed);

  // מסך הצלחה
  if (successRepair) {
    const customer = state.customers.find(c => c.id === successRepair.customer_id);
    const device = state.devices.find(d => d.id === successRepair.device_id);
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Check className="text-green-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">הקריאה נקלטה בהצלחה!</h2>
          <div className="bg-slate-50 rounded-lg p-4 my-6 text-right">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">קוד תיקון:</span> <span className="font-bold text-orange-600">{successRepair.id}</span></div>
              <div><span className="text-slate-500">קוד מכשיר:</span> <span className="font-bold">{device?.id}</span></div>
              <div><span className="text-slate-500">לקוח:</span> <span className="font-semibold">{customer?.name}</span></div>
              <div><span className="text-slate-500">טלפון:</span> <span>{customer?.phone}</span></div>
              <div className="col-span-2"><span className="text-slate-500">מכשיר:</span> <span>{device?.brand} {device?.model}</span></div>
              <div className="col-span-2"><span className="text-slate-500">תלונה:</span> <span>{successRepair.complaint}</span></div>
            </div>
          </div>
          <button onClick={resetForm} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bold">
            <Plus size={18} className="inline ml-1" />
            קליטת קריאה נוספת
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="קליטת קריאה חדשה" subtitle="פתיחת תיקון חדש במערכת" />

      {/* Step Indicator */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'לקוח', icon: User },
            { num: 2, label: 'מכשיר', icon: Wrench },
            { num: 3, label: 'תיקון', icon: FileText },
            { num: 4, label: 'אישור', icon: Check },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className={`flex flex-col items-center ${step >= s.num ? 'text-orange-600' : 'text-slate-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  step > s.num ? 'bg-green-500 border-green-500 text-white' :
                  step === s.num ? 'bg-orange-500 border-orange-500 text-white' :
                  'bg-white border-slate-300'
                }`}>
                  {step > s.num ? <Check size={18} /> : <s.icon size={18} />}
                </div>
                <span className="text-xs mt-1 font-semibold">{s.label}</span>
              </div>
              {idx < 3 && (
                <div className={`flex-1 h-0.5 mx-2 ${step > s.num ? 'bg-green-500' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Customer */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">בחירת/יצירת לקוח</h2>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setCustomerMode('select')}
              className={`flex-1 py-2 rounded-lg font-semibold ${customerMode === 'select' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              לקוח קיים
            </button>
            <button
              onClick={() => setCustomerMode('new')}
              className={`flex-1 py-2 rounded-lg font-semibold ${customerMode === 'new' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              לקוח חדש
            </button>
          </div>

          {customerMode === 'select' ? (
            <div>
              <SearchInput value={customerSearch} onChange={setCustomerSearch} placeholder="חיפוש לפי שם או טלפון..." className="mb-3" />
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                {filteredCustomers.length === 0 ? (
                  <p className="text-center text-slate-500 py-8 text-sm">
                    {state.customers.length === 0 ? 'אין לקוחות במערכת. עבור ללשונית "לקוח חדש".' : 'לא נמצאו לקוחות התואמים את החיפוש'}
                  </p>
                ) : (
                  filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCustomerId(c.id)}
                      className={`w-full text-right p-3 border-b last:border-b-0 hover:bg-slate-50 ${selectedCustomerId === c.id ? 'bg-orange-50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{c.name}</p>
                          <p className="text-xs text-slate-500">{c.phone} {c.email && `• ${c.email}`}</p>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">{c.id}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="שם לקוח *"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2 col-span-2"
              />
              <input
                type="tel"
                placeholder="טלפון *"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2"
              />
              <input
                type="email"
                placeholder="מייל"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="כתובת"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2 col-span-2"
              />
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setStep(2)}
              disabled={!canProceedFromStep1}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-semibold"
            >
              המשך לבחירת מכשיר ←
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Device */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">בחירת/יצירת מכשיר</h2>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setDeviceMode('select')}
              disabled={customerDevices.length === 0}
              className={`flex-1 py-2 rounded-lg font-semibold disabled:opacity-50 ${deviceMode === 'select' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              מכשיר קיים ({customerDevices.length})
            </button>
            <button
              onClick={() => setDeviceMode('new')}
              className={`flex-1 py-2 rounded-lg font-semibold ${deviceMode === 'new' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              מכשיר חדש
            </button>
          </div>

          {deviceMode === 'select' ? (
            <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
              {customerDevices.length === 0 ? (
                <p className="text-center text-slate-500 py-8 text-sm">אין מכשירים ללקוח זה. עבור ל"מכשיר חדש".</p>
              ) : (
                customerDevices.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDeviceId(d.id)}
                    className={`w-full text-right p-3 border-b last:border-b-0 hover:bg-slate-50 ${selectedDeviceId === d.id ? 'bg-orange-50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{d.brand} {d.model}</p>
                        <p className="text-xs text-slate-500">{d.type} • Serial: {d.manufacturer_serial || '—'}</p>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{d.id}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="סוג מכשיר * (תנור קומבי, קוצץ ירקות)"
                value={newDevice.type}
                onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2 col-span-2"
              />
              <input
                type="text"
                placeholder="יצרן * (Ozti, Dynamic)"
                value={newDevice.brand}
                onChange={(e) => setNewDevice({ ...newDevice, brand: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="דגם (MX91)"
                value={newDevice.model}
                onChange={(e) => setNewDevice({ ...newDevice, model: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="Serial Number יצרן"
                value={newDevice.manufacturer_serial}
                onChange={(e) => setNewDevice({ ...newDevice, manufacturer_serial: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2 col-span-2"
              />
              <div>
                <label className="text-xs text-slate-500 mb-1 block">תאריך רכישה</label>
                <input
                  type="date"
                  value={newDevice.purchase_date}
                  onChange={(e) => setNewDevice({ ...newDevice, purchase_date: e.target.value })}
                  className="border border-slate-300 rounded-lg px-3 py-2 w-full"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">תוקף אחריות יצרן</label>
                <input
                  type="date"
                  value={newDevice.warranty_until}
                  onChange={(e) => setNewDevice({ ...newDevice, warranty_until: e.target.value })}
                  className="border border-slate-300 rounded-lg px-3 py-2 w-full"
                />
              </div>
            </div>
          )}

          {selectedDeviceId && deviceHistory.length > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-blue-900 mb-2">📜 היסטוריית המכשיר ({deviceHistory.length} תיקונים):</p>
              <div className="space-y-1 text-xs">
                {deviceHistory.slice(0, 3).map(r => (
                  <div key={r.id} className="flex justify-between">
                    <span className="text-blue-800">{r.complaint}</span>
                    <span className="text-blue-600">{formatDateTime(r.date_intake)}</span>
                  </div>
                ))}
                {deviceHistory.length > 3 && <p className="text-blue-600">ועוד {deviceHistory.length - 3} תיקונים...</p>}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button onClick={() => setStep(1)} className="text-slate-600 hover:text-slate-900 font-medium">
              → חזרה לשלב הלקוח
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canProceedFromStep2}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-semibold"
            >
              המשך לפרטי תיקון ←
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Repair Details */}
      {step === 3 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">פרטי התיקון</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">תיאור התלונה *</label>
              <textarea
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="תיאור מפורט של הבעיה..."
                rows={4}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <ShieldCheck className="inline ml-1" size={16} />
                סוג אחריות
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(WARRANTY_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => { setWarrantyType(key); setDiagnosticFeeConfirmed(false); }}
                    className={`p-3 rounded-lg border-2 text-sm font-semibold ${warrantyType === key ? 'border-orange-500 bg-orange-50 text-orange-900' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {warrantyType === WARRANTY_TYPES.PAID && 'הלקוח ישלם עבור התיקון'}
                {warrantyType === WARRANTY_TYPES.FULL_WARRANTY && 'אחריות מלאה — הלקוח לא משלם (כשל טכני)'}
                {warrantyType === WARRANTY_TYPES.PAID_WARRANTY && 'באחריות, אך בתשלום (נזק/שבר/שימוש לא נכון)'}
              </p>
              {requiresFeeConfirm && (
                <label className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={diagnosticFeeConfirmed}
                    onChange={e => setDiagnosticFeeConfirmed(e.target.checked)}
                    className="w-5 h-5 accent-orange-500 flex-shrink-0"
                  />
                  <span className="text-sm font-semibold text-amber-900">
                    הלקוח אישר דמי בדיקה {formatMoney(state.settings.diagnostic_fee || 180)} + מע"מ *
                  </span>
                </label>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Camera className="inline ml-1" size={16} />
                תמונות קליטה (מומלץ 4 מ-4 צדדים) *
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="block w-full text-sm text-slate-600 file:ml-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
              {intakePhotos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {intakePhotos.map((photo, idx) => (
                    <div key={idx} className="relative group">
                      <img src={photo} alt={`תמונה ${idx + 1}`} className="w-full h-20 object-cover rounded-lg border" />
                      <button
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-500 mt-1">חובה לפחות תמונה אחת. מומלץ 4 תמונות.</p>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button onClick={() => setStep(2)} className="text-slate-600 hover:text-slate-900 font-medium">
              → חזרה למכשיר
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={!canSave}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-semibold"
            >
              סקירה ואישור ←
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">סקירה ואישור</h2>

          <div className="space-y-4 mb-6">
            <SummaryRow
              label="לקוח"
              value={customerMode === 'select'
                ? state.customers.find(c => c.id === selectedCustomerId)?.name
                : newCustomer.name}
              detail={customerMode === 'select'
                ? state.customers.find(c => c.id === selectedCustomerId)?.phone
                : newCustomer.phone}
            />
            <SummaryRow
              label="מכשיר"
              value={deviceMode === 'select'
                ? `${state.devices.find(d => d.id === selectedDeviceId)?.brand || ''} ${state.devices.find(d => d.id === selectedDeviceId)?.model || ''}`
                : `${newDevice.brand} ${newDevice.model}`}
              detail={deviceMode === 'select'
                ? state.devices.find(d => d.id === selectedDeviceId)?.type
                : newDevice.type}
            />
            <SummaryRow label="תלונה" value={complaint} />
            <SummaryRow label="סוג אחריות" value={WARRANTY_LABELS[warrantyType]} />
            <SummaryRow label="תמונות" value={`${intakePhotos.length} תמונות`} />
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(3)} className="text-slate-600 hover:text-slate-900 font-medium">
              → ערוך פרטים
            </button>
            <button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold shadow-md"
            >
              <Check className="inline ml-1" size={20} />
              צור קריאת תיקון
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value, detail }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-100">
      <span className="text-sm text-slate-500 font-semibold w-24 flex-shrink-0">{label}:</span>
      <div className="text-right">
        <p className="text-slate-900 font-medium">{value || '—'}</p>
        {detail && <p className="text-xs text-slate-500 mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}
