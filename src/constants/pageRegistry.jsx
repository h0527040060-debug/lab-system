// מרשם עמודים מאוחד — כל הטאבים וכל העמודים לכל התפקידים
import KanbanBoard from '../pages/office/KanbanBoard';
import OfficeDashboard from '../pages/office/OfficeDashboard';
import LabDashboard from '../pages/lab/LabDashboard';
import OfficeIntake from '../pages/office/OfficeIntake';
import OfficeIntakeInternal from '../pages/office/OfficeIntakeInternal';
import OfficeApproval from '../pages/office/OfficeApproval';
import OfficeAppeals from '../pages/office/OfficeAppeals';
import OfficePayment from '../pages/office/OfficePayment';
import OfficePickup from '../pages/office/OfficePickup';
import OfficeRepairsList from '../pages/office/OfficeRepairsList';
import OfficeCustomers from '../pages/office/OfficeCustomers';
import OfficeDevices from '../pages/office/OfficeDevices';
import PartsPage from '../pages/office/PartsPage';
import OfficeWorkCatalog from '../pages/office/OfficeWorkCatalog';
import OfficeGeneralExpenses from '../pages/office/OfficeGeneralExpenses';
import OfficeReports from '../pages/office/OfficeReports';
import OfficeSettings from '../pages/office/OfficeSettings';
import { OfficeUsers } from '../pages/office/OfficeUsers';
import OfficeLogs from '../pages/office/OfficeLogs';
import OfficeSearch from '../pages/office/OfficeSearch';
import LabSearch from '../pages/lab/LabSearch';

// קטלוג כל הטאבים האפשריים — שמות + אייקונים לתצוגה
export const TAB_CATALOG = [
  { id: 'kanban',           label: 'תצוגת לוח',         icon: '🗂️' },
  { id: 'dashboard',        label: 'דשבורד',             icon: '📊' },
  { id: 'lab-dashboard',    label: 'דשבורד מעבדה',       icon: '🏠' },
  { id: 'intake',           label: 'קליטה',              icon: '🔴' },
  { id: 'intake-internal',  label: 'יד שנייה',           icon: '🛒' },
  { id: 'approval',         label: 'אישור תמחור',        icon: '💰' },
  { id: 'appeals',          label: 'ערעורי אחריות',      icon: '⚠️' },
  { id: 'payment',          label: 'גביה',               icon: '💳' },
  { id: 'pickup',           label: 'איסוף / משלוח',      icon: '📦' },
  { id: 'repairs',          label: 'כל הקריאות',         icon: '📋' },
  { id: 'customers',        label: 'לקוחות',             icon: '👥' },
  { id: 'devices',          label: 'מכשירים',            icon: '📱' },
  { id: 'parts',            label: 'חלקים',              icon: '🔧' },
  { id: 'work-catalog',     label: 'קטלוג עבודות',       icon: '🛠️' },
  { id: 'general-expenses', label: 'רכש כללי',           icon: '💵' },
  { id: 'reports',          label: 'דוחות',              icon: '📈' },
  { id: 'settings',         label: 'הגדרות',             icon: '⚙️' },
  { id: 'users',            label: 'משתמשים',            icon: '👤' },
  { id: 'logs',             label: 'לוגים',              icon: '📜', adminOnly: true },
  // search — מערכת (CommandPalette), לא מוצג בסרגל ניהול תפקידים
  { id: 'search',           label: 'חיפוש',              icon: '🔍', hidden: true },
];

// מיפוי id → קומפוננטה
// props: { role, onNavigate, openRepairId }
export const PAGE_COMPONENTS = {
  kanban:           (props) => <KanbanBoard role={props.role} onNavigate={props.onNavigate} openRepairId={props.openRepairId} />,
  dashboard:        (props) => <OfficeDashboard {...props} />,
  'lab-dashboard':  (props) => <LabDashboard {...props} />,
  intake:           (props) => <OfficeIntake {...props} />,
  'intake-internal':(props) => <OfficeIntakeInternal {...props} />,
  approval:         (props) => <OfficeApproval {...props} />,
  appeals:          (props) => <OfficeAppeals {...props} />,
  payment:          (props) => <OfficePayment {...props} />,
  pickup:           (props) => <OfficePickup {...props} />,
  repairs:          (props) => <OfficeRepairsList {...props} />,
  customers:        (props) => <OfficeCustomers {...props} />,
  devices:          (props) => <OfficeDevices {...props} />,
  parts:            (props) => <PartsPage {...props} />,
  'work-catalog':   (props) => <OfficeWorkCatalog {...props} />,
  'general-expenses':(props) => <OfficeGeneralExpenses {...props} />,
  reports:          (props) => <OfficeReports {...props} />,
  settings:         (props) => <OfficeSettings {...props} />,
  users:            (props) => <OfficeUsers {...props} />,
  logs:             (props) => <OfficeLogs {...props} />,
  // search נבחר לפי תפקיד
  search:           (props) => props.role === 'lab'
    ? <LabSearch {...props} />
    : <OfficeSearch {...props} />,
};
