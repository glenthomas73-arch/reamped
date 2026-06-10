import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function AccountPage() {
      const { user, token, logout, isPro } = useAuth();
      const navigate = useNavigate();
      const [subStatus, setSubStatus] = useState(null);
      const [subLoading, setSubLoading] = useState(false);
      const [cancelLoading, setCancelLoading] = useState(false);
      const [cancelConfirm, setCancelConfirm] = useState(false);
      const [cancelDone, setCancelDone] = useState(null); // { cancel_at }
  const [subError, setSubError] = useState('');

  const fetchSubStatus = useCallback(async () => {
          if (!token || !isPro) return;
          setSubLoading(true);
          try {
                    const res = await fetch(`${API_BASE}/api/subscriptions/status`, {
                                headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) {
                                const data = await res.json();
                                setSubStatus(data);
                    }
          } catch (_) {}
          finally { setSubLoading(false); }
  }, [token, isPro]);

  useEffect(() => { fetchSubStatus(); }, [fetchSubStatus]);

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

  const handleLogout = () => { logout(); navigate('/'); };

  const handleCancelSubscription = async () => {
          if (!cancelConfirm) { setCancelConfirm(true); return; }
          setCancelLoading(true);
          setSubError('');
          try {
                    const res = await fetch(`${API_BASE}/api/subscriptions/cancel`, {
                                method: 'POST',
                                headers: { Authorization: `Bearer ${token}` },
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Cancellation failed');
                    setCancelDone({ cancel_at: data.cancel_at });
                    setCancelConfirm(false);
                    fetchSubStatus(); // refresh status
          } catch (err) {
                    setSubError(err.message);
          } finally {
                    setCancelLoading(false);
          }
  };

  const memberSince = user.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          : 'Recently';

  const formatDate = (iso) =>
          iso ? new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';

  const planLabel = subStatus?.plan === 'annual' ? 'Annual' : 'Monthly';
      const renewsOrEnds = subStatus?.cancel_at_period_end ? 'Ends' : 'Renews';
      const periodEnd = subStatus?.current_period_end
        ? formatDate(subStatus.current_period_end)
              : user.subscription_ends_at
          ? formatDate(user.subscription_ends_at)
                : null;

  return (
          <div style={styles.page}>
      <div style={styles.container}>

  {/* Profile header */}
              <div style={styles.profileCard}>
          <div style={styles.avatar}>{user.email?.[0]?.toUpperCase()}</div>
          <div style={styles.profileInfo}>
            <h1 style={styles.email}>{user.email}</h1>
{user.display_name && <p style={styles.displayName}>{user.display_name}</p>}
             <div style={styles.badges}>
              <span style={isPro ? styles.proBadge : styles.freeBadge}>
{isPro ? '\u26A1 Pro' : 'Free'}
</span>
              <span style={styles.memberBadge}>Member since {memberSince}</span>
    </div>
    </div>
    </div>

        <div style={styles.grid}>

{/* Plan / Billing Card */}
              <div style={styles.card}>
            <h2 style={styles.cardTitle}>Your Plan</h2>
{isPro ? (
                  <div>
{cancelDone && (
                      <div style={styles.flashWarn}>
                        Subscription cancelled. You'll keep Pro access until {formatDate(cancelDone.cancel_at)}.
    </div>
                 )}
{subError && <div style={styles.flashError}>{subError}</div>}

                <div style={styles.planRow}>
                  <span style={styles.planName}>ReAmped Pro</span>
 {subStatus?.cancel_at_period_end
                      ? <span style={styles.cancellingBadge}>Cancelling</span>
                      : <span style={styles.proBadge}>Active</span>}
                          </div>

  {subLoading ? (
                        <p style={styles.planNote}>Loading billing details...</p>
                   ) : subStatus ? (
                                         <div style={styles.billingDetails}>
                                           <div style={styles.billingRow}>
                                             <span style={styles.billingLabel}>Plan</span>
                                             <span style={styles.billingValue}>{planLabel}</span>
                       </div>
                                           <div style={styles.billingRow}>
                                             <span style={styles.billingLabel}>{renewsOrEnds}</span>
                                             <span style={styles.billingValue}>{periodEnd}</span>
                       </div>
                                           <div style={styles.billingRow}>
                                             <span style={styles.billingLabel}>Status</span>
                                             <span style={styles.billingValue}>{subStatus.status}</span>
                       </div>
                       </div>
                                       ) : (
                                         periodEnd && (
                                                                 <p style={styles.planNote}>{renewsOrEnds} {periodEnd}</p>
                                         )
                   )}

                 <p style={styles.planDesc}>You have access to all Pro features: price alerts, watchlist, and price history.</p>

  {!subStatus?.cancel_at_period_end && !cancelDone && (
                        <div style={styles.cancelWrap}>
  {cancelConfirm ? (
                            <div style={styles.cancelConfirmBox}>
                              <p style={styles.cancelConfirmText}>
                                Are you sure? You'll keep Pro access until the end of your billing period.
      </p>
                              <div style={styles.cancelBtnRow}>
                                <button style={styles.cancelConfirmBtn} onClick={handleCancelSubscription} disabled={cancelLoading}>
  {cancelLoading ? 'Cancelling...' : 'Yes, cancel my plan'}
      </button>
                                <button style={styles.cancelAbortBtn} onClick={() => setCancelConfirm(false)}>
                                  Keep my plan
      </button>
      </div>
      </div>
                          ) : (
                                                          <button style={styles.cancelLink} onClick={handleCancelSubscription}>
                              Cancel subscription
      </button>
                          )}
  </div>
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

{/* Account info + sign out */}
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
                <span style={styles.actionLabel}>Member since</span>
                <span style={styles.actionValue}>{memberSince}</span>
              </div>
              </div>
            <button style={styles.logoutBtn} onClick={handleLogout}>Sign Out</button>
              </div>
              </div>
              </div>
              </div>
  );
}

const styles = {
      page: { minHeight: '100vh', background: '#0f0f0f', padding: '40px 16px' },
      container: { maxWidth: 960, margin: '0 auto' },
      gate: { minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' },
      gateCard: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, padding: 40, textAlign: 'center', maxWidth: 380 },
      gateIcon: { fontSize: 48, marginBottom: 16 },
      gateTitle: { color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 12px' },
      gateText: { color: '#888', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 },
      gateBtn: { padding: '12px 28px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
      profileCard: { display: 'flex', alignItems: 'center', gap: 20, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, padding: '24px 28px', marginBottom: 24 },
      avatar: { width: 56, height: 56, borderRadius: '50%', background: '#7c3aed', color: '#fff', fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
      profileInfo: { flex: 1, minWidth: 0 },
      email: { color: '#fff', fontSize: 18, fontWeight: 600, margin: '0 0 4px', wordBreak: 'break-all' },
      displayName: { color: '#888', fontSize: 14, margin: '0 0 10px' },
      badges: { display: 'flex', gap: 8, flexWrap: 'wrap' },
      proBadge: { background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid #7c3aed', borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 600 },
      freeBadge: { background: '#2a2a2a', color: '#888', border: '1px solid #444', borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 600 },
      cancellingBadge: { background: 'rgba(234,179,8,0.15)', color: '#fbbf24', border: '1px solid #b45309', borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 600 },
      memberBadge: { color: '#555', fontSize: 12, padding: '2px 0' },
      grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
      card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, padding: '24px 24px' },
      cardTitle: { color: '#fff', fontSize: 16, fontWeight: 700, margin: '0 0 18px' },
      flashWarn: { background: '#2d2700', border: '1px solid #856404', color: '#ffc107', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, lineHeight: 1.5 },
      flashError: { background: '#3b0d0d', border: '1px solid #7f1d1d', color: '#fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 },
      planRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
      planName: { color: '#fff', fontSize: 15, fontWeight: 600 },
      planDesc: { color: '#888', fontSize: 13, lineHeight: 1.6, marginBottom: 16 },
      planNote: { color: '#666', fontSize: 13, marginBottom: 12 },
      billingDetails: { background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 8, padding: '12px 14px', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 },
      billingRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13 },
      billingLabel: { color: '#666' },
      billingValue: { color: '#ccc', fontWeight: 500, textTransform: 'capitalize' },
      upgradeBtn: { display: 'inline-block', padding: '10px 20px', background: '#7c3aed', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' },
      cancelWrap: { marginTop: 8 },
      cancelConfirmBox: { background: '#1c1010', border: '1px solid #7f1d1d', borderRadius: 8, padding: '14px 16px' },
      cancelConfirmText: { color: '#fca5a5', fontSize: 13, lineHeight: 1.5, margin: '0 0 12px' },
      cancelBtnRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
      cancelConfirmBtn: { padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
      cancelAbortBtn: { padding: '8px 16px', background: '#2a2a2a', color: '#ccc', border: '1px solid #444', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
      cancelLink: { background: 'none', border: 'none', color: '#666', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', padding: 0 },
      linkList: { display: 'flex', flexDirection: 'column', gap: 4 },
      linkItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#111', borderRadius: 8, textDecoration: 'none', color: 'inherit' },
      linkIcon: { fontSize: 18, width: 24, textAlign: 'center' },
      linkText: { flex: 1, color: '#ccc', fontSize: 14 },
      linkArrow: { color: '#555', fontSize: 14 },
      actionList: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 },
      actionItem: { display: 'flex', justifyContent: 'space-between', gap: 12 },
      actionLabel: { color: '#666', fontSize: 13 },
      actionValue: { color: '#ccc', fontSize: 13, fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' },
      logoutBtn: { width: '100%', padding: '10px 0', background: '#1e0000', color: '#f87171', border: '1px solid #7f1d1d', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
};
