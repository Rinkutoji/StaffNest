import { useCallback, useEffect, useState } from 'react';
import { Wallet, Users, CheckCircle2, Download, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/common/StatCard';
import { SkeletonCard } from '../components/common/Skeleton';
import PayrollTable from '../components/payroll/PayrollTable';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatCurrency, getErrorMessage, currentMonthLocalISO } from '../utils/formatters';

function currentMonth() {
  return currentMonthLocalISO();
}

function monthLabel(month) {
  const [y, m] = month.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function downloadCsv(records, month) {
  const header = ['Employee', 'Department', 'Base Salary', 'Bonus', 'Deductions', 'Net Salary', 'Status'];
  const rows = records.map((r) => [
    r.full_name, r.department_name || 'Unassigned', r.base_salary, r.bonus, r.deductions, r.net_salary, r.status,
  ]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `payroll-${month}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Payroll() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'hr';
  const canDelete = user?.role === 'admin'; // only Admin can delete payroll records
  const isEmployee = user?.role === 'employee';

  const [month, setMonth] = useState(currentMonth());
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ total_paid_net: 0, paid_count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError('');
    const params = isEmployee ? { all: 1, limit: 50 } : { month, limit: 50 };
    api.get('/api/payroll/get.php', { params })
      .then((res) => {
        setRecords(res.data.data.payroll);
        setSummary(res.data.data.summary);
      })
      .catch((err) => setError(getErrorMessage(err, 'Could not load payroll.')))
      .finally(() => setLoading(false));
  }, [month, isEmployee]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await api.post('/api/payroll/generate.php', { month });
      toast.success(res.data.message);
      fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveAdjustment(record, bonus, deductions) {
    try {
      await api.post('/api/payroll/update.php', { id: record.id, bonus, deductions });
      toast.success('Payroll record updated.');
      fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleMarkPaid(record) {
    try {
      await api.post('/api/payroll/mark_paid.php', { id: record.id });
      toast.success('Marked as paid.');
      fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete('/api/payroll/delete.php', { data: { id: deleteTarget.id } });
      toast.success('Payroll record deleted.');
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete this record.'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="animate-fade-rise">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {isEmployee ? (
          <div>
            <h2 className="font-display text-lg font-semibold" style={{ color: 'var(--ink)' }}>My Payslips</h2>
            <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>Your full salary history.</p>
          </div>
        ) : (
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)', background: 'var(--surface)' }}
          />
        )}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => downloadCsv(records, isEmployee ? 'all' : month)}
            disabled={records.length === 0}
            className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-black/5 disabled:opacity-50"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          >
            <Download size={16} /> {isEmployee ? 'Download Payslips' : 'Export CSV'}
          </button>
          {canManage && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ background: 'var(--accent)' }}
            >
              <Sparkles size={16} /> {generating ? 'Generating…' : 'Generate Payroll'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : isEmployee ? (
          <>
            <StatCard icon={Users} label="Payslips on record" value={records.length} />
            <StatCard
              icon={Wallet}
              label="Latest Net Pay"
              value={formatCurrency(records[0]?.net_salary ?? 0)}
              accent="var(--warning)"
              accentSoft="var(--warning-soft)"
            />
            <StatCard
              icon={CheckCircle2}
              label="Paid"
              value={records.filter((r) => r.status === 'paid').length}
              accent="var(--success)"
              accentSoft="var(--success-soft)"
            />
          </>
        ) : (
          <>
            <StatCard icon={Users} label={`Records — ${monthLabel(month)}`} value={records.length} />
            <StatCard icon={Wallet} label="Total Paid (Net)" value={formatCurrency(summary.total_paid_net)} accent="var(--warning)" accentSoft="var(--warning-soft)" />
            <StatCard icon={CheckCircle2} label="Paid Count" value={summary.paid_count} accent="var(--success)" accentSoft="var(--success-soft)" />
          </>
        )}
      </div>

      <div className="mt-6 rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        {error && (
          <p className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        <PayrollTable
          records={records}
          loading={loading}
          canManage={canManage}
          canDelete={canDelete}
          onSaveAdjustment={handleSaveAdjustment}
          onMarkPaid={handleMarkPaid}
          onDelete={setDeleteTarget}
        />
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete payroll record?"
        description={`This will remove the ${monthLabel(month)} payroll entry for ${deleteTarget?.full_name || 'this employee'}.`}
      />
    </div>
  );
}