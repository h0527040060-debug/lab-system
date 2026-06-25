import { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { calculateQuoteBreakdown, getPartSellingPrice } from '../utils/pricing';
import { formatMoney } from '../utils/formatters';
import Modal from './Modal';
import PriceBreakdown from './PriceBreakdown';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';

// המרת breakdown לפורמט invoice_items
const breakdownToInvoiceItems = (breakdown) => ({
  works: breakdown.works.map(w => ({ id: w.id, name: w.name, brand: w.brand, model: w.model, price: w.price })),
  parts: breakdown.parts.map(p => ({ part_id: p.id, name: p.name, quantity: p.quantity, unit_price: p.unit_price })),
  services: breakdown.services.map(s => ({ id: s.id, name: s.name, price: s.price })),
});

export default function EditInvoiceModal({ repair, onClose }) {
  const { state, dispatch } = useAppContext();

  const initialBreakdown = useMemo(() => {
    if (repair.invoice_items) {
      const { works = [], parts = [], services = [] } = repair.invoice_items;
      return {
        works,
        parts: parts.map(p => ({ ...p, total: p.unit_price * p.quantity })),
        services,
        worksTotal: works.reduce((s, w) => s + w.price, 0),
        partsTotal: parts.reduce((s, p) => s + p.unit_price * p.quantity, 0),
        servicesTotal: services.reduce((s, sv) => s + sv.price, 0),
        grandTotal: 0,
      };
    }
    return calculateQuoteBreakdown(repair, state);
  }, []);

  const [works, setWorks] = useState(initialBreakdown.works);
  const [parts, setParts] = useState(initialBreakdown.parts.map(p => ({
    part_id: p.id || p.part_id,
    name: p.name,
    quantity: p.quantity,
    unit_price: p.unit_price,
  })));
  const [services, setServices] = useState(initialBreakdown.services.map(s => ({
    id: s.id,
    name: s.name,
    price: s.price,
  })));

  const [showAddWork, setShowAddWork] = useState(false);
  const [showAddPart, setShowAddPart] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const [editingPart, setEditingPart] = useState(null);
  const [editingService, setEditingService] = useState(null);

  const device = state.devices.find(d => d.id === repair.device_id);

  const liveBreakdown = useMemo(() => {
    const worksTotal = works.reduce((s, w) => s + (w.price || 0), 0);
    const partsTotal = parts.reduce((s, p) => s + (p.unit_price || 0) * (p.quantity || 1), 0);
    const servicesTotal = services.reduce((s, sv) => s + (sv.price || 0), 0);
    return {
      works,
      worksTotal,
      parts: parts.map(p => ({ ...p, id: p.part_id, total: p.unit_price * p.quantity })),
      partsTotal,
      services,
      servicesTotal,
      grandTotal: worksTotal + partsTotal + servicesTotal,
    };
  }, [works, parts, services]);

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_REPAIR',
      payload: {
        id: repair.id,
        invoice_items: { works, parts, services },
      },
    });
    onClose();
  };

  // עבודות
  const addWork = (w) => {
    if (!works.find(x => x.id === w.id)) {
      setWorks(prev => [...prev, { id: w.id, name: w.work_name, brand: w.brand, model: w.model, price: w.price }]);
    }
    setShowAddWork(false);
  };
  const removeWork = (id) => setWorks(prev => prev.filter(w => w.id !== id));
  const updateWorkPrice = (id, price) => {
    setWorks(prev => prev.map(w => w.id === id ? { ...w, price: parseFloat(price) || 0 } : w));
    setEditingWork(null);
  };

  // חלקים
  const addPart = (p) => {
    if (!parts.find(x => x.part_id === p.id)) {
      setParts(prev => [...prev, {
        part_id: p.id,
        name: p.name,
        quantity: 1,
        unit_price: getPartSellingPrice(p),
      }]);
    }
    setShowAddPart(false);
  };
  const removePart = (partId) => setParts(prev => prev.filter(p => p.part_id !== partId));
  const updatePart = (partId, field, value) => {
    setParts(prev => prev.map(p => p.part_id === partId ? { ...p, [field]: parseFloat(value) || (field === 'quantity' ? 1 : 0) } : p));
    if (field === 'unit_price') setEditingPart(null);
  };

  // שירותים
  const addService = (s) => {
    if (!services.find(x => x.id === s.id)) {
      setServices(prev => [...prev, { id: s.id, name: s.name, price: s.base_price }]);
    }
    setShowAddService(false);
  };
  const removeService = (id) => setServices(prev => prev.filter(s => s.id !== id));
  const updateServicePrice = (id, price) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, price: parseFloat(price) || 0 } : s));
    setEditingService(null);
  };

  const availableWorks = state.workCatalog.filter(w =>
    !works.find(x => x.id === w.id) &&
    (w.brand === device?.brand || w.brand === 'כל היצרנים' || w.brand === '(חופשי)')
  );
  const availableParts = state.parts.filter(p => !parts.find(x => x.part_id === p.id));
  const availableServices = state.services.filter(s => !services.find(x => x.id === s.id));

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`עריכת חשבון - ${repair.id}`}
      subtitle="ערוך חלקים, עבודות ושירותים לפני גביה"
      maxWidth="max-w-5xl"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100">ביטול</button>
          <button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold">
            שמור חשבון
          </button>
        </div>
      }
    >
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-4">

          {/* עבודות */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-sm">🛠️ עבודות ({works.length})</h4>
              <button onClick={() => setShowAddWork(!showAddWork)} className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1">
                <Plus size={14} /> הוסף עבודה
              </button>
            </div>
            {showAddWork && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-2 max-h-32 overflow-y-auto">
                {availableWorks.length === 0
                  ? <p className="text-xs text-slate-500 text-center py-2">אין עבודות נוספות</p>
                  : availableWorks.map(w => (
                    <button key={w.id} onClick={() => addWork(w)} className="w-full text-right p-1.5 hover:bg-white rounded text-xs flex justify-between">
                      <span>{w.work_name} ({w.brand} {w.model})</span>
                      <span className="font-bold">{formatMoney(w.price)}</span>
                    </button>
                  ))
                }
              </div>
            )}
            <div className="space-y-1">
              {works.map(w => (
                <div key={w.id} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{w.name}</p>
                    <p className="text-xs text-slate-500">{w.brand} {w.model}</p>
                  </div>
                  {editingWork === w.id ? (
                    <EditablePrice
                      value={w.price}
                      onSave={(v) => updateWorkPrice(w.id, v)}
                      onCancel={() => setEditingWork(null)}
                    />
                  ) : (
                    <>
                      <span className="font-bold">{formatMoney(w.price)}</span>
                      <button onClick={() => setEditingWork(w.id)} className="text-slate-400 hover:text-orange-600"><Pencil size={13} /></button>
                    </>
                  )}
                  <button onClick={() => removeWork(w.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              ))}
              {works.length === 0 && <p className="text-xs text-slate-400 text-center py-2 border border-dashed rounded-lg">אין עבודות</p>}
            </div>
          </div>

          {/* חלקים */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-sm">📦 חלקים ({parts.length})</h4>
              <button onClick={() => setShowAddPart(!showAddPart)} className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1">
                <Plus size={14} /> הוסף חלק
              </button>
            </div>
            {showAddPart && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-2 max-h-32 overflow-y-auto">
                {availableParts.length === 0
                  ? <p className="text-xs text-slate-500 text-center py-2">אין חלקים נוספים</p>
                  : availableParts.map(p => (
                    <button key={p.id} onClick={() => addPart(p)} className="w-full text-right p-1.5 hover:bg-white rounded text-xs flex justify-between">
                      <span>{p.name}</span>
                      <span className="font-bold">{formatMoney(getPartSellingPrice(p))}</span>
                    </button>
                  ))
                }
              </div>
            )}
            <div className="space-y-1">
              {parts.map(p => (
                <div key={p.part_id} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{p.name}</p>
                  </div>
                  <label className="text-xs text-slate-500">כמות:</label>
                  <input
                    type="number"
                    min="1"
                    value={p.quantity}
                    onChange={(e) => updatePart(p.part_id, 'quantity', e.target.value)}
                    className="w-14 border border-slate-300 rounded px-2 py-1 text-xs text-center"
                  />
                  {editingPart === p.part_id ? (
                    <EditablePrice
                      value={p.unit_price}
                      onSave={(v) => updatePart(p.part_id, 'unit_price', v)}
                      onCancel={() => setEditingPart(null)}
                    />
                  ) : (
                    <>
                      <span className="font-bold text-xs">{formatMoney(p.unit_price)}/יח'</span>
                      <button onClick={() => setEditingPart(p.part_id)} className="text-slate-400 hover:text-orange-600"><Pencil size={13} /></button>
                    </>
                  )}
                  <button onClick={() => removePart(p.part_id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              ))}
              {parts.length === 0 && <p className="text-xs text-slate-400 text-center py-2 border border-dashed rounded-lg">אין חלקים</p>}
            </div>
          </div>

          {/* שירותים */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-sm">✨ שירותים ({services.length})</h4>
              <button onClick={() => setShowAddService(!showAddService)} className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1">
                <Plus size={14} /> הוסף שירות
              </button>
            </div>
            {showAddService && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-2 max-h-28 overflow-y-auto">
                {availableServices.length === 0
                  ? <p className="text-xs text-slate-500 text-center py-2">אין שירותים נוספים</p>
                  : availableServices.map(s => (
                    <button key={s.id} onClick={() => addService(s)} className="w-full text-right p-1.5 hover:bg-white rounded text-xs flex justify-between">
                      <span>{s.name}</span>
                      <span className="font-bold">{formatMoney(s.base_price)}</span>
                    </button>
                  ))
                }
              </div>
            )}
            <div className="space-y-1">
              {services.map(s => (
                <div key={s.id} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                  <div className="flex-1"><p className="font-semibold">{s.name}</p></div>
                  {editingService === s.id ? (
                    <EditablePrice
                      value={s.price}
                      onSave={(v) => updateServicePrice(s.id, v)}
                      onCancel={() => setEditingService(null)}
                    />
                  ) : (
                    <>
                      <span className="font-bold">{formatMoney(s.price)}</span>
                      <button onClick={() => setEditingService(s.id)} className="text-slate-400 hover:text-orange-600"><Pencil size={13} /></button>
                    </>
                  )}
                  <button onClick={() => removeService(s.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              ))}
              {services.length === 0 && <p className="text-xs text-slate-400 text-center py-2 border border-dashed rounded-lg">אין שירותים</p>}
            </div>
          </div>

        </div>

        {/* סיכום חי */}
        <div>
          <h4 className="font-bold text-sm mb-2">📋 חשבון עדכני</h4>
          <PriceBreakdown breakdown={liveBreakdown} />
        </div>
      </div>
    </Modal>
  );
}

function EditablePrice({ value, onSave, onCancel }) {
  const [draft, setDraft] = useState(String(value));
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-slate-500">₪</span>
      <input
        autoFocus
        type="number"
        min="0"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSave(draft); if (e.key === 'Escape') onCancel(); }}
        className="w-20 border-2 border-orange-400 rounded px-2 py-0.5 text-sm font-bold"
      />
      <button onClick={() => onSave(draft)} className="text-green-600 hover:text-green-800"><Check size={14} /></button>
      <button onClick={onCancel} className="text-slate-400 hover:text-red-600"><X size={14} /></button>
    </div>
  );
}
