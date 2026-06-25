import { useState } from 'react';
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
import OfficeInventory from './office/OfficeInventory';
import OfficeOrders from './office/OfficeOrders';
import OfficeWorkCatalog from './office/OfficeWorkCatalog';
import OfficeGeneralExpenses from './office/OfficeGeneralExpenses';
import OfficeReports from './office/OfficeReports';
import OfficeSettings from './office/OfficeSettings';
import { OfficeUsers } from './office/OfficeUsers';

const PAGE_COMPONENTS = {
  dashboard: OfficeDashboard,
  intake: OfficeIntake,
  approval: OfficeApproval,
  appeals: OfficeAppeals,
  payment: OfficePayment,
  repairs: OfficeRepairsList,
  customers: OfficeCustomers,
  devices: OfficeDevices,
  inventory: OfficeInventory,
  orders: OfficeOrders,
  'work-catalog': OfficeWorkCatalog,
  'general-expenses': OfficeGeneralExpenses,
  reports: OfficeReports,
  settings: OfficeSettings,
  users: OfficeUsers,
};

export default function OfficeRouter() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const PageComponent = PAGE_COMPONENTS[currentTab] || OfficeDashboard;

  return (
    <Layout currentTab={currentTab} onTabChange={setCurrentTab} tabs={OFFICE_TABS}>
      <PageComponent />
    </Layout>
  );
}
