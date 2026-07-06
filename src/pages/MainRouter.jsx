import { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import Layout from '../components/Layout';
import { TAB_CATALOG, PAGE_COMPONENTS } from '../constants/pageRegistry';
import { DEFAULT_ROLE_CONFIG } from '../store/AppContext';

export default function MainRouter() {
  const { state } = useAppContext();
  const role = state.currentUser?.role || 'office';
  const isAdmin = role === 'admin';

  // חישוב רשימת הטאבים הגלויים לפי תפקיד
  const getVisibleTabs = () => {
    if (isAdmin) {
      // אדמין תמיד רואה הכל — כולל logs, ללא hidden
      return TAB_CATALOG.filter(t => !t.hidden);
    }
    const effectiveRole = role === 'lab' ? 'lab' : 'office';
    const allowedIds =
      state.roleConfig?.[effectiveRole]?.visible_tabs ??
      DEFAULT_ROLE_CONFIG[effectiveRole].visible_tabs;
    // שומר סדר הקטלוג, מסנן adminOnly לתפקידים שאינם admin
    return TAB_CATALOG.filter(t =>
      !t.hidden &&
      !t.adminOnly &&
      allowedIds.includes(t.id)
    );
  };

  const visibleTabs = getVisibleTabs();
  const defaultTab = visibleTabs[0]?.id ?? 'kanban';

  const [currentTab, setCurrentTab] = useState(defaultTab);
  const [openRepairId, setOpenRepairId] = useState(null);

  // guard: אם הטאב הנוכחי הוסר מהרשאות — חזרה לטאב ראשון
  useEffect(() => {
    const renderable = new Set([...visibleTabs.map(t => t.id), 'search']);
    if (!renderable.has(currentTab)) {
      setCurrentTab(defaultTab);
    }
  }, [visibleTabs, currentTab, defaultTab]);

  const handleNavigate = (page, repairId = null) => {
    setCurrentTab(page);
    if (repairId) {
      setOpenRepairId(repairId);
      setTimeout(() => setOpenRepairId(null), 0);
    }
  };

  const pageProps = {
    role: isAdmin ? 'admin' : role,
    onNavigate: setCurrentTab,
    openRepairId,
  };

  const PageComponent = PAGE_COMPONENTS[currentTab];

  return (
    <Layout currentTab={currentTab} onTabChange={handleNavigate} tabs={visibleTabs}>
      {PageComponent ? PageComponent(pageProps) : null}
    </Layout>
  );
}
