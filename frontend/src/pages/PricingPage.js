import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
        const [searchParams] = useSearchParams();
        const { login, user, token, isPro } = useAuth();

  const monthlyPrice = billing === 'annual' ? 4.99 : 6.99;
        const annualTotal = 59.99;
        const annualSavings = Math.round((6.99 * 12 - annualTotal));

  // Show success/cancel flash messages from Stripe redirect
  const checkoutSuccess = searchParams.get('success') === 'true';
        const checkoutCanceled = searchParams.get('canceled') === 'true';

  const handleUpgrade = async () => {
            if (!user) { setMode('register'); return; }
            setLoading(true);
            try {
                        const res = await fetch(`${API_BASE}/api/subscriptions/create-checkout`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                      body: JSON.stringify({ plan: billing }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Checkout failed');
                        window.location.href = data.url; // redirect to Stripe Checkout
            } catch (err) {
                        alert(err.message);
            } finally {
                        setLoading(false);
            }
  };

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

  {/* Flash messages from Stripe redirect */}
  {checkoutSuccess && (
                  <div style={styles.flashSuccess}>
            &#9989; Welcome to Pro! Your subscription is now active. Enjoy price alerts and your watchlist.
        </div>
           )}
{checkoutCanceled && (
                <div style={styles.flashWarn}>
            &#8635; Checkout was cancelled — no charge was made. You can upgrade any time.
      </div>
         )}

        <div style={styles.header}>
          <h1 style={styles.title}>Simple, Honest Pricing</h1>
          <p style={styles.subtitle}>Start free. Upgrade when you're ready.</p>

{/* Billing toggle */}
          <div style={styles.toggleWrap}>
            <button
              style={{ ...styles.toggleBtn, ...(billing === 'monthly' ? styles.toggleActive : {}) }}
              onClick={() => setBilling('monthly')}
            >Monthly</button>
            <button
              style={{ ...styles.toggleBtn, ...(billing === 'annual' ? styles.toggleActive : {}) }}
              onClick={() => setBilling('annual')}
            >
              Annual
              <span style={styles.savingsBadge}>Save ${annualSavings}</span>
                    </button>
                    </div>
                    </div>

        <div style={styles.cards}>
              {/* Free card */}
                              <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.planName}>Free</h2>
              <div style={styles.priceRow}>
                <span style={styles.price}>$0</span>
                <span style={styles.pricePer}>/mo</span>
                    </div>
              <p style={styles.planTagline}>All the essentials, forever free.</p>
                    </div>
            <ul style={styles.featureList}>
              {FREE_FEATURES.map(f => (
                                    <li key={f} style={styles.featureItem}>
                                      <span style={styles.checkMark}>&#10003;</span> {f}
                                 </li>
                                               ))}
</ul>
            <button style={styles.freeBtn} onClick={() => navigate('/')}>
{user ? 'Search now &#8594;' : 'Get started free'}
</button>
      </div>

{/* Pro card */}
          <div style={{ ...styles.card, ...styles.proCard }}>
            <div style={styles.popularBadge}>Most Popular</div>
            <div style={styles.cardHeader}>
              <h2 style={{ ...styles.planName, color: '#fff' }}>Pro</h2>
              <div style={styles.priceRow}>
                <span style={{ ...styles.price, color: '#fff' }}>${monthlyPrice}</span>
                <span style={{ ...styles.pricePer, color: 'rgba(255,255,255,0.7)' }}>/mo</span>
                </div>
{billing === 'annual' ? (
                      <p style={{ ...styles.planTagline, color: 'rgba(255,255,255,0.8)' }}>
                  Billed ${annualTotal}/year &middot; Save ${annualSavings} vs monthly
      </p>
               ) : (
                                     <p style={{ ...styles.planTagline, color: 'rgba(255,255,255,0.8)' }}>
                  Billed monthly &middot; Cancel any time
                     </p>
               )}
</div>
            <ul style={styles.featureList}>
{PRO_FEATURES.map(f => (
                      <li key={f} style={{ ...styles.featureItem, color: 'rgba(255,255,255,0.9)' }}>
                                    <span style={{ ...styles.checkMark, color: '#ffd700' }}>&#10003;</span> {f}
                  </li>
                                ))}
</ul>
{isPro ? (
                    <button style={styles.proCurrentBtn} disabled>&#9889; Current Plan</button>
            ) : (
                                <button style={styles.proBtn} onClick={handleUpgrade} disabled={loading}>
            {loading ? 'Redirecting...' : `Upgrade to Pro (${billing})`}
</button>
            )}
</div>
      </div>

        <p style={styles.footer}>
          Prices in USD. Cancel any time from your account settings. No hidden fees.
      </p>
      </div>
      </div>
  );
}

