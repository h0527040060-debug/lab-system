import { useState, useRef } from 'react';
import FloatingScrollbar from './FloatingScrollbar';
import { useAppContext } from '../store/AppContext';
import { ROLE_LABELS } from '../constants/userRoles';
import { LogOut, Menu, X, Search, Plus } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { Button } from './Button';

// טאבים שמופיעים בניווט התחתון במובייל
const BOTTOM_NAV_IDS = {
  office: ['kanban', 'intake', 'repairs', 'customers', 'search'],
  admin:  ['kanban', 'intake', 'repairs', 'customers', 'search'],
  lab:    ['kanban', 'dashboard', 'search', 'history'],
};

export default function Layout({ children, currentTab, onTabChange, tabs }) {
  const { state, dispatch } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const mainRef = useRef(null);

  const role = state.currentUser?.role || 'office';
  const bottomNavIds = BOTTOM_NAV_IDS[role] || BOTTOM_NAV_IDS.office;
  const bottomNavTabs = bottomNavIds.map(id => tabs.find(t => t.id === id)).filter(Boolean);

  const currentTabInfo = tabs.find(t => t.id === currentTab);

  const handleLogout = () => {
    if (confirm('להתנתק מהמערכת?')) {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const roleLabel = ROLE_LABELS[state.currentUser?.role] || '';

  const sidebarContent = (collapsed) => (
    <div className="h-full flex flex-col">
      <div className={`border-b border-slate-700 ${collapsed ? 'p-3' : 'p-4'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-white text-base shrink-0">
            ה
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight truncate">{state.settings.business_name.split(' - ')[0]}</p>
              <p className="text-xs text-slate-400">{roleLabel}</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {tabs.map(tab => {
          const active = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { onTabChange(tab.id); if (window.innerWidth < 1024) setSidebarOpen(false); }}
              title={collapsed ? tab.label : undefined}
              className={`w-full flex items-center transition-colors duration-150 relative ${
                collapsed ? 'justify-center px-2 py-3' : 'gap-3 text-right px-4 py-2.5'
              } ${active
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {/* פס אינדיקטור active */}
              {active && (
                <span className="absolute right-0 top-1 bottom-1 w-0.5 bg-orange-500 rounded-full" />
              )}
              <span className={`text-lg leading-none ${active ? 'text-orange-400' : ''}`}>{tab.icon}</span>
              {!collapsed && <span className="text-sm">{tab.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className={`border-t border-slate-700 ${collapsed ? 'p-2' : 'p-4'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2 mb-3">
            {state.currentUser?.picture ? (
              <img src={state.currentUser.picture} alt={state.currentUser.name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
                {state.currentUser?.name?.charAt(0) || '?'}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate leading-tight">{state.currentUser?.name || ''}</p>
              <p className="text-xs text-slate-400 truncate">{state.currentUser?.email || roleLabel}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? 'התנתק' : undefined}
          className={`w-full flex items-center text-slate-400 hover:text-white text-sm transition-colors ${collapsed ? 'justify-center p-1' : 'gap-2'}`}
        >
          <LogOut size={16} />
          {!collapsed && <span>התנתק</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className={`hidden lg:block shrink-0 transition-all duration-200 bg-slate-900 text-white overflow-hidden ${
        sidebarOpen ? 'w-56' : 'w-14'
      }`}>
        {sidebarContent(!sidebarOpen)}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed top-0 right-0 h-full w-64 bg-slate-900 text-white z-30 lg:hidden overflow-hidden animate-slide-up">
            {sidebarContent(false)}
          </aside>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            >
              {sidebarOpen && window.innerWidth < 1024 ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* כותרת הדף הנוכחי — מובייל + טאבלט */}
            {currentTabInfo && (
              <div className="flex items-center gap-1.5 lg:hidden">
                <span className="text-base leading-none">{currentTabInfo.icon}</span>
                <span className="text-sm font-semibold text-slate-700">{currentTabInfo.label}</span>
              </div>
            )}

            {(role === 'admin' || role === 'office') && (
              <Button
                onClick={() => onTabChange('intake')}
                icon={<Plus size={16} />}
                size="sm"
                className="hidden sm:inline-flex"
                title="קליטת תיקון חדש"
              >
                תיקון חדש
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* כפתור "תיקון חדש" — מובייל בלבד (אייקון בלבד) */}
            {(role === 'admin' || role === 'office') && (
              <Button
                onClick={() => onTabChange('intake')}
                icon={<Plus size={18} />}
                size="sm"
                className="sm:hidden !px-2"
                title="קליטת תיקון חדש"
              />
            )}
            <button
              onClick={() => onTabChange('search')}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
              title="חיפוש גלובלי"
            >
              <Search size={20} />
            </button>
            <NotificationBell onNavigate={onTabChange} />
            <div className="text-sm text-slate-600 hidden md:block">
              {state.settings.business_phone}
            </div>
          </div>
        </header>

        {/* תוכן ראשי — עם ריפוד תחתון למובייל בגלל ניווט תחתון */}
        <div ref={mainRef} className="flex-1 overflow-auto p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </div>
        <FloatingScrollbar targetRef={mainRef} />
      </main>

      {/* ניווט תחתון — מובייל בלבד */}
      {bottomNavTabs.length > 0 && (
        <nav className="lg:hidden fixed bottom-0 right-0 left-0 bg-white border-t border-slate-200 z-20 flex shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
          {bottomNavTabs.map(tab => {
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors relative ${
                  active ? 'text-orange-500' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {/* פס אינדיקטור עליון */}
                {active && (
                  <span className="absolute top-0 right-2 left-2 h-0.5 bg-orange-500 rounded-full" />
                )}
                <span className={`text-xl leading-none transition-transform ${active ? 'scale-110' : ''}`}>
                  {tab.icon}
                </span>
                <span className="leading-tight">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
