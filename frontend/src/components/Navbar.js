import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState('');
  const [activeSos, setActiveSos] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('token'));
    setRole(localStorage.getItem('role') || '');
    setActiveSos(!!localStorage.getItem('activeSos'));
  }, [loc]);

  useEffect(() => {
    const handler = () => setActiveSos(!!localStorage.getItem('activeSos'));
    window.addEventListener('storage', handler);
    const interval = setInterval(handler, 2000);
    return () => { window.removeEventListener('storage', handler); clearInterval(interval); };
  }, []);

  const logout = () => { localStorage.clear(); nav('/'); };
  const a = p => `nav-a${loc.pathname === p ? ' on' : ''}`;

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          <div className="nav-logo-icon">
            <svg width="22" height="22" viewBox="0 0 64 64" fill="none" aria-hidden="true">
              <rect width="64" height="64" rx="16" fill="#0F172A"/>
              <rect x="8" y="8" width="48" height="48" rx="12" fill="#DCFCE7"/>
              <path d="M32 18C24.268 18 18 24.268 18 32c0 10.5 14 18 14 18s14-7.5 14-18c0-7.732-6.268-14-14-14Z" fill="#EF4444"/>
              <path d="M35 24h-6v5h-5v6h5v5h6v-5h5v-6h-5z" fill="#FFF"/>
            </svg>
          </div>
          <div className="nav-logo-text">
            <strong>MediReach</strong>
          </div>
        </Link>

        <div className="nav-links">

          {/* SUPER ADMIN */}
          {loggedIn && role === 'SUPER_ADMIN' && (
            <>
              <Link to="/superadmin" className={a('/superadmin')}>🛡️ Admin Panel</Link>
              <button onClick={logout} className="nav-btn-ghost" style={{ marginLeft: 6 }}>Logout</button>
            </>
          )}

          {/* HOSPITAL ADMIN */}
          {loggedIn && role === 'HOSPITAL_ADMIN' && (
            <>
              <Link to="/dashboard" className={a('/dashboard')}>Dashboard</Link>
              <button onClick={logout} className="nav-btn-ghost" style={{ marginLeft: 6 }}>Logout</button>
            </>
          )}

          {/* REGULAR USER */}
          {loggedIn && role === 'USER' && (
            <>
              <Link to="/hospitals" className={a('/hospitals')}>Hospitals</Link>
              <Link to="/bookings" className={a('/bookings')}>Bookings</Link>
              <Link to="/symptoms" className={a('/symptoms')}>Symptom AI</Link>
              <Link to="/sos" className="nav-sos">⚡ SOS</Link>
              <Link to="/sos/history" className={a('/sos/history')}>My Requests</Link>
              {activeSos && (
                <Link to="/sos/track" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: '#FFF8E1', color: '#92400E', fontWeight: 700, fontSize: 12, border: '1.5px solid #FDE68A', textDecoration: 'none', animation: 'pulse 1.5s infinite' }}>
                  🚑 Track My SOS
                </Link>
              )}
              <button onClick={logout} className="nav-btn-ghost" style={{ marginLeft: 6 }}>Logout</button>
            </>
          )}

          {/* NOT LOGGED IN */}
          {!loggedIn && (
            <>
              <Link to="/hospitals" className={a('/hospitals')}>Hospitals</Link>
              <Link to="/login" className={a('/login')}>Login to Book</Link>
              <Link to="/symptoms" className={a('/symptoms')}>Symptom AI</Link>
              <Link to="/sos" className="nav-sos">⚡ SOS</Link>
              <Link to="/login" className={a('/login')}>Login</Link>
              <Link to="/register" className="nav-btn-primary" style={{ marginLeft: 6 }}>Register Hospital</Link>
            </>
          )}

        </div>
      </div>
    </header>
  );
}
