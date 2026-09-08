import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Restricts a route to specific roles. Renders nothing extra if allowed;
 * redirects to the dashboard if the signed-in user's role isn't listed.
 * Use inside <ProtectedRoute> so `user` is guaranteed to be loaded.
 */
export default function RoleRoute({ allowedRoles }) {
  const { user } = useAuth();

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
