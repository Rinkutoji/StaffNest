import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, UserCheck, UserX, Clock, Timer, Plus, LogIn, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/common/StatCard';
import { SkeletonCard } from '../components/common/Skeleton';
import AttendanceTable from '../components/attendance/AttendanceTable';
import MarkAttendanceModal from '../components/attendance/MarkAttendanceModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Pagination from '../components/common/Pagination';
import { getErrorMessage, todayLocalISO } from '../utils/formatters';

export default function Attendance() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'hr';
  const canDelete = user?.role === 'admin'; // only Admin can delete attendance records
  const isEmployee = user?.role === 'employee';

  const [date, setDate] = useState(todayLocalISO());
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, total_pages: 1 });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markOpen, setMarkOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [clocking, setClocking] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError('');
    const params = { date, page, limit };
    if (departmentId) params.department_id = departmentId;
    if (status) params.status = status;

    const calls = [api.get('/api/attendance/get.php', { params })];
    if (canManage) calls.push(api.get('/api/attendance/summary.php', { params: { date } }));

    Promise.all(calls)
      .then(([listRes, summaryRes]) => {
        setRecords(listRes.data.data.attendance);
        setPagination(listRes.data.data.pagination);
        if (summaryRes) setSummary(summaryRes.data.data);
      })
      .catch((err) => setError(getErrorMessage(err, 'Could not load attendance.')))
      .finally(() => setLoading(false));
  }, [date, departmentId, status, page, limit, canManage]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (canManage) {
      api.get('/api/departments/get.php').then((res) => setDepartments(res.data.data.departments));
    }
  }, [canManage]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete('/api/attendance/delete.php', { data: { id: deleteTarget.id } });
      toast.success('Attendance record deleted.');
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete this record.'));
    } finally {
      setDeleting(false);
    }
  }

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

  const todayRecord = isEmployee && date === todayLocalISO() ? records[0] : null;
  const canClockIn = !todayRecord || !todayRecord.check_in;
  const canClockOut = todayRecord && todayRecord.check_in && !todayRecord.check_out;

  return (
    <div className="animate-fade-rise">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setPage(1); }}
            className="rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)', background: 'var(--surface)' }}
          />
        </div>
        {canManage && (
          <button
            onClick={() => setMarkOpen(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: 'var(--accent)' }}
          >
            <Plus size={16} /> Mark Attendance
          </button>
        )}
        {isEmployee && date === todayLocalISO() && (
          <div className="flex gap-2">
            <button
              onClick={() => handleClock('in')}
              disabled={!canClockIn || clocking}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
              style={{ background: 'var(--success)' }}
            >
              <LogIn size={16} /> Clock In
            </button>
            <button
              onClick={() => handleClock('out')}
              disabled={!canClockOut || clocking}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
              style={{ background: 'var(--danger)' }}
            >
              <LogOut size={16} /> Clock Out
            </button>
          </div>
        )}
      </div>

      {canManage && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {loading || !summary ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard icon={UserCheck} label="Present" value={summary.counts.present} accent="var(--success)" accentSoft="var(--success-soft)" />
              <StatCard icon={Timer} label="Late" value={summary.counts.late} accent="var(--warning)" accentSoft="var(--warning-soft)" />
              <StatCard icon={Clock} label="Half Day" value={summary.counts.half_day} />
              <StatCard icon={UserX} label="Absent" value={summary.counts.absent} accent="var(--danger)" accentSoft="var(--danger-soft)" />
              <StatCard icon={CalendarCheck} label="Not Marked" value={summary.counts.not_marked} accent="var(--ink-soft)" accentSoft="var(--surface-hover)" />
            </>
          )}
        </div>
      )}

      <div className="mt-6 rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          {canManage && (
            <select
              value={departmentId}
              onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }}
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
            >
              <option value="">All departments</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          >
            <option value="">All statuses</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="half_day">Half Day</option>
            <option value="absent">Absent</option>
          </select>
        </div>

        {error && (
          <p className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        <AttendanceTable records={records} loading={loading} canDelete={canDelete} onDelete={setDeleteTarget} />

        {!loading && records.length > 0 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.total_pages}
            limit={pagination.limit}
            total={pagination.total}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        )}
      </div>

      <MarkAttendanceModal
        open={markOpen}
        onClose={() => setMarkOpen(false)}
        onSaved={fetchAll}
        date={date}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete attendance record?"
        description="This will permanently remove this attendance entry. This action cannot be undone."
      />
    </div>
  );
}