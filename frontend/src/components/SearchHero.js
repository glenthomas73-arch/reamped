import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const QUICK_SEARCHES = ['Fender Stratocaster', 'Gibson Les Paul', 'Boss DS-1', 'Fender Twin Reverb', 'Roland TR-808', 'Moog Minimoog'];

export default function SearchHero({ onSearch }) {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

  const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
                if (onSearch) onSearch(query.trim());
                else navigate(`/?q=${encodeURIComponent(query.trim())}`);
        }
  };

  return (
        <div style={styles.hero}>
      <div style={styles.container}>
        <div style={styles.badge}>&#9889; Every deal. One search.</div>
          <h1 style={styles.title}>
          Find used gear.<br />
              <span style={styles.accent}>Beat every price.</span>
    </h1>
          <p style={styles.subtitle}>
          We search Reverb, eBay, Guitar Center Used and more simultaneously,
              then score every listing so you always find the best deal.
    </p>
          <form style={styles.form} onSubmit={handleSubmit}>
              <div style={styles.inputWrap}>
            <span style={styles.searchIcon}>&#128269;</span>
              <input
                style={styles.input}
              type="text"
              placeholder="Search guitars, amps, pedals, synths..."
              value={query}
              onChange={e => setQuery(e.target.value)}
                              autoFocus
            />
            <button type="submit" style={styles.searchBtn}>Search</button>
                </div>
                </form>
        <div style={styles.quickRow}>
          <span style={styles.quickLabel}>Try:</span>
{QUICK_SEARCHES.map(q => (
              <button key={q} style={styles.quickChip} onClick={() => {
                              setQuery(q);
                              if (onSearch) onSearch(q);
                              else navigate(`/?q=${encodeURIComponent(q)}`);
              }}>{q}</button>
                              ))}
</div>
        <div style={styles.statsRow}>
          <div style={styles.stat}><span style={styles.statNum}>2M+</span><span style={styles.statLabel}>Listings indexed</span></div>
          <div style={styles.statDiv} />
          <div style={styles.stat}><span style={styles.statNum}>4</span><span style={styles.statLabel}>Platforms searched</span></div>
          <div style={styles.statDiv} />
          <div style={styles.stat}><span style={styles.statNum}>0-100</span><span style={styles.statLabel}>Value score every deal</span></div>
  </div>
  </div>
                </div>
  );
}

const styles = {
    hero: { background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', padding: '80px 24px 60px', textAlign: 'center' },
  container: { maxWidth: 720, margin: '0 auto' },
    badge: { display: 'inline-block', background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', color: '#f97316', borderRadius: 20, padding: '5px 16px', fontSize: 13, fontWeight: 600, marginBottom: 24 },
                      title: { margin: '0 0 16px', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, color: '#f8fafc', lineHeight: 1.1, letterSpacing: '-1px' },
    accent: { color: '#f97316' },
    subtitle: { margin: '0 0 36px', fontSize: 18, color: '#94a3b8', lineHeight: 1.6 },
    form: { marginBottom: 20 },
    inputWrap: { display: 'flex', alignItems: 'center', background: '#1e293b', border: '2px solid #334155', borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s' },
    searchIcon: { padding: '0 12px', fontSize: 18, color: '#64748b' },
    input: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: 16, padding: '16px 0', caretColor: '#f97316' },
  searchBtn: { padding: '16px 28px', background: '#f97316', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s', whiteSpace: 'nowrap' },
    quickRow: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 48 },
    quickLabel: { fontSize: 13, color: '#64748b', marginRight: 4 },
    quickChip: { padding: '4px 12px', background: 'transparent', border: '1px solid #334155', borderRadius: 16, color: '#94a3b8', fontSize: 12, cursor: 'pointer' },
    statsRow: { display: 'flex', gap: 0, justifyContent: 'center', alignItems: 'center' },
    stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 32px' },
    statNum: { fontSize: 28, fontWeight: 900, color: '#f8fafc' },
    statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
    statDiv: { width: 1, height: 40, background: '#334155' },
};
