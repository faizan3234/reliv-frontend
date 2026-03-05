// src/pages/OrderSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import TopEllipseBackground from '../components/TopEllipseBackground';
import UVCleansingAnimation from '../components/UVCleansingAnimation';
import ConfirmationIcon from '../assets/confirmation.png';

// Safe emoji icons
const MailIcon = () => <span className="text-6xl">✉️</span>;

// Confetti
function Confetti() {
  const confettiCount = 80;
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: confettiCount }).map((_, i) => {
        const size = Math.random() * 12 + 6;
        const left = Math.random() * 100;
        const duration = Math.random() * 3 + 3;
        const delay = Math.random() * 2;
        const rotation = Math.random() * 720 - 360;
        const color = ['#f97316', '#fb923c', '#fed7aa', '#fff7ed', '#f5f5f5'][Math.floor(Math.random() * 5)];

        return (
          <div
            key={i}
            className="absolute top-[-10%] rounded-full origin-center"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              animation: `fall ${duration}s linear ${delay}s forwards`,
              transform: `rotate(${rotation}deg)`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        );
      })}

      <style jsx global>{`
        @keyframes fall {
          0% { transform: translateY(-100%) rotate(0deg); }
          100% { transform: translateY(120vh) rotate(720deg); }
        }
      `}</style>
    </div>
  );
}

// 1. Email Sending + Confirmation
function EmailSendAnimation({ onComplete }) {
  const [phase, setPhase] = useState('sending');

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('sent');
      setTimeout(onComplete, 1800);
    }, 3200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-br from-orange-50 via-gray-50 to-orange-100 flex flex-col items-center justify-center z-50"
    >
      <motion.div
        animate={{ y: [0, -30, 0], rotate: [0, 15, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-orange-600"
      >
        <MailIcon />
      </motion.div>

      <AnimatePresence mode="wait">
        {phase === 'sending' ? (
          <motion.p
            key="sending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-10 text-2xl font-medium text-gray-700"
          >
            Sending your health receipt...
          </motion.p>
        ) : (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-10 flex flex-col items-center"
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-2xl font-semibold text-green-700">Receipt Sent!</p>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-sm text-gray-400 mt-16">Step 1 of 5</p>
    </motion.div>
  );
}

// 2. Payment Success
function PaymentSuccess({ cart, onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className="relative h-screen bg-gradient-to-br from-orange-50 to-gray-100 flex flex-col items-center justify-center text-center px-6 overflow-y-auto scrollable-container"
    >
      <TopEllipseBackground color="#FFF7ED" height="50%" />

      <div className="relative z-10 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 max-w-xl w-full border border-orange-100">
        <Logo />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 10 }}
          className="w-[380px] h-[380px] mx-auto mt-8 flex items-center justify-center"
        >
          <img
            src={ConfirmationIcon}
            alt="Payment Confirmed"
            className="w-full h-full object-contain drop-shadow-[0_20px_35px_rgba(251,146,60,0.5)]"
          />
        </motion.div>

        <h1 className="text-5xl font-bold text-gray-800 mt-10">Payment Confirmed</h1>
        <p className="text-gray-600 mt-6 text-2xl">
          Receipt sent to your registered email.<br />Thank you!
        </p>

        {cart.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-8 bg-green-50 rounded-xl px-6 py-4 border border-green-200"
          >
            <p className="text-green-800 font-bold text-xl flex items-center justify-center gap-2">
              <span>💊</span> Your kits are being dispensed!
            </p>
            <p className="text-green-700 mt-2 text-base">
              Please wait — collect your items from the tray below.
            </p>
          </motion.div>
        )}
      </div>

      <p className="text-sm text-gray-400 mt-10">Step 2 of 5</p>
    </motion.div>
  );
}

