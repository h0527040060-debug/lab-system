import { useAppContext } from '../../store/AppContext';
import PageHeader from '../../components/PageHeader';
import { REPAIR_STATUSES } from '../../constants/statuses';

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

  return (
    <div>
      <PageHeader title="דשבורד משרד" subtitle="מבט כללי על המערכת" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="קריאות פעילות" value={activeRepairs} color="orange" />
        <StatCard label="נקלט היום" value={todayRepairs} color="blue" />
        <StatCard label="סך לקוחות" value={state.customers.length} color="purple" />
        <StatCard label="סך מכשירים" value={state.devices.length} color="green" />
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
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
