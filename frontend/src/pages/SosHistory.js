import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Phone } from 'lucide-react';

const API = 'https://medireach-production-9d50.up.railway.app';

const STATUS_CONFIG = {
  HOSPITAL_NOTIFIED: { bg: '#E3F2FD', border: '#1565C0', color: '#1565C0', icon: '🏥', label: 'Hospital Notified' },
  EN_ROUTE:          { bg: '#FFF8E1', border: '#F9A825', color: '#92400E', icon: '🚑', label: 'En Route' },
  ARRIVED:           { bg: '#E8F5E9', border: '#2E7D32', color: '#1B5E20', icon: '✅', label: 'Arrived' },
  CANCELLED:         { bg: '#FAFAFA', border: '#CCC',    color: '#888',    icon: '✕',  label: 'Cancelled' },
  PENDING:           { bg: '#FFF8E1', border: '#F9A825', color: '#92400E', icon: '⏳', label: 'Pending' },
  NO_BED_AVAILABLE:  { bg: '#FFEBEE', border: '#C62828', color: '#C62828', icon: '❌', label: 'No Bed Available' },
};

export default function SosHistory() {
  const [phone, setPhone] = useState(localStorage.getItem('myPhone') || '');
  const email = localStorage.getItem('email') || '';
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (email) fetchByEmail(email);
    else if (phone) fetchHistory(phone);
  }, []);

  const fetchByEmail = async (e) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/sos/my-by-email?email=${encodeURIComponent(e)}`);
      const data = await res.json();
      setHistory(data);
      setSearched(true);
    } catch {}
    finally { setLoading(false); }
  };

  const fetchHistory = async (p) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/sos/my?phone=${encodeURIComponent(p)}`);
      const data = await res.json();
      setHistory(data.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)));
      setSearched(true);
    } catch {}
    finally { setLoading(false); }
  };

  const resumeTracking = (sos) => {
    localStorage.setItem('activeSos', JSON.stringify({
      id: sos.id,
      hospitalId: sos.assignedHospitalId,
      patientName: sos.patientName,
      status: sos.status,
      patientLat: sos.patientLatitude,
      patientLng: sos.patientLongitude,
    }));
    nav('/sos/track');
  };

  return (
    <div className="page" style={{ background: 'var(--gray50)' }}>
      <div className="wrap fu" style={{ padding: '40px 32px 56px', maxWidth: 600 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>🚑 My SOS Requests</h1>
          <p className="c-dim f13">Enter your phone number to see all your SOS history</p>
        </div>

        <div className="card card-p mb24" style={{ display: 'flex', gap: 10 }}>
          <div className="inp-icon-wrap" style={{ flex: 1 }}>
            <div className="inp-icon"><Phone size={14} /></div>
            <input className="inp inp-has-icon" placeholder="Your phone number" value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchHistory(phone)} />
          </div>
          <button className="btn btn-blue" onClick={() => fetchHistory(phone)} disabled={loading}>
            {loading ? <div className="spin" /> : 'Search'}
          </button>
        </div>

        {searched && history.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>No SOS requests found</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Try a different phone number</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {history.map((sos) => {
            const cfg = STATUS_CONFIG[sos.status] || STATUS_CONFIG.PENDING;
            const active = sos.status === 'HOSPITAL_NOTIFIED' || sos.status === 'EN_ROUTE';
            return (
              <div key={sos.id} className="card card-p" style={{ border: `1.5px solid ${active ? cfg.border : 'var(--gray200)'}`, background: active ? cfg.bg : 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)', marginBottom: 4 }}>
                      SOS #{sos.id} — {sos.patientName}
                    </div>
                    <div style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={11} />
                      {sos.requestedAt ? new Date(sos.requestedAt).toLocaleString('en-IN') : 'Unknown time'}
                    </div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}` }}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#666', marginBottom: active ? 14 : 0 }}>
                  <span><MapPin size={11} style={{ marginRight: 4 }} />Hospital #{sos.assignedHospitalId || 'Not assigned'}</span>
                  <span><Phone size={11} style={{ marginRight: 4 }} />{sos.patientPhone}</span>
                </div>

                {sos.emergencyDetails && (
                  <div style={{ fontSize: 12, color: '#888', marginTop: 8, fontStyle: 'italic' }}>"{sos.emergencyDetails}"</div>
                )}

                {active && (
                  <button className="btn btn-blue btn-full" style={{ marginTop: 12, fontSize: 13 }}
                    onClick={() => resumeTracking(sos)}>
                    🚑 Resume Live Tracking
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
