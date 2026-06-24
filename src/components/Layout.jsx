import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { ROLE_LABELS } from '../constants/userRoles';
import { LogOut, Menu, X } from 'lucide-react';

export default function Layout({ children, currentTab, onTabChange, tabs }) {
  const { state, dispatch } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    if (confirm('להתנתק מהמערכת?')) {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const roleLabel = ROLE_LABELS[state.currentUser?.role] || '';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-200 bg-slate-900 text-white overflow-hidden flex-shrink-0`}>
        <div className="h-full flex flex-col">
          {/* לוגו + שם עסק */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                ה
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">{state.settings.business_name.split(' - ')[0]}</p>
                <p className="text-xs text-slate-400">{roleLabel}</p>
              </div>
            </div>
          </div>

          {/* ניווט */}
          <nav className="flex-1 overflow-y-auto py-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full text-right px-4 py-3 flex items-center gap-3 transition-colors ${
                  currentTab === tab.id
                    ? 'bg-orange-500 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* יוזר + יציאה */}
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 text-slate-300 hover:text-white text-sm"
            >
              <LogOut size={16} />
              <span>התנתק</span>
            </button>
          </div>
        </div>
      </aside>

      {/* תוכן ראשי */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* סרגל עליון */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="text-sm text-slate-600">
            {state.settings.business_phone}
          </div>
        </header>

        {/* אזור תוכן */}
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
