import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";

function MobileEntry() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('sessionId');

  const [form, setForm] = useState({
    name: "", age: "", email: "", phone: "", gender: "",
  });
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionId) { navigate('/'); return; }
    const savedData = localStorage.getItem('reliv_customer_data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setForm(prev => ({
          ...prev,
          name: parsedData.name || "",
          age: parsedData.age || "",
          email: parsedData.email || "",
          phone: parsedData.phone || "",
          gender: parsedData.gender || "",
        }));
        setRememberMe(parsedData.rememberMe !== false);
        setDataLoaded(true);
      } catch (e) { console.error(e); }
    }
  }, [sessionId, navigate]);


  const handleInput = useCallback((e) => {
    const { name, value } = e.target;

    if (name === 'age') {
      const numOnly = value.replace(/[^0-9]/g, '').slice(0, 3);
      e.target.value = numOnly;
      setForm(prev => ({ ...prev, age: numOnly }));
      setErrors(prev => ({ ...prev, age: "" }));
      return;
    }

    if (name === 'phone') {
      const cleaned = value.replace(/[^0-9+\-\s()]/g, '');
      setForm(prev => ({ ...prev, phone: cleaned }));
      setErrors(prev => ({ ...prev, phone: "" }));
      return;
    }

    // For all other fields: just take the value as-is
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  }, []);

  const handleGenderChange = (e) => {
    setForm(prev => ({ ...prev, gender: e.target.value }));
    setErrors(prev => ({ ...prev, gender: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    if (!form.name.trim()) { newErrors.name = "Name is required"; isValid = false; }
    const ageNum = parseInt(form.age, 10);
    if (!form.age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      newErrors.age = "Please enter a valid age (1-120)"; isValid = false;
    }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email"; isValid = false;
    }
    if (form.phone) {
      const digits = form.phone.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) {
        newErrors.phone = "Enter a valid phone number (10-15 digits)"; isValid = false;
      }
    }
    if (!form.gender) { newErrors.gender = "Please select gender"; isValid = false; }
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      if (rememberMe) {
        localStorage.setItem('reliv_customer_data', JSON.stringify({
          ...form, rememberMe: true, lastSaved: new Date().toISOString()
        }));
      } else {
        localStorage.removeItem('reliv_customer_data');
      }
      const response = await fetch(`${API_BASE}/api/save-customer-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, customerData: form })
      });
      if (response.ok) {
        setSubmitted(true);
      } else {
        setSubmitError(`Server error: ${response.status}. Please try again.`);
      }
    } catch (error) {
      setSubmitError("Network error — please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Shared input style ───
  // font-size: 16px is CRITICAL — below 16px, iOS Safari auto-zooms on focus
  // Do NOT set WebkitAppearance/appearance — it can block the native keyboard on some Android browsers
  const base = {
    width: '100%',
    fontSize: '16px',
    lineHeight: '1.5',
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    color: '#111827',
    // DO NOT add WebkitAppearance: 'none' here — it breaks mobile keyboards on Android
  };
  const errStyle = { ...base, border: '1px solid #ef4444' };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #fff7ed, #ffffff)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', padding: '40px 32px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px' }}>✓</div>
          <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#111827', margin: '0 0 10px' }}>Details saved!</h2>
          <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: '1.6', margin: '0 0 20px' }}>
            Your information has been sent to the kiosk. You can now return to continue.
          </p>
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>You can close this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #fff7ed, #ffffff)', padding: '20px 16px 40px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: '0 0 6px' }}>
            <span style={{ color: '#f97316' }}>Reliv</span> — Enter Your Details
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Fill in on your phone, then return to the kiosk</p>
        </div>

        {dataLoaded && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
            <p style={{ color: '#166534', fontSize: '14px', margin: 0 }}>Previous details auto-filled — review and update if needed.</p>
          </div>
        )}

        {submitError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
            <p style={{ color: '#991b1b', fontSize: '14px', margin: 0 }}>{submitError}</p>
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '24px 20px' }}>
          {/*
            KEY FIX: We use `onInput` (not `onChange`) as the primary handler.
            `onInput` is the native DOM event that fires synchronously on every
            keystroke. React's `onChange` is actually mapped to the native `onInput`
            event internally, BUT in some mobile browsers (especially iOS Safari with
            autocorrect/predictive text), React's synthetic event gets batched or
            dropped. By using the native `onInput` attribute directly, we bypass
            React's event system for the actual value capture, then sync to state.
            
            We still pass `onChange={handleInput}` as a fallback for React's system.
            Both pointing to the same handler ensures at least one fires.
          */}
          <form onSubmit={handleSubmit} noValidate>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Full Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onInput={handleInput}
                onChange={handleInput}
                autoComplete="name"
                autoCorrect="off"
                autoCapitalize="words"
                spellCheck="false"
                placeholder="Enter your name"
                style={errors.name ? errStyle : base}
              />
              {errors.name && <p style={{ color: '#ef4444', fontSize: '13px', margin: '4px 0 0' }}>{errors.name}</p>}
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Age *</label>
              <input
                type="text"
                inputMode="numeric"
                name="age"
                value={form.age}
                onInput={handleInput}
                onChange={handleInput}
                autoComplete="off"
                placeholder="e.g. 28"
                maxLength={3}
                style={errors.age ? errStyle : base}
              />
              {errors.age && <p style={{ color: '#ef4444', fontSize: '13px', margin: '4px 0 0' }}>{errors.age}</p>}
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onInput={handleInput}
                onChange={handleInput}
                autoComplete="email"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                placeholder="your.email@example.com"
                style={errors.email ? errStyle : base}
              />
              {errors.email && <p style={{ color: '#ef4444', fontSize: '13px', margin: '4px 0 0' }}>{errors.email}</p>}
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Phone <span style={{ color: '#9ca3af', fontWeight: '400' }}>(Optional)</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onInput={handleInput}
                onChange={handleInput}
                autoComplete="tel"
                inputMode="tel"
                placeholder="+91 98765 43210"
                maxLength={15}
                style={errors.phone ? errStyle : base}
              />
              {errors.phone && <p style={{ color: '#ef4444', fontSize: '13px', margin: '4px 0 0' }}>{errors.phone}</p>}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#374151', margin: '0 0 10px' }}>Gender *</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {["male", "female", "others"].map((g) => (
                  <label key={g} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                    padding: '10px 16px', borderRadius: '8px', minHeight: '44px',
                    border: form.gender === g ? '2px solid #f97316' : '1px solid #d1d5db',
                    background: form.gender === g ? '#fff7ed' : '#fff',
                    fontSize: '15px', color: '#374151',
                  }}>
                    <input
                      type="radio" name="gender" value={g}
                      checked={form.gender === g}
                      onChange={handleGenderChange}
                      style={{ width: '18px', height: '18px', accentColor: '#f97316' }}
                    />
                    <span style={{ textTransform: 'capitalize' }}>{g}</span>
                  </label>
                ))}
              </div>
              {errors.gender && <p style={{ color: '#ef4444', fontSize: '13px', margin: '6px 0 0' }}>{errors.gender}</p>}
            </div>

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
