import { useAppContext } from './store/AppContext';
import { USER_ROLES } from './constants/userRoles';
import LoginPage from './pages/LoginPage';
import OfficeRouter from './pages/OfficeRouter';
import LabRouter from './pages/LabRouter';

export default function App() {
  const { state } = useAppContext();

  if (!state.currentUser) {
    return <LoginPage />;
  }

  switch (state.currentUser.role) {
    case USER_ROLES.OFFICE:
      return <OfficeRouter />;
    case USER_ROLES.LAB:
      return <LabRouter />;
    default:
      return <LoginPage />;
  }
}
