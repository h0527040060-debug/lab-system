import { useState } from 'react';
import Layout from '../components/Layout';
import { LAB_TABS } from '../constants/tabs';

import LabDashboard from './lab/LabDashboard';
import LabSearch from './lab/LabSearch';
import LabHistory from './lab/LabHistory';
import KanbanBoard from './office/KanbanBoard';

const PAGE_COMPONENTS = {
  kanban: (props) => <KanbanBoard role="lab" openRepairId={props.openRepairId} />,
  dashboard: LabDashboard,
  search: LabSearch,
  history: LabHistory,
};

export default function LabRouter() {
  const [currentTab, setCurrentTab] = useState('kanban');
  const [openRepairId, setOpenRepairId] = useState(null);
  const PageComponent = PAGE_COMPONENTS[currentTab] || KanbanBoard;

  const handleNavigate = (page, repairId = null) => {
    setCurrentTab(page);
    if (repairId) {
      setOpenRepairId(repairId);
      setTimeout(() => setOpenRepairId(null), 0);
    }
  };

  return (
    <Layout currentTab={currentTab} onTabChange={handleNavigate} tabs={LAB_TABS}>
      <PageComponent onNavigate={setCurrentTab} openRepairId={openRepairId} />
    </Layout>
  );
}
