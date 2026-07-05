import { useState, useRef, useEffect } from 'react';
import FloatingScrollbar from './FloatingScrollbar';
import { useAppContext } from '../store/AppContext';
import { ROLE_LABELS } from '../constants/userRoles';
import { LogOut, Menu, X, Search, Plus } from 'lucide-react';
import NotificationBell from './NotificationBell';
import SyncIndicator from './SyncIndicator';
import { Button } from './Button';
import { CommandPalette } from './CommandPalette';

// טאבים שמופיעים בניווט התחתון במובייל
const BOTTOM_NAV_IDS = {
  office: ['kanban', 'intake', 'repairs', 'customers', 'search'],
  admin:  ['kanban', 'intake', 'repairs', 'customers', 'search'],
  lab:    ['kanban', 'dashboard', 'search', 'history'],
};

export default function Layout({ children, currentTab, onTabChange, tabs }) {
  const { state, dispatch } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const mainRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleTabChange = (id) => {
    onTabChange(id);
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const role = state.currentUser?.role || 'office';
  const bottomNavIds = BOTTOM_NAV_IDS[role] || BOTTOM_NAV_IDS.office;
  const bottomNavTabs = bottomNavIds.map(id => tabs.find(t => t.id === id)).filter(Boolean);

  const currentTabInfo = tabs.find(t => t.id === currentTab);

  const handleLogout = () => setLogoutConfirm(true);

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
              onClick={() => handleTabChange(tab.id)}
              title={collapsed ? tab.label : undefined}
              aria-label={collapsed ? tab.label : undefined}
              aria-current={active ? 'page' : undefined}
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
          aria-label="התנתק"
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
              aria-label={sidebarOpen ? 'סגור תפריט' : 'פתח תפריט'}
              aria-expanded={sidebarOpen}
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
                onClick={() => handleTabChange('intake')}
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
                onClick={() => handleTabChange('intake')}
                icon={<Plus size={18} />}
                size="sm"
                className="sm:hidden !px-2"
                title="קליטת תיקון חדש"
              />
            )}
            <button
              onClick={() => setCmdOpen(true)}
              aria-label="חיפוש מהיר (Ctrl+K)"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
              title="חיפוש מהיר (Ctrl+K)"
            >
              <Search size={20} />
            </button>
            <NotificationBell onNavigate={onTabChange} />
            <SyncIndicator />
            <div className="text-sm text-slate-600 hidden md:block">
              {state.settings.business_phone}
            </div>
          </div>
        </header>

        {/* תוכן ראשי */}
        <div ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
          {/* מסיר את קלאס האנימציה בסיומה — אחרת ה-transform השיורי (גם translateY(0)) יוצר
              containing block חדש, וכל חלון "fixed" בתוך הדף (כרטיסי לקוח/מכשיר/חלק, גלריות וכו')
              נעצם ביחס לקונטיינר הזה במקום למסך כולו — נחתך, נעלם ה-X, ולחיצה בחוץ לא סוגרת. */}
          <div
            key={currentTab}
            className="animate-fade-in"
            onAnimationEnd={(e) => e.currentTarget.classList.remove('animate-fade-in')}
          >
            {children}
          </div>
        </div>
        <FloatingScrollbar targetRef={mainRef} />
      </main>

      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} onNavigate={handleTabChange} />

      {logoutConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setLogoutConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full text-right animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-slate-900 text-base mb-1">התנתקות מהמערכת</h3>
            <p className="text-sm text-slate-500 mb-5">האם אתה בטוח שברצונך להתנתק?</p>
            <div className="flex gap-2 justify-start flex-row-reverse">
              <button
                onClick={() => { dispatch({ type: 'LOGOUT' }); setLogoutConfirm(false); }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >התנתק</button>
              <button
                onClick={() => setLogoutConfirm(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
              >ביטול</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
