import { useAppContext } from '../store/AppContext';
import { USER_ROLES } from '../constants/userRoles';
import { Building2, Wrench } from 'lucide-react';

export default function LoginPage() {
  const { state, dispatch } = useAppContext();

  const handleLogin = (role) => {
    dispatch({
      type: 'SET_CURRENT_USER',
      payload: { role, login_time: new Date().toISOString() },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        {/* לוגו */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-500 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
            ה
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">
            {state.settings.business_name}
          </h1>
          <p className="text-slate-600 text-sm">{state.settings.business_address}</p>
          <p className="text-slate-500 text-xs mt-1">{state.settings.business_phone}</p>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h2 className="text-xl font-bold text-center text-slate-800 mb-6">
            בחר תפקיד להתחברות
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {/* משרד */}
            <button
              onClick={() => handleLogin(USER_ROLES.OFFICE)}
              className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-400 rounded-xl p-6 transition-all group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-500 group-hover:bg-blue-600 rounded-xl flex items-center justify-center mb-3 transition-colors">
                  <Building2 size={32} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-blue-900 mb-1">משרד</h3>
                <p className="text-xs text-blue-700">
                  קליטה, תמחור, גביה, דוחות פיננסיים
                </p>
              </div>
            </button>

            {/* מעבדה */}
            <button
              onClick={() => handleLogin(USER_ROLES.LAB)}
              className="bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 hover:border-amber-400 rounded-xl p-6 transition-all group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-amber-500 group-hover:bg-amber-600 rounded-xl flex items-center justify-center mb-3 transition-colors">
                  <Wrench size={32} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-amber-900 mb-1">מעבדה</h3>
                <p className="text-xs text-amber-700">
                  אבחון, ביצוע תיקונים, תיעוד
                </p>
              </div>
            </button>
          </div>

          <p className="text-xs text-slate-400 text-center mt-6">
            * אין סיסמה בשלב זה - מערכת פנימית
          </p>
        </div>
      </div>
    </div>
  );
}
