import { useAppContext } from '../../store/AppContext';
import { REPAIR_STATUSES, STATUS_LABELS } from '../../constants/statuses';
import { formatMoney, formatPercent } from '../../utils/formatters';
import {
  getMonthlyRevenue, getRepairsByStatus, getTopCustomers,
  getTopWorkCodes, calculateFinancialSummary, getRepairsByDeviceType,
} from '../../utils/reports';
import PageHeader from '../../components/PageHeader';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import { TrendingUp, Users, Wrench, DollarSign } from 'lucide-react';

const COLORS = ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function OfficeDashboard() {
  const { state } = useAppContext();

  const summary = calculateFinancialSummary(state.repairs, state.generalExpenses, state.technicians);
  const monthlyRevenue = getMonthlyRevenue(state.repairs);
  const statusData = getRepairsByStatus(state.repairs).map(s => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
  }));
  const topCustomers = getTopCustomers(state.repairs, state.customers, 10);
  const topWorks = getTopWorkCodes(state.repairs, state.workCatalog, 5);
  const deviceTypes = getRepairsByDeviceType(state.repairs, state.devices);

  const activeRepairs = state.repairs.filter(r =>
    ![REPAIR_STATUSES.GREEN_COMPLETE, REPAIR_STATUSES.RED_CANCELLED].includes(r.status)
  ).length;

  const todayRepairs = state.repairs.filter(r => {
    const intakeDate = new Date(r.date_intake);
    return intakeDate.toDateString() === new Date().toDateString();
  }).length;

  const internalRepairs = state.repairs.filter(r => r.repair_type === 'internal_used');
  const internalCompleted = internalRepairs.filter(r => r.status === REPAIR_STATUSES.GREEN_COMPLETE);
  const internalPartsCost = internalCompleted.reduce((sum, r) => sum + (r.internal_parts_cost || 0), 0);
  const internalPurchaseCost = internalCompleted.reduce((sum, r) => sum + (r.purchase_cost || 0), 0);
  const internalHours = internalCompleted.reduce((sum, r) => sum + (r.actual_hours || 0), 0);

  return (
    <div>
      <PageHeader title="דשבורד משרד" subtitle="סקירה כללית של העסק" />

      {/* KPI כרטיסים */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          icon={DollarSign}
          label='הכנסות סה"כ'
          value={formatMoney(summary.totalRevenue)}
          subtitle={`${summary.completedCount} תיקונים`}
          color="green"
        />
        <KPICard
          icon={TrendingUp}
          label="רווח נקי"
          value={formatMoney(summary.netProfit)}
          subtitle={formatPercent(summary.netMargin) + ' מההכנסות'}
          color={summary.netProfit >= 0 ? 'blue' : 'red'}
        />
        <KPICard
          icon={Wrench}
          label="קריאות פעילות"
          value={activeRepairs}
          subtitle={`${todayRepairs} נקלטו היום`}
          color="orange"
        />
        <KPICard
          icon={Users}
          label="לקוחות פעילים"
          value={state.customers.length}
          subtitle={`${state.devices.length} מכשירים`}
          color="purple"
        />
      </div>

      {/* 4 גרפים */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* גרף 1: הכנסות חודשיות */}
        <ChartCard title="הכנסות 6 חודשים אחרונים">
          {monthlyRevenue.some(m => m.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" reversed />
                <YAxis tickFormatter={(v) => `${v}₪`} orientation="right" />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} name="הכנסות" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="אין נתוני הכנסות עדיין" />
          )}
        </ChartCard>

        {/* גרף 2: סטטוסים */}
        <ChartCard title="חלוקת קריאות לפי סטטוס">
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="אין קריאות במערכת" />
          )}
        </ChartCard>

        {/* גרף 3: לקוחות מובילים */}
        <ChartCard title="10 לקוחות מובילים לפי הכנסה">
          {topCustomers.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topCustomers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `${v}₪`} />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Bar dataKey="revenue" fill="#3b82f6" name="הכנסות" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="אין נתוני לקוחות עדיין" />
          )}
        </ChartCard>

        {/* גרף 4: עבודות רווחיות */}
        <ChartCard title="5 עבודות הכי רווחיות">
          {topWorks.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topWorks}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `${v}₪`} orientation="right" />
                <Tooltip formatter={(v, n) => n === 'revenue' ? formatMoney(v) : v} />
                <Legend />
                <Bar dataKey="revenue" fill="#22c55e" name="הכנסה" />
                <Bar dataKey="count" fill="#eab308" name="כמות" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="אין נתוני עבודות עדיין" />
          )}
        </ChartCard>

        {/* גרף 5: סוגי מכשירים */}
        <ChartCard title="סוגי מכשירים נפוצים">
          {deviceTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={deviceTypes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="type" type="category" width={110} />
                <Tooltip formatter={(v) => `${v} תיקונים`} />
                <Bar dataKey="count" fill="#f97316" name="תיקונים" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="אין נתוני מכשירים עדיין" />
          )}
        </ChartCard>
      </div>

      {/* סטטיסטיקת יד שנייה */}
      {internalRepairs.length > 0 && (
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-xl p-5">
          <h3 className="font-bold text-purple-900 text-base mb-4">🛒 מוצרי יד שנייה — סיכום</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-purple-200 p-3 text-center">
              <p className="text-2xl font-bold text-purple-700">{internalRepairs.length}</p>
              <p className="text-xs text-slate-500 mt-1">מוצרים בסה"כ</p>
            </div>
            <div className="bg-white rounded-lg border border-purple-200 p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{internalCompleted.length}</p>
              <p className="text-xs text-slate-500 mt-1">טיפולים הושלמו</p>
            </div>
            <div className="bg-white rounded-lg border border-purple-200 p-3 text-center">
              <p className="text-2xl font-bold text-orange-700">{formatMoney(internalPartsCost + internalPurchaseCost)}</p>
              <p className="text-xs text-slate-500 mt-1">עלות כוללת (רכישה+חלקים)</p>
            </div>
            <div className="bg-white rounded-lg border border-purple-200 p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{internalHours.toFixed(1)}h</p>
              <p className="text-xs text-slate-500 mt-1">שעות עבודה</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ icon: Icon, label, value, subtitle, color }) {
  const colors = {
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium opacity-75">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
        </div>
        <Icon size={24} className="opacity-50" />
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="font-bold text-slate-800 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
      {message}
    </div>
  );
}