const styles = {
        page: { minHeight: '100vh', background: '#0f0f0f', padding: '60px 16px' },
        container: { maxWidth: 900, margin: '0 auto' },
        flashSuccess: { background: '#0d3321', border: '1px solid #2d6a4f', color: '#b7e4c7', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 14 },
        flashWarn: { background: '#2d2700', border: '1px solid #856404', color: '#ffc107', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 14 },
        header: { textAlign: 'center', marginBottom: 48 },
        title: { fontSize: 36, fontWeight: 700, color: '#fff', margin: '0 0 8px' },
                    subtitle: { fontSize: 16, color: '#888', margin: '0 0 28px' },
                    toggleWrap: { display: 'inline-flex', background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: 4, gap: 4 },
                    toggleBtn: { padding: '8px 20px', border: 'none', borderRadius: 6, background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 },
                    toggleActive: { background: '#fff', color: '#000' },
                    savingsBadge: { background: '#22c55e', color: '#fff', borderRadius: 99, padding: '2px 7px', fontSize: 11, fontWeight: 700 },
                    cards: { display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' },
                    card: { flex: '1 1 300px', maxWidth: 380, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, padding: 32, position: 'relative' },
                    proCard: { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: '1px solid #7c3aed' },
                    popularBadge: { position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#ffd700', color: '#000', borderRadius: 99, padding: '3px 14px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' },
                    cardHeader: { marginBottom: 24 },
                    planName: { fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 8px' },
                    priceRow: { display: 'flex', alignItems: 'baseline', gap: 4, margin: '0 0 8px' },
                    price: { fontSize: 42, fontWeight: 800, color: '#fff' },
                    pricePer: { fontSize: 16, color: '#666' },
                    planTagline: { fontSize: 13, color: '#666', margin: 0 },
                    featureList: { listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 },
                    featureItem: { fontSize: 14, color: '#ccc', display: 'flex', gap: 8, alignItems: 'flex-start' },
                    checkMark: { color: '#22c55e', fontWeight: 700, flexShrink: 0, marginTop: 1 },
                    freeBtn: { width: '100%', padding: '12px 0', background: '#2a2a2a', color: '#fff', border: '1px solid #444', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
                    proBtn: { width: '100%', padding: '12px 0', background: '#fff', color: '#4f46e5', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
                    proCurrentBtn: { width: '100%', padding: '12px 0', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'default' },
                    footer: { textAlign: 'center', color: '#555', fontSize: 13, marginTop: 32 },
                    // Auth styles
                    authPage: { minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
                    authCard: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, padding: 40, width: '100%', maxWidth: 400 },
                    authLogo: { fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 24, textAlign: 'center' },
                    authTitle: { fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 24px', textAlign: 'center' },
                    authForm: { display: 'flex', flexDirection: 'column', gap: 12 },
                    authInput: { padding: '12px 14px', background: '#0f0f0f', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none' },
                    authError: { color: '#f87171', fontSize: 13, margin: 0 },
                    authSubmit: { padding: '13px 0', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
                    authSwitch: { textAlign: 'center', color: '#666', fontSize: 13, marginTop: 16 },
                    authSwitchBtn: { background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
                    backToPlans: { display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 13 },
                  };
