import React, { useEffect, useMemo, useState } from "react";

const API = process.env.REACT_APP_API_URL || "https://medireach-production-9d50.up.railway.app";
const BOOKING_PRICES = { ICU: 2500, GENERAL: 1200, OPD: 400 };

const getRequestErrorMessage = (error, fallback) => (
  error instanceof TypeError
    ? "Could not reach the booking server. If this happens only on your phone, open the site from an allowed URL and make sure the backend is reachable on your network."
    : (error.message || fallback)
);

export default function BookingPage() {
  const [hospitals, setHospitals] = useState([]);
  const [selected, setSelected] = useState(null);
  const [bedType, setBedType] = useState("GENERAL");
  const [form, setForm] = useState({
    patientName: "",
    patientEmail: localStorage.getItem("email") || "",
    patientPhone: "",
    patientAge: "",
    reason: "",
    specialityRequested: ""
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [tab, setTab] = useState("book");
  const [paymentDone, setPaymentDone] = useState(false);
  const [paymentMeta, setPaymentMeta] = useState(null);
  const [paying, setPaying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");

  const token = localStorage.getItem("token") || "";
  const email = localStorage.getItem("email") || "";
  const amount = BOOKING_PRICES[bedType];

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${token}`
  }), [token]);

  const resetCheckout = () => {
    setPaymentDone(false);
    setPaymentMeta(null);
    setOtpSent(false);
    setOtpValue("");
    setOtpVerified(false);
    setOtpError("");
  };

  const fetchHospitals = () => {
    fetch(`${API}/api/hospitals/all`)
      .then(r => r.json())
      .then(data => {
        setHospitals(data);
        setSelected(current => current
          ? data.find(h => h.hospitalId === current.hospitalId) || current
          : current
        );
      })
      .catch(() => {});
  };

  const fetchMyBookings = () => {
    fetch(`${API}/api/bookings/my`, { headers: authHeaders })
      .then(async r => {
        if (!r.ok) throw new Error("Could not load bookings");
        return r.json();
      })
      .then(setMyBookings)
      .catch(() => setMyBookings([]));
  };

  useEffect(() => {
    fetchHospitals();
    if (email) {
      setForm(f => ({ ...f, patientEmail: email, patientName: f.patientName || email.split("@")[0] }));
      fetchMyBookings();
    }
  }, []);

  useEffect(() => { resetCheckout(); }, [selected, bedType]);

  const handlePayNow = async () => {
    if (!selected) return setError("Please select a hospital");
    if (!form.patientName || !form.patientPhone) return setError("Name and phone are required before payment");
    if (!window.Razorpay) return setError("Razorpay is not available right now");

    setPaying(true);
    setError("");
    try {
      const orderRes = await fetch(`${API}/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          amount,
          patientEmail: email,
          purpose: "BOOKING"
        })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(typeof orderData === "string" ? orderData : "Payment initialization failed");

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "MediReach",
        description: `${bedType} bed booking at ${selected.hospitalName}`,
        order_id: orderData.orderId,
        prefill: {
          name: form.patientName,
          email,
          contact: form.patientPhone
        },
        theme: { color: "#2563eb" },
        handler: async response => {
          const verifyRes = await fetch(`${API}/api/payment/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders },
            body: JSON.stringify(response)
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) throw new Error(typeof verifyData === "string" ? verifyData : "Payment verification failed");
          setPaymentDone(true);
          setPaymentMeta({
            paymentId: verifyData.paymentId,
            orderId: orderData.orderId,
            amount
          });
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", () => setError("Payment was not completed"));
      razorpay.open();
    } catch (e) {
      setError(getRequestErrorMessage(e, "Payment failed"));
    } finally {
      setPaying(false);
    }
  };

  const verifyOtp = () => {
    if (otpValue === "1234") {
      setOtpVerified(true);
      setOtpError("");
      return;
    }
    setOtpVerified(false);
    setOtpError("Invalid OTP. Use demo OTP 1234");
  };

  const handleBook = async () => {
    if (!selected) return setError("Please select a hospital");
    if (!form.patientName || !form.patientPhone) return setError("Name and phone are required");
    if (!otpVerified) return setError("Please verify the booking OTP first");

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${API}/api/bookings/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          ...form,
          patientEmail: email,
          hospitalId: selected.hospitalId,
          bedType,
          patientAge: parseInt(form.patientAge, 10) || 0,
          otpCode: otpValue
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data === "string" ? data : "Booking failed");
      if (paymentMeta?.orderId) {
        await fetch(`${API}/api/payment/attach-booking`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({
            bookingId: data.bookingId,
            orderId: paymentMeta.orderId
          })
        }).catch(() => {});
      }
      setResult(data);
      fetchMyBookings();
      fetchHospitals();
      resetCheckout();
    } catch (e) {
      setError(getRequestErrorMessage(e, "Booking failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async bookingId => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      const res = await fetch(`${API}/api/bookings/${bookingId}/cancel`, {
        method: "PUT",
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data === "string" ? data : "Cancel failed");
      alert(data.message);
      fetchMyBookings();
      fetchHospitals();
    } catch (e) {
      alert(getRequestErrorMessage(e, "Cancel failed"));
    }
  };

  const bedColor = { ICU: "#ef4444", GENERAL: "#3b82f6", OPD: "#10b981" };
  const statusColor = {
    PENDING: "#d97706",
    CONFIRMED: "#10b981",
    REJECTED: "#ef4444",
    HOSPITAL_CANCELLED: "#dc2626",
    CANCELLED: "#64748b",
    COMPLETED: "#6366f1"
  };

  const statusLabel = status => (
    status === "HOSPITAL_CANCELLED" ? "Cancelled by Hospital" : status
  );

  const sendOtp = () => {
    if (!selected) return setError("Please select a hospital");
    if (!form.patientName || !form.patientPhone) return setError("Name and phone are required before OTP verification");
    setOtpSent(true);
    setOtpVerified(false);
    setOtpError("");
    setError("");
  };

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "28px 16px", fontFamily: "sans-serif" }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Secure Bed Booking</h2>
      <p style={{ color: "#64748b", marginBottom: 24 }}>
        Login is required. Payment is optional, but demo OTP <b>1234</b> is required for every booking.
      </p>

      <div className="booking-tabs" style={{ marginBottom: 28 }}>
        {[["book", "Book a Bed"], ["mybookings", "My Bookings"]].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 22px", borderRadius: 8, border: "none", cursor: "pointer",
            background: tab === t ? "#6366f1" : "#f1f5f9",
            color: tab === t ? "#fff" : "#475569", fontWeight: 600, fontSize: 14
          }}>{label}</button>
        ))}
      </div>

      {tab === "book" && (
        <div className="booking-layout">
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

            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 12 }}>3. Patient Details</h3>
            {[
              { key: "patientName", label: "Full Name *", type: "text" },
              { key: "patientEmail", label: "Login Email", type: "email", disabled: true },
              { key: "patientPhone", label: "Phone *", type: "tel" },
              { key: "patientAge", label: "Age", type: "number" },
              { key: "reason", label: "Reason / Symptoms", type: "text" },
              { key: "specialityRequested", label: "Speciality", type: "text" }
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{f.label}</label>
                <input
                  type={f.type}
                  disabled={f.disabled}
                  value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  style={{
                    width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8,
                    fontSize: 14, marginTop: 4, boxSizing: "border-box",
                    background: f.disabled ? "#f8fafc" : "#fff"
                  }}
                />
              </div>
            ))}

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#64748b", fontSize: 13 }}>Booking fee</span>
                <b style={{ color: "#1e293b" }}>Rs. {amount}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#64748b", fontSize: 13 }}>Payment status</span>
                <b style={{ color: paymentDone ? "#15803d" : "#64748b" }}>{paymentDone ? "Paid online" : "Skipped / Pay later"}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b", fontSize: 13 }}>OTP status</span>
                <b style={{ color: otpVerified ? "#15803d" : "#b45309" }}>{otpVerified ? "Verified" : "Pending"}</b>
              </div>
            </div>

            <button onClick={handlePayNow} disabled={paying || paymentDone} style={{
              width: "100%", padding: "12px 0", background: paymentDone ? "#bbf7d0" : "#0f766e",
              color: paymentDone ? "#166534" : "#fff", border: "none", borderRadius: 10,
              fontWeight: 700, fontSize: 15, cursor: paymentDone ? "default" : "pointer", marginBottom: 10
            }}>
              {paymentDone ? `Payment complete${paymentMeta?.paymentId ? ` · ${paymentMeta.paymentId}` : ""}` : paying ? "Opening Razorpay..." : `Pay Online Rs. ${amount}`}
            </button>

            <button onClick={sendOtp} style={{
              width: "100%", padding: "12px 0", background: "#dbeafe",
              color: "#1d4ed8", border: "1px solid #93c5fd", borderRadius: 10,
              fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 12
            }}>
              {otpSent ? "Resend Demo OTP" : "Send Booking OTP"}
            </button>

            {otpSent && (
              <div style={{ border: "1px solid #bfdbfe", background: "#eff6ff", borderRadius: 12, padding: 14, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, color: "#1d4ed8", marginBottom: 6 }}>4. Verify Booking OTP</div>
                <div style={{ color: "#475569", fontSize: 13, marginBottom: 10 }}>Use demo OTP <b>1234</b> to confirm this booking.</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={otpValue}
                    onChange={e => setOtpValue(e.target.value)}
                    placeholder="Enter OTP"
                    style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1.5px solid #93c5fd", fontSize: 14 }}
                  />
                  <button onClick={verifyOtp} style={{
                    padding: "10px 16px", borderRadius: 8, border: "none", background: "#2563eb",
                    color: "#fff", fontWeight: 700, cursor: "pointer"
                  }}>
                    Verify
                  </button>
                </div>
                {otpError && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 8 }}>{otpError}</div>}
                {otpVerified && <div style={{ color: "#15803d", fontSize: 12, marginTop: 8 }}>OTP verified. You can confirm the booking now.</div>}
              </div>
            )}

            {error && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{error}</div>}

            {result && (
              <div style={{ background: result.status === "PENDING" ? "#fff7ed" : "#f0fdf4", border: `1.5px solid ${result.status === "PENDING" ? "#fdba74" : "#86efac"}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
                <div style={{ fontWeight: 700, color: result.status === "PENDING" ? "#c2410c" : "#15803d" }}>
                  {result.status === "PENDING" ? "Booking Request Sent" : "Booking Confirmed"}
                </div>
                <div style={{ fontSize: 13, color: result.status === "PENDING" ? "#9a3412" : "#166534", marginTop: 4 }}>{result.message}</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Booking ID: <b>#{result.bookingId}</b></div>
              </div>
            )}

            <button onClick={handleBook} disabled={loading} style={{
              width: "100%", padding: "13px 0",
              background: loading ? "#c7d2fe" : "#6366f1",
              color: "#fff", border: "none", borderRadius: 10,
              fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer"
            }}>
              {loading ? "Booking..." : `Submit ${bedType} Booking Request`}
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
                    <span style={{ marginLeft: 8, background: (statusColor[b.status] || "#888") + "22", color: statusColor[b.status] || "#888", fontWeight: 700, fontSize: 12, padding: "2px 10px", borderRadius: 6 }}>{statusLabel(b.status)}</span>
                    <div style={{ fontWeight: 600, color: "#1e293b", marginTop: 8 }}>{b.hospitalName}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>Booked: {new Date(b.bookingTime).toLocaleString()}</div>
                    {b.reason && <div style={{ fontSize: 12, color: "#64748b" }}>Reason: {b.reason}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#6366f1" }}>#{b.id}</div>
                    {(b.status === "PENDING" || b.status === "CONFIRMED") && (
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
