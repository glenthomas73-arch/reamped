import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register(email.trim().toLowerCase(), password);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
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
        <h1 style={styles.title}>Create account</h1>
        <p style={styles.subtitle}>Free to start — search across 4 platforms</p>

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
              placeholder="At least 8 characters"
              style={styles.input}
              autoComplete="new-password"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div style={styles.proBox}>
          <span style={styles.proIcon}>&#10022;</span>
          <span style={styles.proText}>
            <Link to="/pricing" style={styles.link}>Upgrade to Pro</Link>
            {' '}for Facebook, Gumtree, and price alerts
          </span>
        </div>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>Sign in</Link>
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
  },
  proBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    background: '#1e1a0e',
    border: '1px solid #78350f',
    borderRadius: 8,
    padding: '10px 14px',
    marginTop: 20,
  },
  proIcon: { color: '#f97316', fontSize: 14, flexShrink: 0, marginTop: 1 },
  proText: { color: '#94a3b8', fontSize: 13, lineHeight: 1.5 },
  footer: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
  },
  link: { color: '#f97316', textDecoration: 'none', fontWeight: 500 },
};
