import React, { useState } from 'react';
import { Button } from '../../components/Button';
import { Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';

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
  const { state, updateState } = sessionStore;

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

    // Atomic update: write cart and transition paymentState in a single setState
    updateState({
      cart: cartPayload,
      paymentState: 'PAYMENT_READY',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-slate-900 font-outfit">Select Medical Kits</h2>
        <p className="text-sm text-slate-600">Items for automated kiosk dispenser release</p>
      </div>

      <div className="space-y-3">
        {AVAILABLE_KITS.map((kit) => {
          const qty = quantities[kit.kit_id] || 0;
          return (
            <div
              key={kit.kit_id}
              className={`rounded-3xl border p-4 transition-all ${
                qty > 0 ? 'border-2 border-orange-500 bg-orange-50/70 shadow-sm' : 'border-orange-100 bg-white shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1 max-w-[70%]">
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">{kit.category}</span>
                  <h4 className="font-bold text-slate-900 font-outfit text-base">{kit.name}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{kit.desc}</p>
                </div>

                <div className="flex items-center space-x-2 bg-white p-1.5 rounded-2xl border border-orange-200 shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(kit.kit_id, -1)}
                    disabled={qty === 0}
                    className="w-7 h-7 rounded-xl bg-orange-50 text-slate-700 hover:bg-orange-100 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="w-6 text-center font-bold text-sm text-slate-900">{qty}</span>

                  <button
                    type="button"
                    onClick={() => handleQuantityChange(kit.kit_id, 1)}
                    className="w-7 h-7 rounded-xl bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center transition-colors"
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
      <div className="rounded-3xl border border-orange-100 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 flex items-center space-x-1.5">
            <ShoppingBag className="w-4 h-4 text-orange-500" />
            <span>Total Units Selected</span>
          </span>
          <span className="font-bold text-slate-900 text-base">{totalQuantity}</span>
        </div>

        <div className="flex items-start space-x-2 text-[11px] text-slate-600 bg-orange-50/70 p-2.5 rounded-2xl border border-orange-100">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>Inventory verification and price calculation are performed during order checkout.</span>
        </div>
      </div>

      <Button
        onClick={handleProceed}
        disabled={selectedKits.length === 0}
        icon={ArrowRight}
      >
        Proceed to Payment ({totalQuantity} Kits)
      </Button>
    </div>
  );
}
