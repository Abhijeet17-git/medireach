import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Phone, CheckCircle, AlertTriangle, Navigation } from 'lucide-react';
import axios from 'axios';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const API = 'https://medireach-production-9d50.up.railway.app';

const AMBULANCE_TYPES = [
  { id: 'basic',    label: 'Basic Life Support',   desc: 'Oxygen, first aid, stretcher',        cost: '₹500–800',   color: '#1565C0', bg: '#E3F2FD', icon: '🚑' },
  { id: 'advanced', label: 'Advanced Life Support', desc: 'Cardiac monitor, IV, paramedic',      cost: '₹1200–1800', color: '#6A1B9A', bg: '#F3E5F5', icon: '🚑' },
  { id: 'air',      label: 'Air Ambulance',         desc: 'Critical emergencies / long distance', cost: '₹50,000+',   color: '#B71C1C', bg: '#FFEBEE', icon: '🚁' },
];

function TrackingMap({ patientLat, patientLng, hospitalId, status }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const ambMarker = useRef(null);
  const stepRef = useRef(0);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [patientLng, patientLat],
      zoom: 13,
      attributionControl: false,
    });
    map.on('load', async () => {
      const patEl = document.createElement('div');
      patEl.innerHTML = `<div style="width:36px;height:36px;border-radius:50%;background:#C62828;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 14px rgba(198,40,40,0.5)">👤</div>`;
      new maplibregl.Marker({ element: patEl }).setLngLat([patientLng, patientLat]).addTo(map);
      try {
        const res = await fetch(`${API}/api/hospitals/nearby?lat=${patientLat}&lng=${patientLng}&radius=100`);
        const hospitals = await res.json();
        const hosp = hospitals.find(h => String(h.hospitalId) === String(hospitalId));
        if (hosp) {
          const hospEl = document.createElement('div');
          hospEl.innerHTML = `<div style="width:36px;height:36px;border-radius:50%;background:#1565C0;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 14px rgba(21,101,192,0.5)">🏥</div>`;
          new maplibregl.Marker({ element: hospEl }).setLngLat([hosp.longitude, hosp.latitude]).addTo(map);
          map.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [[hosp.longitude, hosp.latitude], [patientLng, patientLat]] } } });
          map.addLayer({ id: 'route', type: 'line', source: 'route', paint: { 'line-color': '#F9A825', 'line-width': 3, 'line-dasharray': [2, 2] } });
          const bounds = new maplibregl.LngLatBounds();
          bounds.extend([patientLng, patientLat]);
          bounds.extend([hosp.longitude, hosp.latitude]);
          map.fitBounds(bounds, { padding: 60 });
          const ambEl = document.createElement('div');
          ambEl.innerHTML = `<div style="width:40px;height:40px;border-radius:50%;background:#F9A825;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 14px rgba(249,168,37,0.6)">🚑</div>`;
          ambMarker.current = new maplibregl.Marker({ element: ambEl }).setLngLat([hosp.longitude, hosp.latitude]).addTo(map);

          // Start animation immediately based on current status prop
          if ((status === 'EN_ROUTE') && stepRef.current === 0) {
            const steps = 60;
            const iv = setInterval(() => {
              stepRef.current += 1;
              if (stepRef.current >= steps) { clearInterval(iv); return; }
              const t = stepRef.current / steps;
              ambMarker.current?.setLngLat([hosp.longitude + (patientLng - hosp.longitude) * t, hosp.latitude + (patientLat - hosp.latitude) * t]);
            }, 3000);
          } else if (status === 'ARRIVED') {
            ambMarker.current.getElement().innerHTML = `<div style="width:40px;height:40px;border-radius:50%;background:#2E7D32;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px">✅</div>`;
            ambMarker.current.setLngLat([patientLng, patientLat]);
          }
        }
      } catch {}
    });
    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  useEffect(() => {
    if (status === 'ARRIVED' && ambMarker.current) {
      ambMarker.current.getElement().innerHTML = `<div style="width:40px;height:40px;border-radius:50%;background:#2E7D32;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px">✅</div>`;
      ambMarker.current.setLngLat([patientLng, patientLat]);
    }
    if (status === 'EN_ROUTE' && ambMarker.current && stepRef.current === 0) {
      const hospLng = ambMarker.current.getLngLat().lng;
      const hospLat = ambMarker.current.getLngLat().lat;
      const steps = 60;
      const iv = setInterval(() => {
        stepRef.current += 1;
        if (stepRef.current >= steps) { clearInterval(iv); return; }
        const t = stepRef.current / steps;
        ambMarker.current?.setLngLat([hospLng + (patientLng - hospLng) * t, hospLat + (patientLat - hospLat) * t]);
      }, 3000);
    }
  }, [status]);

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: '2px solid var(--gray200)', marginBottom: 16, boxShadow: 'var(--shadow-md)' }}>
      <div style={{ background: status === 'EN_ROUTE' ? '#FFF8E1' : status === 'ARRIVED' ? '#E8F5E9' : '#E3F2FD', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--gray200)' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'EN_ROUTE' ? '#F9A825' : status === 'ARRIVED' ? '#2E7D32' : '#1565C0', animation: status !== 'ARRIVED' ? 'pulse 1.5s infinite' : 'none' }} />
        <span style={{ fontWeight: 700, fontSize: 13, color: status === 'EN_ROUTE' ? '#92400E' : status === 'ARRIVED' ? '#1B5E20' : '#1565C0' }}>
          {status === 'HOSPITAL_NOTIFIED' ? '🏥 Hospital notified — ambulance being dispatched' :
           status === 'EN_ROUTE' ? '🚑 Ambulance is on the way to you' :
           status === 'ARRIVED' ? '✅ Ambulance has arrived!' : '⏳ Connecting...'}
        </span>
      </div>
      <div ref={mapRef} style={{ height: 280, width: '100%' }} />
    </div>
  );
}