// 3. Dispensing Animation — happy message while kits are being dispensed
function DispensingAnimation({ cart, onComplete }) {
  const [dispensedCount, setDispensedCount] = useState(0);
  const totalItems = cart.reduce((sum, item) => sum + (item.cartQuantity || 1), 0);

  // Build a flat list so we can track per-item completion
  // e.g. cart=[{id:1,cartQuantity:2},{id:3,cartQuantity:1}] → [1,1,3]
  const flatItems = cart.flatMap(item =>
    Array.from({ length: item.cartQuantity || 1 }, () => item.id)
  );

  // Track which kits are fully done (all their items dispensed)
  const kitDoneCount = (kitId) => {
    let done = 0;
    for (let i = 0; i < dispensedCount && i < flatItems.length; i++) {
      if (flatItems[i] === kitId) done++;
    }
    return done;
  };

  useEffect(() => {
    if (totalItems === 0) { onComplete(); return; }
    // Each motor rotation on ESP32 takes ~4s (2s ON + 2s OFF)
    const interval = setInterval(() => {
      setDispensedCount(prev => {
        if (prev >= totalItems) { clearInterval(interval); return prev; }
        return prev + 1;
      });
    }, 4000);

    // Auto-advance after all items + generous buffer
    const timer = setTimeout(onComplete, totalItems * 4000 + 3000);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [totalItems, onComplete]);

  const allDone = dispensedCount >= totalItems;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="relative h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-orange-50 flex flex-col items-center justify-center text-center px-6 overflow-y-auto scrollable-container"
    >
      <TopEllipseBackground color="#ECFDF5" height="50%" />

      <div className="relative z-10 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 max-w-lg w-full border border-green-200">
        <Logo />

        {/* Animated pill icon */}
        <motion.div
          animate={allDone ? { scale: [1, 1.2, 1] } : { y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-8xl mt-6"
        >
          {allDone ? '🎉' : '💊'}
        </motion.div>

        <h1 className="text-4xl font-bold text-gray-800 mt-6">
          {allDone ? '✅ All Kits Dispensed!' : 'Dispensing Your Kits!'}
        </h1>

        <p className="text-gray-600 mt-3 text-lg leading-relaxed">
          {allDone
            ? 'All done! Please collect your items from the tray below.'
            : 'Your wellness kits are being dispensed — please wait a moment.'}
        </p>

        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-green-50 rounded-lg px-4 py-3 border border-green-200"
          >
            <p className="text-green-800 text-base font-semibold flex items-center justify-center gap-2">
              🎉 Thank you for your purchase!
            </p>
          </motion.div>
        )}

        {/* Assurance banner */}
        {!allDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-5 bg-green-50 rounded-lg px-4 py-2.5 border border-green-200"
          >
            <p className="text-green-800 text-sm font-medium flex items-center justify-center gap-2">
              <span>✅</span>
              Payment confirmed — your items are dispensing now. Please wait!
            </p>
          </motion.div>
        )}

        {/* Per-kit progress */}
        <div className="mt-6 space-y-3">
          {cart.map((item) => {
            const itemQty = item.cartQuantity || 1;
            const done = kitDoneCount(item.id);
            const isDone = done >= itemQty;
            return (
              <div key={item.id} className={`flex items-center gap-3 rounded-xl px-5 py-3 transition-colors duration-500 ${isDone ? 'bg-green-100 border border-green-300' : 'bg-green-50'}`}>
                <span className="text-2xl">
                  {isDone ? '✅' : '⏳'}
                </span>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    {isDone ? `${itemQty} of ${itemQty} dispensed` : `Dispensing... ${done} of ${itemQty}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-7 bg-gray-200 rounded-full h-3.5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: totalItems > 0 ? `${Math.min((dispensedCount / totalItems) * 100, 100)}%` : '100%' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <p className="mt-3 text-sm font-semibold text-green-700">
          {allDone
            ? '✨ All done — enjoy your wellness kits!'
            : `Dispensing item ${Math.min(dispensedCount + 1, totalItems)} of ${totalItems}…`}
        </p>
      </div>

      <p className="text-sm text-gray-400 mt-10">Step 3 of 5</p>
    </motion.div>
  );
}

// 4. System Sanitized (after UV animation)
function SystemSanitized({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <>
      <Confetti />
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.08, opacity: 0 }}
        className="relative h-screen bg-gradient-to-br from-orange-50 via-gray-50 to-orange-100 flex flex-col items-center justify-center text-center px-6 overflow-y-auto scrollable-container"
      >
        <TopEllipseBackground color="#FFF7ED" height="50%" />

        <div className="relative z-10 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-12 max-w-lg w-full border border-orange-100">
          <Logo />

          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
            className="text-9xl mt-8"
          >
            ✨
          </motion.div>

          <h1 className="text-4xl font-bold text-gray-800 mt-8">System Sanitized</h1>
          <p className="text-gray-600 mt-4 text-xl">UV cleansing completed successfully</p>
          <p className="text-orange-600 font-semibold mt-6 text-2xl">
            Ready for the next patient
          </p>
        </div>

        <p className="text-sm text-gray-400 mt-12">Step 4 of 5</p>
      </motion.div>
    </>
  );
}

// 5. Thank You + Retention
function RetentionScreen({ onShareFeedback }) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 8000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative h-screen bg-gradient-to-br from-orange-50 to-gray-100 flex flex-col items-center justify-center px-6 overflow-y-auto scrollable-container"
    >
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-12 max-w-lg w-full text-center border border-orange-100">
        <Logo />

        <h2 className="text-5xl font-bold text-gray-800 mt-10">Thank You!</h2>

        <p className="text-gray-700 mt-6 text-xl leading-relaxed">
          Your health check is complete.<br />
          Wishing you great health always!
        </p>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onShareFeedback}
          className="mt-12 w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-2xl py-8 rounded-2xl shadow-2xl transition-all duration-300 flex items-center justify-center gap-4"
        >
          <span className="text-3xl">🌟</span>
          Share Your Experience
        </motion.button>

        <button
          onClick={() => navigate('/')}
          className="mt-10 text-gray-500 hover:text-gray-700 text-lg transition-colors"
        >
          Return to Home Screen
        </button>
      </div>

      <p className="text-sm text-gray-400 mt-10">Step 5 of 5</p>
    </motion.div>
  );
}

export default function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart = [], fromReport = false } = location.state || {};
  const [step, setStep] = useState('email');

  // Log for debugging (remove in production)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('OrderSuccess mounted:', { cart, fromReport, itemCount: cart.length });
    }
  }, [cart, fromReport]);

  const goToFeedback = () => {
    navigate('/feedback');
  };

  const hasKits = cart.length > 0;

  return (
    <div className="relative min-h-screen">
      <AnimatePresence mode="wait">
        {step === 'email' && <EmailSendAnimation key="email" onComplete={() => setStep('payment')} />}

        {step === 'payment' && <PaymentSuccess key="payment" cart={cart} onComplete={() => setStep(hasKits ? 'dispensing' : 'uv')} />}

        {step === 'dispensing' && <DispensingAnimation key="dispensing" cart={cart} onComplete={() => setStep('uv')} />}

        {step === 'uv' && <UVCleansingAnimation key="uv" onComplete={() => setStep('sanitized')} />}

        {step === 'sanitized' && <SystemSanitized key="sanitized" onComplete={() => setStep('thankyou')} />}

        {step === 'thankyou' && <RetentionScreen key="thankyou" onShareFeedback={goToFeedback} />}
      </AnimatePresence>
    </div>
  );
}