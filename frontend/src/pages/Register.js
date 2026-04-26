import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, MapPin, Mail, Lock, Bed, ChevronRight, ChevronLeft, CheckCircle, Search } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import axios from 'axios';

const API = 'http://localhost:8080';
const STEPS = ['Hospital Info', 'Location & Beds', 'Admin Account', 'Verification Docs'];
const SPEC_TAGS = ['Cardiac','Orthopaedic','Maternity','Neurology','Paediatrics','Oncology','Burns','Trauma','Nephrology','Psychiatry','Dermatology','ENT','Ophthalmology','Dental','Gastroenterology'];

export default function Register() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    hospitalName: '', address: '', city: 'Pune', phone: '',
    latitude: '', longitude: '',
    totalIcuBeds: '', totalGeneralBeds: '', totalOpd: '',
    ambulanceAvailable: true,
    ambulancePhone: '',
    specialities: '',
    adminEmail: '', adminPassword: '',
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [docFile, setDocFile] = useState(null);
  const [docName, setDocName] = useState('');
  const searchRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const change = e => set(e.target.name, e.target.value);

  useEffect(() => {
    const handleClick = e => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (form.hospitalName.length < 3) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.hospitalName + ' Pune India')}&format=json&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch { setSuggestions([]); }
      finally { setSearching(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.hospitalName]);

  const selectSuggestion = (place) => {
    const address = place.display_name.split(',').slice(0, 3).join(',').trim();
    const city = place.address?.city || place.address?.town || 'Pune';
    const lat = parseFloat(place.lat).toFixed(6);
    const lng = parseFloat(place.lon).toFixed(6);
    setForm(f => ({ ...f, hospitalName: place.display_name.split(',')[0], address, city, latitude: lat, longitude: lng }));
    setSuggestions([]);
    setShowSuggestions(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({ center: [parseFloat(lng), parseFloat(lat)], zoom: 16, speed: 1.4 });
      placeMarker(parseFloat(lat), parseFloat(lng));
    }
  };

  useEffect(() => {
    if (step !== 1) return;
    setTimeout(() => {
      if (!mapRef.current || mapInstanceRef.current) return;
      const initLat = form.latitude ? parseFloat(form.latitude) : 18.5204;
      const initLng = form.longitude ? parseFloat(form.longitude) : 73.8567;
      const map = new maplibregl.Map({
        container: mapRef.current,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [initLng, initLat],
        zoom: 13,
        attributionControl: false,
      });
      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false, showUserHeading: false }), 'top-right');
      if (form.latitude && form.longitude) {
        placeMarkerOnMap(map, parseFloat(form.latitude), parseFloat(form.longitude));
      }
      map.on('click', async (e) => {
        const lat = e.lngLat.lat.toFixed(6);
        const lng = e.lngLat.lng.toFixed(6);
        setForm(f => ({ ...f, latitude: lat, longitude: lng }));
        placeMarkerOnMap(map, parseFloat(lat), parseFloat(lng));
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          if (data.address) {
            setForm(f => ({ ...f, latitude: lat, longitude: lng, address: f.address || data.display_name.split(',').slice(0, 3).join(',').trim(), city: data.address.city || data.address.town || 'Pune' }));
          }
        } catch {}
      });
      mapInstanceRef.current = map;
    }, 100);
    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, [step]);

  const placeMarkerOnMap = (map, lat, lng) => {
    if (markerRef.current) markerRef.current.remove();
    const el = document.createElement('div');
    el.innerHTML = `<div style="width:36px;height:36px;border-radius:50% 50% 50% 0;background:#C62828;border:3px solid white;transform:rotate(-45deg);box-shadow:0 4px 14px rgba(198,40,40,0.5);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:14px">🏥</span></div>`;
    el.style.cursor = 'pointer';
    markerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([lng, lat]).addTo(map);
  };

  const placeMarker = (lat, lng) => {
    if (mapInstanceRef.current) placeMarkerOnMap(mapInstanceRef.current, lat, lng);
  };

  const detectLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async p => {
        const lat = p.coords.latitude.toFixed(6);
        const lng = p.coords.longitude.toFixed(6);
        setForm(f => ({ ...f, latitude: lat, longitude: lng }));
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo({ center: [parseFloat(lng), parseFloat(lat)], zoom: 16, speed: 1.2 });
          placeMarkerOnMap(mapInstanceRef.current, parseFloat(lat), parseFloat(lng));
        }
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          if (data.address) {
            setForm(f => ({ ...f, address: f.address || data.display_name.split(',').slice(0, 3).join(',').trim(), city: data.address.city || data.address.town || 'Pune' }));
          }
        } catch {}
      },
      () => { set('latitude', '18.5204'); set('longitude', '73.8567'); }
    );
  };

  const toggleSpec = (tag) => {
    const curr = form.specialities.split(',').map(s => s.trim()).filter(Boolean);
    const active = curr.includes(tag);
    const next = active ? curr.filter(s => s !== tag) : [...curr, tag];
    setForm(f => ({ ...f, specialities: next.join(', ') }));
  };

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const payload = {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        totalIcuBeds: parseInt(form.totalIcuBeds),
        totalGeneralBeds: parseInt(form.totalGeneralBeds),
        totalOpd: parseInt(form.totalOpd),
      };
      const { data } = await axios.post(`${API}/api/auth/register`, payload);
      ['token','email','role','hospitalId','hospitalName'].forEach(k => localStorage.setItem(k, data[k] || ''));
      setDone(true);
      setTimeout(() => navigate('/submit-documents'), 2200);
    } catch (err) {
      setError(err.response?.data || 'Registration failed.');
    } finally { setLoading(false); }
  };

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(150deg, var(--navy) 0%, #0D2952 100%)' }}>
      <div className="fu" style={{ textAlign: 'center' }}>
        <div className="si" style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--green-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={38} color="var(--green)" />
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 700, color: 'white', marginBottom: 8 }}>Hospital Registered!</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>Redirecting to your dashboard…</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(150deg, var(--navy) 0%, #0D2952 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', paddingTop: 'calc(var(--nav-h) + 32px)' }}>
      <div style={{ position: 'absolute', top: '25%', left: '50%', width: 600, height: 500, background: 'radial-gradient(ellipse, rgba(21,101,192,0.14) 0%, transparent 65%)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
      <div className="fu" style={{ width: '100%', maxWidth: step === 1 ? 700 : 520, position: 'relative', zIndex: 1, transition: 'max-width 0.4s ease' }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'var(--blue)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3v4M9 11v4M3 9h4M11 9h4" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                <circle cx="9" cy="9" r="2.5" fill="white"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, color: 'white' }}>Medi<span style={{ color: '#90CAF9' }}>Reach</span></span>
          </div>
        </div>

        <div className="row gap8 mb28">
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: 3, borderRadius: 2, marginBottom: 8, background: i <= step ? 'var(--blue)' : 'rgba(255,255,255,0.15)', transition: 'background 0.35s', boxShadow: i <= step ? '0 0 8px rgba(21,101,192,0.5)' : 'none' }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: i === step ? 'white' : 'rgba(255,255,255,0.4)', transition: 'color 0.3s' }}>{s}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '36px 36px 32px' }}>
          {error && <div className="alert alert-red mb20">{error}</div>}

          {step === 0 && (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--blue-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={17} color="var(--blue)" />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 20, color: 'var(--navy)' }}>Hospital Information</div>
                    <div className="f13 c-dim">Search or type your hospital name</div>
                  </div>
                </div>
              </div>
              <div className="inp-wrap" ref={searchRef} style={{ position: 'relative' }}>
                <label className="inp-label">Hospital Name *</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', display: 'flex' }}>
                    {searching ? <div className="spin" style={{ borderTopColor: 'var(--blue)', width: 13, height: 13, borderWidth: 2 }} /> : <Search size={14} />}
                  </div>
                  <input name="hospitalName" value={form.hospitalName} onChange={e => { change(e); setShowSuggestions(true); }} className="inp" style={{ paddingLeft: 36 }} placeholder="e.g. Imperial Hospital, Pune" autoComplete="off" />
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, background: 'white', borderRadius: 'var(--r-md)', border: '1.5px solid var(--gray200)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', marginTop: 4 }}>
                    {suggestions.map((place, i) => (
                      <div key={i} onClick={() => selectSuggestion(place)}
                        style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? '1px solid var(--gray100)' : 'none', display: 'flex', alignItems: 'flex-start', gap: 10 }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--blue-lt)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                        <MapPin size={14} color="var(--blue)" style={{ marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{place.display_name.split(',')[0]}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{place.display_name.split(',').slice(1, 3).join(',')}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{ padding: '10px 14px', background: 'var(--gray50)', borderTop: '1px solid var(--gray100)', fontSize: 11, color: 'var(--text3)' }}>
                      💡 Not found? Go to Step 2 and click the map to pin your hospital
                    </div>
                  </div>
                )}
              </div>
              {form.latitude && (
                <div style={{ background: 'var(--green-lt)', border: '1px solid rgba(46,125,50,0.2)', borderRadius: 'var(--r-md)', padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={13} />Location auto-filled: {form.latitude}, {form.longitude}
                </div>
              )}
              <div className="inp-wrap">
                <label className="inp-label">Full Address *</label>
                <input name="address" value={form.address} onChange={change} className="inp" placeholder="Will auto-fill, or type manually" />
              </div>
              <div className="g2">
                <div className="inp-wrap mb0">
                  <label className="inp-label">City *</label>
                  <input name="city" value={form.city} onChange={change} className="inp" placeholder="Pune" />
                </div>
                <div className="inp-wrap mb0">
                  <label className="inp-label">Phone *</label>
                  <input name="phone" value={form.phone} onChange={change} className="inp" placeholder="02012345678" />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--teal-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bed size={17} color="var(--teal)" />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 20, color: 'var(--navy)' }}>Pin Your Hospital</div>
                      <div className="f13 c-dim">Click anywhere on the map to set location</div>
                    </div>
                  </div>
                  <button type="button" onClick={detectLocation} className="btn btn-ghost btn-sm row gap6" style={{ fontSize: 11, flexShrink: 0 }}>
                    <MapPin size={11} />Use My Location
                  </button>
                </div>
              </div>
              <div style={{ position: 'relative', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '2px solid var(--gray200)', marginBottom: 16, boxShadow: 'var(--shadow-md)' }}>
                <div ref={mapRef} style={{ height: 320, width: '100%' }} />
                {!form.latitude && (
                  <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: 'rgba(10,22,40,0.85)', color: 'white', padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, pointerEvents: 'none', whiteSpace: 'nowrap', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    👆 Click on the map to pin your hospital
                  </div>
                )}
                {form.latitude && (
                  <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: 'rgba(46,125,50,0.9)', color: 'white', padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, pointerEvents: 'none', whiteSpace: 'nowrap', backdropFilter: 'blur(8px)' }}>
                    ✓ Pinned: {form.latitude}, {form.longitude}
                  </div>
                )}
              </div>
              <div className="g2 mb16">
                <div>
                  <label className="inp-label">Total ICU Beds *</label>
                  <input name="totalIcuBeds" type="number" value={form.totalIcuBeds} onChange={change} className="inp" placeholder="20" min="0" />
                </div>
                <div>
                  <label className="inp-label">Total General Beds *</label>
                  <input name="totalGeneralBeds" type="number" value={form.totalGeneralBeds} onChange={change} className="inp" placeholder="100" min="0" />
                </div>
              </div>
              <div className="inp-wrap">
                <label className="inp-label">OPD Capacity *</label>
                <input name="totalOpd" type="number" value={form.totalOpd} onChange={change} className="inp" placeholder="50" min="0" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--gray50)', borderRadius: 'var(--r-md)', border: '1.5px solid var(--gray200)', cursor: 'pointer' }} onClick={() => set('ambulanceAvailable', !form.ambulanceAvailable)}>
                <input type="checkbox" id="amb" checked={form.ambulanceAvailable} onChange={e => set('ambulanceAvailable', e.target.checked)} style={{ width: 17, height: 17, accentColor: 'var(--blue)', cursor: 'pointer' }} onClick={e => e.stopPropagation()} />
                <label htmlFor="amb" style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', cursor: 'pointer' }}>🚑 Ambulance service available</label>
              </div>
              {form.ambulanceAvailable && (
                <div className="inp-wrap mt12">
                  <label className="inp-label">Ambulance Phone Number</label>
                  <input name="ambulancePhone" value={form.ambulancePhone} onChange={change} className="inp" placeholder="e.g. 02026123456" />
                </div>
              )}
              <div className="inp-wrap mt12 mb0">
                <label className="inp-label">Specialities</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {SPEC_TAGS.map(tag => {
                    const active = form.specialities.split(',').map(s => s.trim()).filter(Boolean).includes(tag);
                    return (
                      <span key={tag} onClick={() => toggleSpec(tag)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s', background: active ? 'var(--blue)' : 'var(--gray50)', color: active ? 'white' : 'var(--text)', border: `1.5px solid ${active ? 'var(--blue)' : 'var(--gray200)'}` }}>{tag}</span>
                    );
                  })}
                </div>
                <input name="specialities" value={form.specialities} onChange={change} className="inp" placeholder="Or type custom e.g. Cardiac, Burns, ENT" />
                <div className="f11 c-dim mt6">Click tags or type custom specialities separated by commas</div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={17} color="#7C3AED" />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 20, color: 'var(--navy)' }}>Admin Account</div>
                    <div className="f13 c-dim">Create your hospital admin login</div>
                  </div>
                </div>
              </div>
              <div className="inp-wrap">
                <label className="inp-label">Admin Email *</label>
                <div className="inp-icon-wrap">
                  <div className="inp-icon"><Mail size={14} /></div>
                  <input name="adminEmail" type="email" value={form.adminEmail} onChange={change} className="inp inp-has-icon" placeholder="admin@yourhospital.com" />
                </div>
              </div>
              <div className="inp-wrap mb24">
                <label className="inp-label">Password *</label>
                <div className="inp-icon-wrap">
                  <div className="inp-icon"><Lock size={14} /></div>
                  <input name="adminPassword" type="password" value={form.adminPassword} onChange={change} className="inp inp-has-icon" placeholder="Min 8 characters" minLength={8} />
                </div>
              </div>
              <div style={{ background: 'var(--blue-lt)', border: '1px solid rgba(21,101,192,0.2)', borderRadius: 'var(--r-md)', padding: '13px 16px', fontSize: 13, color: 'var(--blue)', lineHeight: 1.65, fontWeight: 500 }}>
                ✓ After registration, upload your documents in the next step for verification by MediReach admin.
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    📋
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 20, color: 'var(--navy)' }}>Verification Documents</div>
                    <div className="f13 c-dim">Upload your hospital registration certificate</div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="inp-label">Google Drive Document Link *</label>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                  Upload your hospital registration certificate to Google Drive → Share → Copy link → paste below
                </div>
                <input className="inp" placeholder="https://drive.google.com/file/d/..." value={docName}
                  onChange={e => setDocName(e.target.value)}
                  style={{ width: '100%', fontSize: 13 }} />
                {docName && docName.includes('drive.google.com') && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, color: '#2E7D32', fontSize: 13, fontWeight: 600 }}>
                    ✅ Drive link added
                  </div>
                )}
              </div>

              <div style={{ background: '#FFF3CD', border: '1.5px solid #F9A825', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#92400E', marginBottom: 8 }}>
                ⏳ Your hospital will be <strong>pending verification</strong> until MediReach admin reviews your documents. This usually takes 24 hours.
              </div>
              <div style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>
                Accepted documents: Hospital Registration Certificate, License, GST Certificate
              </div>
            </>
          )}

          <div className="row-b mt28">
            <button className="btn btn-ghost row gap6" onClick={() => setStep(s => s - 1)} style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>
              <ChevronLeft size={15} />Back
            </button>
            {step < 2 ? (
              <button className="btn btn-blue row gap6" onClick={() => { setError(''); setStep(s => s + 1); }}>
                Next<ChevronRight size={15} />
              </button>
            ) : step === 2 ? (
              <button className="btn btn-blue row gap6" onClick={submit} disabled={loading}>
                {loading ? <><div className="spin" />Registering…</> : <>Next<ChevronRight size={15} /></>}
              </button>
            ) : (
              <button className="btn btn-blue row gap6" onClick={() => setDone(true)}>
                Complete Registration<ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>

        <p className="center f13 mt20" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: '#90CAF9', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
