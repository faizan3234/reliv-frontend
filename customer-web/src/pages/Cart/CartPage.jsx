import React, { useState } from 'react';
import { Button } from '../../components/Button';
import { Plus, Minus, ShoppingBag, ArrowRight, Info, AlertTriangle } from 'lucide-react';

const SAMPLE_KITS = [
  {
    kit_id: 'kit_first_aid_01',
    name: 'First Aid Emergency Kit',
    desc: 'Bandages, Antiseptic wipes, Burn gel & Tape',
    estimatedPrice: 150,
    stock: 5,
  },
  {
    kit_id: 'kit_wellness_02',
    name: 'Essential Wellness Pack',
    desc: 'Vitamin C, ORS rehydration & Cough lozenges',
    estimatedPrice: 200,
    stock: 8,
  },
  {
    kit_id: 'kit_sanitizer_03',
    name: 'Personal Hygiene Kit',
    desc: 'N95 Mask, Hand sanitizer & Disinfectant wipes',
    estimatedPrice: 100,
    stock: 12,
  },
];

export function CartPage({ sessionStore }) {
  const { state, updateCart, updateState } = sessionStore;

  // Initialize cart state from store or sample
  const [quantities, setQuantities] = useState(() => {
    const initial = {};
    SAMPLE_KITS.forEach((kit) => {
      const existing = state.cart.find((item) => item.kit_id === kit.kit_id);
      initial[kit.kit_id] = existing ? existing.quantity : 0;
    });
    return initial;
  });

  const handleQuantityChange = (kit_id, delta) => {
    setQuantities((prev) => {
      const current = prev[kit_id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [kit_id]: next };
    });
  };

  const selectedItems = SAMPLE_KITS.filter((kit) => (quantities[kit.kit_id] || 0) > 0);
  const totalDisplayAmount = selectedItems.reduce(
    (sum, kit) => sum + kit.estimatedPrice * quantities[kit.kit_id],
    0
  );

  const handleProceed = () => {
    const cartPayload = selectedItems.map((kit) => ({
      kit_id: kit.kit_id,
      name: kit.name,
      quantity: quantities[kit.kit_id],
      estimatedPrice: kit.estimatedPrice,
    }));

    updateCart(cartPayload);
    updateState({ paymentState: 'PAYMENT_READY' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-extrabold text-white font-outfit">Select Medical Kits</h2>
        <p className="text-sm text-slate-400">Choose items for instant dispenser release</p>
      </div>

      <div className="space-y-3">
        {SAMPLE_KITS.map((kit) => {
          const qty = quantities[kit.kit_id] || 0;
          return (
            <div
              key={kit.kit_id}
              className={`glass-panel p-4 rounded-2xl border transition-all ${
                qty > 0 ? 'border-cyan-500/60 bg-slate-900/90' : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1 max-w-[70%]">
                  <h4 className="font-bold text-white font-outfit text-base">{kit.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{kit.desc}</p>
                  <p className="text-sm font-semibold text-cyan-400 mt-1">₹{kit.estimatedPrice}</p>
                </div>

                <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(kit.kit_id, -1)}
                    disabled={qty === 0}
                    className="w-7 h-7 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="w-6 text-center font-bold text-sm text-white">{qty}</span>

                  <button
                    type="button"
                    onClick={() => handleQuantityChange(kit.kit_id, 1)}
                    className="w-7 h-7 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 flex items-center justify-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Summary Card */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400 flex items-center space-x-1.5">
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
            <span>Items Selected</span>
          </span>
          <span className="font-bold text-white">{selectedItems.length}</span>
        </div>

        <div className="flex items-center justify-between text-base font-bold border-t border-slate-800 pt-2">
          <span className="text-slate-200">Estimated Total</span>
          <span className="text-cyan-400 text-lg">₹{totalDisplayAmount}</span>
        </div>

        <div className="flex items-start space-x-2 text-[11px] text-amber-400/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Display price only. Authoritative final transaction price is created by backend inventory.</span>
        </div>
      </div>

      <Button
        onClick={handleProceed}
        disabled={selectedItems.length === 0}
        icon={ArrowRight}
      >
        Proceed to Payment (₹{totalDisplayAmount})
      </Button>
    </div>
  );
}
