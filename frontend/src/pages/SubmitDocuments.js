import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SubmitDocuments() {
  const [driveLink, setDriveLink] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const hospitalId = localStorage.getItem('hospitalId');

  const handleSubmit = async () => {
    if (!driveLink.includes('drive.google.com')) {
      setError('Please paste a valid Google Drive link.');
      return;
    }
    try {
      await fetch(`http://localhost:8080/api/hospitals/${hospitalId}/drive-link`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driveLink })
      });
      setSubmitted(true);
    } catch {
      setError('Failed to submit. Please try again.');
    }
  };

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontWeight: 800, fontSize: 22, color: '#1E293B', marginBottom: 8 }}>Documents Submitted!</h2>
        <p style={{ color: '#64748B', fontSize: 14, marginBottom: 24 }}>
          MediReach admin will review your documents within 24 hours. You'll be notified once verified.
        </p>
        <div style={{ background: '#FEF3C7', border: '1.5px solid #F9A825', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#92400E', marginBottom: 24 }}>
          ⏳ Your hospital is <strong>pending verification</strong> and won't appear in search results until approved.
        </div>
        <button onClick={() => navigate('/dashboard')}
          style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: '#1E3A5F', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '48px 40px', maxWidth: 480, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <h2 style={{ fontWeight: 800, fontSize: 22, color: '#1E293B', marginBottom: 6 }}>Submit Verification Documents</h2>
          <p style={{ color: '#64748B', fontSize: 13 }}>Upload your hospital registration certificate to Google Drive and share the link below</p>
        </div>

        {/* Steps */}
        <div style={{ background: '#F1F5F9', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 10 }}>How to get your Drive link:</div>
          {[
            'Upload your certificate PDF/image to Google Drive',
            'Right-click the file → Share → Change to "Anyone with link"',
            'Click "Copy link" and paste it below'
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1E3A5F', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
              <div style={{ fontSize: 13, color: '#475569' }}>{s}</div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: 6 }}>Google Drive Link *</label>
          <input
            value={driveLink}
            onChange={e => { setDriveLink(e.target.value); setError(''); }}
            placeholder="https://drive.google.com/file/d/..."
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
          {driveLink.includes('drive.google.com') && (
            <div style={{ marginTop: 6, fontSize: 12, color: '#10B981', fontWeight: 600 }}>✅ Valid Drive link detected</div>
          )}
          {error && <div style={{ marginTop: 6, fontSize: 12, color: '#EF4444' }}>{error}</div>}
        </div>

        {/* Accepted docs */}
        <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 24 }}>
          Accepted: Hospital Registration Certificate, License, GST Certificate, any govt-issued document
        </div>

        <button onClick={handleSubmit}
          style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#1E3A5F', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 12 }}>
          Submit Documents
        </button>
        <button onClick={() => navigate('/dashboard')}
          style={{ width: '100%', padding: '13px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', color: '#64748B', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          Skip for now
        </button>
      </div>
    </div>
  );
}
