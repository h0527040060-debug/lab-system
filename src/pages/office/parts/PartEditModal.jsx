import { useState, useRef, useMemo } from 'react';
import { useAppContext as useApp } from '../../../store/AppContext';
import { uploadToStorage } from '../../../store/supabaseStorage';
import { compressImage } from '../../../utils/imageCompression';
import { generateInternalBarcode } from '../../../utils/idGenerators';
import Modal from '../../../components/Modal';
import ConfirmDialog from '../../../components/ConfirmDialog';
import ManufacturerModelPicker from '../../../components/ManufacturerModelPicker';
import { getTotalStock } from '../../../utils/fifo';
import { getDefaultSupplier, addPartToManualOrder } from '../../../utils/inventory';
import { MapPin, Building2, Plus, Trash2, ImagePlus, FileText, BookOpen, PlayCircle, X, Package, ShoppingCart, Check } from 'lucide-react';

export const CATEGORIES = [
  { value: 'sensor', label: 'חיישן' },
  { value: 'heating', label: 'חימום' },
  { value: 'control', label: 'בקרה' },
  { value: 'motor', label: 'מנוע' },
  { value: 'seal', label: 'איטום' },
  { value: 'pump', label: 'משאבה' },
  { value: 'fan', label: 'מאוורר' },
  { value: 'other', label: 'אחר' },
];

const buildDefault = () => ({
  name: '', manufacturer_sku: '', internal_barcode: '',
  category: 'other',
  images: [], main_image_index: 0,
  technical_docs: [],
  shelf: '', bin: '', zone: '',
  suppliers: [],
  min_stock: 1,
  cost_price: 0, selling_price: 0, selling_markup_percent: 0,
  assembly_instructions: { text: '', video_url: '', images: [] },
  compatible_devices: [],
});

