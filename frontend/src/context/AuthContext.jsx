import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, if a token was saved from a previous session,
  // verify it's still valid and restore the user.
  useEffect(() => {
    const token = localStorage.getItem('ems_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/api/auth/me.php')
      .then((res) => setUser(res.data.data.user))
      .catch(() => {
        localStorage.removeItem('ems_token');
        localStorage.removeItem('ems_user');
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password, allowedRoles = null) {
    const res = await api.post('/api/auth/login.php', { email, password });
    const { token, user: loggedInUser } = res.data.data;

    // Keep Staff Login and Employee Login as two separate doors: if someone
    // signs in on the wrong portal, reject and invalidate the token we just
    // received instead of letting them into a form meant for another role.
    if (allowedRoles && !allowedRoles.includes(loggedInUser.role)) {
      localStorage.setItem('ems_token', token); // needed so the interceptor can attach it below
      try {
        await api.post('/api/auth/logout.php');
      } catch {
        // best-effort cleanup only
      }
      localStorage.removeItem('ems_token');
      const err = new Error('This account does not belong to this portal.');
      err.code = 'WRONG_PORTAL';
      err.actualRole = loggedInUser.role;
      throw err;
    }

    localStorage.setItem('ems_token', token);
    localStorage.setItem('ems_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function register(name, email, password) {
    // Public sign-up always creates a plain Employee account. Admin and HR
    // (staff) accounts are provisioned separately, not self-served here.
    await api.post('/api/auth/register.php', { name, email, password });
  }

  async function updateProfile(formData) {
    const res = await api.post('/api/auth/update_profile.php', formData);
    const updatedUser = res.data.data.user;
    localStorage.setItem('ems_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  }

  async function logout() {
    try {
      await api.post('/api/auth/logout.php');
    } catch {
      // Even if the network call fails, we still clear the local session.
    }
    localStorage.removeItem('ems_token');
    localStorage.removeItem('ems_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
