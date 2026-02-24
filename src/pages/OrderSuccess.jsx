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
        {phase === 'sending' && (
          <motion.p
            key="sending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-10 text-2xl font-medium text-gray-700"
          >
            Sending your health receipt...
          </motion.p>
        )}
      </AnimatePresence>

      <p className="text-sm text-gray-400 mt-16">Step 1 of 4</p>
    </motion.div>
  );
}

// 2. Payment Success
function PaymentSuccess({ onComplete }) {
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
      </div>

      <p className="text-sm text-gray-400 mt-10">Step 2 of 4</p>
    </motion.div>
  );
}

// 3. System Sanitized (after UV animation)
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

        <p className="text-sm text-gray-400 mt-12">Step 3 of 4</p>
      </motion.div>
    </>
  );
}

// 4. Thank You + Retention
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

      <p className="text-sm text-gray-400 mt-10">Step 4 of 4</p>
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

  return (
    <div className="relative min-h-screen">
      <AnimatePresence mode="wait">
        {step === 'email' && <EmailSendAnimation key="email" onComplete={() => setStep('payment')} />}

        {step === 'payment' && <PaymentSuccess key="payment" onComplete={() => setStep('uv')} />}

        {step === 'uv' && <UVCleansingAnimation key="uv" onComplete={() => setStep('sanitized')} />}

        {step === 'sanitized' && <SystemSanitized key="sanitized" onComplete={() => setStep('thankyou')} />}

        {step === 'thankyou' && <RetentionScreen key="thankyou" onShareFeedback={goToFeedback} />}
      </AnimatePresence>
    </div>
  );
}