export default function PartEditModal({ part, onSave, onClose }) {
  const { state, dispatch } = useApp();
  const [form, setForm] = useState(part ? {
    ...buildDefault(),
    ...part,
    images: Array.isArray(part.images) ? part.images : [],
    technical_docs: part.technical_docs || [],
    assembly_instructions: part.assembly_instructions || { text: '', video_url: '', images: [] },
    cost_price: part.cost_price ?? 0,
    selling_price: part.selling_price ?? 0,
    selling_markup_percent: part.selling_markup_percent ?? 0,
  } : buildDefault());

  const [activeTab, setActiveTab] = useState('basic');
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');

  // מלאי קיים — מחושב מהאצוות. עריכה תסונכרן לאצוות בעת שמירה (בקטלוג)
  const initialStock = useMemo(
    () => (part?.id ? getTotalStock(part.id, state.stockBatches) : 0),
    [part, state.stockBatches]
  );
  const [stockQty, setStockQty] = useState(initialStock);

  // הזמנה ידנית מהירה — ללא תלות במלאי מינימום/קיים
  const [orderQty, setOrderQty] = useState(1);
  const [orderAdded, setOrderAdded] = useState(false);
  const defaultSupplierName = part?.id ? getDefaultSupplier(part)?.supplier_name : null;

  const handleAddToOrder = () => {
    if (!part?.id) return;
    addPartToManualOrder(state, dispatch, part, orderQty);
    setOrderAdded(true);
    setTimeout(() => setOrderAdded(false), 2000);
  };

  const addCompatibleDevice = () => {
    const b = deviceBrand.trim();
    const m = deviceModel.trim();
    if (!b || !m) return;
    const exists = form.compatible_devices?.some(d => d.brand === b && d.model === m);
    if (exists) return;
    setForm(f => ({ ...f, compatible_devices: [...(f.compatible_devices || []), { brand: b, model: m }] }));
    setDeviceBrand('');
    setDeviceModel('');
  };

  const removeCompatibleDevice = (idx) => {
    setForm(f => ({ ...f, compatible_devices: f.compatible_devices.filter((_, i) => i !== idx) }));
  };
  const [lastPriceEdit, setLastPriceEdit] = useState('markup');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingAssembly, setUploadingAssembly] = useState(false);
  const imageInputRef = useRef();
  const docInputRef = useRef();
  const assemblyImgRef = useRef();

  // ——— תמחור דו-כיווני ———
  const handleCostChange = (val) => {
    const cost = parseFloat(val) || 0;
    if (lastPriceEdit === 'markup') {
      const markup = parseFloat(form.selling_markup_percent) || 0;
      const selling = parseFloat((cost * (1 + markup / 100)).toFixed(2));
      setForm(f => ({ ...f, cost_price: val, selling_price: selling }));
    } else {
      const selling = parseFloat(form.selling_price) || 0;
      const markup = cost > 0 ? parseFloat(((selling - cost) / cost * 100).toFixed(2)) : 0;
      setForm(f => ({ ...f, cost_price: val, selling_markup_percent: markup }));
    }
  };

  const handleSellingChange = (val) => {
    setLastPriceEdit('selling');
    const selling = parseFloat(val) || 0;
    const cost = parseFloat(form.cost_price) || 0;
    const markup = cost > 0 ? parseFloat(((selling - cost) / cost * 100).toFixed(2)) : 0;
    setForm(f => ({ ...f, selling_price: val, selling_markup_percent: markup }));
  };

  const handleMarkupChange = (val) => {
    setLastPriceEdit('markup');
    const markup = parseFloat(val) || 0;
    const cost = parseFloat(form.cost_price) || 0;
    const selling = parseFloat((cost * (1 + markup / 100)).toFixed(2));
    setForm(f => ({ ...f, selling_markup_percent: val, selling_price: selling }));
  };

  // ——— תמונות ———
  const isValidImage = (img) => img && (img.startsWith('data:') || img.startsWith('http'));

  const handleImageUpload = async (e) => {
    const currentImages = form.images.filter(isValidImage);
    const canAdd = 4 - currentImages.length;
    if (canAdd <= 0) return;
    const files = Array.from(e.target.files).slice(0, canAdd);
    e.target.value = '';
    if (!files.length) return;
    setUploadingImages(true);
    try {
      for (const file of files) {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const compressed = await compressImage(dataUrl);
        const url = await uploadToStorage(compressed, 'parts');
        setForm(f => ({
          ...f,
          images: [...f.images.filter(isValidImage), url].slice(0, 4)
        }));
      }
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (idx) => {
    setForm(f => {
      const newImages = f.images.filter((_, i) => i !== idx);
      return { ...f, images: newImages, main_image_index: Math.min(f.main_image_index, Math.max(0, newImages.length - 1)) };
    });
  };

  const setMainImage = (idx) => setForm(f => ({ ...f, main_image_index: idx }));

  // ——— מסמכים ———
  const handleDocUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(f => ({
          ...f,
          technical_docs: [...f.technical_docs, { name: file.name, type: file.type, data: reader.result }]
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeDoc = (idx) => setForm(f => ({ ...f, technical_docs: f.technical_docs.filter((_, i) => i !== idx) }));

  const downloadDoc = (doc) => {
    const a = document.createElement('a');
    a.href = doc.data;
    a.download = doc.name;
    a.click();
  };

  // ——— הוראות הרכבה ———
  const handleAssemblyImageUpload = async (e) => {
    const canAdd = 10 - (form.assembly_instructions.images?.filter(isValidImage).length || 0);
    if (canAdd <= 0) return;
    const files = Array.from(e.target.files).slice(0, canAdd);
    e.target.value = '';
    if (!files.length) return;
    setUploadingAssembly(true);
    try {
      for (const file of files) {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const compressed = await compressImage(dataUrl);
        const url = await uploadToStorage(compressed, 'parts');
        setForm(f => ({
          ...f,
          assembly_instructions: {
            ...f.assembly_instructions,
            images: [...(f.assembly_instructions.images || []).filter(isValidImage), url].slice(0, 10)
          }
        }));
      }
    } finally {
      setUploadingAssembly(false);
    }
  };

  const removeAssemblyImage = (idx) => {
    setForm(f => ({
      ...f,
      assembly_instructions: {
        ...f.assembly_instructions,
        images: f.assembly_instructions.images.filter((_, i) => i !== idx)
      }
    }));
  };

  // ——— ספקים ———
  const updateSupplier = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      suppliers: prev.suppliers.map((s, i) => i === idx ? { ...s, [field]: value } : s)
    }));
  };

  const addSupplier = () => {
    setForm(prev => ({
      ...prev,
      suppliers: [...prev.suppliers, {
        supplier_id: state.suppliers[0]?.id || 1,
        supplier_name: state.suppliers[0]?.name || '',
        supplier_sku: '',
        price: 0,
        is_default: prev.suppliers.length === 0,
      }]
    }));
  };

  const removeSupplier = (idx) => setForm(prev => ({ ...prev, suppliers: prev.suppliers.filter((_, i) => i !== idx) }));
  const setDefaultSupplier = (idx) => setForm(prev => ({
    ...prev,
    suppliers: prev.suppliers.map((s, i) => ({ ...s, is_default: i === idx }))
  }));

  const handleSave = () => {
    const finalPart = {
      ...form,
      cost_price: parseFloat(form.cost_price) || 0,
      selling_price: parseFloat(form.selling_price) || 0,
      selling_markup_percent: parseFloat(form.selling_markup_percent) || 0,
    };
    if (!finalPart.id) {
      finalPart.internal_barcode = finalPart.internal_barcode ||
        generateInternalBarcode(finalPart.category || 'other', state.parts.map(p => p.internal_barcode));
    }
    // מלאי קיים — הקטלוג יסנכרן לאצוות לפי ההפרש
    const targetStock = parseInt(stockQty);
    finalPart.__targetStock = isNaN(targetStock) ? initialStock : Math.max(0, targetStock);
    finalPart.__initialStock = initialStock;
    onSave(finalPart);
  };

  const TABS = [
    { id: 'basic', label: 'פרטים' },
    { id: 'pricing', label: 'תמחור' },
    { id: 'images', label: 'תמונות' },
    { id: 'suppliers', label: 'ספקים' },
    { id: 'assembly', label: 'הרכבה' },
  ];

  const realImages = form.images.filter(isValidImage);
  const assemblyImages = (form.assembly_instructions.images || []).filter(isValidImage);

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={part ? `עריכת ${part.name}` : 'חלק חדש'}
      maxWidth="max-w-3xl"
      footer={
        <div className="flex justify-between items-center">
          {part?.id ? (
            <button
              onClick={() => setConfirmDelete({
                action: () => { dispatch({ type: 'DELETE_PART', payload: part.id }); onClose(); },
                message: `האם למחוק את "${part.name}"? כל האצוות שלו יימחקו גם.`,
              })}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-semibold"
            >
              <Trash2 size={15} /> מחק חלק
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100">ביטול</button>
            <button
              onClick={handleSave}
              disabled={!form.name}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-semibold"
            >
              {part ? 'עדכן' : 'הוסף'}
            </button>
          </div>
        </div>
      }
    >
      {/* sub-tabs */}
      <div className="flex gap-0 border-b border-slate-200 mb-4 -mx-6 px-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.id
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ——— פרטים ——— */}
      {activeTab === 'basic' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">שם החלק *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">מק"ט יצרן</label>
              <input type="text" value={form.manufacturer_sku} onChange={e => setForm(f => ({ ...f, manufacturer_sku: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">קטגוריה</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">מלאי מינימום</label>
              <input type="number" value={form.min_stock}
                onChange={e => setForm(f => ({ ...f, min_stock: parseInt(e.target.value) || 0 }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="bg-green-50 border-2 border-green-400 rounded-lg p-2 -m-0.5">
              <label className="text-xs font-bold block mb-1 text-green-800 flex items-center gap-1">
                <Package size={13} /> מלאי קיים
              </label>
              <input type="number" min="0" value={stockQty}
                onChange={e => setStockQty(e.target.value)}
                className="w-full border-2 border-green-400 bg-white rounded-lg px-3 py-2 text-sm font-bold text-green-800 focus:outline-none focus:border-green-600" />
              <p className="text-[10px] text-green-600 mt-0.5 font-medium">מסונכרן לאצוות</p>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">ברקוד פנימי</label>
              <input type="text" value={form.internal_barcode}
                onChange={e => setForm(f => ({ ...f, internal_barcode: e.target.value }))}
                placeholder="יווצר אוטומטית"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono" />
            </div>
          </div>

          {part?.id && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3 flex-wrap">
              <ShoppingCart size={16} className="text-blue-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-blue-800">הזמנה ידנית מהירה</p>
                <p className="text-[10px] text-blue-500">
                  ללא תלות במלאי מינימום — לחלקים שלא מוחזקים במלאי
                  {defaultSupplierName && ` • ספק: ${defaultSupplierName}`}
                </p>
              </div>
              <input
                type="number" min="1" value={orderQty}
                onChange={e => setOrderQty(parseInt(e.target.value) || 1)}
                className="w-16 border border-blue-300 rounded-lg px-2 py-1.5 text-sm text-center bg-white"
              />
              <button
                type="button"
                onClick={handleAddToOrder}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 ${
                  orderAdded ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {orderAdded ? <><Check size={13} /> נוסף</> : 'הוסף להזמנה'}
              </button>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1"><MapPin size={12} />מיקום במחסן</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">מדף</label>
                <input type="text" value={form.shelf} onChange={e => setForm(f => ({ ...f, shelf: e.target.value }))}
                  placeholder="A3" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-600 block mb-1">תא</label>
                <input type="text" value={form.bin} onChange={e => setForm(f => ({ ...f, bin: e.target.value }))}
                  placeholder="B2" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-600 block mb-1">אזור</label>
                <input type="text" value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
                  placeholder="אלקטרוניקה" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          {/* מכשירים תואמים */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <h4 className="text-xs font-bold text-slate-700 mb-1">🔗 מכשירים תואמים</h4>
            <p className="text-[10px] text-slate-400 mb-2">ריק = החלק מתאים לכל המכשירים</p>
            <div className="flex gap-2 mb-2 items-end">
              <div className="flex-1">
                <ManufacturerModelPicker
                  initialBrand={deviceBrand}
                  initialModel={deviceModel}
                  allowAdd={false}
                  onSelect={({ brand, model }) => { setDeviceBrand(brand); setDeviceModel(model); }}
                />
              </div>
              <button
                type="button"
                onClick={addCompatibleDevice}
                disabled={!deviceBrand.trim() || !deviceModel.trim()}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded text-xs font-semibold shrink-0"
              >
                הוסף
              </button>
            </div>
            {form.compatible_devices?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.compatible_devices.map((d, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs rounded-full px-2.5 py-0.5 font-medium">
                    {d.brand} {d.model}
                    <button type="button" onClick={() => removeCompatibleDevice(i)} className="hover:text-red-600 ml-1">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ——— תמחור ——— */}
      {activeTab === 'pricing' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            הזן מחיר עלות ואז מחיר ללקוח — הרווח יחושב אוטומטית, ולהיפך.
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold block mb-1">מחיר עלות (₪)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.cost_price}
                onChange={e => handleCostChange(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">מחיר ללקוח (₪)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.selling_price}
                onChange={e => handleSellingChange(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">רווח (%)</label>
              <input
                type="number"
                step="0.01"
                value={form.selling_markup_percent}
                onChange={e => handleMarkupChange(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>
          </div>

          {parseFloat(form.cost_price) > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">עלות:</span>
                <span className="font-bold">{parseFloat(form.cost_price || 0).toFixed(2)}₪</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">מחיר ללקוח:</span>
                <span className="font-bold text-green-700">{parseFloat(form.selling_price || 0).toFixed(2)}₪</span>
              </div>
              <div className="flex justify-between border-t border-green-200 mt-2 pt-2">
                <span className="text-slate-600">רווח:</span>
                <span className="font-bold text-green-700">
                  {(parseFloat(form.selling_price || 0) - parseFloat(form.cost_price || 0)).toFixed(2)}₪
                  ({parseFloat(form.selling_markup_percent || 0).toFixed(2)}%)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ——— תמונות ——— */}
      {activeTab === 'images' && (
        <div className="space-y-4">
          {/* תמונות מוצר */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                <ImagePlus size={14} /> תמונות המוצר (עד 4)
                {uploadingImages && <span className="text-xs text-orange-500 font-normal mr-1">מעלה...</span>}
              </h4>
              {realImages.length < 4 && !uploadingImages && (
                <button onClick={() => imageInputRef.current?.click()}
                  className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1">
                  <Plus size={12} /> הוסף תמונה
                </button>
              )}
            </div>
            <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />

            {realImages.length === 0 ? (
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 rounded-lg p-8 text-center text-slate-400 hover:border-orange-400 hover:text-orange-500 transition-colors"
              >
                <ImagePlus size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">לחץ להעלאת תמונות</p>
              </button>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {realImages.map((img, idx) => (
                  <div key={idx} className={`relative rounded-lg border-2 overflow-hidden aspect-square cursor-pointer
                    ${idx === form.main_image_index ? 'border-orange-500' : 'border-slate-200'}`}
                    onClick={() => setMainImage(idx)}>
                    <img src={img} alt="" className="w-full h-full object-contain bg-slate-50" />
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDelete({ action: () => removeImage(idx), message: 'האם אתה בטוח שאתה רוצה למחוק את התמונה?' }); }}
                      className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      <X size={10} />
                    </button>
                    {idx === form.main_image_index && (
                      <span className="absolute bottom-1 right-1 bg-orange-500 text-white text-xs px-1 rounded">ראשית</span>
                    )}
                  </div>
                ))}
                {realImages.length < 4 && (
                  <button onClick={() => imageInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-lg aspect-square flex items-center justify-center text-slate-400 hover:border-orange-400">
                    <Plus size={24} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* מסמכים טכניים */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                <FileText size={14} /> שרטוט / מפרט טכני (PDF/Word)
              </h4>
              <button onClick={() => docInputRef.current?.click()}
                className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1">
                <Plus size={12} /> העלה קובץ
              </button>
            </div>
            <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx" multiple className="hidden" onChange={handleDocUpload} />

            <div className="space-y-2">
              {form.technical_docs.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-slate-500" />
                    <span className="font-medium">{doc.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => downloadDoc(doc)} className="text-xs text-blue-600 hover:underline">הורד</button>
                    <button onClick={() => setConfirmDelete({ action: () => removeDoc(idx), message: `האם אתה בטוח שאתה רוצה למחוק את המסמך "${doc.name}"?` })} className="text-slate-400 hover:text-red-600"><X size={14} /></button>
                  </div>
                </div>
              ))}
              {form.technical_docs.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-3 border border-dashed border-slate-300 rounded-lg">
                  לא הועלו מסמכים טכניים
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ——— ספקים ——— */}
      {activeTab === 'suppliers' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1">
              <Building2 size={14} /> ספקים ({form.suppliers?.length || 0})
            </h4>
            <button onClick={addSupplier} className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1">
              <Plus size={12} /> הוסף ספק
            </button>
          </div>
          <div className="space-y-2">
            {form.suppliers?.map((supplier, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-2 grid grid-cols-12 gap-2 items-center text-sm">
                <select value={supplier.supplier_name}
                  onChange={e => {
                    const s = state.suppliers.find(sp => sp.name === e.target.value);
                    updateSupplier(idx, 'supplier_name', e.target.value);
                    if (s) updateSupplier(idx, 'supplier_id', s.id);
                  }}
                  className="col-span-3 border border-slate-300 rounded px-2 py-1 text-xs">
                  {state.suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                <input type="text" placeholder="מק״ט ספק" value={supplier.supplier_sku}
                  onChange={e => updateSupplier(idx, 'supplier_sku', e.target.value)}
                  className="col-span-3 border border-slate-300 rounded px-2 py-1 text-xs" />
                <div className="col-span-3 flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400">עלות רכש ₪</span>
                  <input type="number" value={supplier.price}
                    onChange={e => updateSupplier(idx, 'price', parseFloat(e.target.value) || 0)}
                    className="border border-slate-300 rounded px-2 py-1 text-xs w-full" />
                </div>
                <label className="col-span-2 flex items-center gap-1 text-xs cursor-pointer">
                  <input type="radio" name="default_supplier" checked={supplier.is_default} onChange={() => setDefaultSupplier(idx)} />
                  <span>ברירת מחדל</span>
                </label>
                <button onClick={() => setConfirmDelete({ action: () => removeSupplier(idx), message: 'האם אתה בטוח שאתה רוצה להסיר את הספק?' })} className="col-span-1 text-slate-400 hover:text-red-600 flex justify-center">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {(!form.suppliers || form.suppliers.length === 0) && (
              <p className="text-xs text-slate-500 text-center py-3 border border-dashed border-slate-300 rounded-lg">
                אין ספקים. הוסף ספק לקבלת מחירים והזמנות.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ——— הוראות הרכבה ——— */}
      {activeTab === 'assembly' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-1 flex items-center gap-1">
              <BookOpen size={12} /> הוראות הרכבה
            </label>
            <textarea
              value={form.assembly_instructions.text}
              onChange={e => setForm(f => ({
                ...f,
                assembly_instructions: { ...f.assembly_instructions, text: e.target.value }
              }))}
              rows={4}
              placeholder="הוראות הרכבה, אזהרות, הערות חשובות..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1 flex items-center gap-1">
              <PlayCircle size={12} /> קישור לסרטון (YouTube / Vimeo)
            </label>
            <input
              type="url"
              value={form.assembly_instructions.video_url}
              onChange={e => setForm(f => ({
                ...f,
                assembly_instructions: { ...f.assembly_instructions, video_url: e.target.value }
              }))}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              dir="ltr"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold flex items-center gap-1">
                <ImagePlus size={12} /> תמונות הרכבה (עד 10)
                {uploadingAssembly && <span className="text-xs text-orange-500 font-normal mr-1">מעלה...</span>}
              </label>
              {assemblyImages.length < 10 && !uploadingAssembly && (
                <button onClick={() => assemblyImgRef.current?.click()}
                  className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1">
                  <Plus size={12} /> הוסף תמונה
                </button>
              )}
            </div>
            <input ref={assemblyImgRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAssemblyImageUpload} />

            {assemblyImages.length > 0 ? (
              <div className="grid grid-cols-5 gap-2">
                {assemblyImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded border border-slate-200 overflow-hidden bg-slate-50">
                    <img src={img} alt="" className="w-full h-full object-contain" />
                    <button onClick={() => setConfirmDelete({ action: () => removeAssemblyImage(idx), message: 'האם אתה בטוח שאתה רוצה למחוק את תמונת ההרכבה?' })}
                      className="absolute top-0.5 left-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                      <X size={8} />
                    </button>
                  </div>
                ))}
                {assemblyImages.length < 10 && (
                  <button onClick={() => assemblyImgRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 hover:border-orange-400">
                    <Plus size={20} />
                  </button>
                )}
              </div>
            ) : (
              <button onClick={() => assemblyImgRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 rounded-lg p-6 text-center text-slate-400 hover:border-orange-400 text-sm">
                לחץ להוספת תמונות הרכבה
              </button>
            )}
          </div>
        </div>
      )}
      <ConfirmDialog
        open={!!confirmDelete}
        title="אישור מחיקה"
        message={confirmDelete?.message}
        confirmLabel="מחק"
        variant="danger"
        onConfirm={() => { confirmDelete?.action(); setConfirmDelete(null); }}
        onCancel={() => setConfirmDelete(null)}
      />
    </Modal>
  );
}
