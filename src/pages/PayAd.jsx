// src/pages/PayAd.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './PayAd.css';

// SVG Icons
const RelivHeartSvg = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="#ea580c">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const CheckSvg = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const ShieldSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

export default function PayAd() {
  const [searchParams] = useSearchParams();

  const [campaignData, setCampaignData] = useState({
    campaignId: 'AD-CAMPAIGN',
    price: 117,
    venue: 'Gurukul Kiosk',
    durationDays: 3,
    confirmationCode: '5829'
  });

  const [paymentState, setPaymentState] = useState('CHECKOUT'); // 'CHECKOUT' | 'PROCESSING' | 'SUCCESS'
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    document.title = "Pay Reliv Ads · Secure Checkout";

    // 1. Check hash #p=...
    const hashStr = window.location.hash || '';
    let parsedPayload = null;

    if (hashStr) {
      const match = hashStr.match(/(?:^|[&#?])p=([^&]+)/);
      if (match && match[1]) {
        try {
          const decoded = atob(decodeURIComponent(match[1]));
          parsedPayload = JSON.parse(decoded);
        } catch {
          console.log('[PayAd] Could not parse base64 hash payload');
        }
      }
    }

    // 2. Check query params e.g. ?campaign=...&amt=117&venue=...
    const qCampaign = searchParams.get('campaign') || parsedPayload?.campaignId;
    const qAmt = parseInt(searchParams.get('amt') || parsedPayload?.price || '117', 10);
    const qVenue = searchParams.get('venue') || parsedPayload?.venue || 'Gurukul';
    const qCode = searchParams.get('code') || parsedPayload?.confirmationCode || '5829';

    setCampaignData({
      campaignId: qCampaign || `AD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      price: qAmt || 117,
      venue: qVenue === 'all' ? 'All Venues (3 Kiosks)' : (qVenue || 'Gurukul'),
      durationDays: parsedPayload?.durationDays || 3,
      confirmationCode: qCode || '5829'
    });
  }, [searchParams]);

  const handlePayNow = () => {
    setPaymentState('PROCESSING');

    // Simulate standard Razorpay / UPI authorization
    setTimeout(() => {
      setPaymentState('SUCCESS');
    }, 1200);
  };

  return (
    <div className="payad-container">
      <div className="payad-card">
        
        {/* Header */}
        <div className="payad-header">
          <RelivHeartSvg />
          <h1 className="payad-title">Reliv Ads</h1>
          <p className="payad-subtitle">Secure DOOH Campaign Payment</p>
        </div>

        {paymentState === 'CHECKOUT' && (
          <>
            {/* Order Summary Box */}
            <div className="payad-order-box">
              <div className="payad-order-row">
                <span className="payad-label">Campaign</span>
                <span className="payad-value">{campaignData.campaignId}</span>
              </div>
              <div className="payad-order-row">
                <span className="payad-label">Venue</span>
                <span className="payad-value">{campaignData.venue}</span>
              </div>
              <div className="payad-order-row">
                <span className="payad-label">Duration</span>
                <span className="payad-value">{campaignData.durationDays} Days</span>
              </div>
              <div className="payad-divider" />
              <div className="payad-total-row">
                <span className="payad-total-label">Total Payable</span>
                <span className="payad-total-price">₹{campaignData.price}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <h2 className="payad-section-title">Select Payment Method</h2>
            
            <div className="payad-methods-list">
              <div 
                className={`payad-method-item ${selectedMethod === 'upi' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('upi')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="payad-method-radio">
                    {selectedMethod === 'upi' && <div className="radio-dot" />}
                  </div>
                  <div>
                    <div className="payad-method-name">UPI / QR (Google Pay, PhonePe, Paytm)</div>
                    <div className="payad-method-sub">Instant zero-fee activation</div>
                  </div>
                </div>
                <span className="badge-instant-pay">INSTANT</span>
              </div>

              <div 
                className={`payad-method-item ${selectedMethod === 'card' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('card')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="payad-method-radio">
                    {selectedMethod === 'card' && <div className="radio-dot" />}
                  </div>
                  <div>
                    <div className="payad-method-name">Credit or Debit Card</div>
                    <div className="payad-method-sub">Visa, Mastercard, RuPay</div>
                  </div>
                </div>
              </div>
            </div>

            {selectedMethod === 'upi' && (
              <div style={{ margin: '14px 0' }}>
                <input 
                  type="text" 
                  className="payad-upi-input" 
                  placeholder="Enter UPI ID (optional e.g. yourname@okhdfcbank)"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            )}

            <button 
              type="button" 
              className="payad-btn-submit"
              onClick={handlePayNow}
            >
              Pay ₹{campaignData.price} Securely
            </button>

            <div className="payad-secure-footer">
              <ShieldSvg />
              <span>256-bit encrypted • Powered by Razorpay & Reliv Payment Gateway</span>
            </div>
          </>
        )}

        {paymentState === 'PROCESSING' && (
          <div className="payad-processing-box">
            <div className="payad-spinner" />
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '16px 0 6px 0', color: '#1d1d1f' }}>
              Confirming Payment…
            </h3>
            <p style={{ fontSize: '14px', color: '#6e6e73' }}>
              Communicating with bank authorization gateway. Please do not close this window.
            </p>
          </div>
        )}

        {paymentState === 'SUCCESS' && (
          <div className="payad-success-view">
            <div className="payad-success-icon">
              <CheckSvg />
            </div>
            
            <h2 className="payad-success-title">Payment Successful</h2>
            <p className="payad-success-sub">
              Your advertisement is authorized and ready for display.
            </p>

            <div className="payad-code-box">
              <div className="payad-code-label">YOUR ACTIVATION CODE</div>
              <div className="payad-code-digits">
                {campaignData.confirmationCode.split('').join('   ')}
              </div>
            </div>

            <div className="payad-instruction-banner">
              <strong>Enter this 4-digit code on the Reliv kiosk screen now</strong> to start your campaign rotation.
            </div>

            <p style={{ fontSize: '12px', color: '#86868b', margin: '16px 0 0 0' }}>
              Keep this screen open until the kiosk confirms activation. The code is tied to your campaign.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
