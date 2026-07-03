import { useState, useRef } from 'react';
import { useAppContext } from '../store/AppContext';
import { useToast } from '../store/ToastContext';
import { uploadToStorage } from '../store/supabaseStorage';
import { REPAIR_STATUSES } from '../constants/statuses';
import { WARRANTY_TYPES, WARRANTY_LABELS } from '../constants/warranty';
import { formatDateTime, formatMoney } from '../utils/formatters';
import { filterWorkCatalogForDevice, calculateAvgHoursForWork } from '../utils/workCatalog';
import { generateWorkCodeId, generateInternalBarcode } from '../utils/idGenerators';
import Modal from './Modal';
import InfoCard from './InfoCard';
import { User, Wrench, FileText, History, ShieldAlert, Camera, Send, CheckSquare, Square, BookOpen, Search, Plus, HelpCircle, X } from 'lucide-react';
import PartThumbnail from './PartThumbnail';
import AssemblyInstructionsViewer from './AssemblyInstructionsViewer';
import { WorkCatalogEditModal } from './WorkCatalogEditModal';
import { PartEditModal } from './PartEditModal';

const IMG_MAX_PX = 800;
const IMG_QUALITY = 0.7;

const compressImage = (dataUrl) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, IMG_MAX_PX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', IMG_QUALITY));
    };
    img.src = dataUrl;
  });

const readFile = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });

