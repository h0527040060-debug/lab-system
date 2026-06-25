import { useAppContext } from './store/AppContext';
import { USER_ROLES } from './constants/userRoles';
import LoginPage from './pages/LoginPage';
import OfficeRouter from './pages/OfficeRouter';
import LabRouter from './pages/LabRouter';

export default function App() {
  const { state, dispatch } = useAppContext();

  if (!state.currentUser) {
    return <LoginPage />;
  }

  if (state.currentUser.role === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">ממתין לאישור</h2>
          <p className="text-slate-500 text-sm mb-6">
            חשבונך ממתין לאישור מנהל המערכת.
          </p>
          <button
            onClick={() => dispatch({ type: 'LOGOUT' })}
            className="text-sm text-blue-600 hover:underline"
          >
            חזרה לכניסה
          </button>
        </div>
      </div>
    );
  }

  switch (state.currentUser.role) {
    case USER_ROLES.ADMIN:
    case USER_ROLES.OFFICE:
      return <OfficeRouter />;
    case USER_ROLES.LAB:
      return <LabRouter />;
    default:
      return <LoginPage />;
  }
}
