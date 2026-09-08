import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Lock, Upload, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import { getErrorMessage } from '../utils/formatters';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost/ems/backend';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    current_password: '',
    new_password: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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

    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required.');
      return;
    }
    if (form.new_password && form.new_password.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('email', form.email);
      data.append('phone', form.phone);
      if (form.new_password) {
        data.append('current_password', form.current_password);
        data.append('new_password', form.new_password);
      }
      if (imageFile) data.append('profile_image', imageFile);
      if (removeImage) data.append('remove_image', '1');

      await updateProfile(data);
      toast.success('Profile updated.');
      setForm((f) => ({ ...f, current_password: '', new_password: '' }));
      setImageFile(null);
      setImagePreview(null);
      setRemoveImage(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update your profile.'));
    } finally {
      setSaving(false);
    }
  }

  const currentImageUrl =
    !removeImage && user?.profile_image ? `${API_BASE}/uploads/avatars/${user.profile_image}` : null;

  return (
    <div className="animate-fade-rise mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--ink)' }}>Profile</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--ink-soft)' }}>Manage your account details.</p>

      <form onSubmit={handleSubmit}>
        {/* Profile photo + account summary */}
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          {imagePreview || currentImageUrl ? (
            <img
              src={imagePreview || currentImageUrl}
              alt="Preview"
              className="h-16 w-16 rounded-full object-cover"
              style={{ border: '2px solid var(--border)' }}
            />
          ) : (
            <Avatar name={form.name || user?.name} size={64} />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-display truncate text-lg font-semibold" style={{ color: 'var(--ink)' }}>{user?.name}</p>
            <p className="truncate text-sm" style={{ color: 'var(--ink-soft)' }}>{user?.email}</p>
            <div className="mt-1.5"><Badge status={user?.role} /></div>
          </div>
          <div className="flex flex-none flex-col gap-1.5">
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

        {/* Account details */}
        <div className="mt-4 space-y-4 rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <h3 className="font-display text-sm font-semibold" style={{ color: 'var(--ink)' }}>Account details</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>Full name</label>
              <div className="relative">
                <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-faint)' }} />
                <input
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2"
                  style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>Email</label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-faint)' }} />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2"
                  style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>Phone</label>
              <div className="relative">
                <Phone size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-faint)' }} />
                <input
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2"
                  style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="mt-4 space-y-4 rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <h3 className="font-display text-sm font-semibold" style={{ color: 'var(--ink)' }}>Change password</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>Current password</label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-faint)' }} />
                <input
                  type="password"
                  value={form.current_password}
                  onChange={(e) => update('current_password', e.target.value)}
                  placeholder="Leave blank to keep"
                  className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2"
                  style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>New password</label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-faint)' }} />
                <input
                  type="password"
                  value={form.new_password}
                  onChange={(e) => update('new_password', e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2"
                  style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--accent)' }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
