import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MapPin } from 'lucide-react';
import axios from 'axios';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const API = 'http://localhost:8080';

export default function SosTrackPage() {
  const nav = useNavigate();
  const [sos, setSos] = useState(null);
  const [liveStatus, setLiveStatus] = useState(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const ambMarker = useRef(null);
  const stepRef = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem('activeSos');
    if (!saved) { nav('/sos'); return; }
    const data = JSON.parse(saved);
    setSos(data);
    setLiveStatus(data.status);
    const interval = setInterval(async () => {
      try {
        const { data: s } = await axios.get(`${API}/api/sos/status/${data.id}`);
        setLiveStatus(s.status);
        localStorage.setItem('activeSos', JSON.stringify({ ...data, status: s.status }));
        if (s.status === 'ARRIVED') clearInterval(interval);
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!sos || !mapRef.current || mapInstance.current) return;
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [sos.patientLng, sos.patientLat],
      zoom: 13,
      attributionControl: false,
    });
    map.on('load', async () => {
      const patEl = document.createElement('div');
      patEl.innerHTML = `<div style="width:36px;height:36px;border-radius:50%;background:#C62828;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 14px rgba(198,40,40,0.5)">👤</div>`;
      new maplibregl.Marker({ element: patEl }).setLngLat([sos.patientLng, sos.patientLat]).addTo(map);
      try {
        const res = await fetch(`${API}/api/hospitals/nearby?lat=${sos.patientLat}&lng=${sos.patientLng}&radius=100`);
        const hospitals = await res.json();
        const hosp = hospitals.find(h => String(h.hospitalId) === String(sos.hospitalId));
        if (hosp) {
          const hospEl = document.createElement('div');
          hospEl.innerHTML = `<div style="width:36px;height:36px;border-radius:50%;background:#1565C0;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 14px rgba(21,101,192,0.5)">🏥</div>`;
          new maplibregl.Marker({ element: hospEl }).setLngLat([hosp.longitude, hosp.latitude]).addTo(map);
          map.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [[hosp.longitude, hosp.latitude], [sos.patientLng, sos.patientLat]] } } });
          map.addLayer({ id: 'route', type: 'line', source: 'route', paint: { 'line-color': '#F9A825', 'line-width': 3, 'line-dasharray': [2, 2] } });
          const bounds = new maplibregl.LngLatBounds();
          bounds.extend([sos.patientLng, sos.patientLat]);
          bounds.extend([hosp.longitude, hosp.latitude]);
          map.fitBounds(bounds, { padding: 60 });
          const ambEl = document.createElement('div');
          ambEl.innerHTML = `<div style="width:40px;height:40px;border-radius:50%;background:#F9A825;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 14px rgba(249,168,37,0.6)">🚑</div>`;
          ambMarker.current = new maplibregl.Marker({ element: ambEl }).setLngLat([hosp.longitude, hosp.latitude]).addTo(map);
          
          // Check live status from DB right now
          try {
            const statusRes = await fetch(`${API}/api/sos/status/${sos.id}`);
            const statusData = await statusRes.json();
            const currentStatus = statusData.status;
            if (currentStatus === 'EN_ROUTE' && stepRef.current === 0) {
              const steps = 60;
              const iv = setInterval(() => {
                stepRef.current += 1;
                if (stepRef.current >= steps) { clearInterval(iv); return; }
                const t = stepRef.current / steps;
                ambMarker.current?.setLngLat([hosp.longitude + (sos.patientLng - hosp.longitude) * t, hosp.latitude + (sos.patientLat - hosp.latitude) * t]);
              }, 3000);
            } else if (currentStatus === 'ARRIVED') {
              ambMarker.current.getElement().innerHTML = `<div style="width:40px;height:40px;border-radius:50%;background:#2E7D32;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px">✅</div>`;
              ambMarker.current.setLngLat([sos.patientLng, sos.patientLat]);
            }
          } catch {}
        }
      } catch {}
    });
    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, [sos]);

  useEffect(() => {
    if (liveStatus === 'ARRIVED' && ambMarker.current && sos) {
      ambMarker.current.getElement().innerHTML = `<div style="width:40px;height:40px;border-radius:50%;background:#2E7D32;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px">✅</div>`;
      ambMarker.current.setLngLat([sos.patientLng, sos.patientLat]);
    }
    if (liveStatus === 'EN_ROUTE' && ambMarker.current && sos && stepRef.current === 0) {
      const hospLng = ambMarker.current.getLngLat().lng;
      const hospLat = ambMarker.current.getLngLat().lat;
      const steps = 60;
      const iv = setInterval(() => {
        stepRef.current += 1;
        if (stepRef.current >= steps) { clearInterval(iv); return; }
        const t = stepRef.current / steps;
        ambMarker.current?.setLngLat([hospLng + (sos.patientLng - hospLng) * t, hospLat + (sos.patientLat - hospLat) * t]);
      }, 3000);
    }
  }, [liveStatus]);

  if (!sos) return null;

  return (
    <div className="page" style={{ background: 'var(--gray50)' }}>
      <div className="wrap fu" style={{ padding: '40px 32px 56px', maxWidth: 580 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>🚑 Tracking Your SOS</h1>
          <p className="c-dim f13">Live updates every 5 seconds</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, gap: 8 }}>
          {['HOSPITAL_NOTIFIED', 'EN_ROUTE', 'ARRIVED'].map((s, i) => {
            const statuses = ['HOSPITAL_NOTIFIED', 'EN_ROUTE', 'ARRIVED'];
            const done = statuses.indexOf(liveStatus) >= i;
            const colors = { HOSPITAL_NOTIFIED: { bg: '#E3F2FD', border: '#1565C0', text: '#1565C0' }, EN_ROUTE: { bg: '#FFF8E1', border: '#F9A825', text: '#92400E' }, ARRIVED: { bg: '#E8F5E9', border: '#2E7D32', text: '#2E7D32' } };
            return (
              <div key={s} style={{ flex: 1, textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: done ? colors[s].bg : 'var(--gray100)', border: `1.5px solid ${done ? colors[s].border : 'var(--gray200)'}`, transition: 'all 0.3s' }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{s === 'HOSPITAL_NOTIFIED' ? '🏥' : s === 'EN_ROUTE' ? '🚑' : '✅'}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: done ? colors[s].text : '#999' }}>
                  {s === 'HOSPITAL_NOTIFIED' ? 'Notified' : s === 'EN_ROUTE' ? 'En Route' : 'Arrived'}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ borderRadius: 16, overflow: 'hidden', border: '2px solid var(--gray200)', marginBottom: 16, boxShadow: 'var(--shadow-md)' }}>
          <div ref={mapRef} style={{ height: 300, width: '100%' }} />
        </div>

        <div className="card card-p mb16">
          {[['Patient', sos.patientName], ['SOS ID', `#${sos.id}`], ['Hospital ID', `#${sos.hospitalId}`], ['Live Status', liveStatus || sos.status]].map(([k, v]) => (
            <div key={k} className="row-b" style={{ padding: '10px 0', borderBottom: '1px solid var(--gray100)' }}>
              <span className="f11 fw6 upper c-dim">{k}</span>
              <span className="fw6 f13">{v}</span>
            </div>
          ))}
        </div>

        {liveStatus === 'ARRIVED' && (
          <div style={{ background: '#E8F5E9', border: '1.5px solid #2E7D32', borderRadius: 12, padding: '16px', textAlign: 'center', marginBottom: 16 }}>
            <CheckCircle size={28} color="#2E7D32" style={{ marginBottom: 8 }} />
            <div style={{ fontWeight: 700, color: '#1B5E20', fontSize: 15 }}>Ambulance has arrived!</div>
          </div>
        )}

        <div className="alert alert-blue mb12"><MapPin size={14} />Show SOS ID #{sos.id} at the hospital reception desk.</div>
        <button onClick={() => { localStorage.removeItem('activeSos'); nav('/sos'); }} className="btn btn-ghost btn-full">✕ Cancel & Clear SOS</button>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}`}</style>
    </div>
  );
}
