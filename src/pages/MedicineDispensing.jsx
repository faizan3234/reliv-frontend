// src/pages/MedicineDispensing.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars -- used by JSX member tags
import { ShoppingCart, Plus, Minus, Sparkles, X, ArrowLeft, Heart, ShieldCheck, Trash2 } from "lucide-react";
import Logo from "../components/Logo";
import PrimaryButton from "../components/PrimaryButton";
import AuraBackground from "../components/AuraBackground";
import "./RelivKiosk.css";
import { API_BASE } from "../config/api";
import SpokenGuide from '../components/SpokenGuide';
import { useHealth } from '../context/HealthContext';
import { medicineGuide } from '../voice/medicineGuide';
import { requestJSON } from '../utils/request';
import { readBrowserStorage, writeBrowserStorage } from '../utils/browserStorage';
import { formatINR } from "../utils/currency";

// Helper to resolve canonical medicine image URL (local Pi file or external URL)
// Universal kit ID resolver (ensures matching across SQLite kit_id and MongoDB id)
// eslint-disable-next-line react-refresh/only-export-components
export const getKitId = (kit) => {
  if (!kit) return "";
  return String(kit.kit_id ?? kit.id ?? kit._id ?? "");
};

// eslint-disable-next-line react-refresh/only-export-components
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
// eslint-disable-next-line react-refresh/only-export-components
export const getAvailableQuantity = (kit) => {
  if (!kit) return 0;
  const value = Number(kit.available_quantity ??
    (Number(kit.stock_quantity ?? kit.quantity ?? 0) - Number(kit.reserved_quantity ?? 0)));
  return Number.isSafeInteger(value) && value > 0 ? value : 0;
};
const stockWords = {
  en: { available:n=>`${n} available`, empty:'Out of stock', expired:'Unavailable', add:'Add', refresh:'Refresh stock', checking:'Checking stock…', offline:'Stock could not be checked. Please refresh before choosing items.', changed:'Stock changed. Please review your selection before continuing.', hint:'The number on each item shows available stock. Use + or − to change your quantity. Out-of-stock items cannot be selected.', selected:'Selected', increase:'Increase quantity', decrease:'Decrease quantity' },
  hi: { available:n=>`${n} उपलब्ध हैं`, empty:'स्टॉक खत्म', expired:'उपलब्ध नहीं', add:'जोड़ें', refresh:'स्टॉक फिर जाँचें', checking:'स्टॉक जाँच रहे हैं…', offline:'स्टॉक जाँचा नहीं जा सका। चुनने से पहले स्टॉक फिर जाँचें।', changed:'स्टॉक बदल गया है। आगे बढ़ने से पहले अपनी चुनी हुई मात्रा जाँच लें।', hint:'हर सामान पर बची हुई मात्रा दिखती है। + या − से अपनी मात्रा बदलें। जिसका स्टॉक खत्म है, उसे नहीं चुन सकते।', selected:'चुना हुआ', increase:'मात्रा बढ़ाएँ', decrease:'मात्रा घटाएँ' },
  bn: { available:n=>`${n}টি পাওয়া যাচ্ছে`, empty:'স্টক শেষ', expired:'পাওয়া যাচ্ছে না', add:'যোগ করুন', refresh:'স্টক আবার দেখুন', checking:'স্টক দেখা হচ্ছে…', offline:'স্টক দেখা যায়নি। বেছে নেওয়ার আগে আবার দেখুন।', changed:'স্টক বদলেছে। এগোনোর আগে আপনার বেছে নেওয়া পরিমাণ দেখুন।', hint:'প্রতিটি জিনিসে কতটা পাওয়া যাচ্ছে দেখানো আছে। + বা − দিয়ে নিজের পরিমাণ বদলান। স্টক শেষ হলে বেছে নেওয়া যাবে না।', selected:'বেছে নেওয়া', increase:'পরিমাণ বাড়ান', decrease:'পরিমাণ কমান' },
};
const isUnavailable = kit => {
  const expiry = kit?.expiryDate || kit?.expiry_date;
  return getAvailableQuantity(kit) === 0 || (expiry && (!Number.isFinite(Date.parse(expiry)) || Date.parse(expiry) < Date.now()));
};
const parseKits = data => {
  const kits = Array.isArray(data) ? data : data?.kits;
  if (!Array.isArray(kits)) throw new Error('Invalid inventory response');
  return kits.filter(kit => kit && getKitId(kit));
};

