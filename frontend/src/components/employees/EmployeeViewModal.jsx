import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { departmentColor } from '../../utils/departmentColors';

export default function EmployeeViewModal({ open, onClose, employee }) {
  if (!employee) return null;

  return (
    <Modal open={open} onClose={onClose} title="Employee Details" maxWidth="30rem">
      <div className="flex items-center gap-4">
        <Avatar name={employee.full_name} imageFilename={employee.profile_image} color={departmentColor(employee.department_id)} size={56} />
        <div>
          <p className="font-display text-lg font-semibold" style={{ color: 'var(--ink)' }}>{employee.full_name}</p>
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>{employee.position || 'No position set'}</p>
          <div className="mt-1.5"><Badge status={employee.status} /></div>
        </div>
      </div>

      <dl className="mt-6 space-y-3 border-t pt-5" style={{ borderColor: 'var(--border)' }}>
        <Row label="Email" value={employee.email} />
        <Row label="Phone" value={employee.phone || '—'} />
        <Row label="Gender" value={employee.gender ? employee.gender[0].toUpperCase() + employee.gender.slice(1) : '—'} />
        <Row label="Date of birth" value={formatDate(employee.date_of_birth)} />
        <Row
          label="Department"
          value={
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: departmentColor(employee.department_id) }} />
              {employee.department_name || 'Unassigned'}
            </span>
          }
        />
        <Row label="Salary" value={<span className="font-mono">{formatCurrency(employee.salary)}</span>} />
        <Row label="Address" value={employee.address || '—'} />
        <Row label="Joined" value={formatDate(employee.created_at)} />
      </dl>
    </Modal>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <dt style={{ color: 'var(--ink-faint)' }}>{label}</dt>
      <dd className="text-right font-medium" style={{ color: 'var(--ink)' }}>{value}</dd>
    </div>
  );
}
