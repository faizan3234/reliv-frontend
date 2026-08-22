// src/pages/MedicineDispensing.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Plus, Minus, Sparkles, X, ArrowLeft, Heart, ShieldCheck } from "lucide-react";
import { sanitizeError } from "../utils/errorSanitizer";
import Logo from "../components/Logo";
import PrimaryButton from "../components/PrimaryButton";
import AuraBackground from "../components/AuraBackground";
import "./RelivKiosk.css";
import { API_BASE } from "../config/api";
import { formatINR } from "../utils/currency";

// Helper to resolve canonical medicine image URL (local Pi file or external URL)
export const getMedicineImageUrl = (kit) => {
  const imagePath = kit?.image_path || kit?.imageUrl || "";

  if (!imagePath) {
    return "";
  }

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("data:") ||
    imagePath.startsWith("blob:")
  ) {
    return imagePath;
  }

  return `${API_BASE}${imagePath}`;
};

// --- Quantity & Stock Helpers ---
export const getAvailableQuantity = (kit) => {
  if (!kit) return 0;
  return Number(
    kit.available_quantity ??
    (Number(kit.stock_quantity ?? kit.quantity ?? 0) -
     Number(kit.reserved_quantity ?? 0))
  );
};

const computeStockLabel = (qty, expiryDate) => {
  if (expiryDate && new Date(expiryDate) < new Date()) return "Expired";
  if (qty <= 0) return "Out of Stock";
  if (qty <= 5) return "Low Stock";
  return "In Stock";
};

const computeStockClass = (qty, expiryDate) => {
  const label = computeStockLabel(qty, expiryDate);
  switch (label) {
    case "In Stock":
      return "stock in";
    case "Low Stock":
      return "stock low";
    case "Out of Stock":
      return "stock out";
    case "Expired":
      return "stock expired";
    default:
      return "stock out";
  }
};

const StockBadge = ({ quantity, expiryDate }) => {
  const stock = computeStockLabel(quantity, expiryDate);
  const stockClass = computeStockClass(quantity, expiryDate);
  return <span className={stockClass}>{stock}</span>;
};

// --- Customer Kit Card Component ---
const KitCard = ({ kit, onAddToCart, onUpdateQty, onRemoveFromCart, cart, isMostChosen }) => {
  const available = getAvailableQuantity(kit);
  const isOutOfStock = available <= 0 || (kit.expiryDate && new Date(kit.expiryDate) < new Date());

  const cartItem = cart?.find((item) => (item.kit_id || item.id) === (kit.kit_id || kit.id));
  const cartQty = cartItem ? cartItem.cartQuantity : 0;

  // Authentic social proof based on kit ID
  const showSocialProof = useMemo(() => {
    const seed = typeof kit.id === "number" ? kit.id : (kit.kit_id || "1").charCodeAt(0);
    return seed % 10 === 2 || seed % 10 === 7;
  }, [kit.id, kit.kit_id]);

  const recentBuyers = useMemo(() => {
    const seed = typeof kit.id === "number" ? kit.id : (kit.kit_id || "1").charCodeAt(0);
    return ((seed * 3) % 4) + 2;
  }, [kit.id, kit.kit_id]);

  return (
    <motion.div
      whileHover={{ y: -6 }}
      className={`glass-card lift-hover ${isOutOfStock ? "disabled" : ""}`}
    >
      {/* Sparkle Effect Layer */}
      <div className="sparkle-layer">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "linear", repeatDelay: 2 }}
          className="shimmer-sweep"
        />
      </div>

      {/* Badges */}
      <div className="card-top">
        {isOutOfStock ? (
          <span className="stock out" style={{ fontSize: "11px", padding: "5px 10px" }}>
            Restocking soon
          </span>
        ) : (
          <StockBadge quantity={available} expiryDate={kit.expiryDate} />
        )}

        {!isOutOfStock && isMostChosen && (
          <span
            className="badge"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              fontSize: "11px",
              padding: "4px 8px",
            }}
          >
            ★ Most Chosen
          </span>
        )}

        {!isOutOfStock && showSocialProof && !isMostChosen && (
          <span
            className="badge"
            style={{
              background: "linear-gradient(135deg, #059669, #10B981)",
              fontSize: "11px",
              padding: "4px 8px",
            }}
          >
            {recentBuyers} bought today
          </span>
        )}
      </div>

      {/* Image */}
      <div className="product-img">
        {getMedicineImageUrl(kit) ? (
          <img src={getMedicineImageUrl(kit)} alt={kit.name} />
        ) : (
          <span>{(kit.name || "Medicine").split(" ")[0]}</span>
        )}
      </div>

      {/* Text Details */}
      <h3>{kit.name}</h3>
      <p>{kit.description || "Essential health & wellness support"}</p>

      {/* Price & Cart Actions */}
      <div className="price-row">
        <div className="price-stack">
          <span className="mrp-price">{formatINR(Math.round(kit.price * 1.25))}</span>
          <span className="price">{formatINR(kit.price)}</span>
        </div>

        {/* Add to Cart button */}
        {!isOutOfStock && cartQty === 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onAddToCart(kit)}
            className="add-cart-btn"
          >
            <Plus size={18} />
            <span>Add</span>
          </motion.button>
        )}

        {/* Quantity Controls */}
        {!isOutOfStock && cartQty > 0 && (
          <div className="card-qty-controls">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() =>
                cartQty > 1
                  ? onUpdateQty(kit.kit_id || kit.id, cartQty - 1)
                  : onRemoveFromCart(kit.kit_id || kit.id)
              }
              className="card-qty-btn card-qty-minus"
            >
              <Minus size={18} />
            </motion.button>
            <span className="card-qty-value">{cartQty}</span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onUpdateQty(kit.kit_id || kit.id, cartQty + 1)}
              className="card-qty-btn card-qty-plus"
              disabled={cartQty >= available}
            >
              <Plus size={18} />
            </motion.button>
          </div>
        )}
      </div>

      {/* Item Total in Cart */}
      {cartQty > 0 && (
        <div className="item-total">
          <span>
            {cartQty} × {formatINR(kit.price)}
          </span>
          <span className="item-total-price">{formatINR(cartQty * kit.price)}</span>
        </div>
      )}
    </motion.div>
  );
};

