import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { uploadToStorage } from '../../store/supabaseStorage';
import { generateDeviceId, generateRepairId, generateEngravingNumber } from '../../utils/idGenerators';
import { loadFromStorage, storageKeys } from '../../store/storage';
import { REPAIR_STATUSES } from '../../constants/statuses';
import { formatDateTime } from '../../utils/formatters';
import PageHeader from '../../components/PageHeader';
import AutocompleteInput from '../../components/AutocompleteInput';
import ManufacturerModelPicker from '../../components/ManufacturerModelPicker';
import DeviceThumbnail from '../../components/DeviceThumbnail';
import { Wrench, FileText, Check, Plus, Camera, LayoutDashboard, Dices } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';

const MAX_PHOTOS = 3;
const PHOTO_MAX_PX = 800;
const PHOTO_QUALITY = 0.7;

const compressImage = (dataUrl) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, PHOTO_MAX_PX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', PHOTO_QUALITY));
    };
    img.src = dataUrl;
  });

export default function OfficeIntakeInternal({ onNavigate }) {
  const { state, dispatch } = useAppContext();

  const [step, setStep] = useState(1);

  // נתוני מכשיר
  const [deviceMode, setDeviceMode] = useState('new');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [deviceSearch, setDeviceSearch] = useState('');
  const [newDevice, setNewDevice] = useState({
    type: '', brand: '', model: '', manufacturer_serial: '', purchase_date: '', purchase_cost: '',
  });

  // נתוני תיקון
  const [complaint, setComplaint] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [intakePhotos, setIntakePhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeletePhoto, setConfirmDeletePhoto] = useState(null);
  const [successRepair, setSuccessRepair] = useState(null);

  // מכשירים ללא לקוח (יד שנייה) או כל מכשיר
  const internalDevices = state.devices.filter(d =>
    !d.owner_customer_id &&
    (!deviceSearch ||
      `${d.brand} ${d.model} ${d.type}`.toLowerCase().includes(deviceSearch.toLowerCase()))
  );

  const deviceHistory = selectedDeviceId
    ? state.repairs.filter(r => r.device_id === selectedDeviceId).sort((a, b) =>
        new Date(b.date_intake) - new Date(a.date_intake)
      )
    : [];

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result);
        const url = await uploadToStorage(compressed, 'intake');
        setIntakePhotos(prev => {
          if (prev.length >= MAX_PHOTOS) return prev;
          return [...prev, url];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (idx) => {
    setIntakePhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    let deviceId = selectedDeviceId;
    if (deviceMode === 'new') {
      deviceId = generateDeviceId(state.devices.map(d => d.id));
      const serial = newDevice.manufacturer_serial?.trim() || generateEngravingNumber(state.devices);
      dispatch({
        type: 'ADD_DEVICE',
        payload: {
          id: deviceId,
          ...newDevice,
          manufacturer_serial: serial,
          owner_customer_id: null,
          images: intakePhotos,
          created_date: new Date().toISOString(),
        },
      });
    } else if (intakePhotos.length > 0) {
      const existingDevice = state.devices.find(d => d.id === deviceId);
      const mergedImages = [...(existingDevice?.images || []), ...intakePhotos].slice(0, 4);
      dispatch({ type: 'UPDATE_DEVICE', payload: { ...existingDevice, images: mergedImages } });
    }

    const freshRepairs = loadFromStorage(storageKeys.REPAIRS, state.repairs);
    const repairId = generateRepairId(freshRepairs.map(r => r.id));

    const repair = {
      id: repairId,
      customer_id: null,
      device_id: deviceId,
      repair_type: 'internal_used',
      complaint,
      internal_notes: internalNotes,
      purchase_cost: purchaseCost ? parseFloat(purchaseCost) : null,
      warranty_type: 'paid',
      status: REPAIR_STATUSES.RED_INTAKE,
      date_intake: new Date().toISOString(),
      intake_by_user_id: state.currentUser?.id,
      intake_by_name: state.currentUser?.name,
    };
    dispatch({ type: 'ADD_REPAIR', payload: repair });
    setSuccessRepair({ repair, deviceId });
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setStep(1);
    setDeviceMode('new');
    setSelectedDeviceId('');
    setDeviceSearch('');
    setNewDevice({ type: '', brand: '', model: '', manufacturer_serial: '', purchase_date: '' });
    setComplaint('');
    setInternalNotes('');
    setPurchaseCost('');
    setIntakePhotos([]);
    setSuccessRepair(null);
  };

  const canProceedFromStep1 = deviceMode === 'select'
    ? !!selectedDeviceId
    : !!(newDevice.type && newDevice.brand);

  const canSave = !!complaint;

  // מסך הצלחה
  if (successRepair) {
    const device = state.devices.find(d => d.id === successRepair.deviceId) ||
      { brand: newDevice.brand, model: newDevice.model, id: successRepair.deviceId };
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Check className="text-purple-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">מוצר יד שנייה נקלט!</h2>
          <div className="bg-slate-50 rounded-lg p-4 my-6 text-right">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">קוד תיקון:</span> <span className="font-bold text-purple-600">{successRepair.repair.id}</span></div>
              <div><span className="text-slate-500">קוד מכשיר:</span> <span className="font-bold">{device?.id}</span></div>
              <div className="col-span-2"><span className="text-slate-500">מכשיר:</span> <span>{device?.type || `${device?.brand} ${device?.model}`}</span></div>
              <div className="col-span-2"><span className="text-slate-500">תיאור:</span> <span>{successRepair.repair.complaint}</span></div>
            </div>
            <div className="mt-3 inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold">
              🛒 מוצר יד שנייה — טיפול פנימי
            </div>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={resetForm} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2">
              <Plus size={18} />
              קליטת מוצר נוסף
            </button>
            {onNavigate && (
              <button onClick={() => onNavigate('kanban')} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2">
                <LayoutDashboard size={18} />
                עבור ל-Kanban
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="קליטת מוצר יד שנייה"
        subtitle="מוצר שנרכש לתיקון פנימי — ללא לקוח משלם"
      />

      {/* תג הסבר */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <span className="text-2xl">🛒</span>
        <div>
          <p className="font-bold text-purple-900">טיפול פנימי</p>
          <p className="text-sm text-purple-700">המוצר יעבור את תהליך המעבדה המלא (אבחון, תיקון, תיעוד) אך ללא גביה מלקוח. כל העלויות ייעקבו לסטטיסטיקה פנימית.</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'מכשיר', icon: Wrench },
            { num: 2, label: 'פרטים', icon: FileText },
            { num: 3, label: 'אישור', icon: Check },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className={`flex flex-col items-center ${step >= s.num ? 'text-purple-600' : 'text-slate-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  step > s.num ? 'bg-green-500 border-green-500 text-white' :
                  step === s.num ? 'bg-purple-600 border-purple-600 text-white' :
                  'bg-white border-slate-300'
                }`}>
                  {step > s.num ? <Check size={18} /> : <s.icon size={18} />}
                </div>
                <span className="text-xs mt-1 font-semibold">{s.label}</span>
              </div>
              {idx < 2 && (
                <div className={`flex-1 h-0.5 mx-2 ${step > s.num ? 'bg-green-500' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Device */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">בחירת/יצירת מכשיר</h2>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setDeviceMode('new')}
              className={`flex-1 py-2 rounded-lg font-semibold ${deviceMode === 'new' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              מכשיר חדש
            </button>
            <button
              onClick={() => setDeviceMode('select')}
              className={`flex-1 py-2 rounded-lg font-semibold ${deviceMode === 'select' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              מכשיר קיים ({internalDevices.length})
            </button>
          </div>

          {deviceMode === 'new' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <ManufacturerModelPicker
                  initialBrand={newDevice.brand}
                  initialModel={newDevice.model}
                  onSelect={({ brand, model, type }) => setNewDevice(d => ({ ...d, brand, model, type: type || d.type }))}
                />
              </div>
              <AutocompleteInput
                value={newDevice.type}
                onChange={val => setNewDevice({ ...newDevice, type: val })}
                onAddValue={val => dispatch({ type: 'ADD_FIELD_VALUE', payload: { field: 'deviceTypes', value: val } })}
                suggestions={state.settings?.fieldLists?.deviceTypes || []}
                placeholder="שם מכשיר * (תנור קומבי, מקרר)"
                allowNew
                className="col-span-2"
              />
              <div className="col-span-2 flex gap-1.5">
                <input
                  type="text"
                  placeholder="Serial Number יצרן (אם אין — יוצע מספר לחריטה)"
                  value={newDevice.manufacturer_serial}
                  onChange={(e) => setNewDevice({ ...newDevice, manufacturer_serial: e.target.value })}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() => setNewDevice(d => ({ ...d, manufacturer_serial: generateEngravingNumber(state.devices) }))}
                  title="הצע מספר לחריטה במקום מוסתר במכשיר"
                  className="shrink-0 px-2.5 border border-slate-300 rounded-lg text-slate-500 hover:text-orange-600 hover:border-orange-400"
                >
                  <Dices size={16} />
                </button>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">תאריך רכישה (יד שנייה)</label>
                <input
                  type="date"
                  value={newDevice.purchase_date}
                  onChange={(e) => setNewDevice({ ...newDevice, purchase_date: e.target.value })}
                  className="border border-slate-300 rounded-lg px-3 py-2 w-full"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">עלות רכישה (₪)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newDevice.purchase_cost}
                  onChange={(e) => setNewDevice({ ...newDevice, purchase_cost: e.target.value })}
                  className="border border-slate-300 rounded-lg px-3 py-2 w-full"
                />
              </div>
            </div>
          ) : (
            <div>
              <input
                type="text"
                placeholder="חיפוש לפי מותג, דגם, סוג..."
                value={deviceSearch}
                onChange={e => setDeviceSearch(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 w-full mb-3"
              />
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                {internalDevices.length === 0 ? (
                  <p className="text-center text-slate-500 py-8 text-sm">לא נמצאו מכשירים פנימיים. עבור ל"מכשיר חדש".</p>
                ) : (
                  internalDevices.map(d => (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDeviceId(d.id)}
                      className={`w-full text-right p-3 border-b last:border-b-0 hover:bg-slate-50 cursor-pointer ${selectedDeviceId === d.id ? 'bg-purple-50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DeviceThumbnail device={d} size="sm" />
                          <div>
                            <p className="font-semibold">{d.type || `${d.brand} ${d.model}`}</p>
                            <p className="text-xs text-slate-500">
                              {d.type && `${d.brand} ${d.model} • `}Serial: {d.manufacturer_serial || '—'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">{d.id}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {selectedDeviceId && deviceHistory.length > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-blue-900 mb-2">📜 היסטוריה ({deviceHistory.length} תיקונים):</p>
              <div className="space-y-1 text-xs">
                {deviceHistory.slice(0, 3).map(r => (
                  <div key={r.id} className="flex justify-between">
                    <span className="text-blue-800">{r.complaint}</span>
                    <span className="text-blue-600">{formatDateTime(r.date_intake)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setStep(2)}
              disabled={!canProceedFromStep1}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-semibold"
            >
              המשך לפרטים ←
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">פרטי הטיפול</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">תיאור הבעיה / מה צריך לתקן *</label>
              <textarea
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="תיאור מפורט של הבעיה..."
                rows={4}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">עלות רכישת המכשיר (₪)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={purchaseCost}
                onChange={e => setPurchaseCost(e.target.value)}
                placeholder="0"
                className="border border-slate-300 rounded-lg px-3 py-2 w-40"
              />
              <p className="text-xs text-slate-400 mt-0.5">לסטטיסטיקה פנימית בלבד</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">הערות פנימיות</label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="הערות לצוות..."
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Camera className="inline ml-1" size={16} />
                תמונות מכשיר <span className="text-slate-400 font-normal">(עד {MAX_PHOTOS})</span>
              </label>
              <div className="flex flex-wrap gap-2 items-center">
                {intakePhotos.length < MAX_PHOTOS && (
                  <>
                    <label className="cursor-pointer bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-sm px-4 py-2 rounded-lg border border-purple-200">
                      📁 בחר קבצים
                      <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                    </label>
                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm px-4 py-2 rounded-lg flex items-center gap-1">
                      <Camera size={15} />
                      צלם
                      <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </>
                )}
              </div>
              {intakePhotos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {intakePhotos.map((photo, idx) => (
                    <div key={idx} className="relative">
                      <img src={photo} alt={`תמונה ${idx + 1}`} className="w-full h-20 object-cover rounded-lg border" />
                      <button
                        onClick={() => setConfirmDeletePhoto(idx)}
                        className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button onClick={() => setStep(1)} className="text-slate-600 hover:text-slate-900 font-medium">
              → חזרה למכשיר
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canSave}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-semibold"
            >
              סקירה ואישור ←
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">סקירה ואישור</h2>

          <div className="space-y-3 mb-6">
            <SummaryRow
              label="מכשיר"
              value={deviceMode === 'new'
                ? `${newDevice.brand} ${newDevice.model}`
                : (() => { const d = state.devices.find(d => d.id === selectedDeviceId); return `${d?.brand} ${d?.model}`; })()}
              detail={deviceMode === 'new' ? newDevice.type : state.devices.find(d => d.id === selectedDeviceId)?.type}
            />
            <SummaryRow label="בעיה" value={complaint} />
            {purchaseCost && <SummaryRow label="עלות רכישה" value={`${purchaseCost}₪`} />}
            {internalNotes && <SummaryRow label="הערות" value={internalNotes} />}
            <SummaryRow label="תמונות" value={`${intakePhotos.length} תמונות`} />
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-900 font-semibold">
              🛒 מוצר יד שנייה — ללא גביה מלקוח
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="text-slate-600 hover:text-slate-900 font-medium">
              → ערוך פרטים
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white px-8 py-3 rounded-lg font-bold shadow-md"
            >
              <Check className="inline ml-1" size={20} />
              {isSubmitting ? 'שומר...' : 'קלוט מוצר'}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeletePhoto !== null}
        title="אישור מחיקה"
        message="האם אתה בטוח שאתה רוצה למחוק את התמונה?"
        confirmLabel="מחק"
        variant="danger"
        onConfirm={() => { removePhoto(confirmDeletePhoto); setConfirmDeletePhoto(null); }}
        onCancel={() => setConfirmDeletePhoto(null)}
      />
    </div>
  );
}

function SummaryRow({ label, value, detail }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-100">
      <span className="text-sm text-slate-500 font-semibold w-28 flex-shrink-0">{label}:</span>
      <div className="text-right">
        <p className="text-slate-900 font-medium">{value || '—'}</p>
        {detail && <p className="text-xs text-slate-500 mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}
