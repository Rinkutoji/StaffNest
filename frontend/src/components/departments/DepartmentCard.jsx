import { Link } from 'react-router-dom';
import { Pencil, Trash2, Users, ArrowRight } from 'lucide-react';
import { departmentColor } from '../../utils/departmentColors';

export default function DepartmentCard({ department, index, canManage, onEdit, onDelete }) {
  const color = departmentColor(index);

  return (
    <div
      className="animate-fade-rise rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)', borderTop: `3px solid ${color}` }}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${color} 15%, white)`, color }}
        >
          <Users size={18} />
        </div>
        {canManage && (
          <div className="flex gap-1">
            <button onClick={() => onEdit(department)} aria-label="Edit department" className="rounded-lg p-1.5 transition hover:bg-black/5" style={{ color: 'var(--ink-soft)' }}>
              <Pencil size={15} />
            </button>
            <button onClick={() => onDelete(department)} aria-label="Delete department" className="rounded-lg p-1.5 transition hover:bg-black/5" style={{ color: 'var(--danger)' }}>
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      <h3 className="font-display mt-3 text-base font-semibold" style={{ color: 'var(--ink)' }}>{department.name}</h3>
      <p className="mt-1 line-clamp-2 text-sm" style={{ color: 'var(--ink-soft)' }}>
        {department.description || 'No description added.'}
      </p>

      <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--border)' }}>
        <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
          {department.employee_count} {department.employee_count === 1 ? 'employee' : 'employees'}
        </span>
        <Link
          to={`/employees?department_id=${department.id}`}
          className="flex items-center gap-1 text-sm font-medium transition hover:gap-1.5"
          style={{ color: 'var(--accent)' }}
        >
          View <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
