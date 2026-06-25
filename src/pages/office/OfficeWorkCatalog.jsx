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

function WorkCatalogEditModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(item || {
    work_name: '', brand: '', model: '', price: 0, estimated_hours_default: 1, notes: '',
  });

  const canSave = form.work_name && form.brand && form.model && form.price >= 0;

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={item ? `עריכת ${item.id}` : 'הוספת עבודה חדשה'}
      subtitle="הגדרת מחיר עבודה לפי דגם"
      maxWidth="max-w-xl"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100">ביטול</button>
          <button
            onClick={() => onSave(form)}
            disabled={!canSave}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-semibold"
          >
            {item ? 'עדכן' : 'הוסף'}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1">שם העבודה *</label>
          <input
            type="text"
            value={form.work_name}
            onChange={(e) => setForm({ ...form, work_name: e.target.value })}
            placeholder="למשל: החלפת מייסבים, החלפת פחמים"
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">יצרן *</label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              placeholder="Dito, Dynamic, Robot Coupe, או 'כל היצרנים'"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
            <p className="text-xs text-slate-500 mt-1">לעבודה גלובלית: 'כל היצרנים'</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">דגם *</label>
            <input
              type="text"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              placeholder="MX91, R301, או 'כל הדגמים'"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
            <p className="text-xs text-slate-500 mt-1">לכל הדגמים: 'כל הדגמים'</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">מחיר עבודה (₪) *</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
            <p className="text-xs text-slate-500 mt-1">ללא חלקים, ללא מע"מ</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">שעות ברירת מחדל</label>
            <input
              type="number"
              step="0.5"
              value={form.estimated_hours_default}
              onChange={(e) => setForm({ ...form, estimated_hours_default: parseFloat(e.target.value) || 1 })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1">הערות</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>
    </Modal>
  );
}