export default function DiagnosisModal({ repair, onClose }) {
  const { state, dispatch } = useAppContext();
  const { showToast } = useToast();

  const customer = state.customers.find(c => c.id === repair.customer_id);
  const device = state.devices.find(d => d.id === repair.device_id);
  const deviceHistory = state.repairs
    .filter(r => r.device_id === repair.device_id && r.id !== repair.id)
    .sort((a, b) => new Date(b.date_intake) - new Date(a.date_intake));

  const relevantWorks = filterWorkCatalogForDevice(state.workCatalog, device);
  const relevantWorkIds = new Set(relevantWorks.map(w => w.id));

  const [diagnosis, setDiagnosis] = useState(repair.diagnosis || '');
  const [selectedWorks, setSelectedWorks] = useState(repair.diagnosed_work_codes || []);
  const [selectedParts, setSelectedParts] = useState(repair.diagnosed_parts || []);
  const [workSearch, setWorkSearch] = useState('');
  const [partSearch, setPartSearch] = useState('');
  const [addingWork, setAddingWork] = useState(false);
  const [addingPart, setAddingPart] = useState(false);

  const [showAppealForm, setShowAppealForm] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [assemblyPart, setAssemblyPart] = useState(null);
  const [appealReason, setAppealReason] = useState('');
  const [appealEvidence, setAppealEvidence] = useState([]);

  // חלקים לבירור
  const [inquiryParts, setInquiryParts] = useState(repair.inquiry_parts || []);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ description: '', images: [], supplier_ids: [] });
  const inquiryImgRef = useRef(null);

  const allFilteredWorks = state.workCatalog.filter(w => {
    if (!workSearch) return true;
    const s = workSearch.toLowerCase();
    return (
      w.work_name?.toLowerCase().includes(s) ||
      w.brand?.toLowerCase().includes(s) ||
      w.model?.toLowerCase().includes(s) ||
      w.id?.toLowerCase().includes(s)
    );
  });
  const sortedWorks = [
    ...allFilteredWorks.filter(w => relevantWorkIds.has(w.id)),
    ...allFilteredWorks.filter(w => !relevantWorkIds.has(w.id)),
  ];

  const filteredParts = state.parts.filter(p => {
    if (!partSearch) return true;
    const s = partSearch.toLowerCase();
    return (
      p.name?.toLowerCase().includes(s) ||
      p.manufacturer?.toLowerCase().includes(s) ||
      p.internal_barcode?.toLowerCase().includes(s) ||
      p.category?.toLowerCase().includes(s)
    );
  });

  const toggleWork = (workId) => {
    setSelectedWorks(prev =>
      prev.includes(workId) ? prev.filter(w => w !== workId) : [...prev, workId]
    );
  };

  const togglePart = (partId) => {
    setSelectedParts(prev => {
      const exists = prev.find(p => p.part_id === partId);
      if (exists) return prev.filter(p => p.part_id !== partId);
      return [...prev, { part_id: partId, quantity: 1 }];
    });
  };

  const updatePartQuantity = (partId, qty) => {
    setSelectedParts(prev =>
      prev.map(p => p.part_id === partId ? { ...p, quantity: Math.max(1, parseInt(qty) || 1) } : p)
    );
  };

  const getPartSellingPrice = (part) => {
    const defaultSupplier = part.suppliers?.find(s => s.is_default) || part.suppliers?.[0];
    const cost = defaultSupplier?.price || 0;
    return cost * (1 + (part.selling_markup_percent || 0) / 100);
  };

  const handleAddWork = (workData) => {
    const newWork = {
      ...workData,
      id: generateWorkCodeId(state.workCatalog.map(w => w.id)),
    };
    dispatch({ type: 'ADD_WORK_ITEM', payload: newWork });
    setSelectedWorks(prev => [...prev, newWork.id]);
    setAddingWork(false);
  };

  const handleAddPart = (partData) => {
    const newId = Math.max(0, ...state.parts.map(p => p.id || 0)) + 1;
    const newPart = {
      ...partData,
      id: newId,
      internal_barcode: partData.internal_barcode ||
        generateInternalBarcode(partData.category || 'other', state.parts.map(p => p.internal_barcode)),
    };
    dispatch({ type: 'ADD_PART', payload: newPart });
    setSelectedParts(prev => [...prev, { part_id: newPart.id, quantity: 1 }]);
    setAddingPart(false);
  };

  const handleAddInquiryImage = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const slots = 2 - inquiryForm.images.length;
    const toAdd = files.slice(0, slots);
    const compressed = await Promise.all(toAdd.map(async f => compressImage(await readFile(f))));
    const urls = await Promise.all(compressed.map(c => uploadToStorage(c, 'inquiry')));
    setInquiryForm(f => ({ ...f, images: [...f.images, ...urls] }));
    e.target.value = '';
  };

  const handleAddInquiryPart = () => {
    if (!inquiryForm.description.trim()) return;
    const newItem = {
      id: `IQ_${Date.now()}`,
      description: inquiryForm.description.trim(),
      images: inquiryForm.images,
      supplier_ids: inquiryForm.supplier_ids,
      created_at: new Date().toISOString(),
    };
    setInquiryParts(prev => [...prev, newItem]);
    setInquiryForm({ description: '', images: [], supplier_ids: [] });
    setShowInquiryForm(false);
  };

  const toggleInquirySupplier = (supplierId) => {
    setInquiryForm(f => ({
      ...f,
      supplier_ids: f.supplier_ids.includes(supplierId)
        ? f.supplier_ids.filter(id => id !== supplierId)
        : [...f.supplier_ids, supplierId],
    }));
  };

  const handleSubmitDiagnosis = () => {
    if (!diagnosis) {
      showToast('יש למלא אבחון ראשוני לפני שמירה', 'error');
      return;
    }
    // מוצר יד שנייה: דילוג ישיר לעבודה (ללא אישור לקוח)
    const nextStatus = repair.repair_type === 'internal_used'
      ? REPAIR_STATUSES.YELLOW_READY_TO_WORK
      : REPAIR_STATUSES.YELLOW_DIAGNOSIS;
    dispatch({
      type: 'UPDATE_REPAIR',
      payload: {
        id: repair.id,
        status: nextStatus,
        diagnosis,
        diagnosed_work_codes: selectedWorks,
        diagnosed_parts: selectedParts,
        diagnosed_at: new Date().toISOString(),
        inquiry_parts: inquiryParts,
      },
    });
    onClose();
  };

  const handleAppealPhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const url = await uploadToStorage(reader.result, 'appeals');
        setAppealEvidence(prev => [...prev, url]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmitAppeal = () => {
    if (!appealReason || appealEvidence.length === 0) {
      showToast('יש למלא סיבה לערעור ולהעלות לפחות תמונה אחת', 'error');
      return;
    }
    dispatch({
      type: 'UPDATE_REPAIR',
      payload: {
        id: repair.id,
        status: REPAIR_STATUSES.YELLOW_APPEAL,
        warranty_appeal: {
          reason: appealReason,
          evidence_photos: appealEvidence,
          status: 'pending_office',
          submitted_at: new Date().toISOString(),
        },
      },
    });
    onClose();
  };

  const isWarrantyCase = repair.warranty_type === WARRANTY_TYPES.FULL_WARRANTY;

  return (
    <>
    {assemblyPart && <AssemblyInstructionsViewer part={assemblyPart} onClose={() => setAssemblyPart(null)} />}
    {addingWork && (
      <WorkCatalogEditModal
        item={null}
        onSave={handleAddWork}
        onClose={() => setAddingWork(false)}
      />
    )}
    {addingPart && (
      <PartEditModal
        part={null}
        onSave={handleAddPart}
        onClose={() => setAddingPart(false)}
      />
    )}
    {lightboxPhoto && (
      <div
        className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center"
        onClick={() => setLightboxPhoto(null)}
      >
        <img src={lightboxPhoto} alt="תצוגה מלאה" className="max-w-full max-h-full object-contain" />
        <button onClick={() => setLightboxPhoto(null)}
          className="absolute top-4 left-4 text-white bg-black/50 rounded-full w-9 h-9 flex items-center justify-center text-xl hover:bg-black/80">✕</button>
      </div>
    )}
    <Modal
      open={true}
      onClose={onClose}
      sheet
      title={`אבחון: ${repair.id}`}
      subtitle={`${customer?.name} • ${device?.brand} ${device?.model}`}
      maxWidth="max-w-5xl"
      footer={
        !showAppealForm ? (
          <div className="flex justify-between">
            {isWarrantyCase && (
              <button
                onClick={() => setShowAppealForm(true)}
                className="bg-orange-100 hover:bg-orange-200 text-orange-800 px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
              >
                <ShieldAlert size={16} />
                ערער על אחריות
              </button>
            )}
            <div className="flex gap-2 mr-auto">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100">סגור</button>
              <button
                onClick={handleSubmitDiagnosis}
                disabled={!diagnosis}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
              >
                <Send size={16} />
                שלח למשרד לתמחור
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between">
            <button onClick={() => setShowAppealForm(false)} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100">→ חזרה לאבחון</button>
            <button
              onClick={handleSubmitAppeal}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
            >
              <ShieldAlert size={16} />
              שלח ערעור למשרד
            </button>
          </div>
        )
      }
    >
      {!showAppealForm ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <InfoCard title="לקוח" icon={User}>
              <p className="font-semibold">{customer?.name}</p>
              <p className="text-xs text-slate-500">{customer?.phone}</p>
            </InfoCard>
            <InfoCard title="מכשיר" icon={Wrench}>
              <p className="font-semibold">{device?.brand} {device?.model}</p>
              <p className="text-xs text-slate-500">{device?.type}</p>
              <p className="text-xs font-mono text-slate-500">{device?.id}</p>
            </InfoCard>
            <InfoCard title="סוג אחריות" icon={ShieldAlert}>
              <p className="font-semibold">{WARRANTY_LABELS[repair.warranty_type]}</p>
            </InfoCard>
          </div>

          <InfoCard title="תלונה" icon={FileText}>
            <p className="text-slate-700">{repair.complaint}</p>
          </InfoCard>

          {repair.intake_photos && repair.intake_photos.length > 0 && (
            <InfoCard title={`תמונות קליטה (${repair.intake_photos.length})`} icon={Camera}>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {repair.intake_photos.map((p, idx) => (
                  <img key={idx} src={p} alt={`קליטה ${idx + 1}`} onClick={() => setLightboxPhoto(p)}
                    className="w-full aspect-square object-cover rounded border cursor-pointer hover:opacity-90" />
                ))}
              </div>
            </InfoCard>
          )}

          {deviceHistory.length > 0 && (
            <InfoCard title={`היסטוריית מכשיר (${deviceHistory.length} תיקונים קודמים)`} icon={History}>
              <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                {deviceHistory.map(r => (
                  <div key={r.id} className="flex justify-between gap-2 py-1 border-b border-slate-200 last:border-0">
                    <span className="text-slate-700">{r.complaint}</span>
                    <span className="text-slate-500 whitespace-nowrap">{formatDateTime(r.date_intake)}</span>
                  </div>
                ))}
              </div>
            </InfoCard>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">אבחון ראשוני *</label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={3}
              placeholder="תיאור הבעיה שמצאתי..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* סקשן עבודות */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-slate-700">
                עבודות נדרשות ({selectedWorks.length} נבחרו)
              </label>
              <button
                onClick={() => setAddingWork(true)}
                className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
              >
                <Plus size={13} />
                עבודה חדשה
              </button>
            </div>
            <div className="relative mb-1">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={workSearch}
                onChange={(e) => setWorkSearch(e.target.value)}
                placeholder="חיפוש לפי שם, יצרן, דגם או קוד..."
                className="w-full border border-slate-300 rounded-lg pr-8 pl-3 py-1.5 text-sm"
              />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-52 overflow-y-auto space-y-1">
              {sortedWorks.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  {workSearch ? 'לא נמצאו עבודות תואמות' : 'קטלוג העבודות ריק'}
                </p>
              ) : (
                sortedWorks.map(w => {
                  const isSelected = selectedWorks.includes(w.id);
                  const isRelevant = relevantWorkIds.has(w.id);
                  const avg = calculateAvgHoursForWork(w.id, state.repairs);
                  return (
                    <button
                      key={w.id}
                      onClick={() => toggleWork(w.id)}
                      className={`w-full text-right p-2 rounded-lg flex items-center gap-2 ${isSelected ? 'bg-orange-100' : 'bg-white hover:bg-slate-100'}`}
                    >
                      {isSelected ? <CheckSquare size={18} className="text-orange-600 shrink-0" /> : <Square size={18} className="text-slate-400 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm flex items-center gap-1.5">
                          {w.work_name}
                          {isRelevant && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-normal">מתאים למכשיר</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">
                          {w.id} • {w.brand} • {w.model}
                          {avg && ` • ⏱️ ממוצע ${avg.avg_hours.toFixed(1)} ש' (${avg.count} ביצועים)`}
                        </p>
                      </div>
                      <span className="font-bold shrink-0">{formatMoney(w.price)}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* סקשן חלקים */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-slate-700">
                חלקים נדרשים ({selectedParts.length} נבחרו)
              </label>
              <button
                onClick={() => setAddingPart(true)}
                className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
              >
                <Plus size={13} />
                חלק חדש
              </button>
            </div>
            <div className="relative mb-1">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={partSearch}
                onChange={(e) => setPartSearch(e.target.value)}
                placeholder="חיפוש לפי שם, יצרן, ברקוד..."
                className="w-full border border-slate-300 rounded-lg pr-8 pl-3 py-1.5 text-sm"
              />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-52 overflow-y-auto space-y-1">
              {filteredParts.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  {partSearch ? 'לא נמצאו חלקים תואמים' : 'המלאי ריק'}
                </p>
              ) : (
                filteredParts.map(p => {
                  const isSelected = selectedParts.find(sp => sp.part_id === p.id);
                  const totalStock = state.stockBatches
                    .filter(b => b.part_id === p.id)
                    .reduce((sum, b) => sum + b.quantity_remaining, 0);
                  return (
                    <div key={p.id} className={`p-2 rounded-lg ${isSelected ? 'bg-orange-100' : 'bg-white'}`}>
                      <div className="flex items-center gap-2">
                        <button onClick={() => togglePart(p.id)}>
                          {isSelected ? <CheckSquare size={18} className="text-orange-600" /> : <Square size={18} className="text-slate-400" />}
                        </button>
                        <PartThumbnail part={p} size="xs" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{p.name}</p>
                          <p className="text-xs text-slate-500">
                            {p.manufacturer} • מלאי: {totalStock} • {formatMoney(getPartSellingPrice(p))} ללקוח
                          </p>
                        </div>
                        {p.assembly_instructions?.text || p.assembly_instructions?.images?.length > 0 ? (
                          <button onClick={(e) => { e.stopPropagation(); setAssemblyPart(p); }}
                            className="text-blue-500 hover:text-blue-700 p-0.5 shrink-0" title="הוראות הרכבה">
                            <BookOpen size={14} />
                          </button>
                        ) : null}
                        {isSelected && (
                          <input
                            type="number"
                            min="1"
                            value={isSelected.quantity}
                            onChange={(e) => updatePartQuantity(p.id, e.target.value)}
                            className="w-16 border border-slate-300 rounded px-2 py-1 text-sm shrink-0"
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* חלקים לבירור */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <HelpCircle size={15} className="text-amber-500" />
                חלקים לבירור אצל ספקים ({inquiryParts.length})
              </label>
              {!showInquiryForm && (
                <button
                  onClick={() => setShowInquiryForm(true)}
                  className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
                >
                  <Plus size={13} />
                  הוסף חלק לבירור
                </button>
              )}
            </div>

            {inquiryParts.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {inquiryParts.map(ip => (
                  <div key={ip.id} className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{ip.description}</p>
                      {ip.supplier_ids.length > 0 && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          ספקים: {ip.supplier_ids.map(sid => state.suppliers.find(s => s.id === sid)?.name).filter(Boolean).join(', ')}
                        </p>
                      )}
                      {ip.images.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {ip.images.map((src, i) => (
                            <img key={i} src={src} alt="" className="w-10 h-10 object-cover rounded border cursor-pointer" onClick={() => setLightboxPhoto(src)} />
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setInquiryParts(prev => prev.filter(x => x.id !== ip.id))}
                      className="text-slate-400 hover:text-red-500 shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showInquiryForm && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                <textarea
                  value={inquiryForm.description}
                  onChange={e => setInquiryForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="תיאור החלק לבירור..."
                  className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">ספקים לבירור:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {state.suppliers.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleInquirySupplier(s.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs border ${inquiryForm.supplier_ids.includes(s.id) ? 'bg-amber-500 text-white border-amber-500' : 'border-slate-300 text-slate-600 hover:border-amber-400'}`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => inquiryImgRef.current?.click()}
                    disabled={inquiryForm.images.length >= 2}
                    className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1.5 disabled:opacity-40"
                  >
                    <Camera size={13} />
                    תמונה ({inquiryForm.images.length}/2)
                  </button>
                  {inquiryForm.images.map((src, i) => (
                    <div key={i} className="relative">
                      <img src={src} alt="" className="w-10 h-10 object-cover rounded border" />
                      <button
                        type="button"
                        onClick={() => setInquiryForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <X size={8} />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 mr-auto">
                    <button
                      type="button"
                      onClick={() => { setShowInquiryForm(false); setInquiryForm({ description: '', images: [], supplier_ids: [] }); }}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      ביטול
                    </button>
                    <button
                      type="button"
                      onClick={handleAddInquiryPart}
                      disabled={!inquiryForm.description.trim()}
                      className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                    >
                      הוסף לבירור
                    </button>
                  </div>
                </div>
                <input
                  ref={inquiryImgRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAddInquiryImage}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-sm text-red-800">
            <p className="font-bold mb-1">⚠️ ערעור על אחריות</p>
            <p>אתה טוען שהקריאה הזו אינה נופלת תחת אחריות מלאה. יש להסביר ולהעלות תמונות הוכחה.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">סיבת הערעור *</label>
            <textarea
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              rows={3}
              placeholder="לדוגמה: נראים סימני נזק פיזי על המכשיר שלא תואמים כשל טכני..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">תמונות הוכחה * (לפחות תמונה אחת)</label>
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-sm px-4 py-2 rounded-lg border border-red-200">
                📁 בחר קבצים
                <input type="file" accept="image/*" multiple onChange={handleAppealPhotoUpload} className="hidden" />
              </label>
              <label className="cursor-pointer bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm px-4 py-2 rounded-lg flex items-center gap-1">
                📷 צלם
                <input type="file" accept="image/*" capture="environment" onChange={handleAppealPhotoUpload} className="hidden" />
              </label>
            </div>
            {appealEvidence.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {appealEvidence.map((p, idx) => (
                  <div key={idx} className="relative group">
                    <img src={p} alt={`ראיה ${idx + 1}`} onClick={() => setLightboxPhoto(p)}
      className="w-full aspect-square object-cover rounded border cursor-pointer hover:opacity-90" />
                    <button
                      onClick={() => setAppealEvidence(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
    </>
  );
}
