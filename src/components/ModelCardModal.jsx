import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { formatDateTime } from '../utils/formatters';
import DeviceThumbnail from './DeviceThumbnail';
import DeviceCompatiblePartsModal from './DeviceCompatiblePartsModal';
import ModelEditModal from './ModelEditModal';
import RepairDetailModal from './RepairDetailModal';
import DeviceQuickModal from './DeviceQuickModal';
import StatusBadge from './StatusBadge';
import { Edit2, PackageSearch, X } from 'lucide-react';

// כרטיס דגם — מציג את כל המכשירים/התיקונים ששייכים לדגם הזה (לא למכשיר פיזי בודד).
// נפתח מהשורה במסך "מכשירים" ומהקישור על מונה התיקונים.
export default function ModelCardModal({ brand, model, onClose, onNavigate }) {
  const { state } = useAppContext();
  const [showParts, setShowParts] = useState(false);
  const [editingModel, setEditingModel] = useState(false);
  const [detailRepairId, setDetailRepairId] = useState(null);
  const [viewingDeviceId, setViewingDeviceId] = useState(null);

  const devices = state.devices.filter(
    d => d.brand?.toLowerCase() === brand.toLowerCase() && d.model?.toLowerCase() === model.toLowerCase()
  );
  const deviceIds = new Set(devices.map(d => d.id));
  const catalogModel = state.models.find(m =>
    m.name.toLowerCase() === model.toLowerCase() &&
    state.manufacturers.find(mf => mf.id === m.manufacturer_id)?.name.toLowerCase() === brand.toLowerCase()
  );
  const category = catalogModel?.device_type || devices[0]?.type || '';
  const syntheticDevice = { brand, model, type: category, images: devices[0]?.images || [] };
  // בעריכת דגם שטרם קוטלג, ממלאים קטגוריה מראש רק אם היא כבר קטגוריה תקנית — לא טקסט חופשי ישן
  const deviceTypesList = state.settings?.fieldLists?.deviceTypes || [];
  const draftCategory = deviceTypesList.includes(category) ? category : '';

  const repairs = state.repairs
    .filter(r => deviceIds.has(r.device_id))
    .sort((a, b) => new Date(b.date_intake) - new Date(a.date_intake));

  const detailRepair = detailRepairId ? state.repairs.find(r => r.id === detailRepairId) : null;
  const detailCustomer = detailRepair ? state.customers.find(c => c.id === detailRepair.customer_id) : null;
  const detailDevice = detailRepair ? state.devices.find(d => d.id === detailRepair.device_id) : null;

  const viewingDevice = viewingDeviceId ? devices.find(d => d.id === viewingDeviceId) : null;
  const viewingDeviceCustomer = viewingDevice ? state.customers.find(c => c.id === viewingDevice.owner_customer_id) : null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="flex items-center gap-3 min-w-0">
              <DeviceThumbnail device={syntheticDevice} size="lg" />
              <div className="min-w-0">
                <h2 className="font-bold text-lg text-slate-800 truncate">{model}</h2>
                <p className="text-sm text-slate-500 truncate">{brand}{category && ` • ${category}`}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setShowParts(true)}
                className="p-1.5 hover:bg-blue-100 rounded-lg text-slate-400 hover:text-blue-600"
                title="חלקים מתאימים"
              >
                <PackageSearch size={16} />
              </button>
              <button
                onClick={() => setEditingModel(true)}
                className="p-1.5 hover:bg-orange-100 rounded-lg text-slate-400 hover:text-orange-600"
                title="ערוך דגם"
              >
                <Edit2 size={16} />
              </button>
              <button onClick={onClose} aria-label="סגור" className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-slate-800">{devices.length}</p>
                <p className="text-xs text-slate-500">מכשירים שנקלטו</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-slate-800">{repairs.length}</p>
                <p className="text-xs text-slate-500">סה״כ תיקונים</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-slate-600 mb-2">מכשירים שנקלטו ({devices.length})</h3>
              <div className="space-y-1.5">
                {devices.map(d => {
                  const owner = state.customers.find(c => c.id === d.owner_customer_id);
                  return (
                    <button
                      key={d.id}
                      onClick={() => setViewingDeviceId(d.id)}
                      className="w-full text-right bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2 text-xs flex items-center justify-between"
                    >
                      <span className="font-mono font-bold text-slate-700">{d.id}</span>
                      <span className="text-slate-500">
                        {owner?.name || '—'}
                        {d.manufacturer_serial && ` • Serial: ${d.manufacturer_serial}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-slate-600 mb-2">היסטוריית תיקונים</h3>
              {repairs.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-3">אין תיקונים קודמים</p>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {repairs.map(r => {
                    const device = state.devices.find(d => d.id === r.device_id);
                    const customer = state.customers.find(c => c.id === r.customer_id);
                    return (
                      <button
                        key={r.id}
                        onClick={() => setDetailRepairId(r.id)}
                        className="w-full text-right bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2 text-xs"
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-mono font-bold text-orange-600">{r.id}</span>
                          <StatusBadge status={r.status} size="sm" />
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>{customer?.name || '—'} {device?.manufacturer_serial && `• Serial: ${device.manufacturer_serial}`}</span>
                          <span>{formatDateTime(r.date_intake)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showParts && <DeviceCompatiblePartsModal device={syntheticDevice} onClose={() => setShowParts(false)} />}
      {editingModel && (
        <ModelEditModal
          model={catalogModel || { id: null, name: model, device_type: draftCategory, images: [], draftBrand: brand }}
          onClose={() => setEditingModel(false)}
        />
      )}
      {detailRepair && (
        <RepairDetailModal
          repair={detailRepair}
          customer={detailCustomer}
          device={detailDevice}
          onClose={() => setDetailRepairId(null)}
          onAction={() => { setDetailRepairId(null); onNavigate?.('kanban'); }}
        />
      )}
      {viewingDevice && (
        <DeviceQuickModal
          device={viewingDevice}
          customer={viewingDeviceCustomer}
          repairs={state.repairs}
          onClose={() => setViewingDeviceId(null)}
        />
      )}
    </>
  );
}
