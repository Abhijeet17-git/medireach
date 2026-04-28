import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, Search, RefreshCw, AlertCircle, X, Navigation } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import axios from 'axios';
const API = 'https://medireach-production-9d50.up.railway.app';

const AMBULANCE_TYPES = [
  { id: 'basic',    label: 'Basic Life Support',    desc: 'Oxygen, first aid',           cost: '₹500–800',   color: '#1565C0', bg: '#E3F2FD', icon: '🚑' },
  { id: 'advanced', label: 'Advanced Life Support',  desc: 'Cardiac monitor, paramedic', cost: '₹1200–1800', color: '#6A1B9A', bg: '#F3E5F5', icon: '🚑' },
  { id: 'air',      label: 'Air Ambulance',          desc: 'Critical / long distance',   cost: '₹50,000+',   color: '#B71C1C', bg: '#FFEBEE', icon: '🚁' },
];

function BedBar({ available, total }) {
  const pct = total > 0 ? Math.round((available / total) * 100) : 0;
  const color = pct > 50 ? 'var(--green)' : pct > 20 ? 'var(--amber)' : 'var(--red)';
  return <div className="bed-track"><div className="bed-fill" style={{ width: `${pct}%`, background: color }} /></div>;
}

function MapModal({ hospital, userCoords, onClose }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [selectedAmb, setSelectedAmb] = useState(null);

  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const hLat = hospital.latitude;
    const hLng = hospital.longitude;
    const uLat = userCoords?.lat || 18.5204;
    const uLng = userCoords?.lng || 73.8567;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [hLng, hLat],
      zoom: 14,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      const hospEl = document.createElement('div');
      hospEl.innerHTML = `<div style="width:44px;height:44px;border-radius:50%;background:#C62828;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 16px rgba(198,40,40,0.5);cursor:pointer">🏥</div>`;
      new maplibregl.Marker({ element: hospEl })
        .setLngLat([hLng, hLat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<strong>${hospital.hospitalName}</strong><br/>${hospital.address}`))
        .addTo(map);

      const userEl = document.createElement('div');
      userEl.innerHTML = `<div style="width:36px;height:36px;border-radius:50%;background:#1565C0;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 12px rgba(21,101,192,0.5)">📍</div>`;
      new maplibregl.Marker({ element: userEl })
        .setLngLat([uLng, uLat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML('<strong>Your Location</strong>'))
        .addTo(map);

      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [[uLng, uLat], [hLng, hLat]] } }
      });
      map.addLayer({
        id: 'route', type: 'line', source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#1565C0', 'line-width': 3, 'line-dasharray': [2, 2] }
      });

      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([uLng, uLat]);
      bounds.extend([hLng, hLat]);
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 1000 });
    });

    mapInstanceRef.current = map;
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  // Google Maps directions URL
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userCoords?.lat || 18.5204},${userCoords?.lng || 73.8567}&destination=${hospital.latitude},${hospital.longitude}&travelmode=driving`;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,22,40,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(6px)', animation: 'fadeIn 0.2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 780, boxShadow: '0 32px 80px rgba(10,22,40,0.4)', overflow: 'hidden', maxHeight: '92vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #EEEEEE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>{hospital.hospitalName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#888', fontSize: 13, marginTop: 4 }}>
              <MapPin size={12} />{hospital.address}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: '#F5F5F5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#E0E0E0'}
            onMouseLeave={e => e.currentTarget.style.background = '#F5F5F5'}>
            <X size={16} color="#666" />
          </button>
        </div>

        {/* Map */}
        <div ref={mapRef} style={{ height: 320, width: '100%' }} />

        {/* Stats */}
        <div style={{ padding: '16px 24px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'ICU Beds',     val: hospital.availableIcuBeds ?? 0,          color: (hospital.availableIcuBeds ?? 0) === 0 ? '#C62828' : '#2E7D32' },
              { label: 'General Beds', val: hospital.availableGeneralBeds ?? 0,       color: '#1565C0' },
              { label: 'OPD Wait',     val: `${hospital.currentOpdWaiting ?? 0} min`, color: '#E65100' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#FAFAFA', borderRadius: 10, padding: '12px 14px', border: '1px solid #EEEEEE', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 22, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', fontWeight: 600, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Google Maps directions button */}
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px 0', background: '#1565C0', color: 'white', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none', marginBottom: 20 }}>
            <Navigation size={16} />
            Get Directions on Google Maps
          </a>
        </div>

        {/* Ambulance options — only show if hospital has ambulance */}
        {hospital.ambulanceAvailable && (
          <div style={{ padding: '0 24px 24px' }}>
            <div style={{ borderTop: '1px solid #EEEEEE', paddingTop: 16, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)', marginBottom: 4 }}>🚑 Ambulance Options</div>
              <div style={{ fontSize: 12, color: '#999' }}>Select a type to call or book</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {AMBULANCE_TYPES.map(amb => (
                <div key={amb.id}
                  onClick={() => setSelectedAmb(selectedAmb?.id === amb.id ? null : amb)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                    border: `2px solid ${selectedAmb?.id === amb.id ? amb.color : '#EEEEEE'}`,
                    background: selectedAmb?.id === amb.id ? amb.bg : '#FAFAFA',
                    transition: 'all 0.18s ease',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{amb.icon}</span>
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

            {/* Call button appears when type selected */}
            {selectedAmb && (
              <a href={`tel:${hospital.ambulancePhone || "112"}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, padding: '14px 0', background: '#C62828', color: 'white', borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 16px rgba(198,40,40,0.35)', animation: 'fadeIn 0.2s ease' }}>
                {`📞 Call ${hospital.ambulancePhone || "112"} — Book ${selectedAmb.label}`}
              </a>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  );
}

function HospitalCard({ h, i, onClick, onReview }) {
  const icu = h.availableIcuBeds ?? 0;
  const status = icu === 0 ? { label: 'FULL', cls: 'badge-red' } : icu < 3 ? { label: 'CRITICAL', cls: 'badge-amber' } : { label: 'AVAILABLE', cls: 'badge-green' };
  return (
    <div className="hosp-card fu" style={{ animationDelay: `${i * 0.06}s`, cursor: 'pointer' }} onClick={() => onClick(h)}>
      <div className="row-b mb14">
        <div style={{ flex: 1, marginRight: 12 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 15, color: 'var(--navy)', marginBottom: 5, lineHeight: 1.3 }}>{h.hospitalName}</div>
          <div className="row gap5 c-dim f12"><MapPin size={11} />{h.address}</div>
        </div>
        <span className={`badge ${status.cls}`}>{status.label}</span>
      </div>
      <div className="g2 mb14" style={{ gap: 10 }}>
        {[
          { label: 'ICU Beds',     val: h.availableIcuBeds ?? 0,     total: 20,  color: icu === 0 ? 'var(--red)' : 'var(--green)' },
          { label: 'General Beds', val: h.availableGeneralBeds ?? 0, total: 100, color: 'var(--blue)' },
        ].map((b, j) => (
          <div key={j} style={{ background: 'var(--gray50)', borderRadius: 'var(--r-md)', padding: '12px 14px', border: '1px solid var(--gray200)' }}>
            <div className="f11 c-dim mb6 upper fw6">{b.label}</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 28, color: b.color, lineHeight: 1 }}>{b.val}</div>
            <BedBar available={b.val} total={b.total} />
          </div>
        ))}
      </div>
      {h.specialities && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {h.specialities.split(',').map(s => s.trim()).filter(Boolean).map((tag, i) => (
            <span key={i} style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: 'var(--blue-lt)', color: 'var(--blue)',
              border: '1px solid rgba(21,101,192,0.15)'
            }}>{tag}</span>
          ))}
        </div>
      )}
      <div className="f12 c-dim">
        <div className="row-b mb8">
          <span className="row gap6"><Clock size={11} />OPD wait: <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{h.currentOpdWaiting ?? 0} min</strong></span>
          <span onClick={e => { e.stopPropagation(); onReview(h); }} style={{ color: h.avgRating > 0 ? '#92400E' : 'var(--text3)', fontWeight: 600, fontSize: 11, background: h.avgRating > 0 ? '#FEF3C7' : 'var(--gray50)', padding: '3px 10px', borderRadius: 20, cursor: 'pointer', border: `1px solid ${h.avgRating > 0 ? '#FDE68A' : 'var(--gray200)'}` }}>
            {h.avgRating > 0 ? `★ ${h.avgRating} · ${h.totalReviews} review${h.totalReviews !== 1 ? 's' : ''}` : '+ Rate'}
          </span>
        </div>
        <div className="row gap8">
          {h.ambulanceAvailable && (
            <span style={{ color: '#00796B', fontWeight: 700, fontSize: 11, background: '#E0F2F1', padding: '2px 8px', borderRadius: 20 }}>🚑 Ambulance</span>
          )}
          <span style={{ color: 'var(--blue)', fontWeight: 600, fontSize: 11, background: 'var(--blue-lt)', padding: '2px 8px', borderRadius: 20 }}>🗺 View Map</span>
            
        </div>
      </div>
    </div>
  );
}

export default function HospitalFinder() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [coords, setCoords] = useState({ lat: 18.5204, lng: 73.8567 });
  const [locating, setLocating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [specFilter, setSpecFilter] = useState('');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  const fetchHospitals = async (lat, lng) => {
    setLoading(true); setError('');
    try {
      const { data } = await axios.get(`${API}/api/hospitals/nearby`, { params: { lat, lng, radius: 50 } });
      setHospitals(data);
    } catch { setError('Could not load hospitals.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHospitals(coords.lat, coords.lng); }, [coords]);

  const locate = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      p => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocating(false); },
      () => setLocating(false)
    );
  };

  const filtered = hospitals.filter(h => {
    const s = search.toLowerCase();
    const m = !s || h.hospitalName?.toLowerCase().includes(s) || h.address?.toLowerCase().includes(s);
    const f = filter === 'all' || (filter === 'icu' && (h.availableIcuBeds ?? 0) > 0) || (filter === 'amb' && h.ambulanceAvailable);
    const sp = !specFilter || (h.specialities || '').toLowerCase().includes(specFilter.toLowerCase());
    return m && f && sp;
  });

  return (
    <div className="page" style={{ background: 'var(--gray50)' }}>
      {selected && <MapModal hospital={selected} userCoords={coords} onClose={() => setSelected(null)} />}

      {/* Review Modal */}
      {reviewModal && (
        <div onClick={() => { setReviewModal(null); setReviewDone(false); }} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,22,40,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(6px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 460, padding: 32, boxShadow: '0 32px 80px rgba(10,22,40,0.4)' }}>
            {reviewDone ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 22, color: 'var(--navy)', marginBottom: 8 }}>Review Submitted!</div>
                <div style={{ color: '#888', fontSize: 14 }}>Thank you for helping others find the right hospital.</div>
                <button onClick={() => { setReviewModal(null); setReviewDone(false); }} className="btn btn-blue mt20" style={{ width: '100%' }}>Close</button>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 20, color: 'var(--navy)', marginBottom: 4 }}>Rate {reviewModal.hospitalName}</div>
                <div style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>Your review helps patients make better decisions</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
                  {[1,2,3,4,5].map(star => (
                    <span key={star} onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                      style={{ fontSize: 36, cursor: 'pointer', transition: 'transform 0.1s', transform: star <= reviewForm.rating ? 'scale(1.15)' : 'scale(1)', filter: star <= reviewForm.rating ? 'none' : 'grayscale(1)' }}>⭐</span>
                  ))}
                </div>
                <textarea className="inp" rows={3} style={{ resize: 'none', marginBottom: 16 }}
                  placeholder="Share your experience (optional)..."
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} />
                <button className="btn btn-blue btn-full" disabled={reviewSubmitting} onClick={async () => {
                  setReviewSubmitting(true);
                  try {
                    const email = localStorage.getItem('email') || 'anonymous@medireach.com';
                    const res = await fetch('https://medireach-production-9d50.up.railway.app/api/reviews', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ hospitalId: reviewModal.hospitalId, userEmail: email, rating: reviewForm.rating, comment: reviewForm.comment })
                    });
                    if (res.ok) {
                      setReviewDone(true);
                      setTimeout(() => { setReviewModal(null); setReviewDone(false); fetchHospitals(coords.lat, coords.lng); }, 2000);
                    }
                  } catch (err) { console.error('Review error:', err); }
                  finally { setReviewSubmitting(false); }
                }}>{reviewSubmitting ? 'Submitting...' : 'Submit Review'}</button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="wrap">
          <div className="row-b wrap-f gap16">
            <div>
              <h1 className="fu">Find Hospitals</h1>
              <p className="fu1 c-dim f13 mt4">Click any card to see live map + ambulance options</p>
            </div>
            <div className="fu2 row gap20 wrap-f">
              {[
                { val: hospitals.length, label: 'Hospitals', color: 'var(--navy)' },
                { val: hospitals.reduce((s, h) => s + (h.availableIcuBeds || 0), 0), label: 'ICU Beds', color: 'var(--green)' },
                { val: hospitals.reduce((s, h) => s + (h.availableGeneralBeds || 0), 0), label: 'General', color: 'var(--blue)' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div className="f11 c-dim upper fw6 mt4">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="wrap" style={{ padding: '24px 32px 56px' }}>
        <div className="fu row gap10 mb24 wrap-f">
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', display: 'flex' }}><Search size={14} /></div>
            <input className="inp" style={{ paddingLeft: 36, height: 40 }} placeholder="Search hospitals…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="row gap6">
            {[['all', 'All'], ['icu', 'ICU Available'], ['amb', '🚑 Ambulance']].map(([k, lbl]) => (
              <button key={k} onClick={() => setFilter(k)} className={`filter-pill${filter === k ? ' on' : ''}`}>{lbl}</button>
            ))}
          </div>
          <button onClick={locate} disabled={locating} className="btn btn-ghost btn-sm row gap6">
            <MapPin size={12} />{locating ? 'Detecting…' : 'My Location'}
          </button>
          <button onClick={() => fetchHospitals(coords.lat, coords.lng)} className="btn btn-ghost btn-sm row gap6">
            <RefreshCw size={12} />Refresh
          </button>
        </div>

        {/* Speciality filter pills */}
        <div className="fu1 row gap8 mb20" style={{ flexWrap: 'wrap' }}>
          {['', 'Cardiac','Orthopaedic','Maternity','Neurology','Paediatrics','Oncology','Burns','Trauma','Nephrology','Psychiatry','Dermatology','ENT','Ophthalmology','Dental','Gastroenterology'].map((tag, i) => (
            <span key={i} onClick={() => setSpecFilter(tag)} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s',
              background: specFilter === tag ? 'var(--navy)' : 'var(--gray50)',
              color: specFilter === tag ? 'white' : 'var(--text)',
              border: `1.5px solid ${specFilter === tag ? 'var(--navy)' : 'var(--gray200)'}`,
            }}>{tag === '' ? '🏥 All Specialities' : tag}</span>
          ))}
        </div>

        {loading ? (
          <div className="g3" style={{ gap: 16 }}>{[...Array(6)].map((_, i) => <div key={i} className="skel" style={{ height: 220 }} />)}</div>
        ) : error ? (
          <div className="col" style={{ alignItems: 'center', gap: 14, padding: '80px 0', textAlign: 'center' }}>
            <AlertCircle size={28} color="var(--red)" />
            <p className="f15 fw6 c-dim">{error}</p>
          </div>
        ) : (
          <div className="g3" style={{ gap: 16 }}>
            {filtered.map((h, i) => <HospitalCard key={h.hospitalId || i} h={h} i={i} onClick={setSelected} onReview={(h) => { setReviewModal(h); setReviewForm({ rating: 5, comment: '' }); }} />)}
          </div>
        )}
      </div>
    </div>
  );
}
