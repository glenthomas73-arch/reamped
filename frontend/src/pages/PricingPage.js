import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const FREE_FEATURES = [
      'Search across all platforms simultaneously',
      'Value Score on every listing',
      'Condition & price filters',
      'Unlimited searches',
      'Affiliate link click-throughs',
    ];

const PRO_FEATURES = [
      'Everything in Free',
      'Price alerts for any search',
      'Watchlist (save listings)',
      'Price history charts',
      'Priority support',
      'No ads (coming soon)',
    ];

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function PricingPage() {
      const [billing, setBilling] = useState('annual');
      const [loading, setLoading] = useState(false);
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [mode, setMode] = useState('pricing');
      const [authError, setAuthError] = useState('');
      const navigate = useNavigate();
      const { login, user } = useAuth();

  const monthlyPrice = billing === 'annual' ? 4.99 : 6.99;
      const annualPrice = billing === 'annual' ? 59.99 : null;

  // Already logged in — redirect to home
  if (user && mode === 'pricing') {
          navigate('/');
          return null;
  }

  const handleRegister = async (e) => {
          e.preventDefault();
          setLoading(true);
          setAuthError('');
          try {
                    const res = await fetch(`${API_BASE}/api/auth/register`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email, password }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Registration failed');
                    login(data.user, data.token);
                    navigate('/');
          } catch (err) {
                    setAuthError(err.message);
          } finally {
                    setLoading(false);
          }
  };

  const handleLogin = async (e) => {
          e.preventDefault();
          setLoading(true);
          setAuthError('');
          try {
                    const res = await fetch(`${API_BASE}/api/auth/login`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email, password }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Login failed');
                    login(data.user, data.token);
                    navigate('/');
          } catch (err) {
                    setAuthError(err.message);
          } finally {
                    setLoading(false);
          }
  };

  if (mode === 'register' || mode === 'login') {
          const isLogin = mode === 'login';
          return (
                    <div style={styles.authPage}>
                      <div style={styles.authCard}>
                        <div style={styles.authLogo}>&#9889; ReAmped</div>
                <h2 style={styles.authTitle}>{isLogin ? 'Sign In' : 'Create Account'}</h2>
              <form onSubmit={isLogin ? handleLogin : handleRegister} style={styles.authForm}>
            <input style={styles.authInput} type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)} required />
            <input style={styles.authInput} type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} required minLength={8} />
              {authError && <p style={styles.authError}>{authError}</p>}
                           <button type="submit" style={styles.authSubmit} disabled={loading}>
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
</button>
    </form>
          <p style={styles.authSwitch}>
{isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button style={styles.authSwitchBtn} onClick={() => setMode(isLogin ? 'register' : 'login')}>
            {isLogin ? 'Sign up free' : 'Sign in'}
</button>
    </p>
          <button style={styles.backToPlans} onClick={() => setMode('pricing')}>&#8592; Back to plans</button>
    </div>
    </div>
    );
}

  return (
          <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Simple, Honest Pricing</h1>
          <p style={styles.subtitle}>Start free. Upgrade when you're ready.</p>
                <div style={styles.toggle}>
            <button style={billing === 'monthly' ? styles.toggleActive : styles.toggleBtn}
                    onClick={() => setBilling('monthly')}>Monthly</button>
            <button style={billing === 'annual' ? styles.toggleActive : styles.toggleBtn}
                    onClick={() => setBilling('annual')}>Annual <span style={styles.saveBadge}>Save 29%</span></button>
      </div>
      </div>

        <div style={styles.cards}>
  {/* Free Card */}
                <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.planName}>Free</h2>
              <div style={styles.priceBlock}>
                <span style={styles.price}>$0</span>
                <span style={styles.period}>/month</span>
      </div>
              <p style={styles.planDesc}>Everything you need to find great gear deals.</p>
      </div>
            <ul style={styles.features}>
  {FREE_FEATURES.map(f => (
                      <li key={f} style={styles.feature}>
                        <span style={styles.check}>&#10003;</span>{f}
                     </li>
                                   ))}
</ul>
            <button style={styles.btnSecondary} onClick={() => setMode('register')}>
                  Get Started Free
    </button>
    </div>

