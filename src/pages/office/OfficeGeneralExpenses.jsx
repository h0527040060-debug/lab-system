import { useState } from 'react';
import { useAppContext as useApp } from '../../store/AppContext';
import { formatMoney, formatDate } from '../../utils/formatters';
import { EXPENSE_CATEGORIES } from '../../constants/expenseCategories';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { DollarSign, Plus, Trash2, Calendar, Tag, Edit2 } from 'lucide-react';

export default function OfficeGeneralExpenses() {
  const { state, dispatch } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');

  const filteredExpenses = state.generalExpenses
    .filter(e => filterCategory === 'all' || e.category === filterCategory)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const byCategory = {};
  state.generalExpenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });

  const handleAddExpense = (expense) => {
    const newId = Math.max(0, ...state.generalExpenses.map(e => e.id || 0)) + 1;
    dispatch({
      type: 'ADD_GENERAL_EXPENSE',
      payload: { ...expense, id: newId }
    });
    setShowAdd(false);
  };

  const handleDelete = () => {
    if (!deleting) return;
    dispatch({ type: 'DELETE_GENERAL_EXPENSE', payload: deleting.id });
    setDeleting(null);
  };

  const handleEditExpense = (updatedExpense) => {
    dispatch({ type: 'UPDATE_GENERAL_EXPENSE', payload: updatedExpense });
    setEditingExpense(null);
  };

  return (
    <div>
      <PageHeader
        title="רכש כללי למעבדה"
        subtitle={`${state.generalExpenses.length} הוצאות, סה"כ ${formatMoney(state.generalExpenses.reduce((s, e) => s + e.amount, 0))}`}
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-1"
          >
            <Plus size={18} />
            הוסף הוצאה
          </button>
        }
      />

      {Object.keys(byCategory).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
            <Tag size={14} />
            פירוט לפי קטגוריה
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {Object.entries(byCategory).map(([cat, amount]) => (
              <div key={cat} className="bg-slate-50 rounded-lg p-2">
                <p className="text-xs text-slate-600">{cat}</p>
                <p className="text-sm font-bold">{formatMoney(amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm text-slate-700 font-semibold">סנן לפי קטגוריה:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">כל הקטגוריות</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-sm text-slate-600 mr-auto">
            סה"כ מסונן: <span className="font-bold">{formatMoney(totalExpenses)}</span>
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <EmptyState icon={DollarSign} title="אין הוצאות" description="הוסף הוצאה ראשונה" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-right p-3 font-semibold">תאריך</th>
                <th className="text-right p-3 font-semibold">קטגוריה</th>
                <th className="text-right p-3 font-semibold">תיאור</th>
                <th className="text-right p-3 font-semibold">ספק/חנות</th>
                <th className="text-right p-3 font-semibold">סכום</th>
                <th className="text-center p-3 font-semibold">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(e => (
                <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400" />
                      {formatDate(e.date)}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded">
                      {e.category}
                    </span>
                  </td>
                  <td className="p-3">
                    <p className="font-semibold">{e.description}</p>
                    {e.notes && <p className="text-xs text-slate-500">{e.notes}</p>}
                  </td>
                  <td className="p-3 text-sm text-slate-600">{e.supplier || '—'}</td>
                  <td className="p-3 font-bold">{formatMoney(e.amount)}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setEditingExpense(e)}
                        className="text-slate-400 hover:text-orange-600 p-1"
                        title="ערוך הוצאה"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setDeleting(e)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-300">
              <tr>
                <td colSpan="4" className="p-3 font-bold text-slate-700 text-right">סה"כ:</td>
                <td className="p-3 font-bold text-lg">{formatMoney(totalExpenses)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {showAdd && (
        <AddExpenseModal onSave={handleAddExpense} onClose={() => setShowAdd(false)} />
      )}
      {editingExpense && (
        <AddExpenseModal initialData={editingExpense} onSave={handleEditExpense} onClose={() => setEditingExpense(null)} />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="מחיקת הוצאה"
        message={`האם למחוק את "${deleting?.description}"?`}
        confirmLabel="מחק"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function AddExpenseModal({ onSave, onClose, initialData }) {
  const isEdit = !!initialData;
  const [form, setForm] = useState(initialData ? {
    ...initialData,
    date: initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0],
  } : {
    date: new Date().toISOString().split('T')[0],
    category: EXPENSE_CATEGORIES[0],
    description: '',
    supplier: '',
    amount: 0,
    notes: '',
  });

  const canSave = form.description && form.amount > 0;

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={isEdit ? 'עריכת הוצאה' : 'הוספת הוצאה כללית'}
      subtitle={isEdit ? undefined : 'רכש לעסק שאינו לתיקון ספציפי'}
      maxWidth="max-w-xl"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg">ביטול</button>
          <button
            onClick={() => onSave(form)}
            disabled={!canSave}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-semibold"
          >
            {isEdit ? 'שמור' : 'הוסף'}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold block mb-1">תאריך *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({...form, date: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">קטגוריה *</label>
            <select
              value={form.category}
              onChange={(e) => setForm({...form, category: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1">תיאור *</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({...form, description: e.target.value})}
            placeholder="מולטימטר דיגיטלי, חבילת בקבוקי גריז..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold block mb-1">ספק / חנות</label>
            <input
              type="text"
              value={form.supplier}
              onChange={(e) => setForm({...form, supplier: e.target.value})}
              placeholder="הום סנטר, אוסם..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">סכום (ללא מע"מ) *</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({...form, amount: parseFloat(e.target.value) || 0})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1">הערות</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({...form, notes: e.target.value})}
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>
    </Modal>
  );
}
