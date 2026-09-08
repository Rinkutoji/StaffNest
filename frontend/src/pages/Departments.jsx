import { useEffect, useState, useCallback } from 'react';
import { Plus, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import DepartmentCard from '../components/departments/DepartmentCard';
import DepartmentFormModal from '../components/departments/DepartmentFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import { SkeletonCard } from '../components/common/Skeleton';
import { getErrorMessage } from '../utils/formatters';

export default function Departments() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'hr';

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formModal, setFormModal] = useState({ open: false, department: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDepartments = useCallback(() => {
    setLoading(true);
    api
      .get('/api/departments/get.php')
      .then((res) => setDepartments(res.data.data.departments))
      .catch((err) => setError(getErrorMessage(err, 'Could not load departments.')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete('/api/departments/delete.php', { data: { id: deleteTarget.id } });
      toast.success('Department deleted.');
      setDeleteTarget(null);
      fetchDepartments();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete this department.'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="animate-fade-rise">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--ink)' }}>Departments</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ink-soft)' }}>
            Organize your team into departments.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setFormModal({ open: true, department: null })}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: 'var(--accent)' }}
          >
            <Plus size={16} /> Add Department
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : departments.length === 0 ? (
        <div className="rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <EmptyState
            icon={Building2}
            title="No departments yet"
            description="Create your first department to start organizing employees."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept, i) => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              index={i}
              canManage={canManage}
              onEdit={(d) => setFormModal({ open: true, department: d })}
              onDelete={(d) => setDeleteTarget(d)}
            />
          ))}
        </div>
      )}

      <DepartmentFormModal
        open={formModal.open}
        department={formModal.department}
        onClose={() => setFormModal({ open: false, department: null })}
        onSaved={fetchDepartments}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete department?"
        description={`Employees in "${deleteTarget?.name}" will become unassigned rather than deleted. This action cannot be undone.`}
      />
    </div>
  );
}
