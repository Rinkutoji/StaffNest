import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, UserCircle, Settings, LogOut, X,
  CalendarCheck, ClipboardList, Wallet, Briefcase, BarChart3,
  ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, roles: null },
  { to: '/employees', label: 'Employees', icon: Users, roles: null },
  { to: '/departments', label: 'Departments', icon: Building2, roles: null },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck, roles: null },
  { to: '/leaves', label: 'Leave Management', icon: ClipboardList, roles: null },
  { to: '/payroll', label: 'Payroll', icon: Wallet, roles: null },
  { to: '/recruitment', label: 'Recruitment', icon: Briefcase, roles: ['admin', 'hr'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'hr'] },
  { to: '/profile', label: 'Profile', icon: UserCircle, roles: null },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'hr'] },
];

export default function Sidebar({ mobileOpen, onCloseMobile, collapsed, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    const role = user?.role;
    await logout();
    navigate(role === 'employee' ? '/employee-login' : '/login', { replace: true });
  }

  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.role));

  return (
    <>
      {/* Mobile scrim */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-all duration-300 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}
        style={{ background: 'var(--sidebar-bg)' }}
      >
        {/* Brand — styled like an ID badge clip */}
        <div className={`flex items-center pb-2 pt-6 ${collapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
          <div className="flex items-center gap-2.5">
            <div className="relative flex-none">
              <div className="h-8 w-6 rounded-t-full border-2" style={{ borderColor: 'var(--accent)' }} />
              <div
                className="absolute inset-x-0 top-2.5 mx-auto h-4 w-4 rounded-sm"
                style={{ background: 'var(--accent)' }}
              />
            </div>
            {!collapsed && <span className="font-display text-lg font-bold text-white">StaffNest</span>}
          </div>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1 text-white/60 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        {!collapsed && (
          <p className="px-5 pb-5 text-xs" style={{ color: 'var(--sidebar-text)' }}>
            Employee Management
          </p>
        )}

        <nav className={`flex-1 space-y-1 overflow-y-auto ${collapsed ? 'px-2 pt-2' : 'px-3'}`}>
          {visibleItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onCloseMobile}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition ${
                  collapsed ? 'justify-center px-0' : 'px-3'
                } ${isActive ? 'text-white' : 'hover:bg-white/5'}`
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--sidebar-bg-active)' : 'transparent',
                color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                borderLeft: collapsed ? 'none' : isActive ? '3px solid var(--accent)' : '3px solid transparent',
              })}
            >
              <Icon size={18} className="flex-none" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={onToggleCollapse}
          className="mx-3 mb-2 hidden items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium transition hover:bg-white/5 lg:flex"
          style={{ color: 'var(--sidebar-text)' }}
        >
          {collapsed ? <ChevronsRight size={16} /> : <><ChevronsLeft size={16} /> Collapse</>}
        </button>

        {/* User footer */}
        <div className="border-t border-white/10 p-4">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div title={collapsed ? user?.name : undefined}>
              <Avatar name={user?.name} imageFilename={user?.profile_image} folder="avatars" size={36} />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{user?.name}</p>
                <p className="truncate text-xs capitalize" style={{ color: 'var(--sidebar-text)' }}>
                  {user?.role}
                </p>
              </div>
            )}
            <button
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="flex-none rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
