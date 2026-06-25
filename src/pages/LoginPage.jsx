import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { LogIn } from 'lucide-react';
import RegisterPage from './RegisterPage';

export default function LoginPage() {
  const { state, dispatch } = useAppContext();
  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (showRegister) {
    return <RegisterPage onBack={() => setShowRegister(false)} />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const user = state.users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );

    if (!user) {
      setError('מייל או סיסמה שגויים');
      return;
    }

    dispatch({ type: 'SET_CURRENT_USER', payload: user });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-500 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
            ה
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            {state.settings.business_name}
          </h1>
          <p className="text-slate-500 text-xs">{state.settings.business_address}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">כתובת מייל</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
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
            <LogIn size={18} />
            כניסה למערכת
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            אין לך חשבון?{' '}
            <button
              onClick={() => setShowRegister(true)}
              className="text-orange-500 hover:underline font-medium"
            >
              הרשמה
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
