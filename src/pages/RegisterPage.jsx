import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { UserPlus } from 'lucide-react';

const generateUserId = (users) => {
  const num = String(users.length + 1).padStart(4, '0');
  return `USR-${num}`;
};

export default function RegisterPage({ onBack }) {
  const { state, dispatch } = useAppContext();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) { setError('יש להזין שם'); return; }
    if (!form.email.trim()) { setError('יש להזין מייל'); return; }
    if (form.password.length < 6) { setError('סיסמה חייבת להכיל לפחות 6 תווים'); return; }
    if (form.password !== form.confirm) { setError('הסיסמאות אינן תואמות'); return; }

    const emailExists = state.users.some(
      u => u.email.toLowerCase() === form.email.trim().toLowerCase()
    );
    if (emailExists) { setError('כתובת המייל כבר רשומה במערכת'); return; }

    const isFirst = state.users.length === 0;
    const newUser = {
      id: generateUserId(state.users),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: isFirst ? 'office' : 'pending',
      created_at: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_USER', payload: newUser });

    if (isFirst) {
      dispatch({ type: 'SET_CURRENT_USER', payload: newUser });
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">ההרשמה הצליחה!</h2>
          <p className="text-slate-500 text-sm mb-6">
            החשבון שלך נוצר וממתין לאישור מנהל המערכת.
          </p>
          <button
            onClick={onBack}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
          >
            חזרה לכניסה
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
            ה
          </div>
          <h2 className="text-xl font-bold text-slate-900">יצירת חשבון</h2>
          {state.users.length === 0 && (
            <p className="text-xs text-emerald-600 mt-1 font-medium">
              משתמש ראשון — יקבל הרשאות מנהל
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">שם מלא</label>
            <input
              type="text"
              name="name"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="ישראל ישראלי"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">כתובת מייל</label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="your@email.com"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">סיסמה</label>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="לפחות 6 תווים"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">אימות סיסמה</label>
            <input
              type="password"
              name="confirm"
              autoComplete="new-password"
              value={form.confirm}
              onChange={handleChange}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <UserPlus size={18} />
            הרשמה
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={onBack}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← חזרה לכניסה
          </button>
        </div>
      </div>
    </div>
  );
}
