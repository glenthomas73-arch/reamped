import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

  const monthlyPrice = billing === 'annual' ? 4.99 : 6.99;
    const annualPrice = billing === 'annual' ? 59.99 : null;

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
                localStorage.setItem('reamped_token', data.token);
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
                localStorage.setItem('reamped_token', data.token);
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
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.planName}>Free</h3>
              <div style={styles.priceRow}>
                <span style={styles.priceAmt}>$0</span>
                <span style={styles.pricePer}>/forever</span>
    </div>
    </div>
            <ul style={styles.featureList}>
  {FREE_FEATURES.map(f => (
                    <li key={f} style={styles.feature}><span style={styles.check}>&#10003;</span>{f}</li>
                                   ))}
                     </ul>
                                 <button style={styles.freeBtn} onClick={() => navigate('/')}>Search Free &#8594;</button>
                     </div>

                               <div style={{ ...styles.card, ...styles.cardPro }}>
                                 <div style={styles.proBadge}>Most Popular</div>
                                 <div style={styles.cardHeader}>
                                   <h3 style={{ ...styles.planName, color: '#f97316' }}>Pro</h3>
                                   <div style={styles.priceRow}>
                                     <span style={{ ...styles.priceAmt, color: '#f97316' }}>
                                       ${billing === 'annual' ? (59.99 / 12).toFixed(2) : '6.99'}
</span>
                <span style={styles.pricePer}>/month</span>
  </div>
{billing === 'annual' && (
                  <p style={styles.annualNote}>Billed annually at ${annualPrice}/yr</p>
                )}
</div>
            <ul style={styles.featureList}>
{PRO_FEATURES.map(f => (
                  <li key={f} style={styles.feature}><span style={{ ...styles.check, color: '#f97316' }}>&#10003;</span>{f}</li>
                                ))}
                  </ul>
                              <button style={styles.proBtn} onClick={() => setMode('register')}>
                                Get Pro &#8594;
                  </button>
                  </div>
                  </div>

                          <div style={styles.faq}>
                            <h2 style={styles.faqTitle}>Frequently Asked Questions</h2>
                  {[
              ['What platforms do you search?', 'Currently Reverb and eBay. Guitar Center Used and Sweetwater Used are coming in Phase 2.'],
              ['What is the Value Score?', 'A proprietary 0-100 score that combines price competitiveness (40%), condition (25%), seller trust (20%), listing freshness (10%), and shipping cost (5%).'],
              ['Can I cancel Pro anytime?', 'Yes. Cancel anytime and you will keep access until the end of your billing period.'],
              ['Do you earn affiliate commissions?', 'Yes — when you click through to buy, we may earn a small commission at no cost to you. This is how we keep the free tier free.'],
            ].map(([q, a]) => (
                          <div key={q} style={styles.faqItem}>
                            <h4 style={styles.faqQ}>{q}</h4>
                                <p style={styles.faqA}>{a}</p>
              </div>
                            ))}
</div>

        <div style={styles.cta}>
          <h2 style={styles.ctaTitle}>Ready to find your next deal?</h2>
          <p style={styles.ctaText}>Start searching for free. No account required.</p>
          <button style={styles.ctaBtn} onClick={() => navigate('/')}>Start Searching</button>
  </div>
  </div>
  </div>
  );
}

const styles = {
    page: { minHeight: '100vh', background: '#0f172a', padding: '60px 24px' },
    container: { maxWidth: 900, margin: '0 auto' },
    header: { textAlign: 'center', marginBottom: 48 },
    title: { margin: '0 0 12px', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#f8fafc' },
    subtitle: { margin: '0 0 28px', color: '#64748b', fontSize: 18 },
    toggle: { display: 'inline-flex', background: '#1e293b', borderRadius: 8, padding: 4, gap: 4, border: '1px solid #334155' },
    toggleBtn: { padding: '8px 20px', background: 'transparent', border: 'none', borderRadius: 6, color: '#64748b', fontSize: 14, cursor: 'pointer', fontWeight: 500 },
    toggleActive: { padding: '8px 20px', background: '#f97316', border: 'none', borderRadius: 6, color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 700 },
    saveBadge: { background: '#22c55e', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11, marginLeft: 6, fontWeight: 700 },
    cards: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 64 },
    card: { background: '#1e293b', borderRadius: 16, padding: '32px 28px', border: '1px solid #334155', position: 'relative' },
    cardPro: { border: '2px solid #f97316', boxShadow: '0 0 40px rgba(249,115,22,0.15)' },
    proBadge: { position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#f97316', color: '#fff', borderRadius: 20, padding: '3px 14px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' },
    cardHeader: { marginBottom: 24 },
    planName: { margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#f1f5f9' },
    priceRow: { display: 'flex', alignItems: 'baseline', gap: 6 },
    priceAmt: { fontSize: 40, fontWeight: 900, color: '#f8fafc' },
    pricePer: { color: '#64748b', fontSize: 16 },
    annualNote: { margin: '4px 0 0', color: '#64748b', fontSize: 13 },
    featureList: { listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 },
    feature: { display: 'flex', alignItems: 'flex-start', gap: 10, color: '#94a3b8', fontSize: 14, lineHeight: 1.5 },
    check: { color: '#22c55e', fontWeight: 700, flexShrink: 0, marginTop: 1 },
    freeBtn: { width: '100%', padding: '12px', background: 'transparent', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', fontSize: 15, cursor: 'pointer', fontWeight: 600 },
    proBtn: { width: '100%', padding: '12px', background: '#f97316', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, cursor: 'pointer', fontWeight: 700 },
    faq: { marginBottom: 64 },
    faqTitle: { color: '#f1f5f9', fontSize: 24, fontWeight: 800, marginBottom: 24 },
    faqItem: { borderBottom: '1px solid #1e293b', paddingBottom: 20, marginBottom: 20 },
    faqQ: { margin: '0 0 8px', color: '#f1f5f9', fontSize: 16, fontWeight: 700 },
    faqA: { margin: 0, color: '#64748b', fontSize: 14, lineHeight: 1.6 },
    cta: { background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: 16, padding: '48px 32px', textAlign: 'center', border: '1px solid #4338ca' },
    ctaTitle: { margin: '0 0 12px', fontSize: 28, fontWeight: 800, color: '#f8fafc' },
    ctaText: { margin: '0 0 24px', color: '#94a3b8', fontSize: 16 },
    ctaBtn: { padding: '14px 32px', background: '#f97316', border: 'none', borderRadius: 10, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' },
    authPage: { minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
    authCard: { background: '#1e293b', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 400, border: '1px solid #334155' },
    authLogo: { color: '#f97316', fontSize: 22, fontWeight: 800, marginBottom: 24, textAlign: 'center' },
    authTitle: { margin: '0 0 24px', color: '#f1f5f9', fontSize: 22, fontWeight: 800, textAlign: 'center' },
    authForm: { display: 'flex', flexDirection: 'column', gap: 14 },
    authInput: { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 15, padding: '12px 14px', outline: 'none' },
    authError: { color: '#ef4444', fontSize: 14, margin: 0, textAlign: 'center' },
    authSubmit: { padding: '12px', background: '#f97316', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
    authSwitch: { textAlign: 'center', color: '#64748b', fontSize: 14, marginTop: 16 },
    authSwitchBtn: { background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
    backToPlans: { display: 'block', width: '100%', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13, marginTop: 12, textAlign: 'center' },
};