// --- Customer Kit Card Component ---
const KitCard = ({ kit, onAddToCart, onUpdateQty, onRemoveFromCart, cart, words, blocked }) => {
  const available = getAvailableQuantity(kit);
  const isOutOfStock = isUnavailable(kit);

  const kitId = getKitId(kit);
  const cartItem = cart?.find((item) => getKitId(item) === kitId);
  const cartQty = cartItem ? cartItem.cartQuantity : 0;


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
        <span className={`stock ${isOutOfStock ? 'out' : available <= 5 ? 'low' : 'in'}`}>
          {isOutOfStock ? (available === 0 ? `${words.empty} · 0` : words.expired) : words.available(available)}
        </span>


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

          <span className="price">{formatINR(kit.price)}</span>
        </div>

        {isOutOfStock && <button className="add-cart-btn" disabled>{available === 0 ? words.empty : words.expired}</button>}
        {/* Add to Cart button */}
        {!isOutOfStock && cartQty === 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onAddToCart(kit)}
            className="add-cart-btn"
            disabled={blocked}
          >
            <Plus size={18} />
            <span>{words.add}</span>
          </motion.button>
        )}

        {/* Quantity Controls */}
        {!isOutOfStock && cartQty > 0 && (
          <div className="card-qty-controls">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() =>
                cartQty > 1
                  ? onUpdateQty(kitId, cartQty - 1)
                  : onRemoveFromCart(kitId)
              }
              aria-label={`${words.decrease}: ${kit.name}`}
              className="card-qty-btn card-qty-minus"
            >
              <Minus size={18} />
            </motion.button>
            <span className="card-qty-value" aria-label={words.selected}>{cartQty}</span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onUpdateQty(kitId, cartQty + 1)}
              className="card-qty-btn card-qty-plus"
              aria-label={`${words.increase}: ${kit.name}`}
              disabled={blocked || cartQty >= available}
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
  const isMedicineDispensingEnabled =
    readBrowserStorage("reliv_medicine_dispensing_enabled") !== "false";

  if (!isMedicineDispensingEnabled) {
    return (
      <div className="min-h-screen h-auto w-full flex flex-col items-center justify-center overflow-y-auto scrollable-container touch-pan-y bg-gray-50 px-4 py-8">
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

  return <EnabledMedicineDispensing />;
}

function EnabledMedicineDispensing() {
  const { data: health } = useHealth();
  const language = health.language || 'en';
  const words = medicineGuide[language] || medicineGuide.en;
  const stockCopy = stockWords[language] || stockWords.en;
  const [stockNotice, setStockNotice] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const inventoryRequest = useRef(null);
  const [loadError, setLoadError] = useState('');
  const [checking, setChecking] = useState(false);
  const checkoutRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { fromPaymentGate, cart: cartFromPrevPage } = location.state || {};
  const [medicalKits, setMedicalKits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState(Array.isArray(cartFromPrevPage) ? cartFromPrevPage : []);

  // Fetch Inventory from Kiosk Backend
  const fetchKits = useCallback(async () => {
    if (inventoryRequest.current || checkoutRef.current) return;
    const controller = new AbortController();
    inventoryRequest.current = controller;
    setRefreshing(true);
    try {
      const data = await requestJSON(`${API_BASE}/api/kits`, { cache: "no-store", timeoutMs:8000, signal:controller.signal });
      if (controller.signal.aborted) return;
      const kits = parseKits(data);
      setLoadError('');
      setMedicalKits(kits);
    } catch (err) {
      if (controller.signal.aborted) return;
      setLoadError(stockCopy.offline);
      if (import.meta.env.DEV) console.warn('Inventory unavailable', err.message);
    } finally {
      if (inventoryRequest.current === controller) inventoryRequest.current = null;
      if (!controller.signal.aborted) { setIsLoading(false); setRefreshing(false); }
    }
  }, [stockCopy.offline]);

  useEffect(() => {
    fetchKits();
    const timer = setInterval(() => { if (!document.hidden) fetchKits(); }, 15000);
    return () => { clearInterval(timer); inventoryRequest.current?.abort(); inventoryRequest.current = null; };
  }, [fetchKits]);

  // Load / Persist Cart
  useEffect(() => {
    if (!cartFromPrevPage) {
      try {
        const saved = sessionStorage.getItem("reliv_cart");
        if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) setCart(parsed.filter(item => item && getKitId(item) && Number.isSafeInteger(item.cartQuantity) && item.cartQuantity > 0)); }
      } catch { /* Ignore malformed stale cart data. */ }
    }
  }, [cartFromPrevPage]);

  useEffect(() => {
    writeBrowserStorage("reliv_cart", JSON.stringify(cart), "sessionStorage");
  }, [cart]);

  // Cart operations with normalized IDs and robust removal
  const handleAddToCart = (kit) => {
    const kitId = getKitId(kit);
    if (!kitId || loadError || checking || isUnavailable(kit)) return;

    setCart((prev) => {
      const existing = prev.find((item) => getKitId(item) === kitId);
      if (existing) {
        const currentKit = medicalKits.find((k) => getKitId(k) === kitId) || existing;
        const maxAvailable = getAvailableQuantity(currentKit);
        if (existing.cartQuantity >= maxAvailable) {
          setStockNotice(stockCopy.changed);
          return prev;
        }
        return prev.map((item) =>
          getKitId(item) === kitId
            ? { ...item, id: kitId, kit_id: kitId, cartQuantity: Math.min(item.cartQuantity + 1, maxAvailable) }
            : item
        );
      }
      return [...prev, { ...kit, id: kitId, kit_id: kitId, cartQuantity: 1 }];
    });
  };

  const handleUpdateQuantity = (kitIdentifier, newQuantity) => {
    const kitId = String(kitIdentifier);
    if (newQuantity <= 0) {
      handleRemoveFromCart(kitId);
      return;
    }

    setCart((prev) =>
      prev
        .map((item) => {
          if (getKitId(item) === kitId) {
            const currentKit = medicalKits.find((k) => getKitId(k) === kitId) || item;
            const maxAvailable = isUnavailable(currentKit) ? 0 : getAvailableQuantity(currentKit);
            const clampedQty = Math.min(newQuantity, maxAvailable);

            if (newQuantity > maxAvailable) {
              setStockNotice(stockCopy.changed);
            }

            return { ...item, id: kitId, kit_id: kitId, cartQuantity: clampedQty, availableStock: maxAvailable };
          }
          return item;
        })
        .filter((item) => item.cartQuantity > 0)
    );
  };

  const handleRemoveFromCart = (kitIdentifier) => {
    const kitId = String(kitIdentifier);
    setCart((prev) => prev.filter((item) => getKitId(item) !== kitId));
  };

  const handleClearCart = () => {
    setCart([]);
    writeBrowserStorage("reliv_cart", "[]", "sessionStorage");
  };

  const { totalItems, totalPrice } = useMemo(() => {
    const items = cart.reduce((sum, item) => sum + (item.cartQuantity || 0), 0);
    const price = cart.reduce((sum, item) => sum + item.price * (item.cartQuantity || 0), 0);
    return { totalItems: items, totalPrice: price };
  }, [cart]);

  // Re-verify inventory and navigate to CHECKOUT (not payment directly)
  const handleCheckout = async () => {
    if (cart.length === 0 || checkoutRef.current || refreshing || loadError) return;
    checkoutRef.current = true; setChecking(true); setLoadError('');
    try {
      const latestKits = await requestJSON(`${API_BASE}/api/kits`, { cache: "no-store", timeoutMs:8000 });
      {
        const kitList = parseKits(latestKits);
        setMedicalKits(kitList);

        const validCart = cart
          .filter((cartItem) => {
            const itemKitId = getKitId(cartItem);
            const kit = kitList.find((k) => getKitId(k) === itemKitId);
            return kit && !isUnavailable(kit);
          })
          .map((cartItem) => {
            const itemKitId = getKitId(cartItem);
            const kit = kitList.find((k) => getKitId(k) === itemKitId);
            return {
              ...cartItem,
              id: itemKitId,
              kit_id: itemKitId,
              cartQuantity: Math.min(cartItem.cartQuantity, getAvailableQuantity(kit)),
              price: kit.price,
              availableStock: getAvailableQuantity(kit),
            };
          });

        if (validCart.length !== cart.length || validCart.some((item,index) => item.cartQuantity !== cart[index].cartQuantity || Number(item.price) !== Number(cart[index].price))) {
          setCart(validCart);
          setStockNotice(stockCopy.changed);
          return;
        }

        const validTotalPrice = validCart.reduce(
          (sum, item) => sum + item.price * (item.cartQuantity || 1),
          0
        );
        navigate("/checkout", {
          state: { cart: validCart, totalPrice: validTotalPrice, fromPaymentGate },
        });
        return;
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn("Failed to re-verify inventory before checkout:", err);
      setLoadError(stockCopy.offline);
    } finally { checkoutRef.current = false; setChecking(false); }
  };

  if (isLoading) {
    return (
      <AuraBackground>
        <div className="flex min-h-[100dvh] h-auto items-center justify-center overflow-y-auto scrollable-container touch-pan-y">
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
        <header className="kiosk-header">
          <Logo />
          <h2>{words.choose}</h2>
          <SpokenGuide text={`${stockCopy.hint} ${words.chooseText}`} language={language} autoSpeak />
          <button className="stock-refresh" type="button" onClick={fetchKits} disabled={refreshing || checking}>{refreshing ? stockCopy.checking : stockCopy.refresh}</button>
          {stockNotice && <p role="status">{stockNotice}</p>}
          {loadError && <div role="alert"><p>{loadError}</p><button type="button" onClick={fetchKits}>{words.retry}</button></div>}
        </header>

        {/* 3-by-3 Product Grid (3 kits top row, 3 kits bottom row) */}
        <main className="product-grid">
          {medicalKits.map((kit, index) => (
            <KitCard
              key={kit.kit_id || kit.id || index}
              kit={kit}
              onAddToCart={handleAddToCart}
              onUpdateQty={handleUpdateQuantity}
              onRemoveFromCart={handleRemoveFromCart}
              cart={cart}
              words={stockCopy}
              blocked={Boolean(loadError) || checking}
            />
          ))}
        </main>

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
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <button
                    onClick={handleClearCart}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#dc2626",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      borderRadius: "10px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                    title="Clear entire cart"
                  >
                    <Trash2 size={14} />
                    <span>CLEAR</span>
                  </button>
                  <div className="luxury-cart-total">
                    <span className="total-label">TOTAL</span>
                    <span className="total-price">{formatINR(totalPrice)}</span>
                  </div>
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
                          <span>{stockCopy.available(getAvailableQuantity(medicalKits.find(kit => getKitId(kit) === getKitId(item))))}</span>
                          <span aria-hidden="true" style={{ margin: "0 4px" }}>•</span>
                          <span>{words.title}</span>
                        </p>
                      </div>
                    </div>

                    <div className="luxury-qty-section">
                      <span className="qty-label">{stockCopy.selected}</span>
                      <div className="luxury-qty-controls">
                        <button
                          onClick={() => handleUpdateQuantity(getKitId(item), item.cartQuantity - 1)}
                          className="luxury-qty-btn"
                          title={item.cartQuantity <= 1 ? "Remove item" : "Decrease quantity"}
                        >
                          {item.cartQuantity <= 1 ? <Trash2 size={13} style={{ color: "#ef4444" }} /> : "−"}
                        </button>
                        <span className="luxury-qty-value">
                          {String(item.cartQuantity).padStart(2, "0")}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(getKitId(item), item.cartQuantity + 1)}
                          className="luxury-qty-btn"
                          title={stockCopy.increase}
                          disabled={Boolean(loadError) || checking || isUnavailable(medicalKits.find(kit => getKitId(kit) === getKitId(item))) || item.cartQuantity >= getAvailableQuantity(medicalKits.find(kit => getKitId(kit) === getKitId(item)))}
                        >
                          +
                        </button>
                      </div>
                      <span className="luxury-item-subtotal">
                        {formatINR(item.price * item.cartQuantity)}
                      </span>
                      <button
                        onClick={() => handleRemoveFromCart(getKitId(item))}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center"
                        }}
                        title="Remove from cart"
                        aria-label="Remove item"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Proceed Action Button */}
              <div className="luxury-cart-footer">
                <PrimaryButton
                  onClick={handleCheckout}
                  disabled={checking || refreshing || Boolean(loadError)}
                  className="luxury-pay-btn"
                >
                  <span>Proceed to Checkout ({formatINR(totalPrice)})</span>
                </PrimaryButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuraBackground>
  );
}
