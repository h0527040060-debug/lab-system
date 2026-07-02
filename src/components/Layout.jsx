import { useState, useRef } from 'react';
import FloatingScrollbar from './FloatingScrollbar';
import { useAppContext } from '../store/AppContext';
import { ROLE_LABELS } from '../constants/userRoles';
import { LogOut, Menu, X, Search, Plus } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Layout({ children, currentTab, onTabChange, tabs }) {
  const { state, dispatch } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const mainRef = useRef(null);

  const handleLogout = () => {
    if (confirm('להתנתק מהמערכת?')) {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const roleLabel = ROLE_LABELS[state.currentUser?.role] || '';

  const sidebarContent = (
    <div className="h-full flex flex-col">
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

      <nav className="flex-1 overflow-y-auto py-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { onTabChange(tab.id); if (window.innerWidth < 1024) setSidebarOpen(false); }}
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

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          {state.currentUser?.picture ? (
            <img
              src={state.currentUser.picture}
              alt={state.currentUser.name}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
              {state.currentUser?.name?.charAt(0) || '?'}
            </div>
          )}
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate leading-tight">
              {state.currentUser?.name || ''}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {state.currentUser?.email || roleLabel}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <LogOut size={16} />
          <span>התנתק</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex">
      {/* Desktop sidebar — in document flow */}
      <aside className={`hidden lg:block ${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-200 bg-slate-900 text-white overflow-hidden flex-shrink-0`}>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — fixed overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed top-0 right-0 h-full w-64 bg-slate-900 text-white z-30 lg:hidden overflow-hidden">
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {(state.currentUser?.role === 'admin' || state.currentUser?.role === 'office') && (
              <button
                onClick={() => onTabChange('intake')}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
                title="קליטת תיקון חדש"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">תיקון חדש</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onTabChange('search')}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800"
              title="חיפוש גלובלי"
            >
              <Search size={20} />
            </button>
            <NotificationBell onNavigate={onTabChange} />
            <div className="text-sm text-slate-600 hidden sm:block">
              {state.settings.business_phone}
            </div>
          </div>
        </header>

        <div ref={mainRef} className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </div>
        <FloatingScrollbar targetRef={mainRef} />
      </main>
    </div>
  );
}
