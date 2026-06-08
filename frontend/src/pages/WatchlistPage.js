import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const CONDITION_COLORS = {
    mint: '#22c55e', excellent: '#84cc16', good: '#eab308',
    fair: '#f97316', poor: '#ef4444', new: '#22c55e',
};

async function fetchWatchlist(token) {
    const res = await fetch(`${API}/api/watchlist`, {
          headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load watchlist');
    return res.json();
}

async function removeFromWatchlist(token, listingId) {
    const res = await fetch(`${API}/api/watchlist/${listingId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to remove');
}

function WatchlistCard({ item, onRemove }) {
    const img = item.image_urls?.[0];
    const condColor = CONDITION_COLORS[item.condition] || '#94a3b8';
    const score = item.value_score;
    const scoreColor = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';

  return (
        <div style={styles.card}>
      <div style={styles.imageWrap}>
  {img
             ? <img src={img} alt={item.title} style={styles.image} loading="lazy" />
                                   : <div style={styles.noImage}>&#127928;</div>
                        }
  {score != null && (
                         <div style={{ ...styles.scoreBadge, background: scoreColor }}>
                <span style={styles.scoreNum}>{Math.round(score)}</span>
            <span style={styles.scoreLabel}>Value</span>
  </div>
        )}
</div>
      <div style={styles.body}>
        <div style={styles.tags}>
          <span style={styles.platform}>{item.platform}</span>
{item.condition && (
              <span style={{ ...styles.cond, color: condColor, borderColor: condColor }}>
{item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
</span>
          )}
</div>
        <h3 style={styles.title}>{item.title}</h3>
{item.brand && <p style={styles.meta}>{item.brand}{item.model ? ` ${item.model}` : ''}</p>}
        <div style={styles.footer}>
          <span style={styles.price}>
            ${parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 0 })}
</span>
          <div style={styles.actions}>
{item.affiliate_url && (
                <a href={item.affiliate_url} target="_blank" rel="noopener noreferrer" style={styles.viewBtn}>
                View Deal
  </a>
            )}
            <button style={styles.removeBtn} onClick={() => onRemove(item.id)}>&#10005;</button>
              </div>
              </div>
              </div>
              </div>
  );
}

export default function WatchlistPage() {
    const { user, token, isPro } = useAuth();
    const navigate = useNavigate();
    const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
        queryKey: ['watchlist'],
        queryFn: () => fetchWatchlist(token),
        enabled: !!token,
  });

  const removeMutation = useMutation({
        mutationFn: (listingId) => removeFromWatchlist(token, listingId),
        onSuccess: () => qc.invalidateQueries(['watchlist']),
  });

  if (!user) {
        return (
                <div style={styles.gate}>
                  <div style={styles.gateCard}>
                    <div style={styles.gateIcon}>&#10084;</div>
              <h2 style={styles.gateTitle}>Save Your Favourites</h2>
              <p style={styles.gateText}>Sign in to save listings to your watchlist and track the best deals.</p>
              <button style={styles.gateBtn} onClick={() => navigate('/pricing')}>Sign In / Sign Up</button>
          </div>
          </div>
        );
  }

  const items = data?.items || data || [];

  return (
        <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>&#10084; Watchlist</h1>
            <p style={styles.pageSubtitle}>
  {items.length > 0 ? `${items.length} saved listing${items.length !== 1 ? 's' : ''}` : 'No saved listings yet'}
</p>
  </div>

{isLoading && (
            <div style={styles.grid}>
{[1,2,3,4].map(i => <div key={i} style={styles.skeleton} />)}
               </div>
                       )}

{isError && (
            <p style={styles.error}>Failed to load watchlist. Please try again.</p>
         )}

{!isLoading && !isError && items.length === 0 && (
            <div style={styles.empty}>
            <div style={styles.emptyIcon}>&#127928;</div>
             <h3 style={styles.emptyTitle}>Your watchlist is empty</h3>
             <p style={styles.emptyText}>Browse listings and click the bookmark icon to save deals you love.</p>
             <Link to="/" style={styles.emptyBtn}>Start Searching</Link>
  </div>
         )}

{!isLoading && items.length > 0 && (
            <div style={styles.grid}>
{items.map(item => (
                <WatchlistCard
                           key={item.id}
                item={item}
                onRemove={(id) => removeMutation.mutate(id)}
              />
                              ))}
                  </div>
        )}
</div>
          </div>
  );
}

const styles = {
    page: { background: '#0f172a', minHeight: '100vh', padding: '40px 24px' },
    container: { maxWidth: 1200, margin: '0 auto' },
    pageHeader: { marginBottom: 32 },
    pageTitle: { fontSize: 28, fontWeight: 800, color: '#f1f5f9', margin: '0 0 8px' },
    pageSubtitle: { color: '#64748b', fontSize: 15 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 },
    skeleton: { height: 300, background: '#1e293b', borderRadius: 12, border: '1px solid #334155' },
    error: { color: '#ef4444', textAlign: 'center', padding: 40 },
    empty: { textAlign: 'center', padding: '80px 24px' },
    emptyIcon: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px' },
    emptyText: { color: '#64748b', fontSize: 15, margin: '0 0 24px' },
    emptyBtn: { display: 'inline-block', padding: '10px 24px', background: '#f97316', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 15 },
    gate: { background: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
    gateCard: { background: '#1e293b', borderRadius: 16, padding: 48, maxWidth: 400, textAlign: 'center', border: '1px solid #334155' },
    gateIcon: { fontSize: 48, marginBottom: 16 },
    gateTitle: { fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '0 0 12px' },
    gateText: { color: '#94a3b8', fontSize: 15, margin: '0 0 24px', lineHeight: 1.5 },
    gateBtn: { padding: '12px 28px', background: '#f97316', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
    card: { background: '#1e293b', borderRadius: 12, overflow: 'hidden', border: '1px solid #334155', display: 'flex', flexDirection: 'column' },
    imageWrap: { position: 'relative', height: 180, background: '#0f172a', overflow: 'hidden' },
    image: { width: '100%', height: '100%', objectFit: 'cover' },
    noImage: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 40, color: '#334155' },
    scoreBadge: { position: 'absolute', top: 10, right: 10, borderRadius: 8, padding: '4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 44 },
    scoreNum: { color: '#fff', fontWeight: 800, fontSize: 16, lineHeight: 1 },
    scoreLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' },
    body: { padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 },
    tags: { display: 'flex', gap: 8, alignItems: 'center' },
    platform: { fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
    cond: { fontSize: 11, fontWeight: 600, border: '1px solid', borderRadius: 4, padding: '1px 6px' },
    title: { margin: 0, fontSize: 14, fontWeight: 600, color: '#f1f5f9', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
    meta: { margin: 0, fontSize: 12, color: '#64748b' },
    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', gap: 8 },
    price: { fontSize: 20, fontWeight: 800, color: '#f97316' },
    actions: { display: 'flex', gap: 8, alignItems: 'center' },
    viewBtn: { padding: '5px 12px', background: '#f97316', borderRadius: 6, color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 600 },
    removeBtn: { width: 28, height: 28, borderRadius: '50%', background: 'transparent', border: '1px solid #475569', color: '#64748b', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
};
