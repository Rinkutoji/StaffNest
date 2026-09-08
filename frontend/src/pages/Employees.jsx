import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import EmployeeFilters from '../components/employees/EmployeeFilters';
import EmployeeTable from '../components/employees/EmployeeTable';
import EmployeeFormModal from '../components/employees/EmployeeFormModal';
import EmployeeViewModal from '../components/employees/EmployeeViewModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Pagination from '../components/common/Pagination';
import { getErrorMessage } from '../utils/formatters';

const DEFAULT_FILTERS = {
  search: '',
  department_id: '',
  gender: '',
  status: '',
  salary_min: '',
  salary_max: '',
  sort: 'latest',
};

export default function Employees() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'hr';
  const canDelete = user?.role === 'admin'; // only Admin can delete; HR can create/edit only
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    search: searchParams.get('search') || '',
    department_id: searchParams.get('department_id') || '',
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, total_pages: 1 });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formModal, setFormModal] = useState({ open: false, employee: null });
  const [viewModal, setViewModal] = useState({ open: false, employee: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEmployees = useCallback(() => {
    setLoading(true);
    setError('');
    const params = { ...filters, page, limit };
    Object.keys(params).forEach((k) => params[k] === '' && delete params[k]);

    api
      .get('/api/employees/get.php', { params })
      .then((res) => {
        setEmployees(res.data.data.employees);
        setPagination(res.data.data.pagination);
      })
      .catch((err) => setError(getErrorMessage(err, 'Could not load employees.')))
      .finally(() => setLoading(false));
  }, [filters, page, limit]);

  // Debounce so typing in the search box doesn't fire a request per keystroke
  useEffect(() => {
    const timeout = setTimeout(fetchEmployees, 350);
    return () => clearTimeout(timeout);
  }, [fetchEmployees]);

  useEffect(() => {
    api.get('/api/departments/get.php').then((res) => setDepartments(res.data.data.departments));
  }, []);

  // Reset to page 1 whenever filters change
  function handleFilterChange(next) {
    setFilters(next);
    setPage(1);
    if (next.department_id) {
      setSearchParams({ department_id: next.department_id });
    } else {
      setSearchParams({});
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete('/api/employees/delete.php', { data: { id: deleteTarget.id } });
      toast.success('Employee deleted.');
      setDeleteTarget(null);
      fetchEmployees();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete this employee.'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="animate-fade-rise">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--ink)' }}>Employees</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ink-soft)' }}>
            {pagination.total} people across your organization.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setFormModal({ open: true, employee: null })}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: 'var(--accent)' }}
          >
            <Plus size={16} /> Add Employee
          </button>
        )}
      </div>

      <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <EmployeeFilters filters={filters} onChange={handleFilterChange} departments={departments} />

        {error && (
          <p className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        <EmployeeTable
          employees={employees}
          loading={loading}
          canManage={canManage}
          canDelete={canDelete}
          onView={(emp) => setViewModal({ open: true, employee: emp })}
          onEdit={(emp) => setFormModal({ open: true, employee: emp })}
          onDelete={(emp) => setDeleteTarget(emp)}
        />

        {!loading && employees.length > 0 && (
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

      <EmployeeFormModal
        open={formModal.open}
        employee={formModal.employee}
        departments={departments}
        onClose={() => setFormModal({ open: false, employee: null })}
        onSaved={fetchEmployees}
      />

      <EmployeeViewModal
        open={viewModal.open}
        employee={viewModal.employee}
        onClose={() => setViewModal({ open: false, employee: null })}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete employee?"
        description={`This will permanently remove ${deleteTarget?.full_name || 'this employee'} from your records. This action cannot be undone.`}
      />
    </div>
  );
}