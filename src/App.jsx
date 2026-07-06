import { useAppContext } from './store/AppContext';
import { USER_ROLES } from './constants/userRoles';
import LoginPage from './pages/LoginPage';
import MainRouter from './pages/MainRouter';
import { InstallPrompt } from './components/InstallPrompt';
import { RepairStatusPage } from './pages/RepairStatusPage';

export default function App() {
  const { state } = useAppContext();

  const hash = window.location.hash;
  if (hash.startsWith('#/repair/')) {
    const repairId = hash.replace('#/repair/', '').split('?')[0];
    return <RepairStatusPage repairId={repairId} />;
  }

  if (!state.currentUser) {
    return <LoginPage />;
  }

  switch (state.currentUser.role) {
    case USER_ROLES.ADMIN:
    case USER_ROLES.OFFICE:
    case USER_ROLES.LAB:
      return <><MainRouter /><InstallPrompt /></>;
    default:
      return <LoginPage />;
  }
}
