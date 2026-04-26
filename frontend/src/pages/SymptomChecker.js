import React, { useState } from 'react';
import { Send, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
const API = 'https://medireach-production-9d50.up.railway.app';

const URGENCY = {
  ICU_IMMEDIATELY: { label: 'Go to ICU Immediately', color: 'var(--red)',   bg: 'var(--red-lt)',   border: 'rgba(198,40,40,0.2)',   icon: '🚨' },
  GENERAL_OPD:     { label: 'Visit General OPD',     color: 'var(--amber)', bg: 'var(--amber-lt)', border: 'rgba(230,81,0,0.2)',    icon: '🏥' },
  BOOK_APPOINTMENT:{ label: 'Book an Appointment',   color: 'var(--green)', bg: 'var(--green-lt)', border: 'rgba(46,125,50,0.2)',   icon: '📅' },
};

export default function SymptomChecker() {
  const [form, setForm] = useState({ symptoms: '', age: '', existingConditions: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.symptoms.trim() || !form.age) { setError('Please describe your symptoms and enter your age.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const { data } = await axios.post(`${API}/api/ai/symptom-check`, {
        symptoms: form.symptoms, age: parseInt(form.age),
        existingConditions: form.existingConditions || 'None',
      });
      setResult(data);
    } catch { setError('AI service unavailable. Please try again.'); }
    finally { setLoading(false); }
  };

  const cfg = result ? (URGENCY[result.urgencyLevel] || URGENCY.GENERAL_OPD) : null;

  return (
    <div className="page" style={{ background: 'var(--gray50)' }}>
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray200)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="wrap" style={{ padding: '32px 32px 24px' }}>
          <div className="fu row gap14">
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: '#F3E8FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0
            }}>🧠</div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.4px' }}>
                AI Symptom Checker
              </h1>
              <p className="c-dim f14 mt4">Describe your symptoms and get instant Gemini AI triage guidance.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap" style={{ padding: '32px 32px 56px', maxWidth: 760 }}>
        <div className="fu1 card card-p mb20">
          <div className="inp-wrap">
            <label className="inp-label">Describe Your Symptoms *</label>
            <textarea className="inp" rows={4}
              placeholder="e.g. Severe chest pain radiating to left arm, shortness of breath for the past hour…"
              value={form.symptoms} onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))}
              style={{ minHeight: 110 }} />
          </div>
          <div className="g2">
            <div className="inp-wrap mb0">
              <label className="inp-label">Age *</label>
              <input className="inp" type="number" placeholder="e.g. 45" min={1} max={120}
                value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
            </div>
            <div className="inp-wrap mb0">
              <label className="inp-label">Existing Conditions</label>
              <input className="inp" placeholder="e.g. diabetes, hypertension"
                value={form.existingConditions} onChange={e => setForm(f => ({ ...f, existingConditions: e.target.value }))} />
            </div>
          </div>

          {error && <div className="alert alert-red mt16"><AlertTriangle size={14} />{error}</div>}

          <button className="btn btn-blue btn-full btn-lg mt20" onClick={submit} disabled={loading}>
            {loading ? <><div className="spin" />Analyzing with Gemini AI…</> : <><Send size={15} />Analyze Symptoms</>}
          </button>
          <p className="center c-dimmer f12 mt12">
            ⚠️ AI guidance only · Not a substitute for professional medical advice
          </p>
        </div>

        {result && cfg && (
          <div className="result-card" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
            <div className="row gap12 mb20">
              <span style={{ fontSize: 32 }}>{cfg.icon}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 22, color: cfg.color }}>
                  {cfg.label}
                </div>
                <div className="f11 c-dim mt4 upper fw6">{result.urgencyLevel?.replace(/_/g,' ')}</div>
              </div>
            </div>

            <div className="col gap10 mb20">
              {[['Recommendation', result.recommendation], ['Reasoning', result.reasoning]].map(([k, v]) => (
                <div key={k} style={{ background: 'rgba(255,255,255,0.65)', borderRadius: 'var(--r-md)', padding: '14px 16px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div className="f11 fw6 upper c-dim mb6">{k}</div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)' }}>{v}</p>
                </div>
              ))}
            </div>

            <div className="row gap12 wrap-f">
              {result.urgencyLevel === 'ICU_IMMEDIATELY' && (
                <Link to="/sos" className="btn btn-red" style={{ flex: 1, justifyContent: 'center' }}>🆘 Trigger SOS Now</Link>
              )}
              <Link to="/hospitals" className="btn btn-blue" style={{ flex: 1, justifyContent: 'center' }}>
                Find Hospitals <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
