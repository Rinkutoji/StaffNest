import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  LogIn, LogOut, UserCheck, Timer, UserX, Clock, ClipboardList,
  Clock3, CheckCircle2, XCircle, Plus,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/common/StatCard';
import { SkeletonCard, SkeletonLine } from '../components/common/Skeleton';
import Avatar from '../components/common/Avatar';
import LeaveRequestModal from '../components/leaves/LeaveRequestModal';
import { formatCurrency, formatDate, getErrorMessage } from '../utils/formatters';

const LEAVE_STATUS_STYLE = {
  pending: { bg: 'var(--warning-soft)', text: 'var(--warning)', label: 'Pending' },
  approved: { bg: 'var(--success-soft)', text: 'var(--success)', label: 'Approved' },
  rejected: { bg: 'var(--danger-soft)', text: 'var(--danger)', label: 'Rejected' },
};

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clocking, setClocking] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    api.get('/api/dashboard/employee_stats.php')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(getErrorMessage(err, 'Could not load your dashboard.')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleClock(action) {
    setClocking(true);
    try {
      const res = await api.post('/api/attendance/clock.php', { action });
      toast.success(res.data.message);
      fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setClocking(false);
    }
  }

  if (!loading && data && data.linked === false) {
    return (
      <div className="animate-fade-rise rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <p className="font-display text-lg font-semibold" style={{ color: 'var(--ink)' }}>No employee record linked yet</p>
        <p className="mt-2 text-sm" style={{ color: 'var(--ink-soft)' }}>
          Your account isn't linked to an HR employee record yet, so attendance, leave and payroll can't be shown.
          Please ask an Admin or HR to link your account.
        </p>
      </div>
    );
  }

  const attendance = data?.today_attendance;
  const canClockIn = !attendance || !attendance.check_in;
  const canClockOut = attendance && attendance.check_in && !attendance.check_out;
  const payslip = data?.latest_payslip;

  return (
    <div className="animate-fade-rise space-y-6">
      {error && (
        <p className="rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>{error}</p>
      )}

      {/* Personal summary + Clock In/Out */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border p-5 lg:col-span-2" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          {loading ? (
            <SkeletonLine height={64} />
          ) : (
            <>
              <Avatar name={data?.employee?.full_name || user?.name} imageFilename={data?.employee?.profile_image} size={56} />
              <div className="min-w-0 flex-1">
                <p className="font-display truncate text-lg font-semibold" style={{ color: 'var(--ink)' }}>{data?.employee?.full_name}</p>
                <p className="truncate text-sm" style={{ color: 'var(--ink-soft)' }}>
                  {data?.employee?.position || 'No position set'} · {data?.employee?.department_name || 'Unassigned'}
                </p>
                <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>Joined {formatDate(data?.employee?.created_at)}</p>
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--ink-faint)' }}>Today</p>
          {loading ? (
            <SkeletonLine height={40} />
          ) : (
            <div className="mt-1.5">
              <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
                {attendance?.check_in ? `Checked in at ${attendance.check_in}` : 'Not checked in yet'}
                {attendance?.check_out ? ` · Out at ${attendance.check_out}` : ''}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleClock('in')}
                  disabled={!canClockIn || clocking}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                  style={{ background: 'var(--success)' }}
                >
                  <LogIn size={14} /> Clock In
                </button>
                <button
                  onClick={() => handleClock('out')}
                  disabled={!canClockOut || clocking}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                  style={{ background: 'var(--danger)' }}
                >
                  <LogOut size={14} /> Clock Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* This month's attendance */}
      <div>
        <h3 className="font-display mb-3 text-sm font-semibold" style={{ color: 'var(--ink)' }}>My Attendance This Month</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {loading || !data ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard icon={UserCheck} label="Present" value={data.month_attendance.present} accent="var(--success)" accentSoft="var(--success-soft)" />
              <StatCard icon={Timer} label="Late" value={data.month_attendance.late} accent="var(--warning)" accentSoft="var(--warning-soft)" />
              <StatCard icon={Clock} label="Half Day" value={data.month_attendance.half_day} />
              <StatCard icon={UserX} label="Absent" value={data.month_attendance.absent} accent="var(--danger)" accentSoft="var(--danger-soft)" />
            </>
          )}
        </div>
      </div>

      {/* Leave summary */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold" style={{ color: 'var(--ink)' }}>My Leave</h3>
          <button
            onClick={() => setRequestOpen(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
            style={{ background: 'var(--accent)' }}
          >
            <Plus size={14} /> New Request
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {loading || !data ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard icon={Clock3} label="Pending" value={data.leave_summary.pending} accent="var(--warning)" accentSoft="var(--warning-soft)" />
              <StatCard icon={CheckCircle2} label="Approved" value={data.leave_summary.approved} accent="var(--success)" accentSoft="var(--success-soft)" />
              <StatCard icon={XCircle} label="Rejected" value={data.leave_summary.rejected} accent="var(--danger)" accentSoft="var(--danger-soft)" />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent leave requests */}
        <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <h3 className="font-display mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            <ClipboardList size={15} style={{ color: 'var(--ink-faint)' }} /> Recent Leave Requests
          </h3>
          {loading ? (
            <SkeletonLine height={100} />
          ) : data?.recent_leaves.length === 0 ? (
            <p className="py-6 text-center text-sm" style={{ color: 'var(--ink-soft)' }}>No leave requests yet.</p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {data?.recent_leaves.map((l, i) => {
                const s = LEAVE_STATUS_STYLE[l.status];
                return (
                  <div key={i} className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium capitalize" style={{ color: 'var(--ink)' }}>{l.leave_type} leave</p>
                      <p className="truncate text-xs" style={{ color: 'var(--ink-soft)' }}>
                        {formatDate(l.start_date)} – {formatDate(l.end_date)}
                      </p>
                    </div>
                    <span
                      className="flex-none rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ background: s.bg, color: s.text }}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Latest payslip */}
        <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <h3 className="font-display mb-3 text-sm font-semibold" style={{ color: 'var(--ink)' }}>Latest Payslip</h3>
          {loading ? (
            <SkeletonLine height={80} />
          ) : !payslip ? (
            <p className="py-6 text-center text-sm" style={{ color: 'var(--ink-soft)' }}>No payslips generated yet.</p>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
                  {new Date(payslip.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{
                    background: payslip.status === 'paid' ? 'var(--success-soft)' : 'var(--warning-soft)',
                    color: payslip.status === 'paid' ? 'var(--success)' : 'var(--warning)',
                  }}
                >
                  {payslip.status === 'paid' ? 'Paid' : 'Pending'}
                </span>
              </div>
              <p className="font-display mt-1 text-2xl font-bold" style={{ color: 'var(--ink)' }}>{formatCurrency(payslip.net_salary)}</p>
              <p className="mt-1 text-xs" style={{ color: 'var(--ink-faint)' }}>
                Base {formatCurrency(payslip.base_salary)} · Bonus +{formatCurrency(payslip.bonus)} · Deductions -{formatCurrency(payslip.deductions)}
              </p>
              <a href="/payroll" className="mt-3 inline-block text-xs font-medium" style={{ color: 'var(--accent)' }}>
                View full salary history →
              </a>
            </div>
          )}
        </div>
      </div>

      <LeaveRequestModal open={requestOpen} onClose={() => setRequestOpen(false)} onSaved={fetchAll} />
    </div>
  );
}
