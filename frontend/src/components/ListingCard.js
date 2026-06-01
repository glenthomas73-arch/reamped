import React from 'react';
import { useNavigate } from 'react-router-dom';

const CONDITION_COLORS = {
    mint: '#22c55e', excellent: '#84cc16', good: '#eab308',
    fair: '#f97316', poor: '#ef4444', new: '#22c55e',
};

const PLATFORM_LABELS = {
    reverb: 'Reverb', ebay: 'eBay', guitarcenter: 'Guitar Center', sweetwater: 'Sweetwater',
};

function ScoreBadge({ score }) {
    const color = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';
    return (
          <div style={{ ...styles.badge, background: color }}>
      <span style={styles.badgeScore}>{Math.round(score)}</span>
      <span style={styles.badgeLabel}>Value</span>
  </div>
  );
}

export default function ListingCard({ listing }) {
    const navigate = useNavigate();
    const img = listing.image_urls?.[0];
    const condColor = CONDITION_COLORS[listing.condition] || '#94a3b8';
    const platform = PLATFORM_LABELS[listing.platform] || listing.platform;

  const handleClick = () => {
        if (listing.affiliate_url) {
                window.open(listing.affiliate_url, '_blank', 'noopener,noreferrer');
        }
  };

  return (
        <div style={styles.card} onClick={handleClick}>
        <div style={styles.imageWrap}>
{img ? (
            <img src={img} alt={listing.title} style={styles.image} loading="lazy" />
          ) : (
                      <div style={styles.noImage}>&#127928;</div>
          )}
{listing.value_score != null && (
            <div style={styles.badgeWrap}><ScoreBadge score={listing.value_score} /></div>
          )}
  </div>
      <div style={styles.body}>
        <div style={styles.platformRow}>
          <span style={styles.platformTag}>{platform}</span>
{listing.condition && (
              <span style={{ ...styles.conditionTag, color: condColor, borderColor: condColor }}>
{listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1)}
</span>
          )}
</div>
        <h3 style={styles.title}>{listing.title}</h3>
{listing.brand && <p style={styles.meta}>{listing.brand}{listing.model ? ` ${listing.model}` : ''}</p>}
        <div style={styles.footer}>
          <span style={styles.price}>
            ${parseFloat(listing.price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
</span>
          <span style={styles.shipping}>
{listing.shipping_cost === 0 || listing.shipping_cost === null && listing.shipping_available
              ? '&#10003; Free ship'
                : listing.shipping_cost
              ? `+$${listing.shipping_cost} ship`
                : ''}
  </span>
    </div>
{listing.seller_name && (
            <p style={styles.seller}>
  {listing.seller_name}
{listing.seller_rating ? ` \u2605 ${(listing.seller_rating * 100).toFixed(0)}%` : ''}
  </p>
                                   )}
  </div>
</div>
    );
  }

    const styles = {
    card: {
    background: '#1e293b',
      borderRadius: 12,
      overflow: 'hidden',
        cursor: 'pointer',
      transition: 'transform 0.15s, box-shadow 0.15s',
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
      },
        imageWrap: { position: 'relative', height: 180, background: '#0f172a', overflow: 'hidden' },
        image: { width: '100%', height: '100%', objectFit: 'cover' },
                                              noImage: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 48, color: '#334155' },
    badgeWrap: { position: 'absolute', top: 10, right: 10 },
    badge: { borderRadius: 8, padding: '4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 44 },
            badgeScore: { color: '#fff', fontWeight: 800, fontSize: 16, lineHeight: 1 },
        badgeLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
        body: { padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 },
        platformRow: { display: 'flex', gap: 8, alignItems: 'center' },
  platformTag: { fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
        conditionTag: { fontSize: 11, fontWeight: 600, border: '1px solid', borderRadius: 4, padding: '1px 6px' },
        title: { margin: 0, fontSize: 14, fontWeight: 600, color: '#f1f5f9', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
        meta: { margin: 0, fontSize: 12, color: '#64748b' },
        footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' },
        price: { fontSize: 20, fontWeight: 800, color: '#f97316' },
    shipping: { fontSize: 12, color: '#22c55e' },
        seller: { margin: 0, fontSize: 12, color: '#64748b' },
    };
