import { useAppContext } from '../../store/AppContext';
import PageHeader from '../../components/PageHeader';
import { REPAIR_STATUSES } from '../../constants/statuses';
import { formatMoney } from '../../utils/formatters';

export default function OfficeDashboard() {
  const { state } = useAppContext();

  const activeRepairs = state.repairs.filter(r =>
    ![REPAIR_STATUSES.GREEN_COMPLETE, REPAIR_STATUSES.RED_CANCELLED].includes(r.status)
  ).length;

  const todayRepairs = state.repairs.filter(r => {
    const intakeDate = new Date(r.date_intake);
    const today = new Date();
    return intakeDate.toDateString() === today.toDateString();
  }).length;

  const pendingPayment = state.repairs.filter(r => r.status === REPAIR_STATUSES.PENDING_PAYMENT).length;

  const completedRepairs = state.repairs.filter(r => r.status === REPAIR_STATUSES.GREEN_COMPLETE);
  const totalRevenue = completedRepairs.reduce((sum, r) => sum + (r.final_price || 0), 0);

  return (
    <div>
      <PageHeader title="דשבורד משרד" subtitle="מבט כללי על המערכת" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="קריאות פעילות" value={activeRepairs} color="orange" />
        <StatCard label="נקלט היום" value={todayRepairs} color="blue" />
        <StatCard label="ממתין לגביה" value={pendingPayment} color="red" />
        <StatCard label="הושלמו" value={completedRepairs.length} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <p className="text-sm font-medium text-green-700">סך הכנסות (ללא מע"מ)</p>
          <p className="text-3xl font-bold text-green-900 mt-2">{formatMoney(totalRevenue)}</p>
          <p className="text-xs text-green-600 mt-1">{completedRepairs.length} תיקונים שהושלמו</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <p className="text-sm font-medium text-purple-700">סך לקוחות</p>
          <p className="text-3xl font-bold text-purple-900 mt-2">{state.customers.length}</p>
        </div>
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-6">
          <p className="text-sm font-medium text-cyan-700">סך מכשירים</p>
          <p className="text-3xl font-bold text-cyan-900 mt-2">{state.devices.length}</p>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm p-6 text-center">
        <p className="text-sm text-slate-500">דשבורד מלא עם גרפים ינבנה בשלב 10</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
