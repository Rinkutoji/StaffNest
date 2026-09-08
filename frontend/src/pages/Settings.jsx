import { useState } from 'react';
import { ShieldCheck, Info, Moon, Sun, Bell, BellOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Badge from '../components/common/Badge';

const PERMISSIONS = [
  { action: 'View employees & departments', admin: true, hr: true, employee: true },
  { action: 'Add / edit employees', admin: true, hr: true, employee: false },
  { action: 'Add / edit departments', admin: true, hr: true, employee: false },
  { action: 'Delete records (employees, departments, attendance, leave, payroll, recruitment)', admin: true, hr: false, employee: false },
  { action: 'View attendance & leave', admin: true, hr: true, employee: true },
  { action: 'Manage payroll & recruitment (create/edit)', admin: true, hr: true, employee: false },
  { action: 'View dashboard analytics', admin: true, hr: true, employee: true },
];

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    localStorage.getItem('ems_notifications_enabled') !== '0'
  );

  function toggleNotifications() {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    localStorage.setItem('ems_notifications_enabled', next ? '1' : '0');
    // Let the Header (mounted separately) know to refresh its bell state.
    window.dispatchEvent(new Event('ems-notifications-preference-changed'));
  }

  return (
    <div className="animate-fade-rise mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--ink)' }}>Settings</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--ink-soft)' }}>Preferences, role and permissions.</p>

      {/* Preferences */}
      <div className="mt-6 rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <h3 className="font-display text-sm font-semibold" style={{ color: 'var(--ink)' }}>Preferences</h3>

        <div className="mt-4 flex items-center justify-between border-b py-3" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Dark mode</p>
              <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>Switch between light and dark theme.</p>
            </div>
          </div>
          <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
        </div>

        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Notifications</p>
              <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>Show the notification bell and badge in the header.</p>
            </div>
          </div>
          <Toggle checked={notificationsEnabled} onChange={toggleNotifications} />
        </div>
      </div>

      {/* Role & permissions */}
      <div className="mt-4 rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} style={{ color: 'var(--accent)' }} />
          <h3 className="font-display text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            Signed in as <Badge status={user?.role} />
          </h3>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: 'var(--border)', color: 'var(--ink-faint)' }}>
                <th className="py-2 pr-4 font-medium">Action</th>
                <th className="px-2 py-2 text-center font-medium">Admin</th>
                <th className="px-2 py-2 text-center font-medium">HR</th>
                <th className="px-2 py-2 text-center font-medium">Employee</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((row) => (
                <tr key={row.action} className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2.5 pr-4" style={{ color: 'var(--ink)' }}>{row.action}</td>
                  <td className="px-2 py-2.5 text-center">{row.admin ? <Check /> : <Dash />}</td>
                  <td className="px-2 py-2.5 text-center">{row.hr ? <Check /> : <Dash />}</td>
                  <td className="px-2 py-2.5 text-center">{row.employee ? <Check /> : <Dash />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
{/* 
      <div className="mt-4 flex items-start gap-3 rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <Info size={18} className="mt-0.5 flex-none" style={{ color: 'var(--ink-faint)' }} />
        <div className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          <p><strong style={{ color: 'var(--ink)' }}>StaffNest</strong> — Employee Management System</p>
          <p className="mt-1">Built with React, Tailwind CSS and a native PHP + MySQL REST API.</p>
        </div>
      </div> */}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      className="relative h-6 w-11 flex-none rounded-full transition"
      style={{ background: checked ? 'var(--accent)' : 'var(--border-strong)' }}
    >
      <span
        className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  );
}

function Check() {
  return <span style={{ color: 'var(--success)' }}>●</span>;
}
function Dash() {
  return <span style={{ color: 'var(--ink-faint)' }}>—</span>;
}