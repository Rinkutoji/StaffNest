import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleRoute from './components/common/RoleRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
import EmployeeLogin from './pages/EmployeeLogin';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import Attendance from './pages/Attendance';
import LeaveManagement from './pages/LeaveManagement';
import Payroll from './pages/Payroll';
import Recruitment from './pages/Recruitment';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                borderRadius: '10px',
                background: 'var(--surface)',
                color: 'var(--ink)',
                border: '1px solid var(--border)',
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/employee-login" element={<EmployeeLogin />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/departments" element={<Departments />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/leaves" element={<LeaveManagement />} />
                <Route path="/payroll" element={<Payroll />} />

                <Route element={<RoleRoute allowedRoles={['admin', 'hr']} />}>
                  <Route path="/recruitment" element={<Recruitment />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
