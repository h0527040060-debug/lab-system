import { useState } from 'react';
import { useAppContext } from '../../../store/AppContext';
import { Save } from 'lucide-react';

export function SettingsBusiness() {
  const { state, dispatch } = useAppContext();
  const [form, setForm] = useState({ ...state.settings });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: form });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="space-y-3">
        <div>
          <label className="text-sm font-semibold block mb-1">שם העסק</label>
          <input
            type="text"
            value={form.business_name}
            onChange={(e) => setForm({ ...form, business_name: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-semibold block mb-1">כתובת</label>
          <input
            type="text"
            value={form.business_address}
            onChange={(e) => setForm({ ...form, business_address: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold block mb-1">טלפון</label>
            <input
              type="text"
              value={form.business_phone}
              onChange={(e) => setForm({ ...form, business_phone: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">אחוז מע"מ לתצוגה</label>
            <input
              type="number"
              value={form.vat_percent_display}
              onChange={(e) => setForm({ ...form, vat_percent_display: parseFloat(e.target.value) || 0 })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
            <p className="text-xs text-slate-500 mt-1">תצוגה בלבד במסך גביה</p>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">דמי בדיקה (₪)</label>
            <input
              type="number"
              value={form.diagnostic_fee ?? 180}
              onChange={(e) => setForm({ ...form, diagnostic_fee: parseFloat(e.target.value) || 0 })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
            <p className="text-xs text-slate-500 mt-1">נגבים בתיקון בתשלום, מזוכים עם אישור הצעה</p>
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold block mb-1">ימי תקיעה להתראה</label>
          <input
            type="number"
            value={form.alert_stuck_repair_days}
            onChange={(e) => setForm({ ...form, alert_stuck_repair_days: parseInt(e.target.value) || 7 })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
          <p className="text-xs text-slate-500 mt-1">תיקון שלא משתנה X ימים יסומן כתקוע</p>
        </div>
      </div>
      <button
        onClick={handleSave}
        className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
      >
        <Save size={18} />
        {saved ? '✓ נשמר!' : 'שמור הגדרות'}
      </button>
    </div>
  );
}
