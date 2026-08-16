import React, { useState, useEffect } from 'react';
import { createBridgeOrder } from '../../services/bridgeApi';
import { openRazorpayCheckout } from '../../services/razorpay';
import { submitOrderCreationToPi } from '../../services/kioskHandoff';
import { Button } from '../../components/Button';
import { ShieldCheck, Lock, CreditCard, AlertCircle, Loader2 } from 'lucide-react';

export function PaymentPage({ sessionStore }) {
  const { state, updateState } = sessionStore;

  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState(null);
  const [orderError, setOrderError] = useState(null);

  // If Pi has already created transaction & returned transactionId + amount
  const hasAuthoritativeTransaction = Boolean(state.transactionId && state.amount > 0);

  // 1. If transaction doesn't exist on Pi yet, initiate top-level form POST handoff to Pi /api/create-order
  const handleCreatePiTransaction = () => {
    try {
      setIsLoadingOrder(true);

      // Cart recovery: React state → sessionStorage → reject
      const getReliableCart = () => {
        // Source 1: React state
        if (Array.isArray(state.cart) && state.cart.length > 0) {
          return state.cart;
        }

        // Source 2: persisted sessionStorage
        try {
          const stored = sessionStorage.getItem('reliv_customer_session_v1');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed.cart) && parsed.cart.length > 0) {
              console.warn('[PAYMENT] Recovered cart from sessionStorage:', parsed.cart);
              return parsed.cart;
            }
          }
        } catch (err) {
          console.error('[PAYMENT] Failed to recover cart from sessionStorage:', err);
        }

        return [];
      };

      const reliableCart = getReliableCart();

      console.log('[PAYMENT] ===== FINAL ORDER PAYLOAD =====');
      console.log('[PAYMENT] serviceType:', state.serviceType);
      console.log('[PAYMENT] React cart:', JSON.stringify(state.cart));
      console.log('[PAYMENT] Reliable cart:', JSON.stringify(reliableCart));
      console.log('[PAYMENT] sessionId:', state.sessionId);
      console.log('[PAYMENT] kioskUrl:', state.kioskUrl);

      if (
        state.serviceType === 'MEDICINE' &&
        reliableCart.length === 0
      ) {
        setIsLoadingOrder(false);
        setOrderError('Your cart is empty. Please go back and select at least one kit.');
        console.error('[PAYMENT] BLOCKED: MEDICINE order has no cart after React + sessionStorage recovery');
        return;
      }

      submitOrderCreationToPi({
        sessionId: state.sessionId,
        pairingToken: state.pairingToken,
        serviceType: state.serviceType,
        cart: reliableCart,
        kioskBaseUrl: state.kioskUrl,
      });
    } catch (err) {
      setIsLoadingOrder(false);
      setOrderError(err.message || 'Failed to initiate order creation with kiosk.');
    }

  };

  // 2. When authoritative transactionId + amount are returned from Pi, fetch Razorpay order from Payment Bridge
  useEffect(() => {
    let isMounted = true;

    async function fetchBridgeOrder() {
      if (!hasAuthoritativeTransaction || razorpayOrder || isLoadingOrder) return;
      setIsLoadingOrder(true);
      setOrderError(null);

      try {
        // STRICT: Call Payment Bridge with ONLY Pi-returned transactionId and authoritative amount
        const orderData = await createBridgeOrder({
          sessionId: state.sessionId,
          transactionId: state.transactionId,
          kioskId: state.kioskId,
          amount: state.amount,
          currency: state.currency || 'INR',
        });

        if (isMounted) {
          setRazorpayOrder(orderData);
        }
      } catch (err) {
        if (isMounted) {
          // STRICT SECURITY RULE: NO DEV MOCK ORDER FALLBACK IN PRODUCTION PAYMENT CODE!
          setOrderError(err.message || 'Payment Bridge is unavailable. Cannot initiate payment.');
          updateState({
            paymentState: 'ERROR',
            error: {
              title: 'Payment Service Unavailable',
              message: err.message || 'Payment Bridge order creation failed. Please try again later or notify kiosk administrator.',
              code: 'BRIDGE_ORDER_FAIL',
            },
          });
        }
      } finally {
        if (isMounted) setIsLoadingOrder(false);
      }
    }

    fetchBridgeOrder();

    return () => {
      isMounted = false;
    };
  }, [hasAuthoritativeTransaction]);

  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);

  const handlePayClick = async () => {
    if (!razorpayOrder || isOpeningCheckout) return;

    try {
      setIsOpeningCheckout(true);
      updateState({ paymentState: 'PAYMENT_OPEN' });

      await openRazorpayCheckout({
        orderId: razorpayOrder.orderId,
        amount: razorpayOrder.amount, // in paise returned by Bridge
        currency: razorpayOrder.currency || 'INR',
        keyId: razorpayOrder.keyId,
        customerDetails: state.customerDetails,
        onSuccess: (paymentResult) => {
          setIsOpeningCheckout(false);
          // Transition to Payment Processing & Bridge Verification
          updateState({
            paymentState: 'PAYMENT_PROCESSING',
            paymentResult,
          });
        },
        onDismiss: () => {
          setIsOpeningCheckout(false);
          updateState({ paymentState: 'PAYMENT_READY' });
        },
        onError: (err) => {
          setIsOpeningCheckout(false);
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
      setIsOpeningCheckout(false);
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
        <h2 className="text-2xl font-extrabold text-white font-outfit">Payment Checkout</h2>
        <p className="text-sm text-slate-400">Authoritative Kiosk Inventory & Transaction</p>
      </div>

      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        {/* Order Summary Box */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Service</span>
            <span className="font-semibold text-slate-200 uppercase">
              {state.serviceType === 'HEALTH_CHECKUP' ? 'Health Checkup Report' : 'Medicine Kit Purchase'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Customer</span>
            <span className="font-semibold text-slate-200">{state.customerDetails?.name || 'Customer'}</span>
          </div>

          {state.transactionId && (
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Transaction ID</span>
              <span className="font-mono text-slate-300">{state.transactionId.slice(0, 16)}</span>
            </div>
          )}

          <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
            <span className="font-bold text-white text-base">Authoritative Amount</span>
            {hasAuthoritativeTransaction ? (
              <span className="text-2xl font-extrabold text-orange-500 font-outfit">
                ₹{state.amount}
              </span>
            ) : (
              <span className="text-xs text-amber-400 font-medium italic">Pending Kiosk Calculation...</span>
            )}
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
        {!hasAuthoritativeTransaction ? (
          <Button
            onClick={handleCreatePiTransaction}
            loading={isLoadingOrder}
            icon={CreditCard}
            size="lg"
          >
            Create Kiosk Order & Calculate Price
          </Button>
        ) : (
          <Button
            onClick={handlePayClick}
            loading={isLoadingOrder}
            disabled={!razorpayOrder || isLoadingOrder}
            icon={CreditCard}
            size="lg"
          >
            PAY ₹{state.amount}
          </Button>
        )}

        <p className="text-[11px] text-center text-slate-500">
          Supports UPI (GPay, PhonePe, Paytm), Cards, and Netbanking
        </p>
      </div>
    </div>
  );
}
