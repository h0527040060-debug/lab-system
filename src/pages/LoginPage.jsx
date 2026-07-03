import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { LogIn } from 'lucide-react';
import RegisterPage from './RegisterPage';
import { Button } from '../components/Button';

export default function LoginPage() {
  const { state, dispatch } = useAppContext();
  const [showRegister, setShowRegister] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const admins = state.users.filter(u => u.role === 'admin');

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
              id="email"
              name="email"
              autoComplete="username"
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
              id="password"
              name="password"
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

          <Button type="submit" icon={<LogIn size={18} />} size="lg" className="w-full">
            כניסה למערכת
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-slate-500">
            אין לך חשבון?{' '}
            <button onClick={() => setShowRegister(true)} className="text-orange-500 hover:underline font-medium">
              הרשמה
            </button>
          </p>
          <button onClick={() => setShowForgot(!showForgot)} className="text-xs text-slate-400 hover:text-slate-600">
            שכחתי סיסמה
          </button>
          {showForgot && (
            <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-4 text-right">
              <p className="text-xs font-semibold text-slate-700 mb-2">לאיפוס סיסמה פנה לאדמין המערכת:</p>
              {admins.length === 0 ? (
                <p className="text-xs text-slate-500">לא נמצאו אדמינים במערכת</p>
              ) : (
                admins.map(a => (
                  <div key={a.id} className="text-xs text-slate-700 flex items-center gap-2 py-1">
                    <span className="font-semibold">{a.name}</span>
                    <span className="text-slate-400">•</span>
                    <span dir="ltr">{a.email}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
