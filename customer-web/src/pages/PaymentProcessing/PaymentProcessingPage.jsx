import React, { useEffect, useState } from 'react';
import { verifyBridgePayment } from '../../services/bridgeApi';
import { submitPaymentCompleteToPi } from '../../services/kioskHandoff';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export function PaymentProcessingPage({ sessionStore }) {
  const { state, updateState } = sessionStore;
  const paymentResult = state.paymentResult || {};

  const [isVerified, setIsVerified] = useState(false);
  const [authorization, setAuthorization] = useState(null);
  const [signature, setSignature] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function runVerificationFlow() {
      try {
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
        setIsVerified(true);

        setTimeout(() => {
          if (!isMounted) return;
          updateState({ paymentState: 'PAYMENT_HANDOFF' });

          try {
            submitPaymentCompleteToPi({
              sessionId: state.sessionId,
              authorization: bridgeRes.authorization,
              signature: bridgeRes.signature,
              pairingToken: state.pairingToken,
              kioskBaseUrl: state.kioskUrl || import.meta.env.VITE_KIOSK_FALLBACK_URL || '',
            });
          } catch (handoffErr) {
            console.error('Pi Handoff submit error:', handoffErr);
            updateState({
              paymentState: 'ERROR',
              error: {
                title: "We couldn't finish the payment confirmation",
                message: "We couldn't finish the kiosk confirmation. Please return to the Reliv kiosk and try again.",
                code: 'KIOSK_HANDOFF_FAIL',
              },
            });
          }
        }, 1200);

      } catch (err) {
        if (isMounted) {
          console.error('Bridge verify error:', err);
          updateState({
            paymentState: 'ERROR',
            error: {
              title: "We couldn't finish the payment confirmation",
              message: "Your payment may still be safe. Please return to the Reliv kiosk and try again.",
              code: 'BRIDGE_VERIFY_FAIL',
            },
          });
        }
      }
    }

    if (paymentResult.razorpay_payment_id) {
      runVerificationFlow();
    } else {
      updateState({
        paymentState: 'ERROR',
        error: {
          title: "We couldn't finish the payment confirmation",
          message: "Payment parameters were incomplete. Please return to the Reliv kiosk and try again.",
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
          kioskBaseUrl: state.kioskUrl || import.meta.env.VITE_KIOSK_FALLBACK_URL || '',
        });
      } catch (manualErr) {
        updateState({
          paymentState: 'ERROR',
          error: {
            title: "We couldn't finish the payment confirmation",
            message: "Please return to the Reliv kiosk and try again.",
            code: 'MANUAL_HANDOFF_FAIL',
          },
        });
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-slate-900 font-outfit">
          {isVerified ? 'Payment verified' : 'Verifying your payment'}
        </h2>
        <p className="text-sm text-slate-600">
          {isVerified ? 'Finishing your Reliv session…' : "This usually takes only a few seconds. Please don't close this page."}
        </p>
      </div>

      <div className="rounded-3xl border border-orange-100 bg-white p-8 shadow-sm space-y-6 text-center">
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          {isVerified ? (
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin" />
          )}
        </div>

        <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
          {isVerified
            ? 'Updating kiosk with verified payment.'
            : 'Confirming your payment status securely.'}
        </p>

        {/* Fallback button if auto form submission is delayed */}
        {isVerified && (
          <div className="pt-2">
            <button
              onClick={handleManualHandoff}
              className="w-full py-3.5 px-5 rounded-2xl bg-orange-500 text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-sm hover:bg-orange-600 active:scale-[0.99] transition-all"
            >
              <span>Continue to Kiosk</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
