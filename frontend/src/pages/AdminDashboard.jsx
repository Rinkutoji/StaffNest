import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users, UserCheck, Building2, UserPlus, Wallet, ClipboardX,
  Plus, FileDown, Cake, CalendarClock, Bell,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/common/StatCard';
import { SkeletonCard, SkeletonLine, SkeletonCircle } from '../components/common/Skeleton';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import EmployeeFormModal from '../components/employees/EmployeeFormModal';
import DepartmentFormModal from '../components/departments/DepartmentFormModal';
import { formatCurrency, formatDate, timeAgo, getErrorMessage, currentMonthLocalISO } from '../utils/formatters';
import { departmentColor } from '../utils/departmentColors';

const ATTENDANCE_COLORS = { present: 'var(--success)', late: 'var(--warning)', half_day: 'var(--accent)', absent: 'var(--danger)' };
const STATUS_DOT = { success: 'var(--success)', warning: 'var(--warning)', info: 'var(--accent)', danger: 'var(--danger)' };

function downloadCsv(filename, header, rows) {
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'hr';

  const [stats, setStats] = useState(null);
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/api/dashboard/stats.php'),
      api.get('/api/employees/get.php', { params: { limit: 10, sort: 'latest' } }),
      api.get('/api/departments/get.php'),
    ])
      .then(([statsRes, empRes, deptRes]) => {
        setStats(statsRes.data.data);
        setRecentEmployees(empRes.data.data.employees.slice(0, 6));
        setDepartments(deptRes.data.data.departments);
      })
      .catch((err) => setError(getErrorMessage(err, 'Could not load dashboard data.')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleExportPayroll() {
    try {
      const month = currentMonthLocalISO();
      const res = await api.get('/api/payroll/get.php', { params: { month, limit: 50 } });
      let rows = res.data.data.payroll;
      if (rows.length === 0) {
        const empRes = await api.get('/api/employees/get.php', { params: { status: 'active', limit: 50 } });
        rows = empRes.data.data.employees.map((e) => ({
          full_name: e.full_name, department_name: e.department_name, base_salary: e.salary, bonus: 0, deductions: 0, net_salary: e.salary, status: 'projected',
        }));
        toast('No payroll generated yet for this month — exporting projected salaries instead.', { icon: 'ℹ️' });
      }
      downloadCsv(
        `payroll-${month}.csv`,
        ['Employee', 'Department', 'Base Salary', 'Bonus', 'Deductions', 'Net Salary', 'Status'],
        rows.map((r) => [r.full_name, r.department_name || 'Unassigned', r.base_salary, r.bonus, r.deductions, r.net_salary, r.status])
      );
    } catch {
      toast.error('Could not export payroll.');
    }
  }

  async function handleExportDirectory() {
    try {
      const res = await api.get('/api/employees/get.php', { params: { limit: 50, sort: 'name_asc' } });
      const rows = res.data.data.employees;
      downloadCsv(
        'employee-directory.csv',
        ['Full Name', 'Email', 'Phone', 'Department', 'Position', 'Salary', 'Status'],
        rows.map((r) => [r.full_name, r.email, r.phone || '', r.department_name || 'Unassigned', r.position || '', r.salary, r.status])
      );
    } catch {
      toast.error('Could not export employee directory.');
    }
  }

  const attendanceChartData = stats
    ? Object.entries(stats.charts.attendance_overview.counts).map(([status, total]) => ({
        name: status.replace('_', ' '), value: total, color: ATTENDANCE_COLORS[status],
      }))
    : [];

  return (
    <div className="animate-fade-rise space-y-6">
      {error && (
        <p className="rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      {/* ================= Stat Cards ================= */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {loading || !stats ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard icon={Users} label="Total Employees" value={stats.cards.total_employees} />
            <StatCard icon={UserCheck} label="Active" value={stats.cards.active_employees} accent="var(--success)" accentSoft="var(--success-soft)" />
            <StatCard icon={Building2} label="Departments" value={stats.cards.total_departments} accent="var(--dept-5)" accentSoft="rgba(42,169,199,0.14)" />
            <StatCard icon={UserPlus} label="New This Month" value={stats.cards.new_employees} accent="var(--dept-4)" accentSoft="rgba(194,71,141,0.14)" />
            <StatCard icon={Wallet} label="Monthly Payroll" value={formatCurrency(stats.cards.total_salary)} accent="var(--warning)" accentSoft="var(--warning-soft)" />
            <StatCard icon={ClipboardX} label="On Leave Today" value={stats.cards.on_leave_today} accent="var(--danger)" accentSoft="var(--danger-soft)" />
          </>
        )}
      </div>

      {/* ================= Quick Actions ================= */}
      {canManage && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickAction icon={Plus} label="Add Employee" onClick={() => setEmployeeModalOpen(true)} />
          <QuickAction icon={Building2} label="Add Department" onClick={() => setDepartmentModalOpen(true)} />
          <QuickAction icon={FileDown} label="Export Payroll" onClick={handleExportPayroll} />
          <QuickAction icon={Users} label="Export Directory" onClick={handleExportDirectory} />
        </div>
      )}

      {/* ================= Charts ================= */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Employees by Department" loading={loading}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats?.charts.employees_by_department} margin={{ left: -20 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="department" tick={{ fontSize: 11, fill: 'var(--ink-soft)' }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} interval={0} angle={-15} textAnchor="end" height={45} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--ink-soft)' }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'var(--canvas)' }} contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface)' }} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {stats?.charts.employees_by_department.map((entry, index) => <Cell key={index} fill={departmentColor(index)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Employee Growth (6 months)" loading={loading}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={stats?.charts.employee_growth} margin={{ left: -20 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--ink-soft)' }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--ink-soft)' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface)' }} />
              <Line type="monotone" dataKey="total" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--accent)' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={`Attendance Overview ${stats?.charts.attendance_overview.date ? `(${formatDate(stats.charts.attendance_overview.date)})` : ''}`}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={attendanceChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                {attendanceChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface)' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Leave Requests (6 months)" loading={loading}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats?.charts.leave_requests_by_month} margin={{ left: -20 }}>
              <defs>
                <linearGradient id="leaveFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--dept-4)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--dept-4)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--ink-soft)' }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--ink-soft)' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface)' }} />
              <Area type="monotone" dataKey="total" stroke="var(--dept-4)" strokeWidth={2.5} fill="url(#leaveFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ================= Notifications + Activity ================= */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Notifications" icon={Bell} loading={loading}>
          {stats?.notifications.length === 0 ? (
            <EmptyRow text="No notifications yet." />
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {stats?.notifications.map((n, i) => (
                <div key={i} className="flex items-start gap-2.5 py-3 first:pt-0 last:pb-0" style={{ borderColor: 'var(--border)' }}>
                  <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full" style={{ background: STATUS_DOT[n.status] || 'var(--accent)' }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm" style={{ color: 'var(--ink)' }}>{n.message}</p>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-faint)' }}>{timeAgo(n.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Recent Activity" icon={ClipboardX} loading={loading}>
          {stats?.recent_activity.length === 0 ? (
            <EmptyRow text="No activity yet." />
          ) : (
            <div className="relative space-y-4 pl-4">
              <div className="absolute bottom-1 left-1 top-1 w-px" style={{ background: 'var(--border)' }} />
              {stats?.recent_activity.map((item, i) => (
                <div key={i} className="relative">
                  <span className="absolute -left-[18px] top-1 h-2.5 w-2.5 rounded-full ring-4" style={{ background: 'var(--accent)', ringColor: 'var(--surface)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{item.full_name}</p>
                  <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>
                    {item.position || 'No position'} · {item.was_updated ? 'Profile updated' : 'Joined the team'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>{timeAgo(item.was_updated ? item.updated_at : item.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* ================= Recent Employees ================= */}
      <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold" style={{ color: 'var(--ink)' }}>Recent Employees</h3>
          <Link to="/employees" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: 'var(--border)', color: 'var(--ink-faint)' }}>
                <th className="px-3 py-2 font-medium">Employee</th>
                <th className="px-3 py-2 font-medium">Department</th>
                <th className="px-3 py-2 font-medium">Position</th>
                <th className="px-3 py-2 font-medium">Join Date</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}><td className="px-3 py-3" colSpan={5}><SkeletonLine /></td></tr>
                  ))
                : recentEmployees.map((e) => (
                    <tr key={e.id} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={e.full_name} imageFilename={e.profile_image} color={departmentColor(e.department_id)} size={30} />
                          <span className="truncate text-sm font-medium" style={{ color: 'var(--ink)' }}>{e.full_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-sm" style={{ color: 'var(--ink-soft)' }}>{e.department_name || 'Unassigned'}</td>
                      <td className="px-3 py-2.5 text-sm" style={{ color: 'var(--ink-soft)' }}>{e.position || '—'}</td>
                      <td className="px-3 py-2.5 text-sm" style={{ color: 'var(--ink-soft)' }}>{formatDate(e.created_at)}</td>
                      <td className="px-3 py-2.5"><Badge status={e.status} /></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= Upcoming Events ================= */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Upcoming Birthdays" icon={Cake} loading={loading}>
          {stats?.upcoming_birthdays.length === 0 ? (
            <EmptyRow text="No birthdays in the next 30 days." />
          ) : (
            <div className="space-y-3">
              {stats?.upcoming_birthdays.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Avatar name={b.full_name} imageFilename={b.profile_image} color={departmentColor(i)} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: 'var(--ink)' }}>{b.full_name}</p>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--ink-soft)' }}>{formatDate(b.next_birthday)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Upcoming Leave" icon={CalendarClock} loading={loading}>
          {stats?.upcoming_leaves.length === 0 ? (
            <EmptyRow text="No upcoming approved leave." />
          ) : (
            <div className="space-y-3">
              {stats?.upcoming_leaves.map((l, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Avatar name={l.full_name} imageFilename={l.profile_image} color={departmentColor(i)} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: 'var(--ink)' }}>{l.full_name}</p>
                    <p className="truncate text-xs capitalize" style={{ color: 'var(--ink-soft)' }}>{l.leave_type} leave</p>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--ink-soft)' }}>{formatDate(l.start_date)} – {formatDate(l.end_date)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <EmployeeFormModal
        open={employeeModalOpen}
        employee={null}
        departments={departments}
        onClose={() => setEmployeeModalOpen(false)}
        onSaved={fetchAll}
      />
      <DepartmentFormModal
        open={departmentModalOpen}
        department={null}
        onClose={() => setDepartmentModalOpen(false)}
        onSaved={fetchAll}
      />
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
        <Icon size={18} />
      </div>
      <span className="text-xs font-medium" style={{ color: 'var(--ink)' }}>{label}</span>
    </button>
  );
}

function ChartCard({ title, loading, children }) {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <h3 className="font-display mb-3 text-sm font-semibold" style={{ color: 'var(--ink)' }}>{title}</h3>
      {loading ? <SkeletonLine height={240} /> : children}
    </div>
  );
}

function Panel({ title, icon: Icon, loading, children }) {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <h3 className="font-display mb-4 flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--ink)' }}>
        <Icon size={15} style={{ color: 'var(--ink-faint)' }} /> {title}
      </h3>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonCircle size={30} />
              <SkeletonLine width="70%" />
            </div>
          ))}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function EmptyRow({ text }) {
  return <p className="py-6 text-center text-sm" style={{ color: 'var(--ink-soft)' }}>{text}</p>;
}
