import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/formatters';
import api from '../api/axios';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Silently wake up the Render backend the moment the page loads
  // so it is ready by the time the user finishes typing and clicks Sign In.
  useEffect(() => {
    api.get('/index.php').catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, ['admin', 'hr']);
      navigate('/', { replace: true });
    } catch (err) {
      if (err.code === 'WRONG_PORTAL') {
        setError('This is an employee account. Please use the Employee Login below.');
      } else {
        setError(getErrorMessage(err, 'Invalid email or password.'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex"
        style={{ background: 'var(--sidebar-bg)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="h-8 w-6 rounded-t-full border-2" style={{ borderColor: 'var(--accent)' }} />
            <div className="absolute inset-x-0 top-2.5 mx-auto h-4 w-4 rounded-sm" style={{ background: 'var(--accent)' }} />
          </div>
          <span className="font-display text-xl font-bold text-white">StaffNest</span>
        </div>

        <div className="animate-fade-rise">
          <h1 className="font-display max-w-md text-3xl font-bold leading-tight text-white">
            Every employee record, one organized workspace.
          </h1>
          <p className="mt-4 max-w-sm text-sm" style={{ color: 'var(--sidebar-text)' }}>
            Manage staff, departments and performance in a single clean dashboard built for HR teams.
          </p>
        </div>

        {/* Decorative badge grid — echoes the ID-badge motif used across the app */}
        <div className="grid grid-cols-6 gap-3 opacity-70">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full"
              style={{
                background: `var(--dept-${(i % 6) + 1})`,
                opacity: 0.4 + (i % 3) * 0.2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-10 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm animate-fade-rise">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="relative">
              <div className="h-7 w-5 rounded-t-full border-2" style={{ borderColor: 'var(--accent)' }} />
              <div className="absolute inset-x-0 top-2 mx-auto h-3.5 w-3.5 rounded-sm" style={{ background: 'var(--accent)' }} />
            </div>
            <span className="font-display text-lg font-bold" style={{ color: 'var(--ink)' }}>StaffNest</span>
          </div>

          <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--ink)' }}>
            Staff Sign In
          </h2>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--ink-soft)' }}>
            For Admin & HR accounts only.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>
                Email
              </label>
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
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>
                Password
              </label>
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
            Not Admin or HR?{' '}
            <Link to="/employee-login" className="font-medium" style={{ color: 'var(--accent)' }}>
              Employee Login
            </Link>
          </p>

          {/* <div className="mt-8 rounded-xl border p-3.5 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--ink-soft)' }}>
            <p className="font-medium" style={{ color: 'var(--ink)' }}>Demo credentials</p>
            <p className="mt-1">admin@ems.com / admin123 (Admin)</p>
            <p>hr@ems.com / admin123 (HR)</p>
          </div> */}
        </div>
      </div>
    </div>
  );
}
