import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";

function MobileEntry() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('sessionId');

  // ── Refs for uncontrolled inputs (no value= prop = mobile keyboard works freely) ──
  const nameRef = useRef(null);
  const ageRef  = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);

  // Only gender & checkbox need state (they're radio/checkbox, not text)
  const [gender, setGender] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // ── Load saved data and set into uncontrolled inputs via refs ──
  useEffect(() => {
    if (!sessionId) { navigate('/'); return; }

    const savedData = localStorage.getItem('reliv_customer_data');
    if (savedData) {
      try {
        const d = JSON.parse(savedData);
        // Set defaultValue via ref .value — works after mount
        if (nameRef.current && d.name)   nameRef.current.value  = d.name;
        if (ageRef.current && d.age)     ageRef.current.value   = d.age;
        if (emailRef.current && d.email) emailRef.current.value = d.email;
        if (phoneRef.current && d.phone) phoneRef.current.value = d.phone;
        if (d.gender) setGender(d.gender);
        if (d.rememberMe !== false) setRememberMe(true);
        setDataLoaded(true);
      } catch (e) { console.error(e); }
    }
  }, [sessionId, navigate]);

  // ── Read values from refs on submit ──
  const getFormValues = () => ({
    name:   nameRef.current?.value?.trim()  || "",
    age:    ageRef.current?.value?.trim()   || "",
    email:  emailRef.current?.value?.trim() || "",
    phone:  phoneRef.current?.value?.trim() || "",
    gender,
  });

  const validateForm = (form) => {
    const e = {};
    if (!form.name)  e.name = "Name is required";
    const ageNum = parseInt(form.age, 10);
    if (!form.age || isNaN(ageNum) || ageNum < 1 || ageNum > 120)
      e.age = "Please enter a valid age (1–120)";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Please enter a valid email";
    if (form.phone) {
      const digits = form.phone.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15)
        e.phone = "Enter a valid phone number (10–15 digits)";
    }
    if (!form.gender) e.gender = "Please select gender";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    const form = getFormValues();
    const errs = validateForm(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    try {
      if (rememberMe) {
        localStorage.setItem('reliv_customer_data', JSON.stringify({
          ...form, rememberMe: true, lastSaved: new Date().toISOString()
        }));
      } else {
        localStorage.removeItem('reliv_customer_data');
      }

      const res = await fetch(`${API_BASE}/api/save-customer-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, customerData: form })
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setSubmitError(`Server error: ${res.status}. Please try again.`);
      }
    } catch (err) {
      setSubmitError("Network error — please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Shared input style — 16px font is CRITICAL to stop iOS zoom on focus ──
  const inp = (hasErr) => ({
    display: 'block',
    width: '100%',
    fontSize: '16px',        // Must be ≥16px or iOS Safari zooms in
    lineHeight: '1.5',
    padding: '12px 14px',
    borderRadius: '8px',
    border: `1px solid ${hasErr ? '#ef4444' : '#d1d5db'}`,
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    color: '#111827',
    // No WebkitAppearance override — that breaks Android keyboards
  });

  const label = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px',
  };

  const errMsg = { color: '#ef4444', fontSize: '13px', margin: '4px 0 0' };
  const fieldWrap = { marginBottom: '18px' };

  if (submitted) {
    return (
      <div className="mobile-entry-page" style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #fff7ed, #ffffff)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '40px 32px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px' }}>✓</div>
          <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#111827', margin: '0 0 10px' }}>Details saved!</h2>
          <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: '1.6', margin: '0 0 20px' }}>
            Your info has been sent to the kiosk. Return to the kiosk to continue.
          </p>
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>You can close this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-entry-page" style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #fff7ed, #ffffff)', padding: '20px 16px 40px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: '0 0 6px' }}>
            <span style={{ color: '#f97316' }}>Reliv</span> — Enter Your Details
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Fill in on your phone, then return to the kiosk
          </p>
        </div>

        {dataLoaded && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
            <p style={{ color: '#166534', fontSize: '14px', margin: 0 }}>
              Previous details auto-filled — review and update if needed.
            </p>
          </div>
        )}

        {submitError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
            <p style={{ color: '#991b1b', fontSize: '14px', margin: 0 }}>{submitError}</p>
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '24px 20px' }}>
          <form onSubmit={handleSubmit} noValidate>

            {/* ── Name ── */}
            <div style={fieldWrap}>
              <label style={label}>Full Name *</label>
              <input
                ref={nameRef}
                type="text"
                name="name"
                autoComplete="name"
                autoCorrect="off"
                autoCapitalize="words"
                spellCheck="false"
                placeholder="Enter your name"
                style={inp(errors.name)}
              />
              {errors.name && <p style={errMsg}>{errors.name}</p>}
            </div>

            {/* ── Age ── */}
            <div style={fieldWrap}>
              <label style={label}>Age *</label>
              <input
                ref={ageRef}
                type="text"
                inputMode="numeric"
                name="age"
                autoComplete="off"
                placeholder="e.g. 28"
                maxLength={3}
                style={inp(errors.age)}
              />
              {errors.age && <p style={errMsg}>{errors.age}</p>}
            </div>

            {/* ── Email ── */}
            <div style={fieldWrap}>
              <label style={label}>Email *</label>
              <input
                ref={emailRef}
                type="email"
                name="email"
                autoComplete="email"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                placeholder="your.email@example.com"
                style={inp(errors.email)}
              />
              {errors.email && <p style={errMsg}>{errors.email}</p>}
            </div>

            {/* ── Phone ── */}
            <div style={fieldWrap}>
              <label style={label}>
                Phone <span style={{ color: '#9ca3af', fontWeight: '400' }}>(Optional)</span>
              </label>
              <input
                ref={phoneRef}
                type="tel"
                name="phone"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+91 98765 43210"
                maxLength={15}
                style={inp(errors.phone)}
              />
              {errors.phone && <p style={errMsg}>{errors.phone}</p>}
            </div>

            {/* ── Gender ── */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#374151', margin: '0 0 10px' }}>Gender *</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {["male", "female", "others"].map((g) => (
                  <label key={g} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    cursor: 'pointer', padding: '10px 16px', borderRadius: '8px',
                    minHeight: '44px',
                    border: gender === g ? '2px solid #f97316' : '1px solid #d1d5db',
                    background: gender === g ? '#fff7ed' : '#fff',
                    fontSize: '15px', color: '#374151',
                  }}>
                    <input
                      type="radio" name="gender" value={g}
                      checked={gender === g}
                      onChange={() => {
                        setGender(g);
                        setErrors(prev => ({ ...prev, gender: "" }));
                      }}
                      style={{ width: '18px', height: '18px', accentColor: '#f97316' }}
                    />
                    <span style={{ textTransform: 'capitalize' }}>{g}</span>
                  </label>
                ))}
              </div>
              {errors.gender && <p style={errMsg}>{errors.gender}</p>}
            </div>

            {/* ── Remember Me ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <input
                type="checkbox" id="rememberMe" checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#f97316', cursor: 'pointer' }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: '14px', color: '#6b7280', cursor: 'pointer' }}>
                Remember my details for next time
              </label>
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%', padding: '14px',
                background: isSubmitting ? '#fdba74' : '#f97316',
                color: '#fff', border: 'none', borderRadius: '10px',
                fontSize: '16px', fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                minHeight: '50px',
              }}
            >
              {isSubmitting ? 'Sending to kiosk...' : 'Submit Details →'}
            </button>

          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '16px' }}>
          Session: {sessionId ? sessionId.slice(0, 8) + '...' : 'Invalid'}
        </p>
      </div>
    </div>
  );
}

export default MobileEntry;
