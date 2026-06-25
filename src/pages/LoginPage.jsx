import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../store/AppContext';

// יש להחליף ב-Client ID אמיתי מ-Google Cloud Console
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

// פענוח JWT מגוגל ללא ספרייה חיצונית
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const generateUserId = (users) => {
  const num = String(users.length + 1).padStart(4, '0');
  return `USR-${num}`;
};

export default function LoginPage() {
  const { state, dispatch } = useAppContext();
  const googleBtnRef = useRef(null);
  const [error, setError] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  const handleCredentialResponse = (response) => {
    const payload = parseJwt(response.credential);
    if (!payload) {
      setError('שגיאה בקבלת פרטים מגוגל. נסה שוב.');
      return;
    }

    const { email, name, picture } = payload;

    // חיפוש משתמש קיים לפי מייל
    let user = state.users.find(u => u.email === email);

    if (!user) {
      // יצירת משתמש חדש
      const isFirst = state.users.length === 0;
      user = {
        id: generateUserId(state.users),
        name,
        email,
        picture: picture || '',
        role: isFirst ? 'office' : 'pending',
        created_at: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_USER', payload: user });
    }

    if (user.role === 'pending') {
      setPendingEmail(email);
      return;
    }

    dispatch({ type: 'SET_CURRENT_USER', payload: user });
  };

  useEffect(() => {
    if (!window.google || !googleBtnRef.current) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: 'outline',
      size: 'large',
      locale: 'he',
      width: 300,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.users]);

  // המתנה לטעינת סקריפט גוגל
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          locale: 'he',
          width: 300,
        });
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* לוגו */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-500 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
            ה
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">
            {state.settings.business_name}
          </h1>
          <p className="text-slate-600 text-sm">{state.settings.business_address}</p>
        </div>

        <div className="border-t border-slate-200 pt-6">
          {pendingEmail ? (
            // מסך ממתין אישור
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⏳</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">ממתין לאישור</h2>
              <p className="text-slate-600 text-sm mb-1">
                החשבון <strong>{pendingEmail}</strong> נרשם בהצלחה.
              </p>
              <p className="text-slate-500 text-sm mb-6">
                מנהל המערכת צריך לאשר את גישתך לפני שתוכל להיכנס.
              </p>
              <button
                onClick={() => setPendingEmail('')}
                className="text-sm text-blue-600 hover:underline"
              >
                חזרה לכניסה
              </button>
            </div>
          ) : (
            // מסך כניסה רגיל
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-800 mb-2">כניסה למערכת</h2>
              <p className="text-slate-500 text-sm mb-6">
                {state.users.length === 0
                  ? 'הכניסה הראשונה תיצור חשבון מנהל'
                  : 'הכנס עם חשבון Google שלך'}
              </p>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 text-right">
                  {error}
                </div>
              )}

              <div className="flex justify-center">
                <div ref={googleBtnRef} />
              </div>

              {GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com' && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-right">
                  <p className="text-xs text-amber-700 font-medium mb-1">⚠️ מצב פיתוח</p>
                  <p className="text-xs text-amber-600 mb-2">
                    יש להגדיר Google Client ID אמיתי ב-LoginPage.jsx
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleCredentialResponse({
                        credential: btoa(JSON.stringify({ alg: 'RS256' })) + '.' +
                          btoa(JSON.stringify({
                            email: 'admin@example.com',
                            name: 'מנהל מערכת',
                            picture: '',
                            sub: '123456',
                          })) + '.sig'
                      })}
                      className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                    >
                      כניסת ניסיון — משרד
                    </button>
                    <button
                      onClick={() => handleCredentialResponse({
                        credential: btoa(JSON.stringify({ alg: 'RS256' })) + '.' +
                          btoa(JSON.stringify({
                            email: 'tech@example.com',
                            name: 'טכנאי ראשי',
                            picture: '',
                            sub: '654321',
                          })) + '.sig'
                      })}
                      className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700"
                    >
                      כניסת ניסיון — מעבדה
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
