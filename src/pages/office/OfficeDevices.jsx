import { useState, useMemo } from 'react';
import { useAppContext } from '../../store/AppContext';
import { useStagger } from '../../hooks/useStagger';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import EmptyState from '../../components/EmptyState';
import DeviceThumbnail from '../../components/DeviceThumbnail';
import DeviceCompatiblePartsModal from '../../components/DeviceCompatiblePartsModal';
import ModelCardModal from '../../components/ModelCardModal';
import ModelEditModal from '../../components/ModelEditModal';
import { Wrench, Edit2, PackageSearch } from 'lucide-react';

// מקבץ את כל המכשירים לפי יצרן+דגם — שורה אחת לדגם, לא לכל מכשיר/Serial בנפרד
function buildModelGroups(state) {
  const groups = new Map();
  state.devices.forEach(d => {
    if (!d.brand?.trim() || !d.model?.trim()) return;
    const key = `${d.brand.trim().toLowerCase()}||${d.model.trim().toLowerCase()}`;
    if (!groups.has(key)) groups.set(key, { brand: d.brand, model: d.model, devices: [] });
    groups.get(key).devices.push(d);
  });

  return Array.from(groups.values()).map(g => {
    const catalogModel = state.models.find(m =>
      m.name.toLowerCase() === g.model.toLowerCase() &&
      state.manufacturers.find(mf => mf.id === m.manufacturer_id)?.name.toLowerCase() === g.brand.toLowerCase()
    );
    const deviceIds = new Set(g.devices.map(d => d.id));
    const repairsCount = state.repairs.filter(r => deviceIds.has(r.device_id)).length;
    return {
      key: `${g.brand}||${g.model}`,
      brand: g.brand,
      model: g.model,
      category: catalogModel?.device_type || g.devices[0]?.type || '',
      catalogModel,
      devices: g.devices,
      repairsCount,
    };
  });
}

export default function OfficeDevices({ onNavigate }) {
  const { state } = useAppContext();
  const [search, setSearch] = useState('');
  const [cardGroup, setCardGroup] = useState(null);
  const [partsGroup, setPartsGroup] = useState(null);
  const [editingModel, setEditingModel] = useState(null);
  const stagger = useStagger(25);

  const modelGroups = useMemo(() => buildModelGroups(state), [state]);

  // עריכת דגם זמינה תמיד — אם עדיין אין רשומת קטלוג (מכשיר שהמיגרציה פספסה), פותח במצב "קטלג עכשיו"
  const openEditForGroup = (g) => {
    setEditingModel(g.catalogModel || { id: null, name: g.model, device_type: g.category, images: [], draftBrand: g.brand });
  };

  const filteredGroups = modelGroups
    .filter(g => {
      if (!search) return true;
      const s = search.toLowerCase();
      if (
        g.brand.toLowerCase().includes(s) ||
        g.model.toLowerCase().includes(s) ||
        g.category?.toLowerCase().includes(s)
      ) return true;
      return g.devices.some(d => {
        const owner = state.customers.find(c => c.id === d.owner_customer_id);
        return (
          d.id.toLowerCase().includes(s) ||
          d.manufacturer_serial?.toLowerCase().includes(s) ||
          owner?.name?.toLowerCase().includes(s)
        );
      });
    })
    .sort((a, b) => b.repairsCount - a.repairsCount);

  const totalDevices = state.devices.length;

  return (
    <div>
      <PageHeader title="מכשירים" subtitle={`${filteredGroups.length} דגמים • ${totalDevices} מכשירים במערכת`} />

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="חיפוש לפי דגם, יצרן, קטגוריה, קוד מכשיר, serial, בעלים..." />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredGroups.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="אין מכשירים"
            description={totalDevices === 0 ? 'מכשירים נרשמים אוטומטית בקליטת תיקון' : 'לא נמצאו תוצאות לחיפוש זה'}
            action={totalDevices === 0 && onNavigate ? (
              <button onClick={() => onNavigate('intake')} className="mt-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors">
                קלוט תיקון ראשון
              </button>
            ) : null}
          />
        ) : (
          <>
            {/* מובייל — כרטיסים */}
            <div className="sm:hidden divide-y divide-slate-100">
              {filteredGroups.map((g, i) => (
                <div
                  key={g.key}
                  style={stagger(i)}
                  onClick={() => setCardGroup(g)}
                  className="p-3 animate-fade-in cursor-pointer hover:bg-slate-50"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2 text-right flex-1 min-w-0">
                      <DeviceThumbnail device={{ brand: g.brand, model: g.model, images: g.devices[0]?.images || [] }} size="sm" />
                      <span className="min-w-0">
                        <p className="font-semibold text-sm truncate">{g.model}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {g.brand}{g.category && ` • ${g.category}`}
                        </p>
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPartsGroup(g); }}
                      className="p-2 hover:bg-blue-100 rounded-lg text-slate-400 hover:text-blue-600 mr-1 shrink-0"
                      title="חלקים מתאימים"
                    >
                      <PackageSearch size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditForGroup(g); }}
                      className="p-2 hover:bg-orange-100 rounded-lg text-slate-400 hover:text-orange-600 mr-1 shrink-0"
                      title="ערוך דגם"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-400">{g.devices.length} מכשירים נקלטו</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setCardGroup(g); }}
                      className={`text-xs font-bold hover:underline ${g.repairsCount > 0 ? 'text-orange-600' : 'text-slate-400'}`}
                    >
                      {g.repairsCount} תיקונים
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* דסקטופ — טבלה */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-right p-3 font-semibold">דגם</th>
                    <th className="text-right p-3 font-semibold">יצרן</th>
                    <th className="text-right p-3 font-semibold">קטגוריה</th>
                    <th className="text-center p-3 font-semibold">תיקונים</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map((g, i) => (
                    <tr
                      key={g.key}
                      style={stagger(i)}
                      onClick={() => setCardGroup(g)}
                      className="border-b border-slate-100 hover:bg-slate-50 animate-fade-in cursor-pointer"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-right">
                          <DeviceThumbnail device={{ brand: g.brand, model: g.model, images: g.devices[0]?.images || [] }} size="sm" />
                          <span className="font-semibold">{g.model}</span>
                        </div>
                      </td>
                      <td className="p-3">{g.brand}</td>
                      <td className="p-3">
                        {g.category ? (
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{g.category}</span>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setCardGroup(g); }}
                          className={`font-bold hover:underline ${g.repairsCount > 0 ? 'text-orange-600' : 'text-slate-400'}`}
                        >
                          {g.repairsCount}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setPartsGroup(g); }}
                            className="p-2 hover:bg-blue-100 rounded-lg text-slate-400 hover:text-blue-600"
                            title="חלקים מתאימים"
                          >
                            <PackageSearch size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditForGroup(g); }}
                            className="p-2 hover:bg-orange-100 rounded-lg text-slate-400 hover:text-orange-600"
                            title="ערוך דגם"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {cardGroup && (
        <ModelCardModal brand={cardGroup.brand} model={cardGroup.model} onNavigate={onNavigate} onClose={() => setCardGroup(null)} />
      )}
      {partsGroup && (
        <DeviceCompatiblePartsModal device={{ brand: partsGroup.brand, model: partsGroup.model }} onClose={() => setPartsGroup(null)} />
      )}
      {editingModel && (
        <ModelEditModal model={editingModel} onClose={() => setEditingModel(null)} />
      )}
    </div>
  );
}
