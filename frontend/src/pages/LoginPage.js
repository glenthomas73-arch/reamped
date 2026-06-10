import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>&#9889;</span> ReAmped
        </div>
        <h1 style={styles.title}>Sign in</h1>
        <p style={styles.subtitle}>Welcome back — find your next deal</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>&#9888;</span> {error}
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={styles.input}
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link to="/register" style={styles.link}>Create one</Link>
        </p>
        <p style={styles.footer}>
          <Link to="/pricing" style={styles.link}>Go Pro</Link>
          {' '}to unlock all 6 platforms &amp; price alerts
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f0f1a',
    padding: '24px 16px',
  },
  card: {
    background: '#1a1a2e',
    border: '1px solid #16213e',
    borderRadius: 16,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  logo: {
    color: '#f97316',
    fontSize: 22,
    fontWeight: 800,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: '-0.5px',
  },
  logoIcon: { marginRight: 4 },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 700,
    margin: '0 0 4px',
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    margin: '0 0 28px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  errorBox: {
    background: '#2d1515',
    border: '1px solid #7f1d1d',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#fca5a5',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  errorIcon: { fontSize: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: 500 },
  input: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: 8,
    padding: '10px 12px',
    color: '#e2e8f0',
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  btn: {
    background: '#f97316',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 4,
    transition: 'opacity 0.15s',
  },
  footer: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
  },
  link: { color: '#f97316', textDecoration: 'none', fontWeight: 500 },
};
