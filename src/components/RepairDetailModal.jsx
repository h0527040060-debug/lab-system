import { useState, useRef } from 'react';
import { X, User, Smartphone, FileText, Wrench, Camera, Stethoscope, Clock, Package, Edit2, Plus, Trash2 } from 'lucide-react';
import { uploadToStorage } from '../store/supabaseStorage';
import ConfirmDialog from './ConfirmDialog';
import { useAppContext } from '../store/AppContext';
import { getStatusDisplay } from '../utils/statusConfig';
import { formatDateTime } from '../utils/formatters';
import WhatsAppButton from './WhatsAppButton';
import { RepairEditModal } from './RepairEditModal';
import { CustomerEditModal } from './CustomerEditModal';
import { DeviceEditModal } from './DeviceEditModal';
import ImageGalleryModal from './ImageGalleryModal';

const WARRANTY_LABELS = {
  paid: 'תשלום רגיל',
  full_warranty: 'אחריות מלאה',
  paid_warranty: 'אחריות בתשלום',
};

function formatSeconds(sec) {
  if (!sec || sec < 60) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}ש׳ ${m > 0 ? m + 'ד׳' : ''}`.trim();
  return `${m} דקות`;
}

function getWarrantyStatus(repair, device) {
  if (!device?.our_warranty_months) return null;
  const start = new Date(repair.created_at || repair.date_intake);
  const expiry = new Date(start);
  expiry.setMonth(expiry.getMonth() + device.our_warranty_months);
  const daysLeft = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) return { expired: true };
  if (daysLeft > 30) return { expired: false, months: Math.ceil(daysLeft / 30) };
  return { expired: false, days: daysLeft };
}

const MAX_DEVICE_PHOTOS = 4;
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

export default function RepairDetailModal({ repair, customer, device, onClose, onAction }) {
  const { state, dispatch } = useAppContext();
  const addPhotoRef = useRef(null);
  const [showEditCustomer, setShowEditCustomer] = useState(false);
  const [showEditDevice, setShowEditDevice] = useState(false);
  const [showEditRepair, setShowEditRepair] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(null);
  const [confirmDeletePhoto, setConfirmDeletePhoto] = useState(null);
  const [showDeleteRepair, setShowDeleteRepair] = useState(false);
  const statusDisplay = getStatusDisplay(repair.status, state.statusConfig);

  const diagnosedParts = repair.diagnosed_parts || [];
  const partsDetails = diagnosedParts.map(dp => {
    const part = state.parts?.find(p => p.id === dp.part_id || p.id === dp.id);
    return { name: part?.name || dp.name || 'חלק', qty: dp.quantity || 1, price: dp.price || part?.price || 0 };
  });

  const elapsedTime = formatSeconds(repair.timer_seconds);
  const laborCost = repair.labor_cost || 0;
  const partsCost = repair.parts_cost || partsDetails.reduce((s, p) => s + p.price * p.qty, 0);
  const finalPrice = repair.final_price;

  const canDiagnosis = ['red_intake', 'yellow_diagnosis', 'yellow_appeal'].includes(repair.status);
  const canWork = ['yellow_ready_to_work', 'in_work'].includes(repair.status);
  const canDocs = repair.status === 'pending_release_docs';

  // תמונות מכשיר — מקור האמת הוא device.images, עם fallback לתמונות קליטה ישנות
  const deviceImages = device?.images?.length > 0 ? device.images : (repair.intake_photos || []);

  const handleAddDevicePhoto = (e) => {
    const files = Array.from(e.target.files);
    if (!device || !files.length) return;
    const slots = MAX_DEVICE_PHOTOS - (device.images || []).length;
    const toAdd = files.slice(0, slots);
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result);
        const url = await uploadToStorage(compressed, 'devices');
        const currentDevice = state.devices.find(d => d.id === device.id);
        const updated = [...(currentDevice?.images || []), url].slice(0, MAX_DEVICE_PHOTOS);
        dispatch({ type: 'UPDATE_DEVICE', payload: { ...currentDevice, images: updated } });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleDeleteDevicePhoto = (idx) => {
    if (!device) return;
    const currentDevice = state.devices.find(d => d.id === device.id);
    const updated = (currentDevice?.images || []).filter((_, i) => i !== idx);
    dispatch({ type: 'UPDATE_DEVICE', payload: { ...currentDevice, images: updated } });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* כותרת */}
          <div className={`flex items-center justify-between p-4 border-b border-slate-200 ${statusDisplay.bg}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{statusDisplay.emoji}</span>
              <div>
                <p className="font-mono font-bold text-orange-600 text-sm">{repair.id}</p>
                <p className={`text-xs font-semibold ${statusDisplay.text}`}>{statusDisplay.label}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-white/60">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* לקוח ומכשיר */}
            <div className="space-y-2">
              <button
                onClick={() => setShowEditCustomer(true)}
                className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors text-right"
              >
                <User size={16} className="text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">לקוח</p>
                  <p className="font-semibold text-slate-800 truncate">{customer?.name || '—'}</p>
                  {customer?.phone && <p className="text-xs text-slate-500">{customer.phone}</p>}
                </div>
                <span className="text-xs text-blue-500 font-semibold flex-shrink-0">פרטים ←</span>
              </button>

              <button
                onClick={() => setShowEditDevice(true)}
                className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-purple-50 rounded-xl border border-slate-200 hover:border-purple-300 transition-colors text-right"
              >
                <Smartphone size={16} className="text-purple-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">מכשיר</p>
                  <p className="font-semibold text-slate-800 truncate">{device?.brand} {device?.model}</p>
                  {device?.id && <p className="text-xs text-slate-400 font-mono">{device.id}</p>}
                </div>
                <span className="text-xs text-purple-500 font-semibold flex-shrink-0">פרטים ←</span>
              </button>
            </div>

            {/* תאריך + אחריות */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-slate-50 rounded-xl p-2.5">
                <p className="text-xs text-slate-500 mb-0.5">תאריך קליטה</p>
                <p className="font-semibold text-slate-800">{repair.date_intake ? formatDateTime(repair.date_intake).slice(0, 10) : '—'}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5">
                <p className="text-xs text-slate-500 mb-0.5">סוג שירות</p>
                <p className="font-semibold text-slate-800">{WARRANTY_LABELS[repair.warranty_type] || repair.warranty_type || '—'}</p>
              </div>
            </div>

            {/* חיווי אחריות שלנו */}
            {(() => {
              const ws = getWarrantyStatus(repair, device);
              if (!ws) return null;
              return (
                <div className={`rounded-xl px-3 py-2 text-sm font-semibold flex items-center gap-2 ${ws.expired ? 'bg-red-50 text-red-600 border border-red-200' : ws.days ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                  <span>{ws.expired ? '⚠️' : '🛡️'}</span>
                  {ws.expired
                    ? 'פג תוקף האחריות'
                    : ws.months
                    ? `נותרו ${ws.months} חודשים לסיום האחריות`
                    : `נותרו ${ws.days} ימים לסיום האחריות`}
                </div>
              );
            })()}

            {/* תלונה */}
            {repair.complaint && (
              <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText size={13} className="text-orange-600" />
                  <p className="text-xs font-bold text-orange-700">תלונת לקוח</p>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{repair.complaint}</p>
              </div>
            )}

            {/* תמונות מכשיר */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold text-slate-500">תמונות מכשיר</p>
                {device && (device.images || []).length < MAX_DEVICE_PHOTOS && (
                  <button
                    onClick={() => addPhotoRef.current?.click()}
                    className="flex items-center gap-1 text-xs text-orange-600 font-semibold"
                  >
                    <Plus size={12} /> הוסף
                  </button>
                )}
              </div>
              <input ref={addPhotoRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddDevicePhoto} />
              {deviceImages.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {deviceImages.map((src, i) => (
                    <div key={i} className="relative">
                      <img
                        src={src}
                        onClick={() => setGalleryIndex(i)}
                        className="w-16 h-16 object-cover rounded-lg cursor-pointer border border-slate-200"
                      />
                      {device && device.images?.length > 0 && (
                        <button
                          onClick={() => setConfirmDeletePhoto(i)}
                          className="absolute -top-1 -left-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center"
                        >
                          <X size={9} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">אין תמונות</p>
              )}
            </div>

            {/* אבחון */}
            {repair.diagnosis_notes && (
              <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Stethoscope size={13} className="text-yellow-700" />
                  <p className="text-xs font-bold text-yellow-700">אבחון טכנאי</p>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{repair.diagnosis_notes}</p>
              </div>
            )}

            {/* זמן עבודה */}
            {elapsedTime && (
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-blue-500" />
                <span className="text-slate-600">זמן עבודה:</span>
                <span className="font-semibold text-slate-800">{elapsedTime}</span>
              </div>
            )}

            {/* חלקים */}
            {partsDetails.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <div className="flex items-center gap-1.5 mb-2">
                  <Package size={13} className="text-slate-600" />
                  <p className="text-xs font-bold text-slate-700">חלקים ({partsDetails.length})</p>
                </div>
                <div className="space-y-1">
                  {partsDetails.map((p, i) => (
                    <div key={i} className="flex justify-between text-xs text-slate-700">
                      <span>{p.name} {p.qty > 1 ? `×${p.qty}` : ''}</span>
                      {p.price > 0 && <span className="font-semibold">{p.price * p.qty}₪</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* תמחור */}
            {(finalPrice != null || laborCost > 0 || partsCost > 0) && (
              <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                <p className="text-xs font-bold text-green-700 mb-1.5">תמחור</p>
                <div className="space-y-0.5 text-xs text-slate-700">
                  {laborCost > 0 && (
                    <div className="flex justify-between"><span>עבודה</span><span>{laborCost}₪</span></div>
                  )}
                  {partsCost > 0 && (
                    <div className="flex justify-between"><span>חלקים</span><span>{partsCost}₪</span></div>
                  )}
                  {finalPrice != null && (
                    <div className="flex justify-between font-bold text-sm text-green-800 pt-1 border-t border-green-200 mt-1">
                      <span>סה״כ לתשלום</span><span>{finalPrice}₪</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* פעולות */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
              <button
                onClick={() => setShowDeleteRepair(true)}
                className="flex items-center gap-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-semibold border border-red-200"
              >
                <Trash2 size={12} /> מחק
              </button>
              <WhatsAppButton repair={repair} customer={customer} device={device} type="customer" />
              <button
                onClick={() => setShowEditRepair(true)}
                className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-semibold"
              >
                <Edit2 size={12} /> ערוך פרטים
              </button>
              {canDiagnosis && (
                <button
                  onClick={() => { onAction(repair.id, 'diagnosis'); onClose(); }}
                  className="flex items-center gap-1.5 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1.5 rounded-lg font-semibold"
                >
                  <Stethoscope size={12} /> אבחון
                </button>
              )}
              {repair.diagnosis_notes && !canDiagnosis && (
                <button
                  onClick={() => { onAction(repair.id, 'diagnosis'); onClose(); }}
                  className="flex items-center gap-1.5 text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg font-semibold border border-yellow-200"
                >
                  <Stethoscope size={12} /> ערוך אבחון
                </button>
              )}
              {canWork && (
                <button
                  onClick={() => { onAction(repair.id, 'work'); onClose(); }}
                  className="flex items-center gap-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1.5 rounded-lg font-semibold"
                >
                  <Wrench size={12} /> ביצוע
                </button>
              )}
              {canDocs && (
                <button
                  onClick={() => { onAction(repair.id, 'docs'); onClose(); }}
                  className="flex items-center gap-1.5 text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1.5 rounded-lg font-semibold"
                >
                  <Camera size={12} /> תיעוד
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* modals פנימיים */}
      {showEditCustomer && customer && (
        <CustomerEditModal customer={customer} onClose={() => setShowEditCustomer(false)} />
      )}
      {showEditDevice && device && (
        <DeviceEditModal device={device} onClose={() => setShowEditDevice(false)} />
      )}
      {showEditRepair && (
        <RepairEditModal repair={repair} onClose={() => setShowEditRepair(false)} />
      )}
      {galleryIndex !== null && (
        <ImageGalleryModal
          images={deviceImages}
          startIndex={galleryIndex}
          onClose={() => setGalleryIndex(null)}
        />
      )}
      <ConfirmDialog
        open={confirmDeletePhoto !== null}
        title="אישור מחיקה"
        message="האם אתה בטוח שאתה רוצה למחוק את התמונה?"
        confirmLabel="מחק"
        variant="danger"
        onConfirm={() => { handleDeleteDevicePhoto(confirmDeletePhoto); setConfirmDeletePhoto(null); }}
        onCancel={() => setConfirmDeletePhoto(null)}
      />
      <ConfirmDialog
        open={showDeleteRepair}
        title="מחיקת קריאה"
        message={`האם אתה בטוח שאתה רוצה למחוק את הקריאה ${repair.id}? פעולה זו אינה ניתנת לביטול.`}
        confirmLabel="מחק לצמיתות"
        variant="danger"
        onConfirm={() => { dispatch({ type: 'DELETE_REPAIR', payload: repair.id }); setShowDeleteRepair(false); onClose(); }}
        onCancel={() => setShowDeleteRepair(false)}
      />
    </>
  );
}
