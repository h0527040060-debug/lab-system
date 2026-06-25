import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { KeyRound, Check, X } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'admin',   label: 'אדמין',         color: 'purple' },
  { value: 'office',  label: 'משרד',           color: 'blue' },
  { value: 'lab',     label: 'מעבדה',          color: 'amber' },
  { value: 'pending', label: 'ממתין',          color: 'slate' },
];

const ROLE_BADGE = {
  admin:   'bg-purple-100 text-purple-800',
  office:  'bg-blue-100 text-blue-800',
  lab:     'bg-amber-100 text-amber-800',
  pending: 'bg-slate-100 text-slate-600',
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('he-IL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

export function OfficeUsers() {
  const { state, dispatch } = useAppContext();
  const currentUserId = state.currentUser?.id;
  const [resetUserId, setResetUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');

  const handleRoleChange = (userId, newRole) => {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;
    dispatch({ type: 'UPDATE_USER', payload: { id: userId, role: newRole } });
    if (userId === currentUserId) {
      dispatch({ type: 'SET_CURRENT_USER', payload: { ...user, role: newRole } });
    }
  };

  const startReset = (userId) => {
    setResetUserId(userId);
    setNewPassword('');
    setResetError('');
  };

  const handleReset = (userId) => {
    if (newPassword.length < 6) { setResetError('סיסמה חייבת להכיל לפחות 6 תווים'); return; }
    dispatch({ type: 'UPDATE_USER', payload: { id: userId, password: newPassword } });
    setResetUserId(null);
    setNewPassword('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">ניהול משתמשים</h1>
        <span className="text-sm text-slate-500">{state.users.length} משתמשים רשומים</span>
      </div>

      {state.users.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          אין משתמשים רשומים עדיין
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-right">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">משתמש</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">מייל</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">תפקיד</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">הצטרף</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {state.users.map((user) => {
                const isSelf = user.id === currentUserId;
                const isResetting = resetUserId === user.id;
                return (
                  <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.picture ? (
                          <img src={user.picture} alt={user.name}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                            {user.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.id}</p>
                        </div>
                        {isSelf && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">אתה</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_BADGE[user.role] || ROLE_BADGE.pending}`}>
                        {ROLE_OPTIONS.find(r => r.value === user.role)?.label || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className="text-xs text-slate-400">לא ניתן לשנות</span>
                      ) : isResetting ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="password"
                            value={newPassword}
                            onChange={e => { setNewPassword(e.target.value); setResetError(''); }}
                            placeholder="סיסמה חדשה"
                            className="border border-slate-300 rounded px-2 py-1 text-xs w-32"
                            dir="ltr"
                            autoFocus
                          />
                          <button onClick={() => handleReset(user.id)} className="text-green-600 hover:text-green-800 p-1"><Check size={15} /></button>
                          <button onClick={() => setResetUserId(null)} className="text-slate-400 hover:text-red-600 p-1"><X size={15} /></button>
                          {resetError && <span className="text-xs text-red-600">{resetError}</span>}
                        </div>
                      ) : (
                        <div className="flex gap-1 flex-wrap">
                          {ROLE_OPTIONS.filter(r => r.value !== user.role).map(option => (
                            <button
                              key={option.value}
                              onClick={() => handleRoleChange(user.id, option.value)}
                              className={`text-xs px-2 py-0.5 rounded-lg border transition-colors ${
                                option.value === 'admin'  ? 'border-purple-200 text-purple-700 hover:bg-purple-50' :
                                option.value === 'office' ? 'border-blue-200 text-blue-700 hover:bg-blue-50' :
                                option.value === 'lab'    ? 'border-amber-200 text-amber-700 hover:bg-amber-50' :
                                'border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                          <button
                            onClick={() => startReset(user.id)}
                            className="text-xs px-2 py-0.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                            title="איפוס סיסמה"
                          >
                            <KeyRound size={12} /> סיסמה
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
