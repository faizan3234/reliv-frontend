// src/pages/Feedback.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import VirtualKeyboard from '../components/VirtualKeyboard';

const API_BASE = import.meta.env.VITE_BACKEND_URL;

const Logo = ({ className = "", size = "text-4xl md:text-5xl" }) => (
  <div className={`inline-flex items-center justify-center ${className}`} aria-hidden="true">
    <h1 className={`${size} font-extrabold leading-tight tracking-tight`}>
      <span className="text-orange-500">Re</span>
      <span className="text-black relative">
        l
        <span className="relative inline-block">
          ı
          <span
            className="absolute left-1/2 top-[0.18em]"
            style={{
              transform: "translateX(-51%)",
              width: "0.20em",
              height: "0.20em",
              backgroundColor: "#F97316",
              borderRadius: "50%",
            }}
          />
        </span>
        v
      </span>
    </h1>
  </div>
);

export default function Feedback() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [isFaculty, setIsFaculty] = useState(null);
  const [stream, setStream] = useState('');
  const [mood, setMood] = useState(null);
  const [positives, setPositives] = useState([]);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Collaboration states
  const [showCollabPrompt, setShowCollabPrompt] = useState(false);
  const [wantsToCollaborate, setWantsToCollaborate] = useState(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeInput, setActiveInput] = useState(null);

  const nameInputRef = useRef(null);
  const commentInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const phoneInputRef = useRef(null);

  const INACTIVITY_TIMEOUT = 60000; // 60 seconds
  const timerRef = useRef(null);

  const resetTimer = () => {
    // Don't reset timer if feedback is already submitted - let user finish
    if (submitted) return;
    
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => navigate('/'), INACTIVITY_TIMEOUT);
  };

  // Stop timer when feedback is submitted
  useEffect(() => {
    if (submitted) {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [submitted]);

  // Listen for any user activity (touch, click, keypress) to reset timer
  useEffect(() => {
    if (submitted) return; // Don't track after submission
    
    const handleActivity = () => {
      resetTimer();
    };
    
    // Listen for all user interactions
    document.addEventListener('touchstart', handleActivity, { passive: true });
    document.addEventListener('touchmove', handleActivity, { passive: true });
    document.addEventListener('click', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('scroll', handleActivity, { passive: true });
    
    // Start the timer initially
    resetTimer();
    
    return () => {
      document.removeEventListener('touchstart', handleActivity);
      document.removeEventListener('touchmove', handleActivity);
      document.removeEventListener('click', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('scroll', handleActivity);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [submitted]);

  useEffect(() => {
    if (showKeyboard) {
      setTimeout(() => {
        const refMap = {
          name: nameInputRef,
          comment: commentInputRef,
          email: emailInputRef,
          phone: phoneInputRef,
        };
        if (activeInput && refMap[activeInput]?.current) {
          refMap[activeInput].current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, [showKeyboard, activeInput]);

  const needsImprovement = mood <= 3 || positives.includes('❌ Nothing special');

  const moodOptions = [
    { emoji: '😡', label: 'Very Bad', value: 1 },
    { emoji: '😐', label: 'Okay', value: 3 },
    { emoji: '🙂', label: 'Good', value: 4 },
    { emoji: '😊', label: 'Great', value: 5 },
    { emoji: '🤩', label: 'Excellent', value: 6 },
  ];

  const positiveOptions = [
    '🕒 Fast & easy',
    '🩺 Accurate results',
    '🧼 Clean & hygienic',
    '🧑‍⚕️ Felt professional',
    '🎨 Nice design',
    '❌ Nothing special',
  ];

  const computingStreams = ['CSE', 'CSE-AI', 'CSE-OT', 'CSE-IOTCSBT', 'CSBS', 'CSE-AIML'];
  const coreEngineeringStreams = ['ECE', 'EE', 'EEE', 'ME', 'IT', 'Other'];

  const handlePositive = (opt) => {
    if (positives.length >= 3 && !positives.includes(opt)) return;
    if (opt === '❌ Nothing special') {
      setPositives(['❌ Nothing special']);
    } else {
      setPositives(prev =>
        prev.includes(opt)
          ? prev.filter(p => p !== opt)
          : prev.filter(p => p !== '❌ Nothing special').concat(opt)
      );
    }
    resetTimer();
  };

  const handleSubmit = async () => {
    const feedbackData = {
      name: name.trim(),
      role: isFaculty ? 'Faculty' : 'Student',
      stream: isFaculty ? null : stream,
      mood,
      positives,
      comment: comment.trim(),
      submittedAt: new Date().toISOString(),
    };
    
    // Send feedback to backend (email sent silently)
    try {
      await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      });
    } catch (err) {
      console.error('Feedback submission error:', err);
      // Continue anyway - don't block user experience
    }
    
    setSubmitted(true);

    // Show collaboration prompt after thank you animation
    setTimeout(() => {
      setShowCollabPrompt(true);
    }, 4500);
  };

  const handleCollabChoice = (choice) => {
    setWantsToCollaborate(choice);
    if (!choice) {
      setTimeout(() => navigate('/'), 7000);
    }
    resetTimer();
  };

  const handleCollabSubmit = async () => {
    // Send collaboration interest with feedback data
    try {
      await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role: isFaculty ? 'Faculty' : 'Student',
          stream: isFaculty ? null : stream,
          mood,
          positives,
          comment: comment.trim(),
          submittedAt: new Date().toISOString(),
          collaboration: {
            email: email.trim(),
            phone: phone.trim()
          }
        })
      });
    } catch (err) {
      console.error('Collaboration submission error:', err);
    }
    setTimeout(() => navigate('/'), 4000);
  };

  const openKeyboard = (field) => {
    setActiveInput(field);
    setShowKeyboard(true);
    resetTimer();
  };

  const closeKeyboard = () => {
    setShowKeyboard(false);
    setActiveInput(null);
    resetTimer();
  };

  const inputs = { name, comment, email, phone };

  const handleKeyboardChange = (field, value) => {
    if (field === 'name') {
      setName(value.replace(/[^a-zA-Z\s]/g, ''));
    } else if (field === 'comment') {
      setComment(value);
    } else if (field === 'email') {
      setEmail(value);
    } else if (field === 'phone') {
      setPhone(value.replace(/[^0-9+\-\s]/g, ''));
    }
    resetTimer();
  };

  return (
    <div className="h-screen bg-gradient-to-br from-orange-50 to-gray-100 flex flex-col items-center justify-center p-6 overflow-y-auto scrollable-container">
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-3xl w-full relative overflow-hidden border border-orange-100">
        {/* Logo */}
        <div className="flex justify-center mb-10 mt-4">
          <Logo size="text-5xl md:text-6xl" />
        </div>

        {/* Progress bar - only during feedback */}
        {!submitted && !showCollabPrompt && (
          <div className="mb-10">
            <div className="text-center text-xl font-semibold text-gray-700 mb-3">
              Step {step} of 5
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-600 transition-all duration-500"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Back button - only during steps */}
        {step >= 2 && step <= 5 && !submitted && !showCollabPrompt && (
          <button
            onClick={() => {
              setStep(prev => Math.max(1, prev - 1));
              closeKeyboard();
            }}
            className="absolute top-6 left-6 text-5xl text-gray-400 hover:text-orange-600 transition-colors z-10"
          >
            ←
          </button>
        )}

        <AnimatePresence mode="wait">
          {/* Normal feedback flow */}
          {!submitted && !showCollabPrompt ? (
            <>
              {step === 1 && (
                <motion.div key="step1" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }} className="text-center">
                  <h2 className="text-4xl font-bold text-gray-800 mb-4">Who are you?</h2>
                  <p className="text-xl text-gray-600 mb-12">This helps us understand your feedback better</p>
                  <div className="grid grid-cols-2 gap-8 max-w-xl mx-auto">
                    <button
                      onClick={() => { setIsFaculty(false); setStep(2); }}
                      className={`p-10 rounded-3xl text-3xl font-semibold transition-all border-4 ${isFaculty === false ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-lg' : 'border-gray-300 hover:bg-gray-50'}`}
                    >
                      Student
                    </button>
                    <button
                      onClick={() => { setIsFaculty(true); setStep(2); }}
                      className={`p-10 rounded-3xl text-3xl font-semibold transition-all border-4 ${isFaculty === true ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-lg' : 'border-gray-300 hover:bg-gray-50'}`}
                    >
                      Faculty
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }}>
                  <h2 className="text-4xl font-bold text-gray-800 mb-3 text-center">Your Name</h2>
                  <p className="text-xl text-gray-600 mb-10 text-center">We use this only to personalize our thanks</p>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                    placeholder="Short name"
                    className="w-full p-6 text-2xl border-2 border-gray-300 rounded-2xl mb-10 focus:border-orange-500 focus:ring-4 focus:ring-orange-200 outline-none"
                    maxLength={60}
                    onFocus={() => openKeyboard('name')}
                  />

                  {isFaculty === false && (
                    <>
                      <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Your Stream / Department</h3>
                      <div className="mb-8">
                        <p className="text-lg font-medium text-gray-600 mb-4">Computing Streams</p>
                        <div className="grid grid-cols-3 gap-4">
                          {computingStreams.map(opt => (
                            <button
                              key={opt}
                              onClick={() => { setStream(opt); resetTimer(); }}
                              className={`p-6 rounded-2xl text-xl font-medium transition-all border-2 ${stream === opt ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:bg-gray-50'}`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-600 mb-4">Core Engineering & Others</p>
                        <div className="grid grid-cols-3 gap-4">
                          {coreEngineeringStreams.map(opt => (
                            <button
                              key={opt}
                              onClick={() => { setStream(opt); resetTimer(); }}
                              className={`p-6 rounded-2xl text-xl font-medium transition-all border-2 ${stream === opt ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:bg-gray-50'}`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end mt-10">
                    <button
                      onClick={() => setStep(3)}
                      disabled={name.trim().length < 2 || (isFaculty === false && !stream)}
                      className="py-5 px-12 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-2xl shadow-lg hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }} className="text-center">
                  <h2 className="text-4xl font-bold text-gray-800 mb-12">How was your experience today?</h2>
                  <div className="flex flex-wrap justify-center gap-10 md:gap-16">
                    {moodOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setMood(opt.value); setStep(4); resetTimer(); }}
                        className="text-9xl md:text-[12rem] transition-transform hover:scale-125 active:scale-110 focus:outline-none"
                        title={opt.label}
                      >
                        {opt.emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }}>
                  <h2 className="text-4xl font-bold text-gray-800 mb-4 text-center">What did you like most?</h2>
                  <p className="text-xl text-gray-600 mb-10 text-center">Select up to 3</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-12">
                    {positiveOptions.map(opt => (
                      <button
                        key={opt}
                        onClick={() => handlePositive(opt)}
                        className={`p-6 rounded-2xl text-xl font-medium transition-all border-2 ${
                          positives.includes(opt) ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md' : 'border-gray-200 hover:bg-gray-50'
                        } ${positives.length >= 3 && !positives.includes(opt) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setStep(5)}
                      disabled={positives.length === 0}
                      className="py-5 px-12 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-2xl shadow-lg hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div key="step5" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }}>
                  <h2 className="text-4xl font-bold text-gray-800 mb-4 text-center">
                    {needsImprovement ? 'How can we make Reliv better?' : 'Any additional suggestions?'}
                  </h2>
                  <p className="text-xl text-gray-600 mb-8 text-center">Optional • max 400 characters</p>
                  <textarea
                    ref={commentInputRef}
                    value={comment}
                    onChange={(e) => { setComment(e.target.value); resetTimer(); }}
                    placeholder="Your thoughts help us improve..."
                    className="w-full p-6 border-2 border-gray-300 rounded-2xl min-h-[180px] text-2xl resize-none mb-10 focus:border-orange-500 focus:ring-4 focus:ring-orange-200 outline-none"
                    maxLength={400}
                    onFocus={() => openKeyboard('comment')}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSubmit}
                      className="py-6 px-14 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-2xl shadow-lg hover:from-orange-600 hover:to-amber-700"
                    >
                      Submit 👍
                    </button>
                  </div>
                </motion.div>
              )}
            </>
          ) : submitted && !showCollabPrompt ? (
            <motion.div
              key="thankyou"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-16"
            >
              <div className="text-9xl mb-8">🎉</div>
              <h2 className="text-5xl font-bold text-gray-800 mb-6">Thank You!</h2>
              <p className="text-2xl text-gray-700 mb-4">Your feedback has been recorded successfully</p>
              <p className="text-xl text-gray-600 mb-8">We take your privacy seriously — all data is stored securely</p>
              <p className="text-xl text-gray-500">One moment please...</p>
            </motion.div>
          ) : showCollabPrompt && wantsToCollaborate === null ? (
            <motion.div
              key="collab-ask"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="text-8xl mb-8">🩺</div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">One last thing...</h2>
              <p className="text-xl md:text-2xl text-gray-700 mb-10 max-w-2xl mx-auto">
                We are working on an exciting <strong>health-related project</strong>.<br />
                Would you like to collaborate or share your ideas with us?
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-8 mt-8">
                <button
                  onClick={() => handleCollabChoice(true)}
                  className="py-6 px-16 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-2xl shadow-lg hover:from-orange-600 hover:to-amber-700 transform hover:scale-105 transition-all"
                >
                  Yes, let's collaborate! ✨
                </button>

                <button
                  onClick={() => handleCollabChoice(false)}
                  className="py-6 px-16 rounded-2xl bg-gray-200 text-gray-800 font-bold text-2xl shadow hover:bg-gray-300 transition-all"
                >
                  No, thank you
                </button>
              </div>
            </motion.div>
          ) : wantsToCollaborate ? (
            <motion.div
              key="collab-form"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              className="py-10"
            >
              <h2 className="text-4xl font-bold text-gray-800 mb-4 text-center">Great! Let's connect</h2>
              <p className="text-xl text-gray-600 mb-10 text-center">
                Please share your contact details.<br />
                If your idea is exciting & executable, we'll reach out!
              </p>

              <div className="space-y-8 max-w-xl mx-auto">
                <div>
                  <label className="block text-xl font-medium text-gray-700 mb-3">Email</label>
                  <input
                    ref={emailInputRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full p-6 text-2xl border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 outline-none"
                    onFocus={() => openKeyboard('email')}
                  />
                </div>

                <div>
                  <label className="block text-xl font-medium text-gray-700 mb-3">Phone Number</label>
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9+\-\s]/g, ''))}
                    placeholder="+91 98765 43210"
                    className="w-full p-6 text-2xl border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 outline-none"
                    onFocus={() => openKeyboard('phone')}
                  />
                </div>

                <p className="text-lg text-gray-600 text-center mt-6">
                  You can also directly mail your ideas to:<br />
                  <strong className="text-orange-600">khanfaizan3234@gmail.com</strong>
                </p>
              </div>

              <div className="flex justify-center mt-12">
                <button
                  onClick={handleCollabSubmit}
                  disabled={!email.trim() || !phone.trim()}
                  className="py-6 px-16 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-2xl shadow-lg hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Details & Go Back
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Virtual Keyboard */}
      {showKeyboard && activeInput && (
        <div className="fixed bottom-0 left-0 right-0 z-[10000]">
          <VirtualKeyboard
            inputName={activeInput}
            inputs={inputs}
            onChange={handleKeyboardChange}
            onClose={closeKeyboard}
          />
        </div>
      )}
    </div>
  );
}