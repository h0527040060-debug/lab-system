import { useState } from 'react';
import Layout from '../components/Layout';
import { LAB_TABS } from '../constants/tabs';

import LabDashboard from './lab/LabDashboard';
import LabSearch from './lab/LabSearch';
import LabHistory from './lab/LabHistory';
import KanbanBoard from './office/KanbanBoard';

const PAGE_COMPONENTS = {
  kanban: () => <KanbanBoard role="lab" />,
  dashboard: LabDashboard,
  search: LabSearch,
  history: LabHistory,
};

export default function LabRouter() {
  const [currentTab, setCurrentTab] = useState('kanban');
  const PageComponent = PAGE_COMPONENTS[currentTab] || KanbanBoard;

  return (
    <Layout currentTab={currentTab} onTabChange={setCurrentTab} tabs={LAB_TABS}>
      <PageComponent />
    </Layout>
  );
}
