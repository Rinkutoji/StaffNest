import { useAuth } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  return user?.role === 'employee' ? <EmployeeDashboard /> : <AdminDashboard />;
}
