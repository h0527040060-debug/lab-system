export default function OfficeSettings() {
  return <PlaceholderPage title="הגדרות מערכת" description="פרטי עסק ותפעול" stage="שלב 10" />;
}

function PlaceholderPage({ title, description, stage }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-600 mb-1">{description}</p>
      <p className="text-sm text-orange-600 font-semibold">ייבנה ב{stage}</p>
    </div>
  );
}
