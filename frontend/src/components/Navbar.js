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
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3v4M9 11v4M3 9h4M11 9h4" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="9" cy="9" r="2.5" fill="white"/>
            </svg>
          </div>
          Medi<span>Reach</span>
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
              <Link to="/bookings" className={a('/bookings')}>Bookings</Link>
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
