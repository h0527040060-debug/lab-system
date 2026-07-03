import { useState } from 'react';
import { useAppContext as useApp } from '../../../store/AppContext';
import PartThumbnail from '../../../components/PartThumbnail';
import AssemblyInstructionsViewer from '../../../components/AssemblyInstructionsViewer';
import PartEditModal from './PartEditModal';
import SearchInput from '../../../components/SearchInput';
import EmptyState from '../../../components/EmptyState';
import { BookOpen, Edit2, Eye } from 'lucide-react';

export default function AssemblyInstructions() {
  const { state, dispatch } = useApp();
  const [viewingPart, setViewingPart] = useState(null);
  const [editingPart, setEditingPart] = useState(null);
  const [search, setSearch] = useState('');

  const handleSavePart = (partData) => {
    dispatch({ type: 'UPDATE_PART', payload: partData });
    setEditingPart(null);
  };

  const matchesSearch = (p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(s) ||
      p.manufacturer?.toLowerCase().includes(s) ||
      p.manufacturer_sku?.toLowerCase().includes(s) ||
      p.internal_barcode?.toLowerCase().includes(s) ||
      p.category?.toLowerCase().includes(s)
    );
  };

  const partsWithInstructions = state.parts.filter(p =>
    (p.assembly_instructions?.text || p.assembly_instructions?.images?.length || p.assembly_instructions?.video_url) && matchesSearch(p)
  );

  const partsWithout = state.parts.filter(p =>
    !p.assembly_instructions?.text && !p.assembly_instructions?.images?.length && !p.assembly_instructions?.video_url && matchesSearch(p)
  );

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">הוראות הרכבה</h2>
        <p className="text-sm text-slate-500">
          {partsWithInstructions.length} חלקים עם הוראות, {partsWithout.length} ללא הוראות
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="חיפוש לפי שם, יצרן, מק״ט..." />
      </div>

      {partsWithInstructions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <BookOpen size={14} /> חלקים עם הוראות הרכבה
          </h3>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-right p-3 font-semibold">חלק</th>
                  <th className="text-right p-3 font-semibold">הוראות</th>
                  <th className="text-center p-3 font-semibold">תמונות</th>
                  <th className="text-center p-3 font-semibold">סרטון</th>
                  <th className="text-right p-3 font-semibold">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {partsWithInstructions.map(part => {
                  const ai = part.assembly_instructions;
                  return (
                    <tr key={part.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <PartThumbnail part={part} size="sm" />
                          <div>
                            <p className="font-semibold">{part.name}</p>
                            <p className="text-xs text-slate-500">{part.manufacturer}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-slate-600 max-w-48">
                        {ai?.text ? (
                          <p className="truncate">{ai.text}</p>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="p-3 text-center">
                        {ai?.images?.length > 0 ? (
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">{ai.images.length} תמונות</span>
                        ) : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="p-3 text-center">
                        {ai?.video_url ? (
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded">▶ סרטון</span>
                        ) : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button onClick={() => setViewingPart(part)} className="text-blue-500 hover:text-blue-700 p-1" title="צפה">
                            <Eye size={15} />
                          </button>
                          <button onClick={() => setEditingPart(part)} className="text-slate-500 hover:text-orange-600 p-1" title="ערוך">
                            <Edit2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {partsWithout.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 mb-3">חלקים ללא הוראות הרכבה</h3>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <tbody>
                {partsWithout.map(part => (
                  <tr key={part.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <PartThumbnail part={part} size="sm" />
                        <div>
                          <p className="font-medium">{part.name}</p>
                          <p className="text-xs text-slate-500">{part.manufacturer}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-xs text-slate-400">אין הוראות הרכבה</span>
                    </td>
                    <td className="p-3">
                      <button onClick={() => setEditingPart(part)} className="text-xs text-orange-600 hover:underline flex items-center gap-1">
                        <Edit2 size={12} /> הוסף הוראות
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {state.parts.length === 0 && <EmptyState icon={BookOpen} title="אין חלקים בקטלוג" />}

      {viewingPart && <AssemblyInstructionsViewer part={viewingPart} onClose={() => setViewingPart(null)} />}

      {editingPart && (
        <PartEditModal
          part={editingPart}
          onSave={handleSavePart}
          onClose={() => setEditingPart(null)}
        />
      )}
    </div>
  );
}
