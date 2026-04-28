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
              <path d="M32 14C23.2 14 16 21.2 16 30c0 11.8 16 20 16 20s16-8.2 16-20c0-8.8-7.2-16-16-16Z" fill="#fff"/>
              <path d="M35 22h-6v7h-7v6h7v7h6v-7h7v-6h-7z" fill="#D32F2F"/>
            </svg>
          </div>
          <div className="nav-logo-text">
            <strong>Medi<span>Reach</span></strong>
            <small>Emergency Response</small>
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
