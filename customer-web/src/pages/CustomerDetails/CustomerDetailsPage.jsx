import React, { useState } from 'react';
import { InputField } from '../../components/InputField';
import { Button } from '../../components/Button';
import { submitCustomerDetailsToPi } from '../../services/kioskHandoff';
import { User, Calendar, Mail, Phone, ArrowRight, ShieldCheck } from 'lucide-react';

export function CustomerDetailsPage({ sessionStore }) {
  const { state, updateCustomerDetails, updateState } = sessionStore;
  const [formData, setFormData] = useState(state.customerDetails);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name || formData.name.trim().length < 2) {
      errs.name = 'Please enter a valid full name';
    }
    const ageNum = parseInt(formData.age, 10);
    if (!formData.age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      errs.age = 'Please enter a valid age between 1 and 120';
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.phone || !/^\d{10}$/.test(formData.phone.replace(/[- ]/g, ''))) {
      errs.phone = 'Please enter a 10-digit mobile number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    updateCustomerDetails(formData);

    try {
      submitCustomerDetailsToPi({
        sessionId: state.sessionId,
        customerDetails: formData,
        pairingToken: state.pairingToken,
        kioskBaseUrl: state.kioskUrl || import.meta.env.VITE_KIOSK_FALLBACK_URL || '',
      });
    } catch (err) {
      console.warn('Pi handoff form POST fallback:', err);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      updateState({ paymentState: 'SERVICE_SELECTION' });
    }, 400);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-slate-900 font-outfit">Your Information</h2>
        <p className="text-sm text-slate-600">Used for your health assessment & receipts</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm space-y-4">
        <InputField
          label="Full Name"
          id="name"
          name="name"
          placeholder="e.g. Faizan Khan"
          value={formData.name}
          onChange={handleChange}
          required
          error={errors.name}
          icon={User}
        />

        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="Age"
            id="age"
            name="age"
            type="number"
            placeholder="e.g. 24"
            value={formData.age}
            onChange={handleChange}
            required
            error={errors.age}
            icon={Calendar}
          />

          <div className="space-y-1.5 w-full">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide">
              Gender <span className="text-orange-500">*</span>
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 text-sm font-medium outline-none transition duration-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 hover:border-slate-300"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <InputField
          label="Email Address"
          id="email"
          name="email"
          type="email"
          placeholder="customer@example.com"
          value={formData.email}
          onChange={handleChange}
          required
          error={errors.email}
          icon={Mail}
          helperText="Your health report and receipt will be associated with this email."
        />

        <InputField
          label="Mobile Phone"
          id="phone"
          name="phone"
          type="tel"
          placeholder="10-digit number"
          value={formData.phone}
          onChange={handleChange}
          required
          error={errors.phone}
          icon={Phone}
        />

        <div className="pt-2">
          <Button type="submit" loading={isSubmitting} icon={ArrowRight}>
            Continue to Service Selection
          </Button>
        </div>

        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Your information is encrypted and securely stored</span>
        </div>
      </form>
    </div>
  );
}
