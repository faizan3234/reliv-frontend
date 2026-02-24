// src/pages/DispensingProgress.jsx
// Real-time dispensing progress UI with motor/sensor status

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../components/Logo";
import TopEllipseBackground from "../components/TopEllipseBackground";

const API_BASE = import.meta.env.VITE_BACKEND_URL;
const POLL_INTERVAL = 1500; // Poll every 1.5 seconds

// Status colors and icons
const STATUS_CONFIG = {
  pending:    { color: "text-gray-400", bg: "bg-gray-100", icon: "⏳", label: "Waiting" },
  dispensing: { color: "text-orange-600", bg: "bg-orange-100", icon: "⚙️", label: "Dispensing" },
  completed:  { color: "text-green-600", bg: "bg-green-100", icon: "✅", label: "Done" },
  failed:     { color: "text-red-600", bg: "bg-red-100", icon: "❌", label: "Issue" },
};

function ProgressBar({ dispensed, requested, status }) {
  const pct = requested > 0 ? Math.min((dispensed / requested) * 100, 100) : 0;
  
  return (
    <div className="w-full mt-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{dispensed} of {requested}</span>
        <span className="text-gray-500">{Math.round(pct)}%</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            status === 'completed' ? 'bg-green-500' :
            status === 'failed' ? 'bg-red-400' :
            'bg-gradient-to-r from-orange-400 to-orange-600'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function ItemCard({ item, index }) {
  const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-white border-2 ${
        item.status === 'dispensing' ? 'border-orange-400 shadow-lg shadow-orange-100' :
        item.status === 'completed' ? 'border-green-300' :
        item.status === 'failed' ? 'border-red-300' :
        'border-gray-200'
      } rounded-2xl p-5 transition-all duration-300`}
    >
      <div className="flex items-start gap-4">
        {/* Motor Icon */}
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${config.bg} flex-shrink-0`}>
          <span className="text-2xl">{config.icon}</span>
        </div>
        
        {/* Info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-gray-900 truncate">{item.kitName}</h3>
            <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
              {config.label}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
            <span>Motor #{item.motor}</span>
            <span>•</span>
            <span>Qty: {item.requestedQty}</span>
            {item.retries > 0 && (
              <>
                <span>•</span>
                <span className="text-amber-600">Retries: {item.retries}</span>
              </>
            )}
          </div>

          {/* Progress Bar */}
          <ProgressBar 
            dispensed={item.dispensedQty} 
            requested={item.requestedQty} 
            status={item.status} 
          />
          
          {/* Sensor Status (only when dispensing) */}
          {item.status === 'dispensing' && (
            <div className="flex gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${item.irCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-gray-600">IR: {item.irCount}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${item.loadConfirmed > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-gray-600">Load: {item.loadConfirmed}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-600">Rotations: {item.motorRotations}</span>
              </div>
            </div>
          )}
          
          {/* Error Info */}
          {item.status === 'failed' && item.errors?.length > 0 && (
            <div className="mt-2 p-2 bg-red-50 rounded-lg">
              <p className="text-xs text-red-600">
                ⚠️ Dispensed {item.dispensedQty} of {item.requestedQty} — Please collect from the bin and alert staff for remaining items.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function DispensingProgress() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart = [], sessionId: initialSessionId } = location.state || {};
  
  const [sessionId, setSessionId] = useState(initialSessionId || null);
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(!initialSessionId);
  const pollRef = useRef(null);

  // Start dispensing if no session ID was passed
  useEffect(() => {
    if (sessionId || cart.length === 0) return;
    
    const startDispense = async () => {
      setIsStarting(true);
      try {
        const res = await fetch(`${API_BASE}/api/dispense`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart }),
        });
        const data = await res.json();
        if (data.ok && data.sessionId) {
          setSessionId(data.sessionId);
          setSessionData({
            status: 'in-progress',
            items: data.items.map(i => ({
              ...i,
              requestedQty: i.quantity,
              dispensedQty: 0,
              irCount: 0,
              loadConfirmed: 0,
              motorRotations: 0,
              retries: 0,
              errors: [],
            })),
          });
        } else {
          setError(data.message || "Failed to start dispensing");
        }
      } catch (err) {
        setError("Cannot connect to kiosk. Please alert staff.");
      } finally {
        setIsStarting(false);
      }
    };

    startDispense();
  }, [cart, sessionId]);

  // Poll for dispensing status
  useEffect(() => {
    if (!sessionId) return;

    const pollStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/dispense/${sessionId}`);
        const data = await res.json();
        if (data.ok) {
          setSessionData(data);
          // Stop polling if session is complete
          if (['completed', 'failed', 'partial'].includes(data.status)) {
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
          }
        }
      } catch {
        // Ignore polling errors, will retry
      }
    };

    // Initial poll
    pollStatus();

    // Set up interval
    pollRef.current = setInterval(pollStatus, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [sessionId]);

  // Overall progress calculation
  const totalRequested = sessionData?.items?.reduce((s, i) => s + (i.requestedQty || 0), 0) || 0;
  const totalDispensed = sessionData?.items?.reduce((s, i) => s + (i.dispensedQty || 0), 0) || 0;
  const overallPct = totalRequested > 0 ? Math.round((totalDispensed / totalRequested) * 100) : 0;
  const isComplete = ['completed', 'partial', 'failed'].includes(sessionData?.status);
  const allSuccess = sessionData?.status === 'completed';

  // Auto-navigate after completion
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        navigate('/order-success', { replace: true });
      }, 6000); // 6 seconds to review
      return () => clearTimeout(timer);
    }
  }, [isComplete, navigate]);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-orange-50/30 font-sans overflow-y-auto scrollable-container">
      <TopEllipseBackground color="#FFF7ED" height="50%" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="text-center mb-10">
          <Logo size="text-4xl" />
          <h1 className="text-3xl font-bold text-gray-900 mt-6">
            {isComplete ? (allSuccess ? "All Items Dispensed! 🎉" : "Dispensing Complete") : "Dispensing Your Items..."}
          </h1>
          <p className="text-gray-500 mt-2">
            {isComplete
              ? "Please collect your items from the bin below"
              : "Please wait while we prepare your items"}
          </p>
        </header>

        {/* Starting State */}
        {isStarting && (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="text-6xl inline-block"
            >
              ⚙️
            </motion.div>
            <p className="mt-6 text-gray-600 text-lg">Initializing dispensing system...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
            <span className="text-4xl">⚠️</span>
            <h2 className="text-xl font-bold text-red-800 mt-3">{error}</h2>
            <p className="text-red-600 mt-2">Your payment was successful. Items will be dispensed shortly.</p>
            <button
              onClick={() => navigate('/order-success', { replace: true })}
              className="mt-4 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Overall Progress */}
        {sessionData && !isStarting && (
          <>
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Overall Progress
                </span>
                <span className="text-2xl font-bold text-orange-600">{overallPct}%</span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    allSuccess ? 'bg-gradient-to-r from-green-400 to-green-600' :
                    'bg-gradient-to-r from-orange-400 to-orange-600'
                  }`}
                  animate={{ width: `${overallPct}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{totalDispensed} items dispensed</span>
                <span>{totalRequested} total</span>
              </div>
            </div>

            {/* Individual Items */}
            <div className="space-y-4">
              {sessionData.items?.map((item, index) => (
                <ItemCard key={item.kitId} item={item} index={index} />
              ))}
            </div>

            {/* Completion Actions */}
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-center"
              >
                {allSuccess ? (
                  <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6">
                    <span className="text-5xl">🎉</span>
                    <h2 className="text-xl font-bold text-green-800 mt-3">All items dispensed successfully!</h2>
                    <p className="text-green-600 mt-2">Please collect your items from the collection bin.</p>
                  </div>
                ) : (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
                    <span className="text-5xl">⚠️</span>
                    <h2 className="text-xl font-bold text-amber-800 mt-3">Some items had issues</h2>
                    <p className="text-amber-600 mt-2">
                      Please collect dispensed items and alert staff for any missing items. 
                      Your payment is fully covered.
                    </p>
                  </div>
                )}
                
                <button
                  onClick={() => navigate('/order-success', { replace: true })}
                  className="mt-6 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-[1.02] transition-all"
                >
                  Continue →
                </button>
                <p className="text-gray-400 text-sm mt-3">Auto-continuing in a few seconds...</p>
              </motion.div>
            )}

            {/* Dispensing Animation */}
            {!isComplete && (
              <div className="mt-8 text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-5xl inline-block"
                >
                  📦
                </motion.div>
                <p className="text-gray-500 mt-3">
                  Do not move the kiosk while dispensing is in progress
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
