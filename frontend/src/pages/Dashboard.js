import React, { useState, useEffect } from 'react';
import { Bed, Clock, LogOut, RefreshCw, Save, AlertCircle, CheckCircle, Building2, Zap } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const API = 'http://localhost:8080';

export default function Dashboard() {
  const [hospital, setHospital] = useState(null);
  const [verified, setVerified] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [sosAlerts, setSosAlerts] = useState([]);
  const [beds, setBeds] = useState({ icuBeds: 0, generalBeds: 0, opdWaiting: 0, ambulancePhone: '', specialities: '' });
  const nav = useNavigate();
  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email');
  const hospitalId = localStorage.getItem('hospitalId');
  const hospitalName = localStorage.getItem('hospitalName');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await axios.get(`${API}/api/hospitals/all`);
      const mine = data.find(h => String(h.hospitalId) === String(hospitalId));
      if (mine) {
        setHospital(mine);
        setBeds({
          icuBeds: mine.availableIcuBeds ?? 0,
          generalBeds: mine.availableGeneralBeds ?? 0,
          opdWaiting: mine.currentOpdWaiting ?? 0,
          ambulancePhone: mine.ambulancePhone ?? '',
          specialities: mine.specialities ?? ''
        });
      }
    } catch { setError('Failed to load hospital data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const checkVerified = async () => {
      try {
        const res = await fetch(`${API}/api/superadmin/hospitals`);
        const data = await res.json();
        const mine = data.find(h => String(h.id) === String(hospitalId));
        if (mine) setVerified(mine.verified === true || mine.verified === 1);
      } catch {}
    };
    checkVerified();
  }, [hospitalId]);

  useEffect(() => {
    const checkVerified = async () => {
      try {
        const res = await fetch(`${API}/api/superadmin/hospitals`);
        const data = await res.json();
        const mine = data.find(h => String(h.id) === String(hospitalId));
        if (mine) setVerified(mine.verified === true || mine.verified === 1);
      } catch {}
    };
    checkVerified();
  }, [hospitalId]);

  // Poll for active SOS requests every 5 seconds
  useEffect(() => {
    if (!hospitalId) return;
    const fetchSos = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/sos/hospital/${hospitalId}`);
        if (res.ok) {
          const data = await res.json();
          setSosAlerts(data);
        }
      } catch {}
    };
    fetchSos();
    const interval = setInterval(fetchSos, 5000);
    return () => clearInterval(interval);
  }, [hospitalId]);

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      await axios.put(`${API}/api/hospitals/${hospitalId}/beds`, null, {
        params: {
          icuBeds: beds.icuBeds,
          generalBeds: beds.generalBeds,
          opdWaiting: beds.opdWaiting,
          ambulancePhone: beds.ambulancePhone,
          specialities: beds.specialities
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setSaved(true); setTimeout(() => setSaved(false), 3000); load();
    } catch { setError('Failed to save changes.'); }
    finally { setSaving(false); }
  };

  const logout = () => { localStorage.clear(); nav('/'); };

  const tiles = [
    { label: 'ICU Beds Available', value: hospital?.availableIcuBeds ?? 0,    color: 'var(--red)',   bg: 'var(--red-lt)',   Icon: Bed },
    { label: 'General Beds',       value: hospital?.availableGeneralBeds ?? 0, color: 'var(--blue)',  bg: 'var(--blue-lt)',  Icon: Bed },
    { label: 'OPD Waiting (min)',  value: hospital?.currentOpdWaiting ?? 0,    color: 'var(--amber)', bg: 'var(--amber-lt)', Icon: Clock },
    { label: 'Ambulance',          value: hospital?.ambulanceAvailable ? 'Active' : 'N/A', color: 'var(--teal)', bg: 'var(--teal-lt)', Icon: Zap },
  ];

  const verificationBanner = !verified ? (
    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 18px', margin: '16px 32px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 18 }}>⏳</span>
      <div>
        <div style={{ fontWeight: 700, color: '#92400E', fontSize: 14 }}>Hospital Pending Verification</div>
        <div style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>Not visible in search results until approved by MediReach admin.</div>
      </div>
    </div>
  ) : (
    <div style={{ background: '#E8F5E9', border: '1.5px solid #2E7D32', borderRadius: 12, padding: '14px 20px', margin: '16px 32px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 22 }}>✅</span>
      <div style={{ fontWeight: 700, color: '#1B5E20', fontSize: 15 }}>Hospital Verified — Live on MediReach</div>
    </div>
  );


  const noDocsBanner = !verified ? (
    <div style={{
      background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10,
      padding: '10px 18px', marginBottom: 8, display: 'flex',
      alignItems: 'center', gap: 10, flexWrap: 'wrap',
      margin: '0 0 8px 0', boxSizing: 'border-box', width: '100%'
    }}>
      <span style={{ fontSize: 16 }}>📋</span>
      <div style={{ fontSize: 13, color: '#92400E', fontWeight: 500, flex: 1, minWidth: 0 }}>
        Documents not submitted — admin cannot approve without them.
      </div>
      <a href="/submit-documents" style={{ padding: '6px 14px', borderRadius: 6, background: '#F59E0B', color: 'white', fontWeight: 700, fontSize: 12, textDecoration: 'none', flexShrink: 0 }}>
        Upload Now →
      </a>
    </div>
  ) : null;

  return (
    <div className="page" style={{ background: 'var(--gray50)' }}>
      {/* Topbar */}
      <div className="dash-topbar">
        <div className="dash-topbar-inner">
          <div className="row gap12">
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'var(--blue-lt)', border: '1px solid rgba(21,101,192,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Building2 size={18} color="var(--blue)" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 17, color: 'var(--navy)', lineHeight: 1.2 }}>
                {hospital?.hospitalName || hospitalName || 'Hospital Dashboard'}
              </div>
              <div className="f12 c-dim mt2">{email}</div>
            </div>
          </div>
          <div className="row gap8">
            <button className="btn btn-ghost btn-sm row gap6" onClick={load}><RefreshCw size={12} />Refresh</button>
            <button className="btn btn-ghost btn-sm row gap6" onClick={logout}><LogOut size={12} />Logout</button>
          </div>
        </div>
      </div>

      <div className="wrap" style={{ padding: '32px 32px 56px' }}>
        {verificationBanner}
        {noDocsBanner}
        {error && <div className="alert alert-red"><AlertCircle size={15} />{error}</div>}
        {saved && <div className="alert alert-green"><CheckCircle size={15} />Updated — visible to patients instantly!</div>}

        {loading ? (
          <>
            <div className="g4 mb20" style={{ gap: 16 }}>{[...Array(4)].map((_, i) => <div key={i} className="skel" style={{ height: 104 }} />)}</div>
            <div className="g2" style={{ gap: 20 }}><div className="skel" style={{ height: 300 }} /><div className="skel" style={{ height: 300 }} /></div>
          </>
        ) : (
          <>
            {/* Stat tiles */}
            <div className="fu g4 mb28" style={{ gap: 16 }}>
              {tiles.map((t, i) => (
                <div key={i} className="stat-tile">
                  <div className="row-b">
                    <span className="f11 fw6 upper c-dim">{t.label}</span>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <t.Icon size={15} color={t.color} />
                    </div>
                  </div>
                  <div className="stat-num" style={{ color: t.color, fontSize: 34 }}>{t.value}</div>
                </div>
              ))}
            </div>

            <div className="fu1 g2" style={{ gap: 20 }}>
              {/* SOS Alerts */}
              {sosAlerts.length > 0 && (
                <div className="card card-p mb20" style={{ borderLeft: '4px solid var(--red)', gridColumn: '1 / -1' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 18, color: 'var(--red)', marginBottom: 14 }}>🆘 Incoming SOS Alerts</div>
                  {sosAlerts.map((s, i) => (
                    <div key={i} style={{ padding: '12px 0', borderBottom: i < sosAlerts.length - 1 ? '1px solid var(--gray100)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{s.patientName} — {s.patientPhone}</div>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>{s.emergencyDetails || 'Emergency SOS'}</div>
                      </div>
                      <div className="row gap8">
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.status === 'HOSPITAL_NOTIFIED' ? 'var(--red-lt)' : s.status === 'EN_ROUTE' ? '#FFF8E1' : '#E8F5E9', color: s.status === 'HOSPITAL_NOTIFIED' ? 'var(--red)' : s.status === 'EN_ROUTE' ? '#F9A825' : '#2E7D32' }}>{s.status}</span>
                        {s.status === 'HOSPITAL_NOTIFIED' && (
                          <button className="btn btn-blue btn-sm" style={{ fontSize: 11, padding: '4px 12px' }} onClick={async () => {
                            await fetch(`http://localhost:8080/api/sos/status/${s.id}?status=EN_ROUTE`, { method: 'PUT' });
                            setSosAlerts(prev => prev.map(a => a.id === s.id ? { ...a, status: 'EN_ROUTE' } : a));
                          }}>🚑 Accept</button>
                        )}
                        {s.status === 'EN_ROUTE' && (
                          <button className="btn btn-sm" style={{ fontSize: 11, padding: '4px 12px', background: 'var(--green)', color: 'white' }} onClick={async () => {
                            await fetch(`http://localhost:8080/api/sos/status/${s.id}?status=ARRIVED`, { method: 'PUT' });
                            setSosAlerts(prev => prev.map(a => a.id === s.id ? { ...a, status: 'ARRIVED' } : a));
                          }}>✅ Mark Arrived</button>
                        )}
                        {(s.status === 'HOSPITAL_NOTIFIED' || s.status === 'EN_ROUTE') && (
                          <button className="btn btn-sm" style={{ fontSize: 11, padding: '4px 12px', background: 'var(--red-lt)', color: 'var(--red)', border: '1px solid var(--red)' }} onClick={async () => {
                            await fetch(`http://localhost:8080/api/sos/status/${s.id}?status=CANCELLED`, { method: 'PUT' });
                            setSosAlerts(prev => prev.filter(a => a.id !== s.id));
                          }}>✕ Cancel</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Update beds + OPD */}
              <div className="card card-p">
                <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 20, color: 'var(--navy)', marginBottom: 4 }}>
                  Update Live Stats
                </div>
                <p className="c-dim f13 mb24">Changes go live immediately for all patients.</p>

                <div className="inp-wrap">
                  <label className="inp-label">Available ICU Beds</label>
                  <input type="number" className="inp" min={0} value={beds.icuBeds}
                    style={{ borderColor: 'rgba(198,40,40,0.3)' }}
                    onChange={e => setBeds(b => ({ ...b, icuBeds: parseInt(e.target.value) || 0 }))} />
                </div>

                <div className="inp-wrap">
                  <label className="inp-label">Available General Beds</label>
                  <input type="number" className="inp" min={0} value={beds.generalBeds}
                    style={{ borderColor: 'rgba(21,101,192,0.3)' }}
                    onChange={e => setBeds(b => ({ ...b, generalBeds: parseInt(e.target.value) || 0 }))} />
                </div>

                <div className="inp-wrap mb28">
                  <label className="inp-label">OPD Wait Time (minutes)</label>
                  <input type="number" className="inp" min={0} value={beds.opdWaiting}
                    style={{ borderColor: 'rgba(230,81,0,0.3)' }}
                    onChange={e => setBeds(b => ({ ...b, opdWaiting: parseInt(e.target.value) || 0 }))} />
                  <div className="f11 c-dim mt6">Current queue wait time shown to patients</div>
                </div>
                <div className="inp-wrap mb28">
                  <label className="inp-label">Ambulance Phone Number</label>
                  <input type="text" className="inp" value={beds.ambulancePhone}
                    style={{ borderColor: 'rgba(0,137,123,0.3)' }}
                    placeholder="e.g. 02026123456"
                    onChange={e => setBeds(b => ({ ...b, ambulancePhone: e.target.value }))} />
                  <div className="f11 c-dim mt6">Patients call this number to book your ambulance</div>
                </div>

                <div className="inp-wrap mb28">
                  <label className="inp-label">Specialities</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                    {['Cardiac','Orthopaedic','Maternity','Neurology','Paediatrics','Oncology','Burns','Trauma','Nephrology','Psychiatry','Dermatology','ENT','Ophthalmology','Dental','Gastroenterology'].map(tag => {
                      const active = (beds.specialities || '').split(',').map(s => s.trim()).filter(Boolean).includes(tag);
                      return (
                        <span key={tag} onClick={() => {
                          const curr = (beds.specialities || '').split(',').map(s => s.trim()).filter(Boolean);
                          const next = active ? curr.filter(s => s !== tag) : [...curr, tag];
                          setBeds(b => ({ ...b, specialities: next.join(', ') }));
                        }} style={{
                          padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s',
                          background: active ? 'var(--blue)' : 'var(--gray50)',
                          color: active ? 'white' : 'var(--text)',
                          border: `1.5px solid ${active ? 'var(--blue)' : 'var(--gray200)'}`,
                        }}>{tag}</span>
                      );
                    })}
                  </div>
                  <input type="text" className="inp"
                    value={beds.specialities}
                    placeholder="Or type custom e.g. Cardiac, Burns, ENT"
                    onChange={e => setBeds(b => ({ ...b, specialities: e.target.value }))} />
                  <div className="f11 c-dim mt6">Click tags or type custom — saved with your other stats</div>
                </div>

                <button className="btn btn-blue btn-full btn-lg" onClick={save} disabled={saving}>
                  {saving ? <><div className="spin" />Saving…</> : <><Save size={15} />Save All Changes</>}
                </button>
              </div>

              {/* Hospital info */}
              <div className="card card-p">
                <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 20, color: 'var(--navy)', marginBottom: 4 }}>Hospital Info</div>
                <p className="c-dim f13 mb20">Details visible to patients on MediReach</p>
                {hospital ? (
                  [
                    ['Name', hospital.hospitalName],
                    ['Address', hospital.address],
                    ['Ambulance', hospital.ambulanceAvailable ? '✓ Available' : '✕ Not Available'],
                    ['Hospital ID', `#${hospital.hospitalId}`],
                    ['Admin', email]
                  ].map(([k, v]) => (
                    <div key={k} className="row-b" style={{ padding: '12px 0', borderBottom: '1px solid var(--gray100)' }}>
                      <span className="f11 fw6 upper c-dim">{k}</span>
                      <span className="fw5 f13" style={{ textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word', color: 'var(--text)' }}>{v}</span>
                    </div>
                  ))
                ) : (
                  <div className="col" style={{ alignItems: 'center', gap: 10, padding: '32px 0', textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--gray100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertCircle size={24} color="var(--text3)" />
                    </div>
                    <p className="fw6 f14 c-dim">No hospital linked to your account</p>
                    <a href="/register" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>Register your hospital →</a>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
