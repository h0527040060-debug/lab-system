import { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { User, Phone, Mail, Save, Check } from 'lucide-react';

const ROLE_LABEL = {
  admin: 'אדמין',
  office: 'משרד',
  lab: 'מעבדה',
  pending: 'ממתין לאישור',
};

export default function ProfilePage() {
  const { state, dispatch } = useAppContext();
  const me = state.currentUser;

  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (me) {
      setForm({ name: me.name || '', phone: me.phone || '', email: me.email || '' });
    }
  }, [me]);

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
    setSaved(false);
  };

  const validate = () => {
    if (!form.name.trim()) return 'שם מלא הוא שדה חובה';
    if (!form.email.trim()) return 'כתובת מייל היא שדה חובה';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) return 'כתובת מייל לא תקינה';
    const duplicate = state.users.find(
      u => u.email.toLowerCase() === form.email.trim().toLowerCase() && u.id !== me.id
    );
    if (duplicate) return 'כתובת מייל זו כבר בשימוש על ידי משתמש אחר';
    return null;
  };

  const handleSave = () => {
    const err = validate();
    if (err) { setError(err); return; }
    dispatch({
      type: 'UPDATE_USER',
      payload: {
        id: me.id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!me) return null;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">הגדרות פרופיל</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* כותרת */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xl">
            {me.name?.charAt(0) || '?'}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{me.name}</p>
            <p className="text-xs text-slate-500">{me.id} · {ROLE_LABEL[me.role] || me.role}</p>
          </div>
        </div>

        {/* טופס */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <User size={14} className="inline ml-1" />שם מלא
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="שם מלא"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <Phone size={14} className="inline ml-1" />טלפון
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => handleChange('phone', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="05X-XXXXXXX"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <Mail size={14} className="inline ml-1" />כתובת מייל
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="example@mail.com"
              dir="ltr"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleSave}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              saved
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            {saved ? <><Check size={16} /> נשמר בהצלחה</> : <><Save size={16} /> שמור שינויים</>}
          </button>
        </div>
      </div>
    </div>
  );
}
