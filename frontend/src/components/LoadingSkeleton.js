import React from 'react';

// Pulse animation skeleton loader for search results and listing detail
export function ListingCardSkeleton() {
  return (
    <div className="listing-card skeleton-card" aria-hidden="true">
      <div className="skeleton-image skeleton-pulse" />
      <div className="skeleton-body">
        <div className="skeleton-line skeleton-pulse" style={{ width: '80%', height: '1.1rem', marginBottom: '0.5rem' }} />
        <div className="skeleton-line skeleton-pulse" style={{ width: '50%', height: '0.85rem', marginBottom: '0.4rem' }} />
        <div className="skeleton-line skeleton-pulse" style={{ width: '35%', height: '1.4rem', marginBottom: '0.6rem' }} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="skeleton-badge skeleton-pulse" />
          <div className="skeleton-badge skeleton-pulse" style={{ width: '3.5rem' }} />
        </div>
      </div>
    </div>
  );
}

export function SearchResultsSkeleton({ count = 8 }) {
  return (
    <div className="results-grid" aria-label="Loading results..." aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListingDetailSkeleton() {
  return (
    <div className="listing-detail skeleton-detail" aria-hidden="true">
      <div className="skeleton-detail-image skeleton-pulse" />
      <div className="skeleton-detail-body">
        <div className="skeleton-line skeleton-pulse" style={{ width: '70%', height: '1.8rem', marginBottom: '0.8rem' }} />
        <div className="skeleton-line skeleton-pulse" style={{ width: '40%', height: '2rem', marginBottom: '1rem' }} />
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <div className="skeleton-badge skeleton-pulse" />
          <div className="skeleton-badge skeleton-pulse" style={{ width: '3.5rem' }} />
          <div className="skeleton-badge skeleton-pulse" style={{ width: '5rem' }} />
        </div>
        <div className="skeleton-line skeleton-pulse" style={{ width: '100%', height: '0.85rem', marginBottom: '0.4rem' }} />
        <div className="skeleton-line skeleton-pulse" style={{ width: '95%', height: '0.85rem', marginBottom: '0.4rem' }} />
        <div className="skeleton-line skeleton-pulse" style={{ width: '88%', height: '0.85rem', marginBottom: '0.4rem' }} />
        <div className="skeleton-line skeleton-pulse" style={{ width: '60%', height: '0.85rem', marginBottom: '1.5rem' }} />
        <div className="skeleton-line skeleton-pulse" style={{ width: '12rem', height: '2.5rem', borderRadius: '0.375rem' }} />
      </div>
    </div>
  );
}

export function FilterBarSkeleton() {
  return (
    <div className="filter-bar-skeleton" aria-hidden="true">
      {[120, 90, 110, 80, 100].map((w, i) => (
        <div
          key={i}
          className="skeleton-pulse"
          style={{ width: w, height: '2.25rem', borderRadius: '0.375rem' }}
        />
      ))}
    </div>
  );
}
