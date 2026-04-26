import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:8080';

export default function SuperAdminPage() {
  const [hospitals, setHospitals] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const nav = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'SUPER_ADMIN') { nav('/login'); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hRes, uRes] = await Promise.all([
        fetch(`${API}/api/superadmin/hospitals`),
        fetch(`${API}/api/superadmin/users`)
      ]);
      setHospitals(await hRes.json());
      setUsers(await uRes.json());
    } catch {}
    finally { setLoading(false); }
  };

  const approve = async (id) => {
    await fetch(`${API}/api/superadmin/hospitals/${id}/approve`, { method: 'PUT' });
    fetchData();
  };

  const reject = async (id) => {
    await fetch(`${API}/api/superadmin/hospitals/${id}/reject`, { method: 'PUT' });
    fetchData();
  };

  const pending = hospitals.filter(h => !h.verified && !h.active);
  const verified = hospitals.filter(h => h.verified && h.active);
  const rejected = hospitals.filter(h => !h.active && h.verified === false);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '32px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1E293B', marginBottom: 4 }}>🛡️ MediReach Super Admin</h1>
              <p style={{ color: '#64748B', fontSize: 14 }}>Verify hospitals before they go live on the platform</p>
            </div>

          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
            {[
              { label: 'Pending', value: hospitals.filter(h => !h.verified).length, color: '#F59E0B', bg: '#FEF3C7' },
              { label: 'Verified', value: hospitals.filter(h => h.verified).length, color: '#10B981', bg: '#D1FAE5' },
              { label: 'Total Users', value: users.length, color: '#3B82F6', bg: '#DBEAFE' },
              { label: 'Total Hospitals', value: hospitals.length, color: '#8B5CF6', bg: '#EDE9FE' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['pending', 'verified', 'users'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                background: tab === t ? '#1E293B' : 'white', color: tab === t ? 'white' : '#64748B',
                boxShadow: tab === t ? 'none' : '0 1px 4px rgba(0,0,0,0.08)' }}>
              {t === 'pending' ? `⏳ Pending (${hospitals.filter(h => !h.verified).length})` : t === 'verified' ? `✅ Verified (${hospitals.filter(h => h.verified).length})` : `👥 Users (${users.length})`}
            </button>
          ))}
        </div>

        {/* Pending Hospitals */}
        {tab === 'pending' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {hospitals.filter(h => !h.verified).length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', background: 'white', borderRadius: 12 }}>
                No pending hospitals 🎉
              </div>
            )}
            {hospitals.filter(h => !h.verified).map(h => (
              <div key={h.id} style={{ background: 'white', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1.5px solid #FEF3C7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#1E293B', marginBottom: 4 }}>{h.name}</div>
                    <div style={{ fontSize: 13, color: '#64748B', marginBottom: 8 }}>📍 {h.address}, {h.city}</div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#475569' }}>
                      <span>🛏️ ICU: {h.availableIcuBeds}/{h.totalIcuBeds}</span>
                      <span>🏥 General: {h.availableGeneralBeds}/{h.totalGeneralBeds}</span>
                      <span>📞 {h.phone}</span>
                      {h.registrationNumber && <span>📋 Reg: {h.registrationNumber}</span>}
                    {h.driveLink && (
                      <a href={h.driveLink} target="_blank" rel="noreferrer"
                        style={{ color: '#1565C0', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        📁 View Documents
                      </a>
                    )}
                    </div>
                    {h.specialities && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {h.specialities.split(',').map(s => (
                          <span key={s} style={{ padding: '2px 10px', background: '#F1F5F9', borderRadius: 20, fontSize: 11, color: '#475569' }}>{s.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginLeft: 16, flexDirection: 'column', alignItems: 'flex-end' }}>
                    {h.driveLink ? (
                      <>
                        <button onClick={() => approve(h.id)}
                          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#10B981', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                          ✅ Approve
                        </button>
                        <button onClick={() => reject(h.id)}
                          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#EF4444', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                          ❌ Reject
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{ padding: '8px 14px', borderRadius: 8, background: '#FEF3C7', color: '#92400E', fontSize: 12, fontWeight: 600 }}>
                          ⏳ Awaiting Documents
                        </div>
                        <button onClick={() => reject(h.id)}
                          style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#EF4444', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
                          ❌ Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Verified Hospitals */}
        {tab === 'verified' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {hospitals.filter(h => h.verified).map(h => (
              <div key={h.id} style={{ background: 'white', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1.5px solid #D1FAE5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#1E293B', marginBottom: 4 }}>✅ {h.name}</div>
                    <div style={{ fontSize: 13, color: '#64748B' }}>📍 {h.address}, {h.city} · 📞 {h.phone}</div>
                  </div>
                  <button onClick={() => reject(h.id)}
                    style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #EF4444', background: 'white', color: '#EF4444', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                  {['ID', 'Email', 'Role', 'Hospital ID'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748B' }}>#{u.id}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: u.role === 'SUPER_ADMIN' ? '#EDE9FE' : u.role === 'HOSPITAL_ADMIN' ? '#DBEAFE' : '#F1F5F9',
                        color: u.role === 'SUPER_ADMIN' ? '#7C3AED' : u.role === 'HOSPITAL_ADMIN' ? '#2563EB' : '#475569' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748B' }}>{u.hospitalId || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
