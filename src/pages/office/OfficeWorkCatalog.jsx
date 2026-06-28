import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { generateWorkCodeId } from '../../utils/idGenerators';
import { formatMoney } from '../../utils/formatters';
import { calculateAvgHoursForWork } from '../../utils/workCatalog';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { Wrench, Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { WorkCatalogEditModal } from '../../components/WorkCatalogEditModal';

export default function OfficeWorkCatalog() {
  const { state, dispatch } = useAppContext();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | workCatalogItem
  const [deleting, setDeleting] = useState(null);

  const filteredCatalog = state.workCatalog.filter(w => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      w.work_name?.toLowerCase().includes(s) ||
      w.brand?.toLowerCase().includes(s) ||
      w.model?.toLowerCase().includes(s) ||
      w.id?.toLowerCase().includes(s)
    );
  });

  const handleSave = (workData) => {
    if (workData.id) {
      dispatch({ type: 'UPDATE_WORK_ITEM', payload: workData });
    } else {
      const newWork = {
        ...workData,
        id: generateWorkCodeId(state.workCatalog.map(w => w.id)),
      };
      dispatch({ type: 'ADD_WORK_ITEM', payload: newWork });
    }
    setEditing(null);
  };

  const handleDelete = () => {
    if (!deleting) return;
    dispatch({ type: 'DELETE_WORK_ITEM', payload: deleting.id });
    setDeleting(null);
  };

  return (
    <div>
      <PageHeader
        title="קטלוג עבודות"
        subtitle={`${state.workCatalog.length} עבודות במחירון`}
        action={
          <button
            onClick={() => setEditing('new')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-1"
          >
            <Plus size={18} />
            הוסף עבודה
          </button>
        }
      />

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="חיפוש לפי שם עבודה, יצרן, דגם..." />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredCatalog.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="אין עבודות בקטלוג"
            description={state.workCatalog.length === 0 ? 'עוד לא הוגדרו עבודות במחירון' : 'לא נמצאו תוצאות'}
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-right p-3 font-semibold">קוד</th>
                <th className="text-right p-3 font-semibold">שם עבודה</th>
                <th className="text-right p-3 font-semibold">יצרן</th>
                <th className="text-right p-3 font-semibold">דגם</th>
                <th className="text-right p-3 font-semibold">מחיר</th>
                <th className="text-right p-3 font-semibold">שעות ברירת מחדל</th>
                <th className="text-right p-3 font-semibold">ממוצע היסטורי</th>
                <th className="text-right p-3 font-semibold">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredCatalog.map(w => {
                const avg = calculateAvgHoursForWork(w.id, state.repairs);
                return (
                  <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs text-orange-600 font-bold">{w.id}</td>
                    <td className="p-3 font-semibold">{w.work_name}</td>
                    <td className="p-3 text-slate-600">{w.brand}</td>
                    <td className="p-3 text-slate-600">{w.model}</td>
                    <td className="p-3 font-bold">{formatMoney(w.price)}</td>
                    <td className="p-3 text-slate-600">{w.estimated_hours_default} ש'</td>
                    <td className="p-3 text-xs">
                      {avg ? (
                        <div className="flex items-center gap-1 text-blue-600">
                          <TrendingUp size={12} />
                          {avg.avg_hours.toFixed(1)} ש' ({avg.count} ביצועים)
                        </div>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button onClick={() => setEditing(w)} className="text-slate-500 hover:text-orange-600 p-1">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => setDeleting(w)} className="text-slate-500 hover:text-red-600 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <WorkCatalogEditModal
          item={editing === 'new' ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <Modal
          open={true}
          onClose={() => setDeleting(null)}
          title="מחיקת עבודה"
          maxWidth="max-w-sm"
          footer={
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100">ביטול</button>
              <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold">מחק</button>
            </div>
          }
        >
          <p className="text-slate-700">האם למחוק את <span className="font-bold">{deleting.work_name}</span> ({deleting.id})?</p>
        </Modal>
      )}
    </div>
  );
}

