import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { REPAIR_STATUSES } from '../constants/statuses';
import { WARRANTY_TYPES, WARRANTY_LABELS } from '../constants/warranty';
import { formatDateTime, formatMoney } from '../utils/formatters';
import { filterWorkCatalogForDevice, calculateAvgHoursForWork } from '../utils/workCatalog';
import Modal from './Modal';
import InfoCard from './InfoCard';
import { User, Wrench, FileText, History, ShieldAlert, Camera, Send, CheckSquare, Square } from 'lucide-react';

export default function DiagnosisModal({ repair, onClose }) {
  const { state, dispatch } = useAppContext();

  const customer = state.customers.find(c => c.id === repair.customer_id);
  const device = state.devices.find(d => d.id === repair.device_id);
  const deviceHistory = state.repairs
    .filter(r => r.device_id === repair.device_id && r.id !== repair.id)
    .sort((a, b) => new Date(b.date_intake) - new Date(a.date_intake));

  const relevantWorks = filterWorkCatalogForDevice(state.workCatalog, device);

  const [diagnosis, setDiagnosis] = useState(repair.diagnosis || '');
  const [selectedWorks, setSelectedWorks] = useState(repair.diagnosed_work_codes || []);
  const [selectedParts, setSelectedParts] = useState(repair.diagnosed_parts || []);

  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealEvidence, setAppealEvidence] = useState([]);

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

  const handleSubmitDiagnosis = () => {
    if (!diagnosis) {
      alert('יש למלא אבחון ראשוני');
      return;
    }
    dispatch({
      type: 'UPDATE_REPAIR',
      payload: {
        id: repair.id,
        status: REPAIR_STATUSES.YELLOW_DIAGNOSIS,
        diagnosis,
        diagnosed_work_codes: selectedWorks,
        diagnosed_parts: selectedParts,
        diagnosed_at: new Date().toISOString(),
      },
    });
    onClose();
  };

  const handleAppealPhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setAppealEvidence(prev => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmitAppeal = () => {
    if (!appealReason || appealEvidence.length === 0) {
      alert('יש למלא סיבה ולהעלות לפחות תמונה אחת');
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
    <Modal
      open={true}
      onClose={onClose}
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
                  <img key={idx} src={p} alt={`קליטה ${idx + 1}`} className="w-full h-20 object-cover rounded border" />
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

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              עבודות נדרשות ({selectedWorks.length} נבחרו)
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
              {relevantWorks.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">אין עבודות בקטלוג עבור {device?.brand} {device?.model}</p>
              ) : (
                relevantWorks.map(w => {
                  const isSelected = selectedWorks.includes(w.id);
                  const avg = calculateAvgHoursForWork(w.id, state.repairs);
                  return (
                    <button
                      key={w.id}
                      onClick={() => toggleWork(w.id)}
                      className={`w-full text-right p-2 rounded-lg flex items-center gap-2 ${isSelected ? 'bg-orange-100' : 'bg-white hover:bg-slate-100'}`}
                    >
                      {isSelected ? <CheckSquare size={18} className="text-orange-600" /> : <Square size={18} className="text-slate-400" />}
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{w.work_name}</p>
                        <p className="text-xs text-slate-500">
                          {w.brand} • {w.model}
                          {avg && ` • ⏱️ ממוצע ${avg.avg_hours.toFixed(1)} שעות (${avg.count} ביצועים)`}
                        </p>
                      </div>
                      <span className="font-bold">{formatMoney(w.price)}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              חלקים נדרשים ({selectedParts.length} נבחרו)
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
              {state.parts.map(p => {
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
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{p.images?.[0]} {p.name}</p>
                        <p className="text-xs text-slate-500">
                          {p.manufacturer} • מלאי: {totalStock} • {formatMoney(getPartSellingPrice(p))} ללקוח
                        </p>
                      </div>
                      {isSelected && (
                        <input
                          type="number"
                          min="1"
                          value={isSelected.quantity}
                          onChange={(e) => updatePartQuantity(p.id, e.target.value)}
                          className="w-16 border border-slate-300 rounded px-2 py-1 text-sm"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleAppealPhotoUpload}
              className="block w-full text-sm file:ml-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
            />
            {appealEvidence.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {appealEvidence.map((p, idx) => (
                  <div key={idx} className="relative group">
                    <img src={p} alt={`ראיה ${idx + 1}`} className="w-full h-20 object-cover rounded border" />
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
  );
}