export default function SosPage() {
  const [loc, setLoc] = useState(() => {
    const saved = localStorage.getItem('activeSos');
    if (saved) { const d = JSON.parse(saved); return { lat: d.patientLat, lng: d.patientLng }; }
    return null;
  });
  const [locErr, setLocErr] = useState('');
  const [form, setForm] = useState({ patientName: '', patientPhone: '', emergencyDetails: '' });
  const [selectedAmb, setSelectedAmb] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(() => {
    const saved = localStorage.getItem('activeSos');
    return saved ? JSON.parse(saved) : null;
  });
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [paymentChoice, setPaymentChoice] = useState(null);

  const [liveStatus, setLiveStatus] = useState(() => {
    const saved = localStorage.getItem('activeSos');
    return saved ? JSON.parse(saved).status : null;
  });

  useEffect(() => {
    const saved = localStorage.getItem('activeSos');
    if (saved) {
      const data = JSON.parse(saved);
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`https://medireach-production-9d50.up.railway.app/api/sos/status/${data.id}`);
          const s = await res.json();
          setLiveStatus(s.status);
          localStorage.setItem('myPhone', form.patientPhone); localStorage.setItem('activeSos', JSON.stringify({ ...data, status: s.status }));
          if (s.status === 'ARRIVED') clearInterval(interval);
        } catch {}
      }, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      p => setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setLocErr('GPS unavailable — using Pune center.')
    );
  }, []);

  const trigger = async () => {
    if (!form.patientName || !form.patientPhone) { setError('Name and phone number are required.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await axios.post(`${API}/api/sos/trigger`, {
        patientName: form.patientName, patientPhone: form.patientPhone,
        patientEmail: localStorage.getItem('email') || '',
        latitude: loc?.lat || 18.5204, longitude: loc?.lng || 73.8567,
        emergencyDetails: form.emergencyDetails || 'Emergency SOS',
      });
      setResult(data);
      setLiveStatus(data.status);
      localStorage.setItem('myPhone', form.patientPhone); localStorage.setItem('activeSos', JSON.stringify({ id: data.id, hospitalId: data.assignedHospitalId, patientName: data.patientName, status: data.status, patientLat: loc?.lat || 18.5204, patientLng: loc?.lng || 73.8567 }));
      const interval = setInterval(async () => {
        try {
          const { data: s } = await axios.get(`${API}/api/sos/status/${data.id}`);
          setLiveStatus(s.status);
          if (s.status === 'ARRIVED') clearInterval(interval);
        } catch {}
      }, 5000);
      setTimeout(() => clearInterval(interval), 300000);
    } catch { setError('SOS failed. Call 102 immediately.'); }
    finally { setLoading(false); }
  };

  if (result) return (
    <div className="page" style={{ background: 'var(--gray50)' }}>
      <div className="wrap fu" style={{ padding: '60px 32px', maxWidth: 580 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#E8F5E9', border: '2px solid rgba(46,125,50,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={34} color="#2E7D32" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, color: '#2E7D32', marginBottom: 8 }}>Bed Reserved!</h1>
          <p className="c-dim f14">Head to the hospital — ambulance is being dispatched.</p>
        </div>
        <TrackingMap patientLat={loc?.lat || 18.5204} patientLng={loc?.lng || 73.8567} hospitalId={result.assignedHospitalId} status={liveStatus} />
        <div className="card card-p mb16">
          {[
            ['Patient', result.patientName],
            ['Hospital ID', `#${result.assignedHospitalId}`],
            ['Ambulance', selectedAmb ? `${selectedAmb.icon} ${selectedAmb.label} (${selectedAmb.cost})` : 'Dispatching...'],
            ['Status', liveStatus || result.status],
            ['SOS ID', `#${result.id}`],
          ].map(([k, v]) => (
            <div key={k} className="row-b" style={{ padding: '12px 0', borderBottom: '1px solid var(--gray100)' }}>
              <span className="f11 fw6 upper c-dim">{k}</span>
              <span className="fw6 f13" style={{ color: 'var(--text)' }}>{v}</span>
            </div>
          ))}
        </div>
        <a href={`https://www.google.com/maps/dir/?api=1&origin=${loc?.lat || 18.5204},${loc?.lng || 73.8567}&destination=hospital+id+${result.assignedHospitalId}&travelmode=driving`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 0', background: '#1565C0', color: 'white', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none', marginBottom: 12 }}>
          <Navigation size={16} />Get Directions on Google Maps
        </a>
        <div className="alert alert-blue mb12"><MapPin size={14} />Show SOS ID #{result.id} at the hospital reception desk.</div>
        <button onClick={() => { setResult(null); setSelectedAmb(null); setLiveStatus(null); localStorage.removeItem('activeSos'); }} className="btn btn-ghost btn-full">← Trigger Another SOS</button>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}`}</style>
    </div>
  );

  return (
    <div className="page" style={{ background: 'var(--gray50)' }}>
      <div style={{ background: 'linear-gradient(150deg, var(--navy) 0%, #6B0000 100%)', padding: '52px 32px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(198,40,40,0.2) 0%, transparent 65%)' }} />
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
            <div style={{ position: 'absolute', inset: -18, borderRadius: '50%', background: 'rgba(198,40,40,0.15)', border: '1px solid rgba(198,40,40,0.3)' }} />
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, fontSize: 32, boxShadow: '0 8px 32px rgba(198,40,40,0.5)' }}>🆘</div>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 700, color: 'white', marginBottom: 10 }}>Emergency SOS</h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, lineHeight: 1.7 }}>We'll find the nearest hospital with an ICU bed and reserve it instantly.</p>
        </div>
      </div>
      <div className="wrap" style={{ padding: '32px 32px 56px', maxWidth: 560 }}>
        <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 20, background: loc ? '#E8F5E9' : '#FFF8E1', border: `1px solid ${loc ? 'rgba(46,125,50,0.2)' : 'rgba(230,81,0,0.2)'}`, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: loc ? '#2E7D32' : '#E65100' }}>
          <MapPin size={14} />{loc ? `📍 ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` : locErr || 'Detecting GPS location…'}
        </div>
        <div className="card card-p mb16">
          <div className="inp-wrap">
            <label className="inp-label">Your Full Name *</label>
            <input className="inp" placeholder="e.g. Rahul Sharma" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
          </div>
          <div className="inp-wrap">
            <label className="inp-label">Phone Number *</label>
            <div className="inp-icon-wrap">
              <div className="inp-icon"><Phone size={14} /></div>
              <input className="inp inp-has-icon" placeholder="9999999999" value={form.patientPhone} onChange={e => setForm(f => ({ ...f, patientPhone: e.target.value }))} />
            </div>
          </div>
          <div className="inp-wrap mb0">
            <label className="inp-label">Emergency Details (optional)</label>
            <textarea className="inp" rows={2} style={{ resize: 'none' }} placeholder="Describe the emergency briefly…" value={form.emergencyDetails} onChange={e => setForm(f => ({ ...f, emergencyDetails: e.target.value }))} />
          </div>
        </div>
        <div className="card card-p mb16">
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)', marginBottom: 4 }}>🚑 Select Ambulance Type</div>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 14 }}>Optional — helps dispatch the right vehicle</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {AMBULANCE_TYPES.map(amb => (
              <div key={amb.id} onClick={() => setSelectedAmb(selectedAmb?.id === amb.id ? null : amb)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 12, cursor: 'pointer', border: `2px solid ${selectedAmb?.id === amb.id ? amb.color : '#EEEEEE'}`, background: selectedAmb?.id === amb.id ? amb.bg : '#FAFAFA', transition: 'all 0.18s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{amb.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: selectedAmb?.id === amb.id ? amb.color : 'var(--navy)' }}>{amb.label}</div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{amb.desc}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: selectedAmb?.id === amb.id ? amb.color : '#444' }}>{amb.cost}</div>
                  <div style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>approx.</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {error && <div className="alert alert-red mb16"><AlertTriangle size={14} />{error}</div>}
        {otpError && <div className="alert alert-red mb16"><AlertTriangle size={14} />{otpError}</div>}

        {/* Step 1 — Send OTP */}
        {!otpSent && !otpVerified && (
          <button className="btn btn-blue btn-full" style={{ padding: '16px 0', fontSize: 15, fontWeight: 700, borderRadius: 'var(--r-lg)', marginBottom: 10 }}
            onClick={() => {
              if (!form.patientPhone || form.patientPhone.length < 10) { setOtpError('Enter a valid phone number first.'); return; }
              setOtpError('');
              setOtpSent(true);
            }}>
            📱 Send OTP to Verify Phone
          </button>
        )}

        {/* Step 2 — Enter OTP */}
        {otpSent && !otpVerified && (
          <div className="card card-p mb16">
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 4 }}>📱 OTP Sent to {form.patientPhone}</div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Demo OTP: <strong>1234</strong></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="inp" placeholder="Enter 4-digit OTP" maxLength={4} value={otpValue}
                onChange={e => setOtpValue(e.target.value)}
                style={{ flex: 1, fontSize: 20, textAlign: 'center', letterSpacing: 8, fontWeight: 700 }} />
              <button className="btn btn-blue" onClick={() => {
                if (otpValue === '1234') { setOtpVerified(true); setOtpError(''); }
                else setOtpError('Invalid OTP. Try 1234 for demo.');
              }}>Verify</button>
            </div>
          </div>
        )}

        {/* Step 3 — Payment choice + Trigger */}
        {otpVerified && (
          <>
            <div style={{ background: '#E8F5E9', border: '1.5px solid #2E7D32', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 13, fontWeight: 600, color: '#1B5E20', display: 'flex', alignItems: 'center', gap: 8 }}>
              ✅ Phone verified — choose payment method
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div onClick={() => setPaymentChoice('razorpay')}
                style={{ flex: 1, padding: '14px', borderRadius: 12, cursor: 'pointer', border: `2px solid ${paymentChoice === 'razorpay' ? '#1565C0' : 'var(--gray200)'}`, background: paymentChoice === 'razorpay' ? '#E3F2FD' : 'white', textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>💳</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: paymentChoice === 'razorpay' ? '#1565C0' : 'var(--navy)' }}>Pay Now</div>
                <div style={{ fontSize: 11, color: '#888' }}>Razorpay · Priority</div>
              </div>
              <div onClick={() => setPaymentChoice('cash')}
                style={{ flex: 1, padding: '14px', borderRadius: 12, cursor: 'pointer', border: `2px solid ${paymentChoice === 'cash' ? '#2E7D32' : 'var(--gray200)'}`, background: paymentChoice === 'cash' ? '#E8F5E9' : 'white', textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>💵</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: paymentChoice === 'cash' ? '#2E7D32' : 'var(--navy)' }}>Pay at Hospital</div>
                <div style={{ fontSize: 11, color: '#888' }}>Cash · Standard</div>
              </div>
            </div>
            <button className="btn btn-red btn-full"
              style={{ padding: '18px 0', fontSize: 17, fontWeight: 800, letterSpacing: 0.5, borderRadius: 'var(--r-lg)', boxShadow: '0 8px 32px rgba(198,40,40,0.4)', opacity: paymentChoice ? 1 : 0.5 }}
              onClick={async () => {
                if (!paymentChoice) { setError('Please select a payment method.'); return; }
                if (paymentChoice === 'razorpay') {
                  try {
                    const amount = selectedAmb?.id === 'air' ? 5000 : selectedAmb?.id === 'advanced' ? 1500 : 600;
                    const orderRes = await fetch('https://medireach-production-9d50.up.railway.app/api/payment/create-order', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ sosId: 0, amount, patientEmail: localStorage.getItem('email') || '' })
                    });
                    const order = await orderRes.json();
                    const options = {
                      key: order.keyId,
                      amount: order.amount,
                      currency: order.currency,
                      name: 'MediReach',
                      description: 'Ambulance Booking',
                      order_id: order.orderId,
                      handler: async (response) => {
                        await fetch('https://medireach-production-9d50.up.railway.app/api/payment/verify', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(response)
                        });
                        trigger();
                      },
                      prefill: { contact: form.patientPhone, email: localStorage.getItem('email') || '' },
                      theme: { color: '#1565C0' }
                    };
                    const rzp = new window.Razorpay(options);
                    rzp.open();
                  } catch { setError('Payment failed. Try cash option.'); }
                } else {
                  trigger();
                }
              }}
              disabled={loading || !paymentChoice}>
              {loading ? <><div className="spin" style={{ borderTopColor: 'white' }} />Finding Nearest ICU Bed…</> : `🆘 CONFIRM SOS ${paymentChoice === 'razorpay' ? '· Pay & Dispatch' : '· Cash at Hospital'}`}
            </button>
          </>
        )}
        <p className="center c-dimmer f13 mt14">Also call your hospital's ambulance directly</p>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}`}</style>
    </div>
  );
}
