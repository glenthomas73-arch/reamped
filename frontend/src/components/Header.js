import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

  return (
        <header style={styles.header}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>&#9889;</span> ReAmped
    </Link>
          <nav style={styles.nav}>
          <Link to="/" style={styles.navLink}>Search</Link>
            <Link to="/pricing" style={styles.navLink}>Pro</Link>
            <a href="https://reverb.com" target="_blank" rel="noopener noreferrer" style={styles.navLink}>Reverb</a>
    </nav>
          <div style={styles.actions}>
          <button style={styles.btnOutline} onClick={() => navigate('/pricing')}>Sign In</button>
            <button style={styles.btnPrimary} onClick={() => navigate('/pricing')}>Go Pro</button>
    </div>
    </div>
    </header>
    );
}

const styles = {
    header: {
          background: '#1a1a2e',
          borderBottom: '1px solid #16213e',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    },
    container: {
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
    },
    logo: {
          color: '#f97316',
          fontSize: 22,
          fontWeight: 800,
          textDecoration: 'none',
          letterSpacing: '-0.5px',
    },
    logoIcon: { marginRight: 4 },
    nav: { display: 'flex', gap: 24, alignItems: 'center' },
    navLink: {
          color: '#94a3b8',
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: 500,
          transition: 'color 0.2s',
    },
    actions: { display: 'flex', gap: 12, alignItems: 'center' },
    btnOutline: {
          padding: '7px 16px',
          background: 'transparent',
          border: '1px solid #334155',
          borderRadius: 6,
          color: '#94a3b8',
          fontSize: 14,
          cursor: 'pointer',
          fontWeight: 500,
    },
    btnPrimary: {
          padding: '7px 16px',
          background: '#f97316',
          border: 'none',
          borderRadius: 6,
          color: '#fff',
          fontSize: 14,
          cursor: 'pointer',
          fontWeight: 600,
    },
};
