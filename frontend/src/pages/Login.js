import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
const API = 'https://medireach-production-9d50.up.railway.app';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nav = useNavigate();

  useEffect(() => { const token = localStorage.getItem('token'); if (token) { const role = localStorage.getItem('role'); nav(role === 'HOSPITAL_ADMIN' ? '/dashboard' : '/hospitals', { replace: true }); } }, []);

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/auth/login`, form);
      ['token','email','role','hospitalId','hospitalName'].forEach(k => localStorage.setItem(k, data[k] || ''));
      if (data.role === 'SUPER_ADMIN') nav('/superadmin', { replace: true });
      else if (data.role === 'HOSPITAL_ADMIN') nav('/dashboard', { replace: true });
      else nav('/hospitals', { replace: true });
    } catch (err) { setError(typeof err.response?.data === 'string' ? err.response.data : 'Login failed. Please check your credentials.'); console.log('Login error:', err.response?.status, err.response?.data); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(150deg, var(--navy) 0%, #0D2952 100%)',
      padding: 24, paddingTop: 'calc(var(--nav-h) + 24px)'
    }}>
      <div style={{ position: 'absolute', top: '30%', left: '50%', width: 600, height: 500, background: 'radial-gradient(ellipse, rgba(21,101,192,0.15) 0%, transparent 65%)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />

      <div className="fu card" style={{ width: '100%', maxWidth: 440, padding: 40, position: 'relative', zIndex: 1 }}>
        <div className="center mb32">
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(21,101,192,0.35)'
          }}>
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
              <path d="M9 3v4M9 11v4M3 9h4M11 9h4" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="9" cy="9" r="2.5" fill="white"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, color: 'var(--navy)', marginBottom: 6, letterSpacing: '-0.4px' }}>Welcome back</h1>
          <p className="c-dim f14">Hospital admins → Dashboard &nbsp;·&nbsp; Patients → Hospital Finder</p>
        </div>

        {error && <div className="alert alert-red">{error}</div>}

        <button className="btn-google mb4" onClick={() => window.location.href = `${API}/oauth2/authorization/google`}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        <div className="divider">or continue with email</div>

        <form onSubmit={submit}>
          <div className="inp-wrap">
            <label className="inp-label">Email Address</label>
            <div className="inp-icon-wrap">
              <div className="inp-icon"><Mail size={14} /></div>
              <input name="email" type="email" className="inp inp-has-icon" placeholder="admin@hospital.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
          </div>
          <div className="inp-wrap mb28">
            <label className="inp-label">Password</label>
            <div className="inp-icon-wrap">
              <div className="inp-icon"><Lock size={14} /></div>
              <input name="password" type={showPw ? 'text' : 'password'} className="inp inp-has-icon"
                style={{ paddingRight: 40 }} placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)',
                display: 'flex', padding: 0
              }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-blue btn-full btn-lg" disabled={loading}>
            {loading ? <><div className="spin" />Signing in…</> : 'Sign In'}
          </button>
        </form>

        <p className="center mt20 c-dim f13">
          No account?{' '}
          <Link to="/register" style={{ color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }}>
            Register your hospital →
          </Link>
        </p>
      </div>
    </div>
  );
}
