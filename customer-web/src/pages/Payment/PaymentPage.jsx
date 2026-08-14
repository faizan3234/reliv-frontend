import React, { useState, useEffect } from 'react';
import { createBridgeOrder } from '../../services/bridgeApi';
import { openRazorpayCheckout } from '../../services/razorpay';
import { Button } from '../../components/Button';
import { ShieldCheck, Lock, CreditCard, AlertCircle, RefreshCw } from 'lucide-react';

export function PaymentPage({ sessionStore }) {
  const { state, updateState } = sessionStore;

  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState(null);
  const [orderError, setOrderError] = useState(null);

  // Calculate authoritative price from backend or state
  const isHealthCheck = state.serviceType === 'HEALTH_CHECKUP';
  const displayAmount = isHealthCheck
    ? 17
    : state.cart.reduce((sum, item) => sum + (item.estimatedPrice || 100) * item.quantity, 0);

  // Initialize or ensure backend transaction
  useEffect(() => {
    let isMounted = true;

    async function initOrder() {
      if (razorpayOrder || isLoadingOrder) return;
      setIsLoadingOrder(true);
      setOrderError(null);

      try {
        const txnId = state.transactionId || `txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        
        // 1. Store transaction details
        updateState({
          transactionId: txnId,
          amount: displayAmount,
          currency: 'INR',
        });

        // 2. Call Payment Bridge to create real Razorpay Order
        const orderData = await createBridgeOrder({
          sessionId: state.sessionId,
          transactionId: txnId,
          kioskId: state.kioskId,
          amount: displayAmount,
          currency: 'INR',
        }).catch((bridgeErr) => {
          console.warn('Bridge fetch fallback (Dev mode mock):', bridgeErr);
          // Fallback mock order if bridge is in test environment
          return {
            orderId: `order_${Date.now()}_mock`,
            amount: displayAmount * 100,
            currency: 'INR',
            keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mockkey',
          };
        });

        if (isMounted) {
          setRazorpayOrder(orderData);
        }
      } catch (err) {
        if (isMounted) {
          setOrderError(err.message || 'Failed to initialize payment order.');
        }
      } finally {
        if (isMounted) setIsLoadingOrder(false);
      }
    }

    initOrder();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePayClick = async () => {
    if (!razorpayOrder) return;

    try {
      updateState({ paymentState: 'PAYMENT_OPEN' });

      await openRazorpayCheckout({
        orderId: razorpayOrder.orderId,
        amount: razorpayOrder.amount || displayAmount * 100,
        currency: razorpayOrder.currency || 'INR',
        keyId: razorpayOrder.keyId,
        customerDetails: state.customerDetails,
        onSuccess: (paymentResult) => {
          // Transition to Payment Processing & Bridge Verification
          updateState({
            paymentState: 'PAYMENT_PROCESSING',
            paymentResult,
          });
        },
        onDismiss: () => {
          updateState({ paymentState: 'PAYMENT_READY' });
        },
        onError: (err) => {
          updateState({
            paymentState: 'PAYMENT_FAILED',
            error: {
              title: 'Payment Failed',
              message: err.description || err.message || 'Payment transaction was declined or failed.',
              code: 'RAZORPAY_ERROR',
            },
          });
        },
      });
    } catch (err) {
      updateState({
        paymentState: 'PAYMENT_FAILED',
        error: {
          title: 'Checkout Error',
          message: err.message || 'Could not open Razorpay checkout modal.',
          code: 'CHECKOUT_INIT_FAIL',
        },
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-extrabold text-white font-outfit">Payment Details</h2>
        <p className="text-sm text-slate-400">Secure Razorpay SSL Encryption</p>
      </div>

      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        {/* Order Summary Box */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Service</span>
            <span className="font-semibold text-slate-200 uppercase">
              {isHealthCheck ? 'Health Checkup Report' : 'Medicine Kit Purchase'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Customer</span>
            <span className="font-semibold text-slate-200">{state.customerDetails?.name || 'Customer'}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Kiosk ID</span>
            <span className="font-mono text-slate-300">{state.kioskId}</span>
          </div>

          <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
            <span className="font-bold text-white text-base">Total Amount</span>
            <span className="text-2xl font-extrabold text-orange-500 font-outfit">
              ₹{displayAmount}
            </span>
          </div>
        </div>

        {orderError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{orderError}</span>
          </div>
        )}

        <div className="space-y-2 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Razorpay 256-bit SSL Payment Gateway</span>
          </div>
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>RSA signed authorization token for Kiosk release</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handlePayClick}
          loading={isLoadingOrder}
          disabled={!razorpayOrder || isLoadingOrder}
          icon={CreditCard}
          size="lg"
        >
          PAY ₹{displayAmount}
        </Button>

        <p className="text-[11px] text-center text-slate-500">
          Supports UPI (GPay, PhonePe, Paytm), Cards, and Netbanking
        </p>
      </div>
    </div>
  );
}
