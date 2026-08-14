import React, { useEffect, useState } from 'react';
import { verifyBridgePayment } from '../../services/bridgeApi';
import { submitPaymentCompleteToPi } from '../../services/kioskHandoff';
import { Loader2, CheckCircle2, ShieldCheck, ArrowRight, Smartphone } from 'lucide-react';

export function PaymentProcessingPage({ sessionStore }) {
  const { state, updateState } = sessionStore;
  const paymentResult = state.paymentResult || {};

  const [step, setStep] = useState(1); // 1: Razorpay Success, 2: Bridge Verifying, 3: Bridge Verified, 4: Pi Handoff
  const [authorization, setAuthorization] = useState(null);
  const [signature, setSignature] = useState(null);
  const [verifyError, setVerifyError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function runVerificationFlow() {
      try {
        setStep(2); // Bridge Verifying state

        // STRICT: Call Payment Bridge verify-payment with real Razorpay callback data
        const bridgeRes = await verifyBridgePayment({
          razorpay_payment_id: paymentResult.razorpay_payment_id,
          razorpay_order_id: paymentResult.razorpay_order_id,
          razorpay_signature: paymentResult.razorpay_signature,
          sessionId: state.sessionId,
          transactionId: state.transactionId,
          kioskId: state.kioskId,
        });

        if (!isMounted) return;

        setAuthorization(bridgeRes.authorization);
        setSignature(bridgeRes.signature);
        setStep(3); // Bridge Verified state

        // Pause briefly for user feedback before Pi handoff
        setTimeout(() => {
          if (!isMounted) return;
          setStep(4); // Triggering Pi Handoff via form POST

          // Transition to PAYMENT_HANDOFF state (NOT COMPLETED!)
          updateState({ paymentState: 'PAYMENT_HANDOFF' });

          try {
            submitPaymentCompleteToPi({
              sessionId: state.sessionId,
              authorization: bridgeRes.authorization,
              signature: bridgeRes.signature,
              pairingToken: state.pairingToken,
              kioskBaseUrl: state.kioskUrl || import.meta.env.VITE_KIOSK_FALLBACK_URL || 'http://192.168.50.1',
            });
          } catch (handoffErr) {
            console.error('Pi Handoff submit error:', handoffErr);
            updateState({
              paymentState: 'ERROR',
              error: {
                title: 'Unable to Connect to Kiosk',
                message: handoffErr.message || 'Could not hand off payment authorization to local kiosk. Please check kiosk Wi-Fi connection or tap "Continue to Kiosk".',
                code: 'KIOSK_HANDOFF_FAIL',
              },
            });
          }
        }, 1200);

      } catch (err) {
        if (isMounted) {
          // STRICT SECURITY RULE: NO DEV MOCK RSA AUTHORIZATION FALLBACK IN PRODUCTION!
          setVerifyError(err.message || 'Payment verification failed on Payment Bridge');
          updateState({
            paymentState: 'PAYMENT_VERIFICATION_FAILED',
            error: {
              title: 'Payment Verification Failed',
              message: err.message || 'Payment Bridge could not verify Razorpay signature or payment details.',
              code: 'BRIDGE_VERIFY_FAIL',
            },
          });
        }
      }
    }

    if (paymentResult.razorpay_payment_id) {
      runVerificationFlow();
    } else {
      setVerifyError('Missing Razorpay payment result parameters.');
      updateState({
        paymentState: 'ERROR',
        error: {
          title: 'Invalid Payment Parameters',
          message: 'No Razorpay payment parameters were received.',
          code: 'MISSING_PAYMENT_PARAMS',
        },
      });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleManualHandoff = () => {
    if (authorization && signature) {
      updateState({ paymentState: 'PAYMENT_HANDOFF' });
      try {
        submitPaymentCompleteToPi({
          sessionId: state.sessionId,
          authorization,
          signature,
          pairingToken: state.pairingToken,
          kioskBaseUrl: state.kioskUrl || import.meta.env.VITE_KIOSK_FALLBACK_URL || 'http://192.168.50.1',
        });
      } catch (manualErr) {

        updateState({
          paymentState: 'ERROR',
          error: {
            title: 'Kiosk Navigation Error',
            message: manualErr.message || 'Failed to submit authorization form to local kiosk.',
            code: 'MANUAL_HANDOFF_FAIL',
          },
        });
      }
    }
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-extrabold text-white font-outfit font-outfit">Verifying Payment</h2>
        <p className="text-sm text-slate-400">Authenticating RSA Authorization with Kiosk</p>
      </div>

      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5 text-center">
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
          <ShieldCheck className="w-10 h-10 text-orange-500" />
        </div>

        {/* Step Progression Indicators */}
        <div className="space-y-3 text-left max-w-xs mx-auto text-xs">
          <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-200">State 1: Razorpay Payment Received</span>
          </div>

          <div className={`flex items-center space-x-3 p-2.5 rounded-xl border transition-all ${
            step >= 2 ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-950/40 border-slate-900 opacity-40'
          }`}>
            {step === 2 ? (
              <Loader2 className="w-4 h-4 text-orange-400 animate-spin shrink-0" />
            ) : step > 2 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
            )}
            <span className={step >= 2 ? 'text-slate-200' : 'text-slate-500'}>
              State 2: Payment Bridge Independent Verification
            </span>
          </div>

          <div className={`flex items-center space-x-3 p-2.5 rounded-xl border transition-all ${
            step >= 4 ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-950/40 border-slate-900 opacity-40'
          }`}>
            {step === 4 ? (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
            ) : step > 4 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
            )}
            <span className={step >= 4 ? 'text-slate-200' : 'text-slate-500'}>
              State 3: Cryptographic RSA Authorization Handoff to Pi
            </span>
          </div>
        </div>

        {/* Fallback button if auto form submission is blocked */}
        {step >= 3 && (
          <div className="pt-2 space-y-2">
            <p className="text-xs text-slate-400">Transferring to local kiosk...</p>
            <button
              onClick={handleManualHandoff}
              className="w-full py-3 px-4 rounded-xl bg-orange-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/20 hover:bg-orange-600 active:scale-95 transition-all"
            >
              <Smartphone className="w-4 h-4" />
              <span>Tap "Continue to Kiosk"</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
