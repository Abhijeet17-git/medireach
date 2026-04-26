import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token        = params.get('token');
    const email        = params.get('email');
    const role         = params.get('role');
    const hospitalId   = params.get('hospitalId');
    const hospitalName = params.get('hospitalName');

    if (!token) { navigate('/login'); return; }

    localStorage.setItem('token',        token);
    localStorage.setItem('email',        email        || '');
    localStorage.setItem('role',         role         || '');
    localStorage.setItem('hospitalId',   hospitalId   || '');
    localStorage.setItem('hospitalName', hospitalName || '');

    if (role === 'SUPER_ADMIN') navigate('/superadmin', { replace: true });
    else if (role === 'HOSPITAL_ADMIN') navigate('/dashboard', { replace: true });
    else navigate('/hospitals', { replace: true });
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(150deg, var(--navy) 0%, #0D2952 100%)',
      flexDirection: 'column', gap: 16
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.15)',
        borderTop: '3px solid white',
        animation: '_spin 0.7s linear infinite'
      }} />
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: 500 }}>
        Signing you in…
      </p>
      <style>{'@keyframes _spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
}
