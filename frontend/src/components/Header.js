import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Header() {
      const { user, logout, isPro } = useAuth();
      const navigate = useNavigate();
      const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
          logout();
          navigate('/');
  };

  return (
          <header style={styles.header}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>&#9889;</span> ReAmped
      </Link>
            <nav style={styles.nav}>
          <Link to="/" style={styles.navLink}>Search</Link>
              <Link to="/pricing" style={styles.navLink}>Pro</Link>
    {user && <Link to="/watchlist" style={styles.navLink}>Watchlist</Link>}
     {user && isPro && <Link to="/alerts" style={styles.navLink}>Alerts</Link>}
         </nav>
              <div style={styles.actions}>
     {user ? (
                     <>
                       <Link to="/account" style={styles.userChip}>
                         <span style={styles.userAvatar}>{user.email?.[0]?.toUpperCase()}</span>
                     <span style={styles.userEmail}>{user.email}</span>
     {isPro && <span style={styles.proBadge}>PRO</span>}
         </Link>
                    <button style={styles.btnOutline} onClick={handleLogout}>Sign Out</button>
         </>
                ) : (
                                <>
                                  <button style={styles.btnOutline} onClick={() => navigate('/pricing')}>Sign In</button>
                   <button style={styles.btnPrimary} onClick={() => navigate('/pricing')}>Go Pro</button>
         </>
               )}
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
              flexShrink: 0,
      },
      logoIcon: { marginRight: 4 },
      nav: { display: 'flex', gap: 24, alignItems: 'center' },
      navLink: {
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
      },
      actions: { display: 'flex', gap: 12, alignItems: 'center' },
      userChip: {
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 20,
              padding: '4px 12px 4px 4px',
              textDecoration: 'none',
              cursor: 'pointer',
      },
      userAvatar: {
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#f97316',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
      },
      userEmail: { color: '#94a3b8', fontSize: 13, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
      proBadge: { background: '#f97316', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase' },
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