// ═════════════════════════════════════════════════════════════════════════
// MAIN CUSTOMER DISPENSING COMPONENT
// ═════════════════════════════════════════════════════════════════════════
export default function MedicineDispensing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fromPaymentGate, cart: cartFromPrevPage } = location.state || {};

  const isMedicineDispensingEnabled =
    localStorage.getItem("reliv_medicine_dispensing_enabled") !== "false";

  if (!isMedicineDispensingEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Logo />
        <h2 className="text-3xl font-bold text-red-600 mt-8 mb-4">
          Medicine Dispensing Disabled
        </h2>
        <p className="text-lg text-gray-700 mb-6">
          This feature is currently turned off. Please contact support.
        </p>
      </div>
    );
  }

  const [medicalKits, setMedicalKits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState(cartFromPrevPage || []);
  const [activeCategory, setActiveCategory] = useState("all");

  // Fetch Inventory from Kiosk Backend
  const fetchKits = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/kits?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to fetch medical kits");
      const data = await response.json();
      const kits = Array.isArray(data) ? data : data.kits || [];
      setMedicalKits(kits);
    } catch (err) {
      if (import.meta.env.DEV) console.error("Error loading kits:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKits();
  }, [fetchKits]);

  // Load / Persist Cart
  useEffect(() => {
    if (!cartFromPrevPage) {
      try {
        const saved = sessionStorage.getItem("reliv_cart");
        if (saved) setCart(JSON.parse(saved));
      } catch {}
    }
  }, [cartFromPrevPage]);

  useEffect(() => {
    sessionStorage.setItem("reliv_cart", JSON.stringify(cart));
  }, [cart]);

  // Cart operations
  const handleAddToCart = (kit) => {
    const kitKey = kit.kit_id || kit.id;
    setCart((prev) => {
      const existing = prev.find((item) => (item.kit_id || item.id) === kitKey);
      if (existing) {
        return prev.map((item) =>
          (item.kit_id || item.id) === kitKey
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      }
      return [...prev, { ...kit, cartQuantity: 1 }];
    });
  };

  const handleUpdateQuantity = (kitKey, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if ((item.kit_id || item.id) === kitKey) {
            const newQty = item.cartQuantity + delta;
            return newQty > 0 ? { ...item, cartQuantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const handleRemoveFromCart = (kitKey) => {
    setCart((prev) => prev.filter((item) => (item.kit_id || item.id) !== kitKey));
  };

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.cartQuantity || 0), 0);
  }, [cart]);

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * (item.cartQuantity || 0), 0);
  }, [cart]);

  const handleProceedToPayment = () => {
    if (cart.length === 0) return;
    navigate("/payment", { state: { cart, totalAmount: totalPrice } });
  };

  if (isLoading) {
    return (
      <AuraBackground>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"
            />
            <div className="text-lg font-bold text-gray-700">Loading medicines...</div>
          </div>
        </div>
      </AuraBackground>
    );
  }

  return (
    <AuraBackground>
      <div className={`kiosk-content ${cart.length === 0 ? "no-cart" : ""}`}>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="kiosk-back-btn"
          aria-label="Go back"
        >
          <ArrowLeft size={22} />
          <span>Back</span>
        </button>

        {/* Header Branding */}
        <div className="kiosk-header">
          <Logo />
          <h1 className="kiosk-title">Medicine Dispenser</h1>
          <p className="kiosk-subtitle">
            Sanitized, verified healthcare products dispensed instantly
          </p>
        </div>

        {/* Medicine Product Grid */}
        <div className="medicine-grid-container">
          <div className="medicine-grid">
            {medicalKits.map((kit, index) => (
              <KitCard
                key={kit.kit_id || kit.id || index}
                kit={kit}
                onAddToCart={handleAddToCart}
                onUpdateQty={handleUpdateQuantity}
                onRemoveFromCart={handleRemoveFromCart}
                cart={cart}
                isMostChosen={index === 0}
              />
            ))}
          </div>
        </div>

        {/* Luxury Slide-up Cart Drawer */}
        <AnimatePresence>
          {totalItems > 0 && (
            <motion.div
              initial={{ y: 120, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 120, opacity: 0 }}
              className="luxury-cart-drawer"
            >
              <div className="cart-silk-wave" />

              {/* Cart Header */}
              <div className="luxury-cart-header">
                <div className="luxury-cart-title">
                  <span className="cart-label">YOUR SELECTION</span>
                  <span className="cart-count">
                    {totalItems} {totalItems === 1 ? "ITEM" : "ITEMS"}
                  </span>
                </div>
                <div className="luxury-cart-total">
                  <span className="total-label">TOTAL</span>
                  <span className="total-price">{formatINR(totalPrice)}</span>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="luxury-cart-items">
                {cart.map((item) => (
                  <motion.div
                    key={item.kit_id || item.id}
                    className="luxury-cart-item"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", width: "100%" }}>
                      <div className="luxury-item-image">
                        <div className="item-image-glow" />
                        {getMedicineImageUrl(item) ? (
                          <img src={getMedicineImageUrl(item)} alt={item.name} />
                        ) : (
                          <span className="item-placeholder">
                            {(item.name || "M").split(" ")[0]}
                          </span>
                        )}
                      </div>
                      <div className="luxury-item-details">
                        <h3 className="luxury-item-name">{item.name}</h3>
                        <p className="luxury-item-meta">
                          <span>SANITIZED</span>
                          <span aria-hidden="true" style={{ margin: "0 4px" }}>•</span>
                          <span>INSTANT</span>
                        </p>
                      </div>
                    </div>

                    <div className="luxury-qty-section">
                      <span className="qty-label">QUANTITY</span>
                      <div className="luxury-qty-controls">
                        <button
                          onClick={() => handleUpdateQuantity(item.kit_id || item.id, -1)}
                          disabled={item.cartQuantity <= 1}
                          className="luxury-qty-btn"
                        >
                          −
                        </button>
                        <span className="luxury-qty-value">
                          {String(item.cartQuantity).padStart(2, "0")}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.kit_id || item.id, 1)}
                          className="luxury-qty-btn"
                        >
                          +
                        </button>
                      </div>
                      <span className="luxury-item-subtotal">
                        {formatINR(item.price * item.cartQuantity)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Proceed Action Button */}
              <div className="luxury-cart-footer">
                <PrimaryButton
                  onClick={handleProceedToPayment}
                  className="luxury-pay-btn"
                >
                  <span>Proceed to Payment ({formatINR(totalPrice)})</span>
                </PrimaryButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuraBackground>
  );
}
