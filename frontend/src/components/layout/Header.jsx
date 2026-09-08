import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu, Search, Bell, BellOff, Sun, Moon, ChevronDown, UserCircle, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axios';
import Avatar from '../common/Avatar';
import { timeAgo } from '../../utils/formatters';

const PAGE_META = {
  '/': {
    title: 'Dashboard',
    subtitle: 'Manage your employees efficiently.',
    employeeSubtitle: 'Here\u2019s your attendance, leave and payroll at a glance.',
  },
  '/employees': {
    title: 'Employees',
    subtitle: 'View and manage your workforce.',
    employeeSubtitle: 'Browse your colleagues across the organization.',
  },
  '/departments': {
    title: 'Departments',
    subtitle: 'Organize your team into departments.',
    employeeSubtitle: 'See how the organization is structured.',
  },
  '/attendance': {
    title: 'Attendance',
    subtitle: 'Track daily employee attendance.',
    employeeSubtitle: 'Clock in/out and review your attendance history.',
  },
  '/leaves': {
    title: 'Leave Management',
    subtitle: 'Review and approve leave requests.',
    employeeSubtitle: 'Submit and track the status of your leave requests.',
  },
  '/payroll': {
    title: 'Payroll',
    subtitle: 'Generate and manage monthly payroll.',
    employeeSubtitle: 'View and download your payslips.',
  },
  '/recruitment': { title: 'Recruitment', subtitle: 'Track job postings and candidates.' },
  '/reports': { title: 'Reports', subtitle: 'Company-wide analytics and trends.' },
  '/profile': { title: 'Profile', subtitle: 'Manage your account details.' },
  '/settings': { title: 'Settings', subtitle: 'Your role and permissions.' },
};

const STATUS_DOT = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  info: 'var(--accent)',
  danger: 'var(--danger)',
};

export default function Header({ onOpenMobile }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    localStorage.getItem('ems_notifications_enabled') !== '0'
  );

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const meta = PAGE_META[location.pathname] || { title: 'StaffNest', subtitle: '' };
  const isEmployeeRole = user?.role === 'employee';
  const subtitle = isEmployeeRole && meta.employeeSubtitle ? meta.employeeSubtitle : meta.subtitle;
  const firstName = user?.name?.split(' ')[0];
  const isDashboard = location.pathname === '/';

  useEffect(() => {
    api
      .get('/api/dashboard/stats.php')
      .then((res) => {
        setNotifications(res.data.data.notifications || []);
        setPendingLeaves(res.data.data.pending_leaves || 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function syncPreference() {
      setNotificationsEnabled(localStorage.getItem('ems_notifications_enabled') !== '0');
    }
    window.addEventListener('ems-notifications-preference-changed', syncPreference);
    return () => window.removeEventListener('ems-notifications-preference-changed', syncPreference);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/employees?search=${encodeURIComponent(search.trim())}`);
    }
  }

  async function handleLogout() {
    const role = user?.role;
    await logout();
    navigate(role === 'employee' ? '/employee-login' : '/login', { replace: true });
  }

  return (
    <header
      className="sticky top-0 z-30 border-b px-4 py-3 sm:px-6 lg:px-8"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="flex-none rounded-lg p-2 transition hover:bg-black/5 lg:hidden"
          style={{ color: 'var(--ink)' }}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="font-display truncate text-lg font-bold sm:text-xl" style={{ color: 'var(--ink)' }}>
            {isDashboard && firstName ? `Welcome back, ${firstName} 👋` : meta.title}
          </h1>
          <p className="hidden truncate text-xs sm:block" style={{ color: 'var(--ink-soft)' }}>
            {subtitle}
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-faint)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees…"
            className="w-48 rounded-lg border py-1.5 pl-8 pr-3 text-sm outline-none transition focus:ring-2 lg:w-64"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)', background: 'var(--canvas)' }}
          />
        </form>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="flex-none rounded-lg p-2 transition hover:bg-black/5"
          style={{ color: 'var(--ink-soft)' }}
          aria-label="Toggle dark mode"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        {/* Notifications */}
        <div className="relative flex-none" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-lg p-2 transition hover:bg-black/5"
            style={{ color: 'var(--ink-soft)' }}
            aria-label="Notifications"
          >
            {notificationsEnabled ? <Bell size={19} /> : <BellOff size={19} />}
            {notificationsEnabled && pendingLeaves > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                style={{ background: 'var(--danger)' }}
              >
                {pendingLeaves}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              className="animate-fade-rise absolute right-0 mt-2 w-80 rounded-2xl border shadow-xl"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
                <p className="font-display text-sm font-semibold" style={{ color: 'var(--ink)' }}>Notifications</p>
              </div>
              {!notificationsEnabled ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>Notifications are turned off.</p>
                  <Link to="/settings" onClick={() => setNotifOpen(false)} className="mt-1 inline-block text-xs font-medium" style={{ color: 'var(--accent)' }}>
                    Enable in Settings →
                  </Link>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm" style={{ color: 'var(--ink-soft)' }}>No notifications yet.</p>
                  ) : (
                    notifications.map((n, i) => (
                      <div key={i} className="flex items-start gap-2.5 border-b px-4 py-3 last:border-0" style={{ borderColor: 'var(--border)' }}>
                        <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full" style={{ background: STATUS_DOT[n.status] || 'var(--accent)' }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm" style={{ color: 'var(--ink)' }}>{n.message}</p>
                          <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-faint)' }}>{timeAgo(n.timestamp)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative flex-none" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-black/5"
          >
            <Avatar name={user?.name} imageFilename={user?.profile_image} folder="avatars" size={32} />
            <ChevronDown size={14} className="hidden sm:block" style={{ color: 'var(--ink-faint)' }} />
          </button>

          {profileOpen && (
            <div
              className="animate-fade-rise absolute right-0 mt-2 w-56 rounded-2xl border shadow-xl"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2.5 border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
                <Avatar name={user?.name} imageFilename={user?.profile_image} folder="avatars" size={36} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" style={{ color: 'var(--ink)' }}>{user?.name}</p>
                  <p className="truncate text-xs capitalize" style={{ color: 'var(--ink-soft)' }}>{user?.role}</p>
                </div>
              </div>
              <div className="p-1.5">
                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition hover:bg-black/5"
                  style={{ color: 'var(--ink)' }}
                >
                  <UserCircle size={16} /> Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition hover:bg-black/5"
                  style={{ color: 'var(--ink)' }}
                >
                  <Settings size={16} /> Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition hover:bg-black/5"
                  style={{ color: 'var(--danger)' }}
                >
                  <LogOut size={16} /> Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}