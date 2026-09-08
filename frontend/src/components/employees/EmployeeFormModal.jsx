import { useEffect, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import api from '../../api/axios';
import { getErrorMessage } from '../../utils/formatters';

const EMPTY_FORM = {
  full_name: '',
  email: '',
  phone: '',
  gender: 'male',
  date_of_birth: '',
  position: '',
  salary: '',
  department_id: '',
  address: '',
  status: 'active',
};

export default function EmployeeFormModal({ open, onClose, onSaved, departments, employee }) {
  const isEdit = Boolean(employee);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm(
        employee
          ? {
              full_name: employee.full_name || '',
              email: employee.email || '',
              phone: employee.phone || '',
              gender: employee.gender || 'male',
              date_of_birth: employee.date_of_birth || '',
              position: employee.position || '',
              salary: employee.salary ?? '',
              department_id: employee.department_id ?? '',
              address: employee.address || '',
              status: employee.status || 'active',
            }
          : EMPTY_FORM
      );
      setImageFile(null);
      setImagePreview(null);
      setRemoveImage(false);
      setError('');
    }
  }, [open, employee]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setRemoveImage(false);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.full_name.trim() || !form.email.trim() || form.salary === '') {
      setError('Full name, email and salary are required.');
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (imageFile) data.append('profile_image', imageFile);
      if (removeImage) data.append('remove_image', '1');

      if (isEdit) {
        data.append('id', employee.id);
        await api.post('/api/employees/update.php', data);
        toast.success('Employee updated successfully.');
      } else {
        await api.post('/api/employees/create.php', data);
        toast.success('Employee created successfully.');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save this employee.'));
    } finally {
      setSaving(false);
    }
  }

  const currentImageUrl =
    !removeImage && employee?.profile_image
      ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost/ems/backend'}/uploads/profiles/${employee.profile_image}`
      : null;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Employee' : 'Add Employee'} maxWidth="40rem">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Profile image */}
        <div className="flex items-center gap-4">
          {imagePreview || currentImageUrl ? (
            <img
              src={imagePreview || currentImageUrl}
              alt="Preview"
              className="h-16 w-16 rounded-full object-cover"
              style={{ border: '2px solid var(--border)' }}
            />
          ) : (
            <Avatar name={form.full_name || '?'} size={64} />
          )}
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:bg-black/5"
                style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
              >
                <Upload size={13} /> Upload photo
              </button>
              {(imagePreview || currentImageUrl) && (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    setRemoveImage(true);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:bg-black/5"
                  style={{ borderColor: 'var(--border)', color: 'var(--danger)' }}
                >
                  <X size={13} /> Remove
                </button>
              )}
            </div>
            <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>JPG, PNG or WEBP. Max 2MB.</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} className="hidden" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" required>
            <input required value={form.full_name} onChange={(e) => update('full_name', e.target.value)} className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Email" required>
            <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Gender">
            <select value={form.gender} onChange={(e) => update('gender', e.target.value)} className={inputClass} style={inputStyle}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Date of birth">
            <input type="date" value={form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)} className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Position">
            <input value={form.position} onChange={(e) => update('position', e.target.value)} className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Salary ($)" required>
            <input type="number" min="0" step="0.01" required value={form.salary} onChange={(e) => update('salary', e.target.value)} className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Department">
            <select value={form.department_id} onChange={(e) => update('department_id', e.target.value)} className={inputClass} style={inputStyle}>
              <option value="">Unassigned</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => update('status', e.target.value)} className={inputClass} style={inputStyle}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <Field label="Address" full>
            <input value={form.address} onChange={(e) => update('address', e.target.value)} className={inputClass} style={inputStyle} />
          </Field>
        </div>

        {error && (
          <p className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium transition hover:bg-black/5" style={{ color: 'var(--ink)' }}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--accent)' }}
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add employee'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const inputClass = 'w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2';
const inputStyle = { borderColor: 'var(--border)', color: 'var(--ink)' };

function Field({ label, required, full, children }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>
        {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
      </label>
      {children}
    </div>
  );
}
