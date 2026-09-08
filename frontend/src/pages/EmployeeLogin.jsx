import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/formatters';

export default function EmployeeLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, ['employee']);
      navigate('/', { replace: true });
    } catch (err) {
      if (err.code === 'WRONG_PORTAL') {
        setError('This looks like an Admin/HR account. Please use Staff Login instead.');
      } else {
        setError(getErrorMessage(err, 'Invalid email or password.'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12" style={{ background: 'var(--canvas)' }}>
      <div
        className="animate-fade-rise w-full max-w-sm rounded-2xl border p-8"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="mb-6 flex items-center gap-2.5">
          <div className="relative">
            <div className="h-7 w-5 rounded-t-full border-2" style={{ borderColor: 'var(--accent)' }} />
            <div className="absolute inset-x-0 top-2 mx-auto h-3.5 w-3.5 rounded-sm" style={{ background: 'var(--accent)' }} />
          </div>
          <span className="font-display text-lg font-bold" style={{ color: 'var(--ink)' }}>StaffNest</span>
        </div>

        <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--ink)' }}>
          Employee Login
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--ink-soft)' }}>
          Sign in to view your workplace dashboard.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>Email</label>
            <div className="relative">
              <Mail size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-faint)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none transition focus:ring-2"
                style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>Password</label>
            <div className="relative">
              <Lock size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-faint)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border py-2.5 pl-10 pr-10 text-sm outline-none transition focus:ring-2"
                style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--ink-faint)' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--accent)' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--ink-soft)' }}>
          New employee?{' '}
          <Link to="/register" className="font-medium" style={{ color: 'var(--accent)' }}>
            Create an account
          </Link>
        </p>
        <p className="mt-2 text-center text-xs" style={{ color: 'var(--ink-faint)' }}>
          Admin or HR?{' '}
          <Link to="/login" className="font-medium" style={{ color: 'var(--ink-soft)' }}>
            Staff login
          </Link>
        </p>
      </div>
    </div>
  );
}
