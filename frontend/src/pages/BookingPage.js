import React, { useState, useEffect } from "react";

const API = process.env.REACT_APP_API_URL || "https://medireach-production-9d50.up.railway.app";

export default function BookingPage() {
  const [hospitals, setHospitals] = useState([]);
  const [selected, setSelected] = useState(null);
  const [bedType, setBedType] = useState("GENERAL");
  const [form, setForm] = useState({ patientName: "", patientEmail: "", patientPhone: "", patientAge: "", reason: "", specialityRequested: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [tab, setTab] = useState("book");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchMyBookings = (email) => {
    fetch(`${API}/api/bookings/my?email=${encodeURIComponent(email)}`)
      .then(r => r.json()).then(setMyBookings).catch(() => {});
  };

  useEffect(() => {
    fetch(`${API}/api/hospitals/all`).then(r => r.json()).then(setHospitals).catch(() => {});
    if (user.email) {
      setForm(f => ({ ...f, patientEmail: user.email, patientName: user.name || "" }));
      fetchMyBookings(user.email);
    }
  }, []);

  const handleBook = async () => {
    if (!selected) return setError("Please select a hospital");
    if (!form.patientName || !form.patientEmail || !form.patientPhone)
      return setError("Name, email and phone are required");

    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch(`${API}/api/bookings/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, hospitalId: selected.hospitalId, bedType, patientAge: parseInt(form.patientAge) || 0 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data);
      setResult(data);
      fetchMyBookings(form.patientEmail);
    } catch (e) {
      setError(e.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      const res = await fetch(`${API}/api/bookings/${bookingId}/cancel?email=${encodeURIComponent(form.patientEmail || user.email)}`, { method: "PUT" });
      const data = await res.json();
      alert(data.message);
      fetchMyBookings(form.patientEmail || user.email);
    } catch { alert("Cancel failed"); }
  };

  const bedColor = { ICU: "#ef4444", GENERAL: "#3b82f6", OPD: "#10b981" };
  const statusColor = { CONFIRMED: "#10b981", CANCELLED: "#ef4444", COMPLETED: "#6366f1" };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 16px", fontFamily: "sans-serif" }}>
      <h2 style={{ fontSize: 26, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>🏥 Book a Hospital Bed</h2>
      <p style={{ color: "#64748b", marginBottom: 24 }}>Reserve your ICU, General, or OPD slot instantly.</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {[["book", "Book a Bed"], ["mybookings", "My Bookings"]].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 22px", borderRadius: 8, border: "none", cursor: "pointer",
            background: tab === t ? "#6366f1" : "#f1f5f9",
            color: tab === t ? "#fff" : "#475569", fontWeight: 600, fontSize: 14
          }}>{label}</button>
        ))}
      </div>

      {tab === "book" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 12 }}>1. Select Hospital</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 440, overflowY: "auto" }}>
              {hospitals.map(h => (
                <div key={h.hospitalId} onClick={() => setSelected(h)} style={{
                  border: selected?.hospitalId === h.hospitalId ? "2px solid #6366f1" : "1.5px solid #e2e8f0",
                  borderRadius: 12, padding: "14px 16px", cursor: "pointer",
                  background: selected?.hospitalId === h.hospitalId ? "#eef2ff" : "#fff"
                }}>
                  <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>{h.hospitalName}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{h.address}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>ICU: {h.availableIcuBeds ?? 0}</span>
                    <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>Gen: {h.availableGeneralBeds ?? 0}</span>
                    <span style={{ background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>OPD wait: {h.currentOpdWaiting ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 12 }}>2. Select Bed Type</h3>
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {["ICU", "GENERAL", "OPD"].map(bt => (
                <button key={bt} onClick={() => setBedType(bt)} style={{
                  flex: 1, padding: "10px 0", borderRadius: 8, border: "2px solid",
                  borderColor: bedType === bt ? bedColor[bt] : "#e2e8f0",
                  background: bedType === bt ? bedColor[bt] : "#fff",
                  color: bedType === bt ? "#fff" : "#475569",
                  fontWeight: 700, fontSize: 13, cursor: "pointer"
                }}>{bt}</button>
              ))}
            </div>

            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 12 }}>3. Your Details</h3>
            {[
              { key: "patientName", label: "Full Name *", type: "text" },
              { key: "patientEmail", label: "Email *", type: "email" },
              { key: "patientPhone", label: "Phone *", type: "tel" },
              { key: "patientAge", label: "Age", type: "number" },
              { key: "reason", label: "Reason / Symptoms", type: "text" },
              { key: "specialityRequested", label: "Speciality (e.g. Cardiology)", type: "text" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{f.label}</label>
                <input type={f.type} value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, marginTop: 4, boxSizing: "border-box" }} />
              </div>
            ))}

            {error && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>⚠️ {error}</div>}

            {result && (
              <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 10, padding: 14, marginBottom: 14 }}>
                <div style={{ fontWeight: 700, color: "#15803d" }}>✅ Booking Confirmed!</div>
                <div style={{ fontSize: 13, color: "#166534", marginTop: 4 }}>{result.message}</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Booking ID: <b>#{result.bookingId}</b></div>
              </div>
            )}

            <button onClick={handleBook} disabled={loading} style={{
              width: "100%", padding: "13px 0",
              background: loading ? "#c7d2fe" : "#6366f1",
              color: "#fff", border: "none", borderRadius: 10,
              fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer"
            }}>
              {loading ? "Booking..." : `Reserve ${bedType} Bed`}
            </button>

            {selected && (
              <div style={{ marginTop: 10, fontSize: 12, color: "#64748b", textAlign: "center" }}>
                Booking at: <b>{selected.hospitalName}</b>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "mybookings" && (
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 16 }}>Your Bookings</h3>
          {myBookings.length === 0
            ? <p style={{ color: "#94a3b8" }}>No bookings found.</p>
            : myBookings.map(b => (
              <div key={b.id} style={{ border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 12, background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ background: (bedColor[b.bedType] || "#888") + "22", color: bedColor[b.bedType] || "#888", fontWeight: 700, fontSize: 12, padding: "2px 10px", borderRadius: 6 }}>{b.bedType}</span>
                    <span style={{ marginLeft: 8, background: (statusColor[b.status] || "#888") + "22", color: statusColor[b.status] || "#888", fontWeight: 700, fontSize: 12, padding: "2px 10px", borderRadius: 6 }}>{b.status}</span>
                    <div style={{ fontWeight: 600, color: "#1e293b", marginTop: 8 }}>{b.hospitalName}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>Booked: {new Date(b.bookingTime).toLocaleString()}</div>
                    {b.reason && <div style={{ fontSize: 12, color: "#64748b" }}>Reason: {b.reason}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#6366f1" }}>#{b.id}</div>
                    {b.status === "CONFIRMED" && (
                      <button onClick={() => handleCancel(b.id)} style={{
                        marginTop: 8, padding: "6px 14px", background: "#fee2e2",
                        color: "#b91c1c", border: "none", borderRadius: 8,
                        fontSize: 12, fontWeight: 600, cursor: "pointer"
                      }}>Cancel</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
