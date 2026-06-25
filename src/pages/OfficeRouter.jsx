import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import Layout from '../components/Layout';
import { OFFICE_TABS } from '../constants/tabs';

import OfficeDashboard from './office/OfficeDashboard';
import OfficeIntake from './office/OfficeIntake';
import OfficeApproval from './office/OfficeApproval';
import OfficeAppeals from './office/OfficeAppeals';
import OfficePayment from './office/OfficePayment';
import OfficeRepairsList from './office/OfficeRepairsList';
import OfficeCustomers from './office/OfficeCustomers';
import OfficeDevices from './office/OfficeDevices';
import OfficeWorkCatalog from './office/OfficeWorkCatalog';
import OfficeGeneralExpenses from './office/OfficeGeneralExpenses';
import OfficeReports from './office/OfficeReports';
import OfficeSettings from './office/OfficeSettings';
import { OfficeUsers } from './office/OfficeUsers';
import PartsPage from './office/PartsPage';
import OfficeSearch from './office/OfficeSearch';
import OfficeLogs from './office/OfficeLogs';

const PAGE_COMPONENTS = {
  dashboard: OfficeDashboard,
  intake: OfficeIntake,
  approval: OfficeApproval,
  appeals: OfficeAppeals,
  payment: OfficePayment,
  repairs: OfficeRepairsList,
  customers: OfficeCustomers,
  devices: OfficeDevices,
  parts: PartsPage,
  'work-catalog': OfficeWorkCatalog,
  'general-expenses': OfficeGeneralExpenses,
  reports: OfficeReports,
  settings: OfficeSettings,
  users: OfficeUsers,
  logs: OfficeLogs,
  search: OfficeSearch,
};

export default function OfficeRouter() {
  const { state } = useAppContext();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const PageComponent = PAGE_COMPONENTS[currentTab] || OfficeDashboard;

  const isAdmin = state.currentUser?.role === 'admin';
  const visibleTabs = OFFICE_TABS.filter(t => !t.hidden && (!t.adminOnly || isAdmin));

  return (
    <Layout currentTab={currentTab} onTabChange={setCurrentTab} tabs={visibleTabs}>
      <PageComponent onNavigate={setCurrentTab} />
    </Layout>
  );
}
