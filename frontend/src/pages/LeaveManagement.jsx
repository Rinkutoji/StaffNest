import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, Clock3, CheckCircle2, XCircle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/common/StatCard';
import { SkeletonCard } from '../components/common/Skeleton';
import LeaveTable from '../components/leaves/LeaveTable';
import LeaveRequestModal from '../components/leaves/LeaveRequestModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Pagination from '../components/common/Pagination';
import { getErrorMessage } from '../utils/formatters';

export default function LeaveManagement() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'hr';
  const canDelete = user?.role === 'admin'; // only Admin can delete; HR can approve/reject only

  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestOpen, setRequestOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError('');
    const params = { page, limit };
    if (status) params.status = status;
    api.get('/api/leaves/get.php', { params })
      .then((res) => {
        setRecords(res.data.data.leave_requests);
        setPagination(res.data.data.pagination);
      })
      .catch((err) => setError(getErrorMessage(err, 'Could not load leave requests.')))
      .finally(() => setLoading(false));
  }, [status, page, limit]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const counts = {
    pending: records.filter((r) => r.status === 'pending').length,
    approved: records.filter((r) => r.status === 'approved').length,
    rejected: records.filter((r) => r.status === 'rejected').length,
  };

  async function handleApprove(record) {
    try {
      await api.post('/api/leaves/review.php', { id: record.id, status: 'approved' });
      toast.success('Leave request approved.');
      fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleReject() {
    setBusy(true);
    try {
      await api.post('/api/leaves/review.php', { id: rejectTarget.id, status: 'rejected' });
      toast.success('Leave request rejected.');
      setRejectTarget(null);
      fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await api.delete('/api/leaves/delete.php', { data: { id: deleteTarget.id } });
      toast.success('Leave request deleted.');
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete this request.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-rise">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>{pagination.total} total requests on record.</p>
        <button
          onClick={() => setRequestOpen(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: 'var(--accent)' }}
        >
          <Plus size={16} /> New Leave Request
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard icon={Clock3} label="Pending (this page)" value={counts.pending} accent="var(--warning)" accentSoft="var(--warning-soft)" />
            <StatCard icon={CheckCircle2} label="Approved (this page)" value={counts.approved} accent="var(--success)" accentSoft="var(--success-soft)" />
            <StatCard icon={XCircle} label="Rejected (this page)" value={counts.rejected} accent="var(--danger)" accentSoft="var(--danger-soft)" />
          </>
        )}
      </div>

      <div className="mt-6 rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <ClipboardList size={16} style={{ color: 'var(--ink-faint)' }} />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {error && (
          <p className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        <LeaveTable
          records={records}
          loading={loading}
          canManage={canManage}
          canDelete={canDelete}
          onApprove={handleApprove}
          onReject={setRejectTarget}
          onDelete={setDeleteTarget}
        />

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

      <LeaveRequestModal open={requestOpen} onClose={() => setRequestOpen(false)} onSaved={fetchAll} />

      <ConfirmDialog
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        loading={busy}
        title="Reject leave request?"
        confirmLabel="Reject"
        description={`This will reject ${rejectTarget?.full_name || 'this employee'}'s leave request.`}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={busy}
        title="Delete leave request?"
        description="This will permanently remove this leave request. This action cannot be undone."
      />
    </div>
  );
}