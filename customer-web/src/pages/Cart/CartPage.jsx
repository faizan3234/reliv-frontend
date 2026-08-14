import React, { useState } from 'react';
import { Button } from '../../components/Button';
import { Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';

const AVAILABLE_KITS = [
  {
    kit_id: 'kit_first_aid_01',
    name: 'First Aid Emergency Kit',
    desc: 'Bandages, Antiseptic wipes, Burn gel & Medical Tape',
    category: 'Emergency Care',
  },
  {
    kit_id: 'kit_wellness_02',
    name: 'Essential Wellness Pack',
    desc: 'Vitamin C, ORS rehydration & Cough lozenges',
    category: 'Wellness & Recovery',
  },
  {
    kit_id: 'kit_sanitizer_03',
    name: 'Personal Hygiene Kit',
    desc: 'N95 Mask, Hand sanitizer & Disinfectant wipes',
    category: 'Hygiene & Protection',
  },
];

export function CartPage({ sessionStore }) {
  const { state, updateCart, updateState } = sessionStore;

  const [quantities, setQuantities] = useState(() => {
    const initial = {};
    AVAILABLE_KITS.forEach((kit) => {
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

  const selectedKits = AVAILABLE_KITS.filter((kit) => (quantities[kit.kit_id] || 0) > 0);
  const totalQuantity = selectedKits.reduce((sum, kit) => sum + quantities[kit.kit_id], 0);

  const handleProceed = () => {
    const cartPayload = selectedKits.map((kit) => ({
      kit_id: kit.kit_id,
      name: kit.name,
      quantity: quantities[kit.kit_id],
    }));

    updateCart(cartPayload);
    updateState({ paymentState: 'PAYMENT_READY' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-extrabold text-white font-outfit font-outfit">Select Medical Kits</h2>
        <p className="text-sm text-slate-400">Items selected for automated kiosk dispenser release</p>
      </div>

      <div className="space-y-3">
        {AVAILABLE_KITS.map((kit) => {
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
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{kit.category}</span>
                  <h4 className="font-bold text-white font-outfit text-base">{kit.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{kit.desc}</p>
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
            <span>Total Units Selected</span>
          </span>
          <span className="font-bold text-white text-base">{totalQuantity}</span>
        </div>

        <div className="flex items-start space-x-2 text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>Inventory check and authoritative pricing will be performed by Kiosk backend during order creation.</span>
        </div>
      </div>

      <Button
        onClick={handleProceed}
        disabled={selectedKits.length === 0}
        icon={ArrowRight}
      >
        Proceed to Order Creation ({totalQuantity} Kits)
      </Button>
    </div>
  );
}
