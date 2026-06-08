import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function AccountPage() {
    const { user, logout, isPro } = useAuth();
    const navigate = useNavigate();

  if (!user) {
        return (
                <div style={styles.gate}>
                  <div style={styles.gateCard}>
                    <div style={styles.gateIcon}>&#128100;</div>
              <h2 style={styles.gateTitle}>Your Account</h2>
              <p style={styles.gateText}>Sign in to access your account settings, watchlist, and price alerts.</p>
              <button style={styles.gateBtn} onClick={() => navigate('/pricing')}>Sign In / Sign Up</button>
          </div>
          </div>
        );
  }

  const handleLogout = () => {
        logout();
        navigate('/');
  };

  const memberSince = user.created_at
      ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'Recently';

  return (
        <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.profileCard}>
          <div style={styles.avatar}>
  {user.email?.[0]?.toUpperCase()}
</div>
          <div style={styles.profileInfo}>
            <h1 style={styles.email}>{user.email}</h1>
{user.display_name && <p style={styles.displayName}>{user.display_name}</p>}
             <div style={styles.badges}>
              <span style={isPro ? styles.proBadge : styles.freeBadge}>
{isPro ? '&#9889; Pro' : 'Free'}
</span>
              <span style={styles.memberBadge}>Member since {memberSince}</span>
  </div>
  </div>
  </div>

        <div style={styles.grid}>
{/* Plan Card */}
            <div style={styles.card}>
            <h2 style={styles.cardTitle}>Your Plan</h2>
{isPro ? (
                <div>
                  <div style={styles.planRow}>
                  <span style={styles.planName}>ReAmped Pro</span>
                    <span style={styles.proBadge}>Active</span>
  </div>
                  <p style={styles.planDesc}>You have access to all Pro features: price alerts, watchlist, and price history.</p>
 {user.subscription_ends_at && (
                     <p style={styles.planNote}>
                       Renews {new Date(user.subscription_ends_at).toLocaleDateString()}
  </p>
                  )}
 </div>
             ) : (
                             <div>
                               <div style={styles.planRow}>
                  <span style={styles.planName}>Free Plan</span>
                   <span style={styles.freeBadge}>Active</span>
               </div>
                 <p style={styles.planDesc}>Upgrade to Pro for price alerts, watchlist, and price history charts.</p>
                 <Link to="/pricing" style={styles.upgradeBtn}>Upgrade to Pro &#8594;</Link>
               </div>
             )}
</div>

{/* Quick Links */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Quick Links</h2>
            <div style={styles.linkList}>
              <Link to="/" style={styles.linkItem}>
                <span style={styles.linkIcon}>&#128269;</span>
                <span style={styles.linkText}>Search Listings</span>
                <span style={styles.linkArrow}>&#8594;</span>
            </Link>
              <Link to="/watchlist" style={styles.linkItem}>
                <span style={styles.linkIcon}>&#10084;</span>
                <span style={styles.linkText}>Watchlist</span>
                <span style={styles.linkArrow}>&#8594;</span>
            </Link>
{isPro && (
                  <Link to="/alerts" style={styles.linkItem}>
                  <span style={styles.linkIcon}>&#128276;</span>
                   <span style={styles.linkText}>Price Alerts</span>
                   <span style={styles.linkArrow}>&#8594;</span>
  </Link>
               )}
              <Link to="/pricing" style={styles.linkItem}>
                <span style={styles.linkIcon}>&#128179;</span>
                <span style={styles.linkText}>Billing &amp; Plans</span>
                <span style={styles.linkArrow}>&#8594;</span>
                </Link>
                </div>
                </div>

{/* Account Actions */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Account</h2>
            <div style={styles.actionList}>
              <div style={styles.actionItem}>
                <span style={styles.actionLabel}>Email</span>
                <span style={styles.actionValue}>{user.email}</span>
            </div>
              <div style={styles.actionItem}>
                <span style={styles.actionLabel}>Tier</span>
                <span style={styles.actionValue}>{isPro ? 'Pro' : 'Free'}</span>
            </div>
              <div style={styles.actionItem}>
                <span style={styles.actionLabel}>Email verified</span>
                <span style={styles.actionValue}>{user.email_verified ? '&#10003; Verified' : 'Pending'}</span>
            </div>
            </div>
            <button style={styles.logoutBtn} onClick={handleLogout}>
                          Sign Out
            </button>
            </div>
            </div>
            </div>
            </div>
  );
}

const styles = {
    page: { background: '#0f172a', minHeight: '100vh', padding: '40px 24px' },
    container: { maxWidth: 900, margin: '0 auto' },
    profileCard: {
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 16,
          padding: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          marginBottom: 28,
    },
    avatar: {
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: '#f97316',
          color: '#fff',
          fontSize: 28,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
    },
    profileInfo: { flex: 1 },
    email: { fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' },
    displayName: { fontSize: 15, color: '#94a3b8', margin: '0 0 12px' },
    badges: { display: 'flex', gap: 10, flexWrap: 'wrap' },
    proBadge: { background: '#f97316', color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 6, padding: '3px 10px' },
    freeBadge: { background: '#1e293b', color: '#94a3b8', fontSize: 12, fontWeight: 600, borderRadius: 6, padding: '3px 10px', border: '1px solid #334155' },
    memberBadge: { color: '#64748b', fontSize: 12, display: 'flex', alignItems: 'center' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 },
    card: { background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: 24 },
    cardTitle: { fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: '0 0 20px' },
    planRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    planName: { fontSize: 16, fontWeight: 600, color: '#f1f5f9' },
    planDesc: { fontSize: 14, color: '#94a3b8', lineHeight: 1.5, margin: '0 0 16px' },
    planNote: { fontSize: 13, color: '#64748b', margin: 0 },
    upgradeBtn: { display: 'inline-block', padding: '9px 18px', background: '#f97316', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 700 },
    linkList: { display: 'flex', flexDirection: 'column', gap: 4 },
    linkItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, textDecoration: 'none', transition: 'background 0.15s' },
    linkIcon: { fontSize: 18, width: 24, textAlign: 'center' },
    linkText: { flex: 1, color: '#cbd5e1', fontSize: 14, fontWeight: 500 },
    linkArrow: { color: '#475569', fontSize: 14 },
    actionList: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 },
    actionItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: 10 },
    actionLabel: { fontSize: 13, color: '#64748b', fontWeight: 600 },
    actionValue: { fontSize: 13, color: '#94a3b8' },
    logoutBtn: { width: '100%', padding: '10px', background: 'transparent', border: '1px solid #475569', borderRadius: 8, color: '#94a3b8', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    gate: { background: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
    gateCard: { background: '#1e293b', borderRadius: 16, padding: 48, maxWidth: 400, textAlign: 'center', border: '1px solid #334155' },
    gateIcon: { fontSize: 48, marginBottom: 16 },
    gateTitle: { fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '0 0 12px' },
    gateText: { color: '#94a3b8', fontSize: 15, margin: '0 0 24px', lineHeight: 1.5 },
    gateBtn: { padding: '12px 28px', background: '#f97316', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
};
