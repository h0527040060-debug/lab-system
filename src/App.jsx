import { useAppContext } from './store/AppContext';

const StatBox = ({ label, value }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col gap-1">
    <span className="text-2xl font-bold text-slate-800">{value}</span>
    <span className="text-xs text-slate-500">{label}</span>
  </div>
);

function App() {
  const { state } = useAppContext();

  const stats = [
    { label: 'לקוחות', value: state.customers.length },
    { label: 'מכשירים', value: state.devices.length },
    { label: 'תיקונים', value: state.repairs.length },
    { label: 'חלקים במלאי', value: state.parts.length },
    { label: 'אצוות FIFO', value: state.stockBatches.length },
    { label: 'ספקים', value: state.suppliers.length },
    { label: 'הזמנות רכש', value: state.purchaseOrders.length },
    { label: 'הוצאות כלליות', value: state.generalExpenses.length },
    { label: 'קטלוג עבודות', value: state.workCatalog.length },
    { label: 'שירותים', value: state.services.length },
    { label: 'טכנאים', value: state.technicians.length },
    { label: 'ערעורי אחריות', value: state.warrantyAppeals.length },
  ];

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">מערכת ניהול מעבדת תיקונים</h1>
          <p className="text-lg text-slate-500">{state.settings?.business_name}</p>
          <p className="text-sm text-slate-400 mt-1">שלב 2 — מודל נתונים + localStorage ✓</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {stats.map(s => (
            <StatBox key={s.label} label={s.label} value={s.value} />
          ))}
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-semibold text-slate-700 mb-3">הגדרות עסק</h2>
          <div className="text-sm text-slate-600 space-y-1">
            <div>שם: {state.settings?.business_name}</div>
            <div>כתובת: {state.settings?.business_address}</div>
            <div>טלפון: {state.settings?.business_phone}</div>
            <div>מע"מ (תצוגה): {state.settings?.vat_percent_display}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
