import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const stats = [
    { num: '8+',   label: 'Hospitals Connected', color: 'var(--blue)' },
    { num: '43',   label: 'ICU Beds Live',        color: 'var(--red)' },
    { num: '375',  label: 'General Beds',          color: 'var(--green)' },
    { num: '< 2s', label: 'Response Time',         color: 'var(--teal)' },
  ];
  const features = [
    { icon: '🗺️', bg: 'var(--blue-lt)',  title: 'Real-Time Bed Finder',   desc: 'Live ICU and general bed availability across all registered hospitals, updated by staff.' },
    { icon: '🧠', bg: '#F3E8FF',        title: 'Gemini AI Triage',        desc: 'Describe your symptoms and get instant AI-powered urgency assessment and guidance.' },
    { icon: '🆘', bg: 'var(--red-lt)',  title: 'One-Tap SOS',             desc: 'Emergency mode finds the nearest ICU and reserves a bed for you instantly.' },
    { icon: '⏱️', bg: 'var(--amber-lt)',title: 'Wait Time Prediction',    desc: 'AI-predicted OPD queue times so you can plan before you leave home.' },
    { icon: '🚑', bg: 'var(--teal-lt)', title: 'Ambulance Tracker',       desc: 'See which hospitals have ambulance service available right now.' },
    { icon: '🔐', bg: 'var(--green-lt)',title: 'Verified Hospitals',      desc: 'All hospitals are registered and admin-managed directly on MediReach.' },
  ];

  return (
    <div className="page" style={{ background: 'var(--gray50)' }}>
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="fu hero-badge">
            <div className="live-dot" />
            Live · Pune Emergency Network
          </div>
          <h1 className="fu1">
            Find the Right Hospital<br />
            <em>Before It's Too Late</em>
          </h1>
          <p className="fu2 hero-sub">
            Real-time bed availability, AI-powered triage, and one-tap emergency SOS — built for Pune's hospitals.
          </p>
          <div className="fu3 hero-btns">
            <Link to="/symptoms" className="btn-hw btn-hw-white">🧠 Check Symptoms</Link>
            <Link to="/sos"      className="btn-hw btn-hw-red">🆘 Emergency SOS</Link>
            <Link to="/hospitals" className="btn-hw btn-hw-ghost">View Hospitals →</Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray200)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="wrap">
          <div className="fu4 g4" style={{ gap: 0 }}>
            {stats.map((s, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '28px 20px',
                borderRight: i < 3 ? '1px solid var(--gray200)' : 'none'
              }}>
                <div className="stat-num" style={{ color: s.color }}>{s.num}</div>
                <div className="stat-lbl mt8">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '72px 32px 80px', maxWidth: 'var(--max)', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div className="fu badge badge-blue mb16" style={{ fontSize: 12 }}>Features</div>
          <h2 className="fu1 serif" style={{ fontSize: 40, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.8px', marginBottom: 12 }}>
            Built for Emergencies
          </h2>
          <p className="fu2" style={{ color: 'var(--text2)', fontSize: 16, maxWidth: 460, margin: '0 auto' }}>
            Every feature designed around saving time when minutes matter most.
          </p>
        </div>
        <div className="g3 fu3" style={{ gap: 16 }}>
          {features.map((f, i) => (
            <div key={i} className="card-hover">
              <div className="feat-icon" style={{ background: f.bg }}>{f.icon}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--navy)' }}>{f.title}</div>
              <p style={{ color: 'var(--text2)', fontSize: 13.5, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 32px 80px', maxWidth: 'var(--max)', margin: '0 auto' }}>
        <div className="fu" style={{
          background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy2) 100%)',
          borderRadius: 'var(--r-2xl)', padding: '60px 52px', textAlign: 'center',
          boxShadow: 'var(--shadow-xl)', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(21,101,192,0.25) 0%, transparent 65%)' }} />
          <h2 className="serif" style={{ fontSize: 36, fontWeight: 700, color: 'white', marginBottom: 12, letterSpacing: '-0.5px', position: 'relative', zIndex: 1 }}>
            Are You a Hospital Administrator?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, marginBottom: 36, position: 'relative', zIndex: 1 }}>
            Register on MediReach and let patients find your available beds in real time.
          </p>
          <Link to="/register" className="btn btn-lg" style={{
            background: 'white', color: 'var(--navy)', fontWeight: 700,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)', position: 'relative', zIndex: 1
          }}>Register Your Hospital →</Link>
        </div>
      </section>
    </div>
  );
}
