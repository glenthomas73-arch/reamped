import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const CONDITION_COLORS = {
    mint: '#22c55e', excellent: '#84cc16', good: '#eab308',
    fair: '#f97316', poor: '#ef4444', new: '#22c55e',
};

async function fetchListing(platform, id) {
    const res = await fetch(`${API_BASE}/api/search?platform=${platform}&id=${id}&limit=1`);
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();
    return data.listings?.[0] || null;
}

function ScoreBar({ label, score, color }) {
    return (
          <div style={styles.scoreRow}>
      <span style={styles.scoreLabel}>{label}</span>
        <div style={styles.scoreTrack}>
        <div style={{ ...styles.scoreFill, width: `${Math.min(100, score || 0)}%`, background: color }} />
  </div>
      <span style={styles.scoreVal}>{Math.round(score || 0)}</span>
  </div>
  );
}

export default function ListingPage() {
    const { platform, id } = useParams();
    const navigate = useNavigate();

  const { data: listing, isLoading, isError } = useQuery({
        queryKey: ['listing', platform, id],
        queryFn: () => fetchListing(platform, id),
  });

  if (isLoading) return (
        <div style={styles.loading}>
      <div style={styles.spinner} />
      <p style={styles.loadingText}>Loading listing...</p>
    </div>
    );

  if (isError || !listing) return (
        <div style={styles.notFound}>
      <h2 style={styles.notFoundTitle}>Listing Not Found</h2>
        <p style={styles.notFoundText}>This listing may no longer be available.</p>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>&#8592; Go Back</button>
    </div>
    );

  const condColor = CONDITION_COLORS[listing.condition] || '#94a3b8';
    const img = listing.image_urls?.[0];

  return (
        <div style={styles.page}>
      <div style={styles.container}>
        <button style={styles.backLink} onClick={() => navigate(-1)}>&#8592; Back to results</button>

        <div style={styles.layout}>
          <div style={styles.imageSection}>
  {img ? (
                  <img src={img} alt={listing.title} style={styles.mainImage} />
            ) : (
                            <div style={styles.noImage}>&#127928;</div>
            )}
{listing.image_urls?.length > 1 && (
                <div style={styles.thumbRow}>
{listing.image_urls.slice(1, 5).map((url, i) => (
                    <img key={i} src={url} alt={`${listing.title} ${i + 2}`} style={styles.thumb} />
                ))}
                  </div>
            )}
</div>

          <div style={styles.details}>
            <div style={styles.platformRow}>
              <span style={styles.platformBadge}>{listing.platform}</span>
                                      {listing.condition && (
                                                        <span style={{ ...styles.condBadge, color: condColor, borderColor: condColor }}>
{listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1)}
</span>
              )}
</div>

            <h1 style={styles.title}>{listing.title}</h1>

{listing.brand && (
                <p style={styles.meta}>{listing.brand}{listing.model ? ` — ${listing.model}` : ''}</p>
            )}

            <div style={styles.priceRow}>
              <span style={styles.price}>
                ${parseFloat(listing.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
</span>
              {listing.shipping_cost === 0 && (
                                <span style={styles.freeShip}>+ Free Shipping</span>
                             )}
{listing.shipping_cost > 0 && (
                  <span style={styles.shipCost}>+ ${listing.shipping_cost} shipping</span>
               )}
</div>

  {listing.value_score != null && (
                  <div style={styles.scoreCard}>
                    <div style={styles.scoreHeader}>
                  <span style={styles.scoreTitle}>Value Score</span>
                     <span style={styles.scoreBig}>{Math.round(listing.value_score)}/100</span>
    </div>
                <ScoreBar label="Price" score={listing.price_score} color="#f97316" />
                    <ScoreBar label="Condition" score={listing.condition_score} color="#22c55e" />
                    <ScoreBar label="Seller Trust" score={listing.trust_score} color="#3b82f6" />
    </div>
            )}

{listing.seller_name && (
                <div style={styles.sellerCard}>
                <p style={styles.sellerLabel}>Sold by</p>
                 <p style={styles.sellerName}>{listing.seller_name}</p>
 {listing.seller_rating && (
                     <p style={styles.sellerRating}>
                       &#9733; {(listing.seller_rating * 100).toFixed(0)}% positive
  {listing.seller_reviews ? ` (${listing.seller_reviews.toLocaleString()} reviews)` : ''}
  </p>
                  )}
 </div>
             )}

            <a
              href={listing.affiliate_url || listing.listing_url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.ctaBtn}
            >
              View on {listing.platform.charAt(0).toUpperCase() + listing.platform.slice(1)} &#8599;
</a>

{listing.location_city && (
                <p style={styles.location}>&#128205; {listing.location_city}, {listing.location_country}</p>
             )}
</div>
  </div>
  </div>
  </div>
  );
}

const styles = {
    page: { minHeight: '100vh', background: '#0f172a', padding: '24px' },
    container: { maxWidth: 1100, margin: '0 auto' },
    backLink: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 14, padding: '0 0 20px', display: 'block' },
    layout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'flex-start' },
    imageSection: {},
    mainImage: { width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 420 },
    noImage: { width: '100%', height: 420, background: '#1e293b', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, color: '#334155' },
    thumbRow: { display: 'flex', gap: 8, marginTop: 12 },
    thumb: { width: 72, height: 72, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: '2px solid transparent' },
    details: { display: 'flex', flexDirection: 'column', gap: 16 },
    platformRow: { display: 'flex', gap: 10, alignItems: 'center' },
    platformBadge: { background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '3px 10px', color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' },
    condBadge: { border: '1px solid', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 },
    title: { margin: 0, fontSize: 24, fontWeight: 800, color: '#f8fafc', lineHeight: 1.3 },
    meta: { margin: 0, color: '#64748b', fontSize: 15 },
    priceRow: { display: 'flex', alignItems: 'baseline', gap: 12 },
    price: { fontSize: 36, fontWeight: 900, color: '#f97316' },
    freeShip: { fontSize: 14, color: '#22c55e', fontWeight: 600 },
    shipCost: { fontSize: 14, color: '#94a3b8' },
    scoreCard: { background: '#1e293b', borderRadius: 12, padding: '16px 20px', border: '1px solid #334155' },
    scoreHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    scoreTitle: { color: '#94a3b8', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
    scoreBig: { color: '#f97316', fontSize: 24, fontWeight: 900 },
    scoreRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
    scoreLabel: { width: 90, fontSize: 13, color: '#64748b' },
    scoreTrack: { flex: 1, height: 6, background: '#334155', borderRadius: 3, overflow: 'hidden' },
    scoreFill: { height: '100%', borderRadius: 3, transition: 'width 0.6s ease' },
    scoreVal: { width: 32, textAlign: 'right', fontSize: 13, color: '#94a3b8', fontWeight: 600 },
    sellerCard: { background: '#1e293b', borderRadius: 10, padding: '14px 16px', border: '1px solid #334155' },
    sellerLabel: { margin: '0 0 4px', fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 },
    sellerName: { margin: '0 0 4px', fontSize: 15, color: '#f1f5f9', fontWeight: 600 },
    sellerRating: { margin: 0, fontSize: 13, color: '#eab308' },
    ctaBtn: { display: 'block', textAlign: 'center', background: '#f97316', color: '#fff', fontWeight: 700, fontSize: 16, padding: '14px 24px', borderRadius: 10, textDecoration: 'none', transition: 'background 0.2s' },
    location: { margin: 0, fontSize: 13, color: '#64748b' },
    loading: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 },
    spinner: { width: 40, height: 40, border: '3px solid #334155', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    loadingText: { color: '#64748b', fontSize: 16 },
    notFound: { textAlign: 'center', padding: '80px 24px' },
    notFoundTitle: { color: '#f1f5f9', fontSize: 28, fontWeight: 800, marginBottom: 12 },
    notFoundText: { color: '#64748b', fontSize: 16, marginBottom: 24 },
    backBtn: { background: '#f97316', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 700, padding: '12px 24px', cursor: 'pointer' },
};
