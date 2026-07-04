import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { formatMoney, formatPercent } from '../../utils/formatters';
import { calculateFinancialSummary } from '../../utils/reports';
import PageHeader from '../../components/PageHeader';
import { TrendingUp, Package, Calculator, FileText } from 'lucide-react';

const PERIODS = [
  { id: 'all', label: 'הכל' },
  { id: 'month', label: 'החודש' },
  { id: 'year', label: 'השנה' },
];

// תחילת התקופה שנבחרה (null = הכל)
const periodStart = (period) => {
  const now = new Date();
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === 'year') return new Date(now.getFullYear(), 0, 1);
  return null;
};

export default function OfficeReports() {
  const { state } = useAppContext();
  const [period, setPeriod] = useState('all');

  const start = periodStart(period);
  const inPeriod = (dateStr) => !start || (dateStr && new Date(dateStr) >= start);

  // סינון תיקונים לפי מועד הסגירה/תשלום והוצאות לפי תאריך
  const filteredRepairs = start
    ? state.repairs.filter(r => inPeriod(r.payment_at || r.released_at || r.date_intake))
    : state.repairs;
  const filteredExpenses = start
    ? state.generalExpenses.filter(e => inPeriod(e.date))
    : state.generalExpenses;

  const summary = calculateFinancialSummary(filteredRepairs, filteredExpenses, state.technicians);

  const expensesByCategory = {};
  filteredExpenses.forEach(e => {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
  });

  return (
    <div>
      <PageHeader title='דוחות פיננסיים' subtitle='דוח רווח/הפסד מלא (ללא מע"מ)' />

      {/* בורר תקופה */}
      <div className="bg-white rounded-xl shadow-sm p-2 mb-4 inline-flex gap-1">
        {PERIODS.map(p => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              period === p.id ? 'bg-orange-500 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* דוח רווח/הפסד */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText size={20} />
          דוח רווח והפסד
        </h2>

        {/* הכנסות */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-green-700 mb-2 flex items-center gap-1">
            <TrendingUp size={16} />
            הכנסות
          </h3>
          <div className="bg-green-50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span>הכנסות מתיקונים שהושלמו</span>
              <span className="font-bold">{formatMoney(summary.totalRevenue)}</span>
            </div>
            <div className="text-xs text-slate-500">{summary.completedCount} תיקונים שולמו</div>
            <div className="border-t border-green-200 pt-2 flex justify-between font-bold text-green-800">
              <span>סך הכנסות:</span>
              <span>{formatMoney(summary.totalRevenue)}</span>
            </div>
          </div>
        </div>

        {/* עלויות תיקונים */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-orange-700 mb-2 flex items-center gap-1">
            <Package size={16} />
            עלויות תיקונים
          </h3>
          <div className="bg-orange-50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span>עלות חלקים (FIFO)</span>
              <span className="font-bold">{formatMoney(summary.totalPartsCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>עלות עבודה (שעות × מחיר שעה)</span>
              <span className="font-bold">{formatMoney(summary.totalLaborCost)}</span>
            </div>
            <div className="border-t border-orange-200 pt-2 flex justify-between font-bold text-orange-800">
              <span>סך עלויות תיקונים:</span>
              <span>{formatMoney(summary.totalPartsCost + summary.totalLaborCost)}</span>
            </div>
          </div>
        </div>

        {/* רווח גולמי */}
        <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-blue-900">רווח גולמי:</span>
            <div className="text-left">
              <span className="text-2xl font-bold text-blue-700">{formatMoney(summary.grossProfit)}</span>
              <span className="text-sm text-blue-600 mr-2">({formatPercent(summary.grossMargin)})</span>
            </div>
          </div>
        </div>

        {/* רכש כללי */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-purple-700 mb-2 flex items-center gap-1">
            <Calculator size={16} />
            הוצאות עסקיות (רכש כללי)
          </h3>
          <div className="bg-purple-50 rounded-lg p-3 space-y-1">
            {Object.entries(expensesByCategory).map(([cat, amount]) => (
              <div key={cat} className="flex justify-between text-sm">
                <span>{cat}</span>
                <span className="font-bold">{formatMoney(amount)}</span>
              </div>
            ))}
            {Object.keys(expensesByCategory).length === 0 && (
              <p className="text-sm text-slate-500 text-center py-2">אין הוצאות רשומות</p>
            )}
            <div className="border-t border-purple-200 pt-2 flex justify-between font-bold text-purple-800">
              <span>סך הוצאות:</span>
              <span>{formatMoney(summary.totalGeneralExpenses)}</span>
            </div>
          </div>
        </div>

        {/* רווח נקי */}
        <div className={`rounded-lg p-4 border-2 ${summary.netProfit >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
          <div className="flex justify-between items-center">
            <span className={`font-bold text-lg ${summary.netProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
              {summary.netProfit >= 0 ? '✓ רווח נקי:' : '⚠️ הפסד נקי:'}
            </span>
            <div className="text-left">
              <span className={`text-3xl font-bold ${summary.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatMoney(summary.netProfit)}
              </span>
              <span className={`text-sm mr-2 ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ({formatPercent(summary.netMargin)})
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            * רכש מלאי לא נחשב הוצאה - זה נכס (נספג ב-FIFO כשמשתמשים בחלק)
          </p>
        </div>
      </div>

      {/* סטטיסטיקה */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">סטטיסטיקה כללית</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatBox label="תיקונים שהושלמו" value={summary.completedCount} />
          <StatBox label="ממוצע הכנסה לתיקון" value={formatMoney(summary.completedCount > 0 ? summary.totalRevenue / summary.completedCount : 0)} />
          <StatBox label="ממוצע רווח לתיקון" value={formatMoney(summary.completedCount > 0 ? summary.netProfit / summary.completedCount : 0)} />
          <StatBox label="אחוז רווח גולמי" value={formatPercent(summary.grossMargin)} />
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-600">{label}</p>
      <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}