{/* Pro Card */}
          <div style={{ ...styles.card, ...styles.cardPro }}>
            <div style={styles.proRibbon}>Most Popular</div>
            <div style={styles.cardHeader}>
              <h2 style={{ ...styles.planName, color: '#f97316' }}>Pro</h2>
              <div style={styles.priceBlock}>
                <span style={styles.price}>${monthlyPrice}</span>
                <span style={styles.period}>/month</span>
              </div>
{billing === 'annual' && (
                    <p style={styles.annualNote}>Billed annually at ${annualPrice}/year</p>
                  )}
              <p style={styles.planDesc}>For serious musicians who never miss a deal.</p>
                  </div>
            <ul style={styles.features}>
              {PRO_FEATURES.map(f => (
                                  <li key={f} style={styles.feature}>
                                    <span style={{ ...styles.check, color: '#f97316' }}>&#10003;</span>{f}
                                </li>
                                              ))}
</ul>
            <button style={styles.btnPrimary} onClick={() => setMode('register')}>
                  Start Pro Free Trial
    </button>
    </div>
    </div>

        <p style={styles.signinNote}>
          Already have an account?{' '}
              <button style={styles.signinLink} onClick={() => setMode('login')}>Sign in</button>
    </p>
    </div>
    </div>
      );
}

const styles = {
      page: { background: '#0f172a', minHeight: '100vh', padding: '60px 24px' },
      container: { maxWidth: 900, margin: '0 auto' },
      header: { textAlign: 'center', marginBottom: 48 },
      title: { fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#f8fafc', margin: '0 0 12px' },
      subtitle: { color: '#94a3b8', fontSize: 18, margin: '0 0 28px' },
      toggle: { display: 'inline-flex', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, overflow: 'hidden' },
      toggleBtn: { padding: '8px 20px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14, fontWeight: 500 },
      toggleActive: { padding: '8px 20px', background: '#334155', border: 'none', color: '#f1f5f9', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
      saveBadge: { background: '#22c55e', color: '#fff', fontSize: 11, borderRadius: 4, padding: '1px 6px', marginLeft: 6, fontWeight: 700 },
      cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 32 },
      card: { background: '#1e293b', borderRadius: 16, padding: 32, border: '1px solid #334155', position: 'relative', overflow: 'hidden' },
      cardPro: { border: '2px solid #f97316' },
      proRibbon: { position: 'absolute', top: 16, right: -24, background: '#f97316', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 32px', transform: 'rotate(45deg)', transformOrigin: 'center' },
      cardHeader: { marginBottom: 24 },
      planName: { fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '0 0 8px' },
      priceBlock: { display: 'flex', alignItems: 'baseline', gap: 4, margin: '0 0 8px' },
      price: { fontSize: 42, fontWeight: 900, color: '#f8fafc' },
      period: { color: '#64748b', fontSize: 16 },
      annualNote: { fontSize: 12, color: '#64748b', margin: '0 0 8px' },
      planDesc: { color: '#94a3b8', fontSize: 14, margin: 0 },
      features: { listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12 },
      feature: { display: 'flex', gap: 10, color: '#cbd5e1', fontSize: 14, alignItems: 'flex-start' },
      check: { color: '#22c55e', fontWeight: 700, flexShrink: 0, marginTop: 1 },
      btnPrimary: { width: '100%', padding: '14px', background: '#f97316', border: 'none', borderRadius: 8, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' },
      btnSecondary: { width: '100%', padding: '14px', background: 'transparent', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 16, fontWeight: 600, cursor: 'pointer' },
      signinNote: { textAlign: 'center', color: '#64748b', fontSize: 14 },
      signinLink: { background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
      authPage: { background: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
      authCard: { background: '#1e293b', borderRadius: 16, padding: 40, width: '100%', maxWidth: 400, border: '1px solid #334155' },
      authLogo: { fontSize: 24, fontWeight: 800, color: '#f97316', textAlign: 'center', marginBottom: 24 },
      authTitle: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', textAlign: 'center', margin: '0 0 24px' },
      authForm: { display: 'flex', flexDirection: 'column', gap: 12 },
      authInput: { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', padding: '12px 16px', fontSize: 15, outline: 'none' },
      authError: { color: '#ef4444', fontSize: 13, margin: 0 },
      authSubmit: { padding: '13px', background: '#f97316', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
      authSwitch: { textAlign: 'center', color: '#64748b', fontSize: 14, marginTop: 16 },
      authSwitchBtn: { background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
      backToPlans: { display: 'block', width: '100%', marginTop: 16, padding: '8px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13, textAlign: 'center' },
};
