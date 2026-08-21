import React, { useState, useEffect } from 'react';
import { createBridgeOrder } from '../../services/bridgeApi';
import { openRazorpayCheckout } from '../../services/razorpay';
import { submitOrderCreationToPi } from '../../services/kioskHandoff';
import { Button } from '../../components/Button';
import { Lock, CreditCard, AlertCircle } from 'lucide-react';

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
        if (Array.isArray(state.cart) && state.cart.length > 0) {
          return state.cart;
        }

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
          setOrderError(err.message || 'Payment Bridge is unavailable. Cannot initiate payment.');
          updateState({
            paymentState: 'ERROR',
            error: {
              title: 'Payment Service Unavailable',
              message: err.message || 'Payment service is temporarily unavailable. Please try again or notify kiosk staff.',
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
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        keyId: razorpayOrder.keyId,
        customerDetails: state.customerDetails,
        onSuccess: (paymentResult) => {
          setIsOpeningCheckout(false);
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
        <h2 className="text-2xl font-bold text-slate-900 font-outfit">Secure Payment</h2>
        <p className="text-sm text-slate-600">Review your summary and complete payment</p>
      </div>

      <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm space-y-4">
        {/* Order Summary Box */}
        <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-100 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Service</span>
            <span className="font-semibold text-slate-900">
              {state.serviceType === 'HEALTH_CHECKUP' ? 'Health Checkup Report' : 'Medicine Kit Purchase'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Customer</span>
            <span className="font-semibold text-slate-900">{state.customerDetails?.name || 'Customer'}</span>
          </div>

          {state.cart && state.cart.length > 0 && (
            <div className="border-t border-orange-100 pt-2 space-y-1">
              {state.cart.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs text-slate-700">
                  <span>{item.name} × {item.quantity}</span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-orange-200/70 pt-3 flex items-center justify-between">
            <span className="font-bold text-slate-900 text-base">Total Amount</span>
            {hasAuthoritativeTransaction ? (
              <span className="text-2xl font-bold text-orange-600 font-outfit">
                ₹{state.amount}
              </span>
            ) : (
              <span className="text-xs text-slate-500 font-medium">Calculating...</span>
            )}
          </div>
        </div>

        {orderError && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{orderError}</span>
          </div>
        )}

        <div className="text-xs text-slate-500 text-center pt-1">
          <span>Your payment is securely processed through Razorpay.</span>
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
            Confirm Order & Continue
          </Button>
        ) : (
          <Button
            onClick={handlePayClick}
            loading={isLoadingOrder}
            disabled={!razorpayOrder || isLoadingOrder}
            icon={CreditCard}
            size="lg"
          >
            Pay ₹{state.amount}
          </Button>
        )}

        <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-500 pt-1">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secure encrypted payment • UPI, Cards & Netbanking</span>
        </div>
      </div>
    </div>
  );
}
