import { useState } from 'react';
import Layout from '../components/Layout';
import { LAB_TABS } from '../constants/tabs';

import LabDashboard from './lab/LabDashboard';
import LabSearch from './lab/LabSearch';
import LabHistory from './lab/LabHistory';
import ProfilePage from './ProfilePage';

const PAGE_COMPONENTS = {
  dashboard: LabDashboard,
  search: LabSearch,
  history: LabHistory,
  profile: ProfilePage,
};

export default function LabRouter() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const PageComponent = PAGE_COMPONENTS[currentTab] || LabDashboard;

  return (
    <Layout currentTab={currentTab} onTabChange={setCurrentTab} tabs={LAB_TABS}>
      <PageComponent />
    </Layout>
  );
}
