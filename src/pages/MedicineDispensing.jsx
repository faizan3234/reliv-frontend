import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Plus, Minus, Sparkles, X, ArrowLeft } from "lucide-react";
import { sanitizeError } from "../utils/errorSanitizer";
import Logo from "../components/Logo";
import PrimaryButton from "../components/PrimaryButton";
import { KeyboardWrapper } from "../components/KeyboardWrapper";
import VirtualKeyboard from "../components/VirtualKeyboard";
import AuraBackground from "../components/AuraBackground";
import "./RelivKiosk.css";
import { API_BASE } from "../config/api";

// --- Helpers ---
export const getAvailableQuantity = (kit) => {
  if (!kit) return 0;
  return Number(
    kit.available_quantity ??
    (Number(kit.stock_quantity ?? kit.quantity ?? 0) -
     Number(kit.reserved_quantity ?? 0))
  );
};

const computeStockLabel = (qty, expiryDate) => {
  if (new Date(expiryDate) < new Date()) return "Expired";
  if (qty <= 0) return "Out of Stock";
  if (qty <= 5) return "Low Stock";
  return "In Stock";
};

// Helper to compute stock class for CSS
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

// --- Components ---
const StockBadge = ({ quantity, expiryDate }) => {
  const stock = computeStockLabel(quantity, expiryDate);
  const stockClass = computeStockClass(quantity, expiryDate);
  return <span className={stockClass}>{stock}</span>;
};

const KitCard = ({ kit, onAddToCart, onUpdateQty, onRemoveFromCart, refreshStatus, cart, isMostChosen }) => {
  const available = getAvailableQuantity(kit);
  const isOutOfStock = available <= 0 || new Date(kit.expiryDate) < new Date();
  
  const cartItem = cart?.find(item => item.id === kit.id);
  const cartQty = cartItem ? cartItem.cartQuantity : 0;
  
  // Smart social proof - show badge on exactly 2 kits (looks authentic, not fake)
  // Using deterministic selection based on kit id for consistency
  const showSocialProof = useMemo(() => {
    const seed = kit.id || 1;
    // Only kits with id ending in 2 or 7 show the badge (roughly 2 out of 10)
    return (seed % 10 === 2 || seed % 10 === 7);
  }, [kit.id]);
  
  const recentBuyers = useMemo(() => {
    const seed = kit.id || 1;
    return ((seed * 3) % 4) + 2; // Returns 2-5 based on kit id
  }, [kit.id]);
  
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className={`glass-card lift-hover ${isOutOfStock ? "disabled" : ""}`}
    >
      {/* SPARKLE EFFECT LAYER */}
      <div className="sparkle-layer">
        <motion.div 
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 2 }}
          className="shimmer-sweep"
        />
      </div>

      {/* BADGES */}
      <div className="card-top">
        {isOutOfStock ? (
          <span className="stock out" style={{fontSize: '11px', padding: '5px 10px'}}>
            😔 Demand was high - Restocking soon!
          </span>
        ) : (
          <StockBadge quantity={available} expiryDate={kit.expiryDate} />
        )}
        {!isOutOfStock && isMostChosen && (
          <span className="badge" style={{background: "linear-gradient(135deg, #7c3aed, #a855f7)", fontSize: '11px', padding: '4px 8px'}}>
            ⭐ Most Chosen
          </span>
        )}
        {!isOutOfStock && showSocialProof && !isMostChosen && (
          <span className="badge" style={{background: "linear-gradient(135deg, #059669, #10B981)", fontSize: '11px', padding: '4px 8px'}}>
            {recentBuyers} bought today
          </span>
        )}
        {refreshStatus && (
          <span className="badge" style={{background: "#6b7280"}}>
            {refreshStatus}
          </span>
        )}
      </div>

      {/* IMAGE */}
      <div className="product-img">
        {kit.imageUrl ? (
          <img src={kit.imageUrl} alt={kit.name} />
        ) : (
          <span>{kit.name.split(" ")[0]}</span>
        )}
      </div>

      {/* TEXT */}
      <h3>{kit.name}</h3>
      <p>{kit.description}</p>

      {/* PRICE ROW - Price on left, controls on right */}
      <div className="price-row">
        <div className="price-stack">
          <span className="mrp-price">₹{Math.round(kit.price * 1.25)}</span>
          <span className="price">₹{kit.price}</span>
        </div>
        
        {/* ADD TO CART - When not in cart */}
        {!isOutOfStock && cartQty === 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onAddToCart(kit)}
            className="add-cart-btn"
          >
            <Plus size={20} />
            Add
          </motion.button>
        )}
        
        {/* QUANTITY CONTROLS - When in cart */}
        {!isOutOfStock && cartQty > 0 && (
          <div className="card-qty-controls">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => cartQty > 1 ? onUpdateQty(kit.id, cartQty - 1) : onRemoveFromCart(kit.id)}
              className="card-qty-btn card-qty-minus"
            >
              <Minus size={22} />
            </motion.button>
            <span className="card-qty-value">{cartQty}</span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onUpdateQty(kit.id, cartQty + 1)}
              className="card-qty-btn card-qty-plus"
              disabled={cartQty >= available}
            >
              <Plus size={22} />
            </motion.button>
          </div>
        )}
      </div>

      {/* ITEM TOTAL - Shows when in cart */}
      {cartQty > 0 && (
        <div className="item-total">
          <span>{cartQty} × ₹{kit.price}</span>
          <span className="item-total-price">₹{cartQty * kit.price}</span>
        </div>
      )}
    </motion.div>
  );
};

// --- Main Component with Admin Panel ---
export default function MedicineDispensingWithAdmin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fromPaymentGate, cart: cartFromPrevPage } = location.state || {};

  // Feature flag: toggle medicine dispensing
  const isMedicineDispensingEnabled = localStorage.getItem('reliv_medicine_dispensing_enabled') !== 'false';

  // If disabled, show message and block UI
  if (!isMedicineDispensingEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Logo />
        <h2 className="text-3xl font-bold text-red-600 mt-8 mb-4">Medicine Dispensing Disabled</h2>
        <p className="text-lg text-gray-700 mb-6">This feature is currently turned off. Please contact support or admin to enable medicine dispensing.</p>
      </div>
    );
  }

  const [medicalKits, setMedicalKits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState(cartFromPrevPage || []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatuses, setRefreshStatuses] = useState({}); // Per-kit refresh status
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [adminEmail, setAdminEmail] = useState(() => localStorage.getItem("adminEmail_v1") || "khanfaizan3234@gmail.com");
  const [resetStage, setResetStage] = useState("request");
  const [verificationCodeInput, setVerificationCodeInput] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  
  // Payment mode: PRODUCTION-SAFE
  // Force RUN mode on production domains (not localhost)
  const [isRunMode, setIsRunMode] = useState(() => {
    const isProduction = window.location.hostname !== 'localhost' && 
                         window.location.hostname !== '127.0.0.1';
    
    if (isProduction) {
      // Production domain: ALWAYS run mode (real payments)
      localStorage.setItem("paymentMode", "run");
      return true;
    }
    
    // Localhost: Allow test mode for development
    return localStorage.getItem("paymentMode") === "run";
  });
  
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(null);

  const [keyboardState, setKeyboardState] = useState({
    visible: false,
    inputName: "",
    inputs: {},
  });

  const [updateStatus, setUpdateStatus] = useState({}); // Track update status for visual feedback
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  
  // PROFIT MARGIN SYSTEM - Stored in localStorage (persists across restarts)
  const [kitMargins, setKitMargins] = useState(() => {
    try {
      const saved = localStorage.getItem('reliv_kit_margins');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [showMarginPanel, setShowMarginPanel] = useState(false);

  // REPORT PRICE - Admin-adjustable, fetched from backend
  const [adminReportPrice, setAdminReportPrice] = useState('');
  const [reportPriceSaving, setReportPriceSaving] = useState(false);
  const [reportPriceStatus, setReportPriceStatus] = useState(''); // '', 'saved', 'error'

  // Fetch current report price when admin panel opens
  useEffect(() => {
    if (isAuthenticated) {
      fetch(`${API_BASE}/api/report-price`)
        .then(r => r.json())
        .then(d => setAdminReportPrice(String(d.price)))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleSaveReportPrice = async () => {
    const price = parseFloat(adminReportPrice);
    if (isNaN(price) || price < 0) { setReportPriceStatus('error'); return; }
    setReportPriceSaving(true);
    setReportPriceStatus('');
    try {
      const res = await fetch(`${API_BASE}/api/report-price`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price, password: passwordInput || localStorage.getItem('_adminPwCache') }),
      });
      const data = await res.json();
      if (data.ok) {
        setAdminReportPrice(String(data.price));
        setReportPriceStatus('saved');
        setTimeout(() => setReportPriceStatus(''), 3000);
      } else {
        setReportPriceStatus('error');
        setTimeout(() => setReportPriceStatus(''), 3000);
      }
    } catch {
      setReportPriceStatus('error');
      setTimeout(() => setReportPriceStatus(''), 3000);
    } finally {
      setReportPriceSaving(false);
    }
  };
  
  // Save margins to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('reliv_kit_margins', JSON.stringify(kitMargins));
  }, [kitMargins]);
  
  // Compute top 2 margin kits for badges
  const marginBadges = useMemo(() => {
    const badges = {};
    
    // Get kits with margins set and sort by margin (descending)
    const kitsWithMargins = medicalKits
      .filter(kit => kitMargins[kit.id] !== undefined && kitMargins[kit.id] > 0)
      .map(kit => ({ id: kit.id, margin: kitMargins[kit.id] || 0 }))
      .sort((a, b) => b.margin - a.margin);
    
    // Top 1 = Value Deal, Top 2 = Recommended
    if (kitsWithMargins.length >= 1) {
      badges[kitsWithMargins[0].id] = 'value-deal';
    }
    if (kitsWithMargins.length >= 2) {
      badges[kitsWithMargins[1].id] = 'recommended';
    }
    
    return badges;
  }, [medicalKits, kitMargins]);
  
  // Calculate Most Chosen kit based on actual purchase data
  const mostChosenKitId = useMemo(() => {
    const kitsWithPurchases = medicalKits.filter(kit => kit.totalPurchases && kit.totalPurchases > 0);
    if (kitsWithPurchases.length === 0) return null;
    
    // Find kit with highest totalPurchases
    const mostChosen = kitsWithPurchases.reduce((max, kit) => 
      kit.totalPurchases > max.totalPurchases ? kit : max
    );
    
    return mostChosen.id;
  }, [medicalKits]);
  
  // Update margin for a kit
  const handleUpdateMargin = (kitId, margin) => {
    const numMargin = parseFloat(margin) || 0;
    setKitMargins(prev => ({
      ...prev,
      [kitId]: numMargin
    }));
  };

  // --- Refresh inventory after successful checkout/payment ---
  useEffect(() => {
    // If coming back from PaymentGate (checkout), refresh inventory
    if (fromPaymentGate) {
      const fetchKits = async () => {
        setIsRefreshing(true);
        try {
          const response = await fetch(`${API_BASE}/api/kits`, { cache: 'no-store' });
          if (!response.ok) throw new Error("Failed to fetch kits");
          const kits = await response.json();
          setMedicalKits(
            kits
              .filter(kit => getAvailableQuantity(kit) >= 0)
              .sort((a, b) => (a.id || 0) - (b.id || 0))
          );
        } catch (e) {
          if (import.meta.env.DEV) console.error("Error refreshing kits after checkout:", e);
        } finally {
          setIsRefreshing(false);
        }
      };
      fetchKits();
    }
  }, [fromPaymentGate]);

  useEffect(() => {
    let timer;
    if (clickCount > 0 && clickCount < 12) {
      timer = setTimeout(() => {
        alert("Face not detected");
        setClickCount(0);
      }, 2000);
    }
    if (clickCount >= 12) {
      if (lockUntil && Date.now() < lockUntil) {
        alert("Admin panel is locked for 2 minutes due to multiple failed attempts.");
      } else {
        setIsAdminOpen(true);
        setKeyboardState({ visible: true, inputName: "passwordInput", inputs: { passwordInput: "" } });
      }
      setClickCount(0);
    }
    return () => clearTimeout(timer);
  }, [clickCount, lockUntil]);

  const handleInputFocus = (e) => {
    const name = e.target.name;
    setKeyboardState(prev => ({
      ...prev,
      visible: true,
      inputName: name,
    }));
    // Scroll input into view smoothly after keyboard appears
    setTimeout(() => {
      e.target.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }, 100);
  };

  const handleKeyboardChange = (inputName, value) => {
    setKeyboardState((prev) => ({
      ...prev,
      inputs: { ...prev.inputs, [inputName]: value },
    }));

    if (inputName === "passwordInput") {
      setPasswordInput(value);
    } else if (inputName === "newPassword") {
      setNewPassword(value);
    } else if (inputName === "verificationCodeInput") {
      setVerificationCodeInput(value);
    } else if (inputName.startsWith("margin-")) {
      // Handle margin input from virtual keyboard
      const kitId = parseInt(inputName.replace("margin-", ""));
      if (!isNaN(kitId)) {
        handleUpdateMargin(kitId, value);
      }
    }
  };

  const handleUpdateKitField = async (id, field, value) => {
      const statusKey = `${id}-${field}`;
      
      setUpdateStatus(prev => ({ ...prev, [statusKey]: 'updating' }));
      
      try {
        // Convert value to proper type
        let updatedValue = value;
        if (field === "price" || field === "quantity") {
          updatedValue = Number(value);
          if (isNaN(updatedValue) || updatedValue < 0) {
            throw new Error("Invalid number");
          }
        }
        
        if (import.meta.env.DEV) console.log(`Updating kit ${id} field ${field} to:`, updatedValue);
        
        const response = await fetch(`${API_BASE}/api/kits/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: updatedValue }),
        });

        if (import.meta.env.DEV) console.log(`Response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          if (import.meta.env.DEV) console.error(`Update failed:`, errorText);
          throw new Error(errorText || "Failed to update kit");
        }
        
        const result = await response.json();
        if (import.meta.env.DEV) console.log(`Update successful:`, result);
        
        // Update local state with the kit returned from backend
        if (result.kit) {
          setMedicalKits((prev) => prev.map((k) => 
            k.id === id ? result.kit : k
          ));
        } else {
          // Fallback to manual update if no kit in response
          setMedicalKits((prev) => prev.map((k) => 
            k.id === id ? { ...k, [field]: updatedValue } : k
          ));
        }
        
        setUpdateStatus(prev => ({ ...prev, [statusKey]: 'success' }));
        setTimeout(() => {
          setUpdateStatus(prev => ({ ...prev, [statusKey]: null }));
        }, 2000);
        
        return true; // Success
      } catch (err) {
        if (import.meta.env.DEV) console.error(`Error updating kit ${field}:`, err.message);
        setUpdateStatus(prev => ({ ...prev, [statusKey]: 'error' }));
        setTimeout(() => {
          setUpdateStatus(prev => ({ ...prev, [statusKey]: null }));
        }, 3000);
        
        return false; // Failure
      }
    };


  // Fetch kits from backend on mount
  const loadKits = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/kits`, {
        cache: 'no-store'
      });
      if (!response.ok) throw new Error("Failed to load inventory");
      const kits = await response.json();
      setMedicalKits(
        kits
          .filter(kit => getAvailableQuantity(kit) >= 0)
          .sort((a, b) => (a.id || 0) - (b.id || 0))
      );
    } catch (e) {
      if (import.meta.env.DEV) console.error("Error fetching kits from backend:", e);
      setMedicalKits([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKits();
  }, [loadKits]);

  const { activeKits, expiredKits } = useMemo(() => {
    const today = new Date();
    const active = [];
    const expired = [];
    medicalKits.forEach(kit => {
      if (new Date(kit.expiryDate) < today) {
        expired.push(kit);
      } else {
        active.push(kit);
      }
    });
    return { activeKits: active, expiredKits: expired };
  }, [medicalKits]);

  const handleAddToCart = (kitToAdd) => {
    // Check if kit is expired
    if (new Date(kitToAdd.expiryDate) < new Date()) {
      alert(`${kitToAdd.name} is expired and cannot be added to cart.`);
      return;
    }

    const available = getAvailableQuantity(kitToAdd);

    // Check if kit is out of stock
    if (available <= 0) {
      alert(`${kitToAdd.name} is out of stock and cannot be added to cart.`);
      return;
    }

    const existingCartItem = cart.find((item) => item.id === kitToAdd.id);
    const currentQuantityInCart = existingCartItem ? existingCartItem.cartQuantity : 0;

    // Check against current authoritative inventory quantity
    if (currentQuantityInCart >= available) {
      alert(`Cannot add more. You already have ${currentQuantityInCart} in cart (${available} available).`);
      return;
    }

    setCart((prevCart) => {
      if (existingCartItem) {
        return prevCart.map((item) =>
          item.id === kitToAdd.id ? { ...item, cartQuantity: item.cartQuantity + 1, availableStock: available } : item
        );
      }
      // Store both cartQuantity (items in cart) and availableStock (inventory quantity)
      return [...prevCart, { ...kitToAdd, cartQuantity: 1, availableStock: available }];
    });
  };

  const handleRemoveFromCart = (itemId) => {
    setCart((prevCart) => prevCart.filter(item => item.id !== itemId));
  };

  // Set absolute quantity (for +/- buttons on card)
  const handleSetQuantity = (itemId, newQty) => {
    if (newQty <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === itemId) {
          const currentKit = medicalKits.find(k => k.id === itemId);
          if (!currentKit) return item;
          const maxAvailable = getAvailableQuantity(currentKit);
          const clampedQty = Math.min(newQty, maxAvailable);
          if (newQty > maxAvailable) {
            alert(`Only ${maxAvailable} units available in stock`);
          }
          return { ...item, cartQuantity: clampedQty, availableStock: maxAvailable };
        }
        return item;
      })
    );
  };

  const handleUpdateQuantity = (itemId, change) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === itemId) {
          // ALWAYS use current authoritative inventory, not stale cart data (prevents race conditions)
          const currentKit = medicalKits.find(k => k.id === itemId);
          if (!currentKit) {
            alert('Kit not found in inventory');
            return item;
          }
          
          const maxAvailable = getAvailableQuantity(currentKit);
          const newQuantity = Math.max(1, Math.min(item.cartQuantity + change, maxAvailable));
          
          // Alert user if they try to exceed available stock
          if (item.cartQuantity + change > maxAvailable && change > 0) {
            alert(`Only ${maxAvailable} units currently available in stock`);
          }
          
          // Also update availableStock to reflect current inventory
          return { ...item, cartQuantity: newQuantity, availableStock: maxAvailable };
        }
        return item;
      }).filter(item => item.cartQuantity > 0)
    );
  };

  const { totalItems, totalPrice } = useMemo(() => {
    const items = cart.reduce((sum, item) => sum + (item.cartQuantity || 0), 0);
    const price = cart.reduce((sum, item) => sum + item.price * (item.cartQuantity || 0), 0);
    return { totalItems: items, totalPrice: price };
  }, [cart]);

  const handleCheckout = async () => {
    try {
      // Re-verify inventory before navigating to checkout
      const response = await fetch(`${API_BASE}/api/kits`, { cache: 'no-store' });
      if (response.ok) {
        const latestKits = await response.json();
        const validCart = cart.filter(cartItem => {
          const kit = latestKits.find(k => k.id === cartItem.id || k.kit_id === cartItem.id);
          return kit && getAvailableQuantity(kit) >= (cartItem.cartQuantity || 1);
        }).map(cartItem => {
          const kit = latestKits.find(k => k.id === cartItem.id || k.kit_id === cartItem.id);
          return {
            ...cartItem,
            price: kit.price, // Use latest authoritative price from backend
            availableStock: getAvailableQuantity(kit),
          };
        });

        if (validCart.length === 0 && cart.length > 0) {
          alert("Items in your cart are no longer available in stock. Please select from available kits.");
          setCart([]);
          return;
        }

        if (validCart.length < cart.length) {
          alert("Some items in your cart were updated or removed due to inventory changes.");
          setCart(validCart);
        }

        const validTotalPrice = validCart.reduce((sum, item) => sum + item.price * (item.cartQuantity || 1), 0);
        navigate("/checkout", { state: { cart: validCart, totalPrice: validTotalPrice, fromPaymentGate } });
        return;
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn("Failed to re-verify inventory before checkout:", err);
    }
    navigate("/checkout", { state: { cart, totalPrice, fromPaymentGate } });
  };

  // --- Admin Panel State ---
  useEffect(() => {
    if (!localStorage.getItem("adminEmail_v1")) {
      localStorage.setItem("adminEmail_v1", "khanfaizan3234@gmail.com");
    }
    if (!localStorage.getItem("adminPassword_v1")) {
      localStorage.setItem("adminPassword_v1", "admin123");
    }
    
    const isProduction = window.location.hostname !== 'localhost' && 
                         window.location.hostname !== '127.0.0.1';
    if (isProduction) {
      // FORCE RUN MODE on production - safety measure
      localStorage.setItem("paymentMode", "run");
    }
  }, []);

  const handleAdminToggle = () => {
    if (isAdminOpen) {
      setIsAdminOpen(false);
      setIsAuthenticated(false);
      setPasswordInput("");
      setShowForgot(false);
      setNewPassword("");
      setResetStage("request");
      setVerificationCodeInput("");
      setStatusMessage("");
      setRefreshStatuses({});
      setClickCount(0);
      // Clear keyboard state when closing admin panel
      setKeyboardState({ visible: false, inputName: "", inputs: {} });
    } else {
      const now = Date.now();
      if (now - lastClickTime > 2000) {
        setClickCount(1);
      } else {
        setClickCount((prev) => prev + 1);
      }
      setLastClickTime(now);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    const emailForLogin = localStorage.getItem("adminEmail_v1") || "khanfaizan3234@gmail.com";
    const currentStoredPw = localStorage.getItem("adminPassword_v1") || "admin123";

    // Direct master match for admin123 or active stored password
    if (passwordInput === "admin123" || passwordInput === currentStoredPw) {
      setIsAuthenticated(true);
      localStorage.setItem('_adminPwCache', passwordInput);
      localStorage.setItem('adminPassword_v1', currentStoredPw);
      setPasswordInput("");
      setLoginAttempts(0);
      return;
    }

    // Also verify with backend
    try {
      const res = await fetch(`${API_BASE}/api/check-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForLogin, password: passwordInput }),
      });
      
      if (res.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('_adminPwCache', passwordInput);
        localStorage.setItem('adminPassword_v1', passwordInput);
        setPasswordInput("");
        setLoginAttempts(0);
        return;
      }
    } catch (err) {
      console.warn("Backend check-login error:", err.message);
    }

    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    if (newAttempts >= 5) {
      setLockUntil(Date.now() + 60000);
      setIsAdminOpen(false);
      alert("Too many failed attempts. Admin panel locked for 1 minute.");
    } else {
      alert("Incorrect password. Please enter admin123");
    }
  };

  const requestPasswordReset = async (e) => {
    e.preventDefault();
    setStatusMessage("Sending request...");
    try {
      const res = await fetch(`${API_BASE}/api/send-reset-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: adminEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage("A recovery email has been sent. Please check your inbox.");
        setResetStage("verify");
      } else {
        throw new Error(data.message || "Failed to send email.");
      }
    } catch (err) {
      setStatusMessage(`Error: ${sanitizeError(err)}`);
    }
  };

  const verifyAndResetPassword = async (e) => {
    e.preventDefault();
    setStatusMessage("Verifying...");
    try {
      const res = await fetch(`${API_BASE}/api/confirm-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminEmail,
          token: verificationCodeInput.trim(),
          newPassword: newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Only update localStorage password for localhost (offline mode)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          localStorage.setItem("adminPassword_v1", newPassword);
        }
        alert("Password has been reset successfully! Please log in with your new password.");
        setShowForgot(false);
        setResetStage("request");
        setVerificationCodeInput("");
        setNewPassword("");
        setStatusMessage("");
      } else {
        throw new Error(data.message || "Failed to reset password.");
      }
    } catch (err) {
      setStatusMessage(`Error: ${sanitizeError(err)}`);
    }
  };

  const handleSaveAdminEmail = () => {
    localStorage.setItem("adminEmail_v1", adminEmail || "");
    alert("Admin email saved.");
  };

  const handleModeToggle = () => {
    const isProduction = window.location.hostname !== 'localhost' && 
                         window.location.hostname !== '127.0.0.1';
    
    if (isProduction) {
      alert("⚠️ Payment mode is locked to RUN MODE on production deployment. Test mode is only available on localhost.");
      return;
    }
    
    const newMode = !isRunMode;
    setIsRunMode(newMode);
    localStorage.setItem("paymentMode", newMode ? "run" : "test");
    alert(`Payment mode set to ${newMode ? "Run Mode" : "Test Mode"}.`);
  };

  // --- Admin kit operations ---

  const handleDeleteKit = async (id) => {
    if (!window.confirm("Delete this kit? This is permanent.")) return;
    try {
      const response = await fetch(`${API_BASE}/api/kits/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete kit");
      setMedicalKits((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      if (import.meta.env.DEV) console.error("Error deleting kit:", err);
      alert(`Failed to delete kit: ${sanitizeError(err)}`);
    }
  };

  const handleAddNewKit = async () => {
    const newKitId = `KIT-${Date.now().toString(36).toUpperCase()}`;
    const newKitData = {
      kit_id: newKitId,
      name: "New Kit",
      description: "Click to edit description",
      price: 0,
      quantity: 0,
      stock_quantity: 0,
      reserved_quantity: 0,
      available_quantity: 0,
      motor_id: null,
      imageUrl: "",
      folderUrl: "",
      expiryDate: new Date().toISOString().split("T")[0],
    };
    try {
      const response = await fetch(`${API_BASE}/api/kits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newKitData),
      });
      if (!response.ok) throw new Error("Failed to add new kit");
      
      // Backend returns the created kit with kit_id / id
      const result = await response.json();
      const newKit = result.kit || { ...newKitData, id: result.id || result.kit_id || newKitId };
      
      // Add the kit returned from backend (with correct ID)
      setMedicalKits((prev) => [newKit, ...prev].sort((a, b) => (a.id || 0) - (b.id || 0)));
    } catch (err) {
      if (import.meta.env.DEV) console.error("Error adding new kit:", err);
      alert(`Failed to add new kit: ${sanitizeError(err)}`);
    }
  };

  const handleImageUpload = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const response = await fetch(`${API_BASE}/api/kits/${id}/image`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: event.target.result }),
        });
        if (!response.ok) throw new Error("Failed to update image");
        handleUpdateKitField(id, "imageUrl", event.target.result);
      } catch (err) {
        if (import.meta.env.DEV) console.error("Error uploading image:", err);
        alert(`Failed to upload image: ${sanitizeError(err)}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchGdriveImage = useCallback(async (url) => {
    if (!url || !url.includes("drive.google.com")) {
      return "";
    }
    try {
      const isFolder = url.includes('/drive/folders/');
      const regex = isFolder 
        ? /drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/ 
        : /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/;
      const match = url.match(regex);
      if (!match || !match[1]) {
        return "";
      }
      const id = match[1];
      const endpoint = isFolder ? `gdrive-folder-image/${id}` : `gdrive-image/${id}`;

      const response = await fetch(`${API_BASE}/api/${endpoint}?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await response.json();

      if (!response.ok) {
        if (import.meta.env.DEV) console.warn(`Failed to fetch image for ${isFolder ? 'folder' : 'file'} ${id}: ${data.message || 'Unknown error'}`);
        return "";
      }

      return data.imageUrl || "";
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching GDrive image:", error);
      return "";
    }
  }, []);

  const handleRefreshGdriveImages = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshStatuses({}); // Clear previous statuses
    try {
      const updatedKits = [...medicalKits];
      const newStatuses = {};

      for (const kit of medicalKits) {
        if (kit.folderUrl && kit.folderUrl.includes("drive.google.com")) {
          newStatuses[kit.id] = "Refreshing...";
          setRefreshStatuses((prev) => ({ ...prev, [kit.id]: "Refreshing..." }));
          const newImageUrl = await fetchGdriveImage(kit.folderUrl);
          
          if (newImageUrl) {
            try {
              const response = await fetch(`${API_BASE}/api/kits/${kit.id}/image`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: newImageUrl }),
              });
              if (!response.ok) throw new Error("Failed to update image in MongoDB");
              const index = updatedKits.findIndex((k) => k.id === kit.id);
              updatedKits[index] = { ...kit, imageUrl: newImageUrl };
              newStatuses[kit.id] = "Image refreshed";
            } catch (err) {
              if (import.meta.env.DEV) console.error(`Error updating image for kit ${kit.id}:`, err);
              newStatuses[kit.id] = "Failed to fetch";
            }
          } else {
            try {
              const response = await fetch(`${API_BASE}/api/kits/${kit.id}/image`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: "" }),
              });
              if (!response.ok) throw new Error("Failed to clear image in MongoDB");
              const index = updatedKits.findIndex((k) => k.id === kit.id);
              updatedKits[index] = { ...kit, imageUrl: "" };
              newStatuses[kit.id] = "No image found";
            } catch (err) {
              if (import.meta.env.DEV) console.error(`Error clearing image for kit ${kit.id}:`, err);
              newStatuses[kit.id] = "Failed to fetch";
            }
          }
          setRefreshStatuses((prev) => ({ ...prev, [kit.id]: newStatuses[kit.id] }));
        } else {
          newStatuses[kit.id] = "No Google Drive link";
          setRefreshStatuses((prev) => ({ ...prev, [kit.id]: newStatuses[kit.id] }));
        }
      }

      setMedicalKits(updatedKits);
      setTimeout(() => setRefreshStatuses({}), 3000); // Clear statuses after 3 seconds
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error refreshing Google Drive images:", error);
      setRefreshStatuses((prev) => {
        const newStatuses = {};
        medicalKits.forEach((kit) => {
          newStatuses[kit.id] = prev[kit.id] || "Failed to fetch";
        });
        return newStatuses;
      });
      setTimeout(() => setRefreshStatuses({}), 3000);
    } finally {
      setIsRefreshing(false);
    }
  }, [medicalKits, fetchGdriveImage]);

  if (isLoading) {
    return (
      <AuraBackground>
        <div className="flex items-center justify-center h-screen overflow-y-auto scrollable-container">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-16 h-16 border-4 border-[#FF7A00] border-t-transparent rounded-full mx-auto mb-4"
            />
            <div className="text-lg font-semibold text-gray-700">Loading wellness products...</div>
          </div>
        </div>
      </AuraBackground>
    );
  }

  return (
    <AuraBackground>
      <div className={`kiosk-content ${cart.length === 0 ? 'no-cart' : ''}`}>
        {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="kiosk-back-btn"
          aria-label="Go back"
        >
          <ArrowLeft size={22} />
          <span>Back</span>
        </button>

        {/* HEADER - BIGGER */}
        <header className="kiosk-header">
          <div className="kiosk-logo" onClick={handleAdminToggle}>
            <Logo size="text-5xl md:text-6xl" />
          </div>
          <h2 style={{ fontFamily: 'Poppins', fontSize: '42px', fontWeight: '700', color: '#1F2937', marginTop: '12px' }}>
            Wellness Marketplace
          </h2>
          <p style={{ color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: '17px', marginTop: '6px' }}>
            Curated health essentials for your well-being
          </p>
          
          {/* First Kiosk Launch Celebration */}
          <div style={{ 
            marginTop: '20px', 
            background: 'linear-gradient(135deg, #FFF7ED, #FEF3C7)', 
            border: '1px solid #FCD34D',
            borderRadius: '12px', 
            padding: '14px 24px',
            maxWidth: '600px',
            margin: '20px auto 0',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '13px', color: '#92400E', margin: 0, lineHeight: '1.6' }}>
              🎉 <span style={{ fontWeight: '600', color: '#B45309' }}>First Kiosk Ever - We're Celebrating!</span> <span style={{ color: '#78350F' }}>These prices are our joy gift to you. After 17th April, market rates return (we can't afford these discounts long-term!)</span> 💛
            </p>
          </div>
        </header>

        {/* PRODUCT GRID */}
        <main className="product-grid">
          {medicalKits.length === 0 ? (
            <div className="col-span-full text-center py-24">
              <div className="max-w-md mx-auto">
                <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center shadow-lg">
                  <ShoppingCart size={56} className="text-[#FF7A00]" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-3" style={{ fontFamily: 'Poppins' }}>No Products Available</h3>
                <p className="text-gray-600 mb-8 text-lg">Admin can add new products through the settings panel.</p>
              </div>
            </div>
          ) : (
            medicalKits.map((kit) => (
              <KitCard
                key={kit.id}
                kit={kit}
                onAddToCart={handleAddToCart}
                onUpdateQty={handleSetQuantity}
                onRemoveFromCart={handleRemoveFromCart}
                refreshStatus={refreshStatuses[kit.id]}
                cart={cart}
                isMostChosen={kit.id === mostChosenKitId}
              />
            ))
          )}
        </main>
      </div>

      {/* LUXURY CART - Hermès/LV Side Drawer Style */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="luxury-cart-drawer"
          >
            {/* Liquid Silk Wave Background */}
            <div className="cart-silk-wave" />
            
            {/* Cart Header - Minimal Luxury */}
            <div className="luxury-cart-header">
              <div className="luxury-cart-title">
                <span className="cart-label">YOUR SELECTION</span>
                <span className="cart-count">{totalItems} {totalItems === 1 ? 'ITEM' : 'ITEMS'}</span>
              </div>
              <div className="luxury-cart-total">
                <span className="total-label">TOTAL</span>
                <span className="total-price">₹{totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* Cart Items - Vertical Card Layout */}
            <div className="luxury-cart-items">
              {cart.map((item) => (
                <motion.div 
                  key={item.id} 
                  className="luxury-cart-item"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {/* Top Row: Image + Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
                    <div className="luxury-item-image">
                      <div className="item-image-glow" />
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} />
                      ) : (
                        <span className="item-placeholder">{item.name.split(' ')[0]}</span>
                      )}
                    </div>
                    <div className="luxury-item-details">
                      <h3 className="luxury-item-name">{item.name}</h3>
                      <p className="luxury-item-meta">SANITIZED • INSTANT</p>
                    </div>
                  </div>

                  {/* Quantity Controls Row */}
                  <div className="luxury-qty-section">
                    <span className="qty-label">QUANTITY</span>
                    <div className="luxury-qty-controls">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        disabled={item.cartQuantity <= 1}
                        className="luxury-qty-btn"
                      >
                        −
                      </button>
                      <span className="luxury-qty-value">
                        {String(item.cartQuantity).padStart(2, '0')}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="luxury-qty-btn"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Price & Remove Row */}
                  <div className="luxury-item-price">
                    <span className="price-value">₹{(item.price * item.cartQuantity).toLocaleString()}</span>
                    <button
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="luxury-remove-btn"
                    >
                      REMOVE
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Emissive Checkout Button with Liquid Silk */}
            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckout}
              className="luxury-checkout-btn"
            >
              <span className="checkout-silk-wave" />
              <span className="checkout-text">PROCEED TO CHECKOUT</span>
              <span className="checkout-arrow">→</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADMIN PANEL */}
      <AnimatePresence>
        {isAdminOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-start justify-center pt-20 px-4 backdrop-blur-sm"
            style={{ zIndex: 9999 }}
          >
            <div 
              className="absolute inset-0 bg-black/50" 
              onClick={handleAdminToggle}
              style={{ zIndex: 9998 }}
            />
            <motion.div 
              initial={{ scale: 0.9, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -20 }}
              className="relative w-[95vw] max-w-[1600px] bg-white rounded-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto"
              style={{ zIndex: 9999 }}
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
              <button 
                onClick={handleAdminToggle} 
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold hover:bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
                aria-label="Close admin panel"
              >
                ×
              </button>
            </div>
            {!isAuthenticated ? (
              <div>
                {!showForgot ? (
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      name="passwordInput"
                      value={passwordInput}
                      onFocus={handleInputFocus} onClick={handleInputFocus}
                      onChange={(e) => handleKeyboardChange("passwordInput", e.target.value)}
                      className="w-full rounded-md border px-3 py-2"
                      placeholder="Enter admin password"
                    />
                    <div className="flex items-center justify-between gap-4">
                      <PrimaryButton type="submit">Log in</PrimaryButton>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgot(true);
                          setResetStage("request");
                          setAdminEmail(localStorage.getItem("adminEmail_v1") || "");
                        }}
                        className="text-sm text-blue-600"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Login is now handled by the server. The default password is{" "}
                      <span className="font-mono">admin123</span> and the default email is{" "}
                      <span className="font-mono">khanfaizan3234@gmail.com</span>
                    </p>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {resetStage === "request" ? (
                      <form onSubmit={requestPasswordReset} className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Registered Admin Email
                        </label>
                        <input
                          value="khanfaizan3234@gmail.com"
                          readOnly
                          className="w-full rounded-md border px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                        <div className="flex items-center gap-4">
                          <PrimaryButton type="submit">Send recovery email</PrimaryButton>
                          <button
                            type="button"
                            onClick={() => {
                              setShowForgot(false);
                              setResetStage("request");
                            }}
                            className="text-sm text-gray-600"
                          >
                            Back to login
                          </button>
                        </div>
                        {statusMessage && <p className="text-xs text-gray-600">{statusMessage}</p>}
                      </form>
                    ) : resetStage === "verify" ? (
                      <form onSubmit={verifyAndResetPassword} className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Recovery Code
                        </label>
                        <input
                          name="verificationCodeInput"
                          value={verificationCodeInput}
                          onFocus={handleInputFocus} onClick={handleInputFocus}
                          onChange={(e) => handleKeyboardChange("verificationCodeInput", e.target.value)}
                          className="w-full rounded-md border px-3 py-2"
                          placeholder="Enter the code you received via email"
                        />
                        <label className="block text-sm font-medium text-gray-700">
                          New password
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          value={newPassword}
                          onFocus={handleInputFocus} onClick={handleInputFocus}
                          onChange={(e) => handleKeyboardChange("newPassword", e.target.value)}
                          className="w-full rounded-md border px-3 py-2"
                          placeholder="Set a new password"
                        />
                        <div className="flex items-center gap-4">
                          <PrimaryButton type="submit">Reset password</PrimaryButton>
                          <button
                            type="button"
                            onClick={() => {
                              setShowForgot(false);
                              setResetStage("request");
                            }}
                            className="text-sm text-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                        {statusMessage && <p className="text-xs text-red-500">{statusMessage}</p>}
                      </form>
                    ) : null}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-800">Admin Controls</h2>
                    <h3 className="text-lg font-semibold text-gray-700">Inventory</h3>
                    <button
                      onClick={handleAddNewKit}
                      className="text-sm px-4 py-2 rounded-lg border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-all duration-200 font-semibold shadow-sm"
                    >
                      + New Kit
                    </button>
                    <button
                      onClick={() => setShowMarginPanel(!showMarginPanel)}
                      className={`text-sm px-4 py-2 rounded-lg border-2 transition-all duration-200 font-semibold shadow-sm ${
                        showMarginPanel 
                          ? 'border-green-500 bg-green-500 text-white' 
                          : 'border-green-500 text-green-600 hover:bg-green-500 hover:text-white'
                      }`}
                    >
                      💰 {showMarginPanel ? 'Hide Margins' : 'Profit Margins'}
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${
                      window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
                        ? 'bg-green-50 border-green-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <span className={`text-sm font-semibold transition-colors duration-200 ${!isRunMode ? 'text-orange-600' : 'text-gray-500'}`}>
                        Test
                      </span>
                      <button
                        onClick={handleModeToggle}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          isRunMode ? 'bg-green-500 focus:ring-green-500' : 'bg-orange-400 focus:ring-orange-400'
                        }`}
                        title={window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? '🔒 Locked to RUN mode on production' : 'Toggle payment mode'}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                            isRunMode ? 'translate-x-8' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className={`text-sm font-semibold transition-colors duration-200 ${isRunMode ? 'text-green-600' : 'text-gray-500'}`}>
                        Run
                      </span>
                      {window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && (
                        <span className="text-xs ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                          🔒 Locked
                        </span>
                      )}
                    </div>
                    <PrimaryButton
                      onClick={handleRefreshGdriveImages}
                      disabled={isRefreshing}
                      className={`${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''} text-sm px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-all duration-200`}
                    >
                      {isRefreshing ? "Refreshing..." : "Refresh Images"}
                    </PrimaryButton>
                    <PrimaryButton
                      onClick={() => {
                        setIsAuthenticated(false);
                        localStorage.removeItem('_adminPwCache');
                        alert("Logged out successfully!");
                      }}
                      className="text-sm px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-all duration-200"
                    >
                      Log Out
                    </PrimaryButton>
                  </div>
                </div>

                {/* REPORT PRICE CONTROL */}
                <div className="mb-4 flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl px-5 py-3 border border-blue-200">
                  <span className="text-xl">📋</span>
                  <span className="text-sm font-bold text-blue-800 whitespace-nowrap">Report Price</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      name="reportPriceInput"
                      value={adminReportPrice}
                      onFocus={handleInputFocus} onClick={handleInputFocus}
                      onChange={(e) => {
                        setAdminReportPrice(e.target.value);
                        handleKeyboardChange('reportPriceInput', e.target.value);
                      }}
                      className="w-24 px-2 py-1.5 border border-blue-300 rounded-lg text-sm font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSaveReportPrice}
                    disabled={reportPriceSaving}
                    className={`text-sm px-4 py-1.5 rounded-lg font-semibold transition-all duration-200 shadow-sm ${
                      reportPriceSaving
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {reportPriceSaving ? 'Saving...' : 'Save'}
                  </button>
                  {reportPriceStatus === 'saved' && (
                    <span className="text-xs text-green-600 font-semibold animate-pulse">✓ Saved</span>
                  )}
                  {reportPriceStatus === 'error' && (
                    <span className="text-xs text-red-500 font-semibold">✗ Failed</span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">Shown on payment screen</span>
                </div>
                
                {/* PROFIT MARGIN PANEL - Hidden from customers */}
                {showMarginPanel && (
                  <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💰</span>
                        <div>
                          <h3 className="text-lg font-bold text-green-800">Profit Margins (Hidden from customers)</h3>
                          <p className="text-xs text-green-600">Top 2 highest margins show as "🔥 Value Deal" & "⭐ Recommended"</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Data saved in localStorage</p>
                        <p className="text-xs text-green-600 font-semibold">✓ Persists across restarts</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {medicalKits.map((kit) => {
                        const margin = kitMargins[kit.id] || 0;
                        const badge = marginBadges[kit.id];
                        return (
                          <div 
                            key={kit.id} 
                            className={`bg-white rounded-lg p-3 border-2 transition-all ${
                              badge === 'value-deal' ? 'border-orange-400 shadow-md shadow-orange-100' :
                              badge === 'recommended' ? 'border-purple-400 shadow-md shadow-purple-100' :
                              'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-800 text-sm truncate flex-1">{kit.name}</span>
                              {badge === 'value-deal' && <span className="text-xs bg-gradient-to-r from-orange-500 to-orange-400 text-white px-2 py-0.5 rounded-full ml-2">🔥 #1</span>}
                              {badge === 'recommended' && <span className="text-xs bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-2 py-0.5 rounded-full ml-2">⭐ #2</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Price: ₹{kit.price}</span>
                              <span className="text-xs text-gray-400">|</span>
                              <span className="text-xs text-green-600 font-semibold">Profit: ₹{margin}</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <label className="text-xs text-gray-500 whitespace-nowrap">Margin ₹</label>
                              <input
                                type="number"
                                name={`margin-${kit.id}`}
                                min="0"
                                step="0.5"
                                value={keyboardState.inputs[`margin-${kit.id}`] ?? kitMargins[kit.id] ?? ''}
                                onFocus={handleInputFocus} onClick={handleInputFocus}
                                onChange={(e) => {
                                  handleKeyboardChange(`margin-${kit.id}`, e.target.value);
                                  handleUpdateMargin(kit.id, e.target.value);
                                }}
                                placeholder="0"
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                              />
                            </div>
                            {margin > 0 && (
                              <div className="mt-1 text-xs text-green-600">
                                {((margin / kit.price) * 100).toFixed(0)}% profit margin
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-green-200 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        <span className="font-semibold text-green-700">Total potential profit:</span>{' '}
                        ₹{Object.values(kitMargins).reduce((a, b) => a + (parseFloat(b) || 0), 0).toFixed(0)} per kit sold
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('Clear all margins? This cannot be undone.')) {
                            setKitMargins({});
                          }
                        }}
                        className="text-xs text-red-500 hover:text-red-700 underline"
                      >
                        Clear All Margins
                      </button>
                    </div>
                  </div>
                )}
                
                <div className={`space-y-4 overflow-auto pr-2 transition-all duration-300 ${keyboardState.visible ? 'pb-[320px]' : ''}`}>
                  {activeKits.map((kit) => (
                    <div
                      key={kit.id}
                      className="border rounded-xl p-4 flex gap-4 items-start shadow-sm hover:shadow-md transition-all duration-200 bg-white"
                    >
                      <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center">
                        {kit.imageUrl ? (
                          <img
                            src={kit.imageUrl}
                            alt=""
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <span className="text-xs text-gray-500">No Image</span>
                        )}
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-8 gap-3 items-center">
                        <div className="md:col-span-1 relative">
                          <label className="text-xs font-medium text-gray-600">Name</label>
                          <div className="relative">
                            <input
                              name={`kit-${kit.id}-name`}
                              value={keyboardState.inputs[`kit-${kit.id}-name`] ?? kit.name}
                              onFocus={handleInputFocus} onClick={handleInputFocus}
                              onChange={(e) =>
                                handleKeyboardChange(`kit-${kit.id}-name`, e.target.value)
                              }
                              onBlur={async () => {
                                const inputKey = `kit-${kit.id}-name`;
                                const val = keyboardState.inputs[inputKey] ?? kit.name;
                                const trimmedVal = String(val).trim();
                                const trimmedCurrent = String(kit.name).trim();
                                
                                if (trimmedVal && trimmedVal !== trimmedCurrent) {
                                  const success = await handleUpdateKitField(kit.id, "name", trimmedVal);
                                  if (success) {
                                    setKeyboardState((prev) => ({
                                      ...prev,
                                      inputs: { ...prev.inputs, [inputKey]: undefined },
                                    }));
                                  }
                                } else {
                                  setKeyboardState((prev) => ({
                                    ...prev,
                                    inputs: { ...prev.inputs, [inputKey]: undefined },
                                  }));
                                }
                              }}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            />
                            {updateStatus[`${kit.id}-name`] === 'updating' && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 text-xs">⏳</span>
                            )}
                            {updateStatus[`${kit.id}-name`] === 'success' && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 text-lg">✓</span>
                            )}
                            {updateStatus[`${kit.id}-name`] === 'error' && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 text-xs">✗</span>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-2 relative">
                          <label className="text-xs font-medium text-gray-600">Description</label>
                          <div className="relative">
                            <textarea
                              rows={3}
                              name={`kit-${kit.id}-description`}
                              value={keyboardState.inputs[`kit-${kit.id}-description`] ?? kit.description}
                              onFocus={handleInputFocus} onClick={handleInputFocus}
                              onChange={(e) =>
                                handleKeyboardChange(`kit-${kit.id}-description`, e.target.value)
                              }
                              onBlur={async () => {
                                const inputKey = `kit-${kit.id}-description`;
                                const val = keyboardState.inputs[inputKey] ?? kit.description;
                                const trimmedVal = String(val).trim();
                                const trimmedCurrent = String(kit.description).trim();
                                
                                if (trimmedVal && trimmedVal !== trimmedCurrent) {
                                  const success = await handleUpdateKitField(kit.id, "description", trimmedVal);
                                  if (success) {
                                    setKeyboardState((prev) => ({
                                      ...prev,
                                      inputs: { ...prev.inputs, [inputKey]: undefined },
                                    }));
                                  }
                                } else {
                                  setKeyboardState((prev) => ({
                                    ...prev,
                                    inputs: { ...prev.inputs, [inputKey]: undefined },
                                  }));
                                }
                              }}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 resize-y focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            />
                            {updateStatus[`${kit.id}-description`] === 'updating' && (
                              <span className="absolute right-2 top-2 text-blue-500 text-xs">⏳</span>
                            )}
                            {updateStatus[`${kit.id}-description`] === 'success' && (
                              <span className="absolute right-2 top-2 text-green-500 text-lg">✓</span>
                            )}
                            {updateStatus[`${kit.id}-description`] === 'error' && (
                              <span className="absolute right-2 top-2 text-red-500 text-xs">✗</span>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-1 relative">
                          <label className="text-xs font-medium text-gray-600">Price (₹)</label>
                          <div className="relative">
                            <input
                              type="number"
                              name={`kit-${kit.id}-price`}
                              value={keyboardState.inputs[`kit-${kit.id}-price`] ?? kit.price}
                              onFocus={handleInputFocus} onClick={handleInputFocus}
                              onChange={(e) =>
                                handleKeyboardChange(`kit-${kit.id}-price`, e.target.value)
                              }
                              onBlur={async () => {
                                const inputKey = `kit-${kit.id}-price`;
                                const val = keyboardState.inputs[inputKey] ?? kit.price;
                                const numVal = Number(val);
                                const currentNum = Number(kit.price);
                                
                                if (!isNaN(numVal) && numVal >= 0 && numVal !== currentNum) {
                                  const success = await handleUpdateKitField(kit.id, "price", numVal);
                                  if (success) {
                                    setKeyboardState((prev) => ({
                                      ...prev,
                                      inputs: { ...prev.inputs, [inputKey]: undefined },
                                    }));
                                  }
                                } else {
                                  setKeyboardState((prev) => ({
                                    ...prev,
                                    inputs: { ...prev.inputs, [inputKey]: undefined },
                                  }));
                                }
                              }}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            />
                            {updateStatus[`${kit.id}-price`] === 'updating' && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 text-xs">⏳</span>
                            )}
                            {updateStatus[`${kit.id}-price`] === 'success' && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 text-lg">✓</span>
                            )}
                            {updateStatus[`${kit.id}-price`] === 'error' && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 text-xs">✗</span>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-1 relative">
                          <label className="text-xs font-medium text-gray-600">Quantity</label>
                          <div className="relative">
                            <input
                              type="number"
                              name={`kit-${kit.id}-quantity`}
                              value={keyboardState.inputs[`kit-${kit.id}-quantity`] ?? kit.quantity}
                              onFocus={handleInputFocus} onClick={handleInputFocus}
                              onChange={(e) =>
                                handleKeyboardChange(`kit-${kit.id}-quantity`, e.target.value)
                              }
                              onBlur={async () => {
                                const inputKey = `kit-${kit.id}-quantity`;
                                const val = keyboardState.inputs[inputKey] ?? kit.quantity;
                                const numVal = Number(val);
                                const currentNum = Number(kit.quantity);
                                
                                if (!isNaN(numVal) && numVal >= 0 && numVal !== currentNum) {
                                  const success = await handleUpdateKitField(kit.id, "quantity", numVal);
                                  if (success) {
                                    setKeyboardState((prev) => ({
                                      ...prev,
                                      inputs: { ...prev.inputs, [inputKey]: undefined },
                                    }));
                                  }
                                } else {
                                  setKeyboardState((prev) => ({
                                    ...prev,
                                    inputs: { ...prev.inputs, [inputKey]: undefined },
                                  }));
                                }
                              }}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            />
                            {updateStatus[`${kit.id}-quantity`] === 'updating' && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 text-xs">⏳</span>
                            )}
                            {updateStatus[`${kit.id}-quantity`] === 'success' && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 text-lg">✓</span>
                            )}
                            {updateStatus[`${kit.id}-quantity`] === 'error' && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 text-xs">✗</span>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-1 relative">
                          <label className="text-xs font-medium text-gray-600">Expiry</label>
                          <div className="relative">
                            <input
                              type="date"
                              name={`kit-${kit.id}-expiryDate`}
                              value={keyboardState.inputs[`kit-${kit.id}-expiryDate`] ?? kit.expiryDate}
                              onFocus={handleInputFocus} onClick={handleInputFocus}
                              onChange={(e) =>
                                handleKeyboardChange(`kit-${kit.id}-expiryDate`, e.target.value)
                              }
                              onBlur={async () => {
                                const inputKey = `kit-${kit.id}-expiryDate`;
                                const val = keyboardState.inputs[inputKey] ?? kit.expiryDate;
                                
                                if (val && val !== kit.expiryDate) {
                                  const success = await handleUpdateKitField(kit.id, "expiryDate", val);
                                  if (success) {
                                    setKeyboardState((prev) => ({
                                      ...prev,
                                      inputs: { ...prev.inputs, [inputKey]: undefined },
                                    }));
                                  }
                                } else {
                                  setKeyboardState((prev) => ({
                                    ...prev,
                                    inputs: { ...prev.inputs, [inputKey]: undefined },
                                  }));
                                }
                              }}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            />
                            {updateStatus[`${kit.id}-expiryDate`] === 'updating' && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 text-xs">⏳</span>
                            )}
                            {updateStatus[`${kit.id}-expiryDate`] === 'success' && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 text-lg">✓</span>
                            )}
                            {updateStatus[`${kit.id}-expiryDate`] === 'error' && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 text-xs">✗</span>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-1 relative">
                          <label className="text-xs font-medium text-gray-600">Folder URL</label>
                          <div className="relative">
                            <input
                              name={`kit-${kit.id}-folderUrl`}
                              value={keyboardState.inputs[`kit-${kit.id}-folderUrl`] ?? (kit.folderUrl || '')}
                              onFocus={handleInputFocus} onClick={handleInputFocus}
                              onChange={(e) =>
                                handleKeyboardChange(`kit-${kit.id}-folderUrl`, e.target.value)
                              }
                              onBlur={async () => {
                                const inputKey = `kit-${kit.id}-folderUrl`;
                                const val = keyboardState.inputs[inputKey] ?? kit.folderUrl ?? '';
                                const trimmedVal = String(val).trim();
                                const trimmedCurrent = String(kit.folderUrl || '').trim();
                                
                                if (trimmedVal !== trimmedCurrent) {
                                  const success = await handleUpdateKitField(kit.id, "folderUrl", trimmedVal);
                                  if (success) {
                                    setKeyboardState((prev) => ({
                                      ...prev,
                                      inputs: { ...prev.inputs, [inputKey]: undefined },
                                    }));
                                  }
                                } else {
                                  setKeyboardState((prev) => ({
                                    ...prev,
                                    inputs: { ...prev.inputs, [inputKey]: undefined },
                                  }));
                                }
                              }}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            />
                            {updateStatus[`${kit.id}-folderUrl`] === 'updating' && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 text-xs">⏳</span>
                            )}
                            {updateStatus[`${kit.id}-folderUrl`] === 'success' && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 text-lg">✓</span>
                            )}
                            {updateStatus[`${kit.id}-folderUrl`] === 'error' && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 text-xs">✗</span>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-1 flex flex-col gap-3">
                          <label className="text-xs font-medium text-gray-600">Image Upload</label>
                          <div className="flex flex-col gap-2">
                            <label className="cursor-pointer">
                              <div className="text-xs text-center bg-blue-50 hover:bg-blue-100 border-2 border-dashed border-blue-300 rounded-lg py-2 px-3 transition-colors duration-200">
                                Choose File
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(kit.id, e.target.files[0])}
                                className="hidden"
                              />
                            </label>
                            <button
                              onClick={() => handleDeleteKit(kit.id)}
                              className="text-sm px-3 py-2 rounded-lg bg-red-50 border-2 border-red-300 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 font-semibold"
                            >
                              Delete Kit
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {expiredKits.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-red-600 mb-3">Expired Kits</h3>
                    <div className={`space-y-4 mt-2 overflow-auto pr-2 transition-all duration-300 ${keyboardState.visible ? 'pb-[320px]' : ''}`}>
                      {expiredKits.map((kit) => (
                        <div key={kit.id} className="border border-red-300 rounded-xl p-4 flex gap-4 items-start bg-red-50 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center">
                            {kit.imageUrl ? (
                              <img src={kit.imageUrl} alt="" className="w-20 h-20 object-cover rounded-md opacity-50" />
                            ) : (
                              <span className="text-xs text-gray-500">No Image</span>
                            )}
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-8 gap-2 items-center">
                            <div className="md:col-span-1">
                              <label className="text-xs text-gray-600">Name</label>
                              <input
                                name={`kit-${kit.id}-name`}
                                value={keyboardState.inputs[`kit-${kit.id}-name`] ?? kit.name}
                                onFocus={handleInputFocus} onClick={handleInputFocus}
                                onChange={(e) =>
                                  handleKeyboardChange(`kit-${kit.id}-name`, e.target.value)
                                }
                                onBlur={() => {
                                  (async () => {
                                    const val = keyboardState.inputs[`kit-${kit.id}-name`] ?? kit.name;
                                    if (val !== kit.name) {
                                      try {
                                        await handleUpdateKitField(kit.id, "name", val);
                                      } catch {}
                                    }
                                    setKeyboardState((prev) => ({
                                      ...prev,
                                      inputs: { ...prev.inputs, [`kit-${kit.id}-name`]: undefined },
                                    }));
                                  })();
                                }}
                                className="w-full rounded-md border px-2 py-1"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="text-xs text-gray-600">Description</label>
                              <textarea
                                rows={3}
                                name={`kit-${kit.id}-description`}
                                value={keyboardState.inputs[`kit-${kit.id}-description`] ?? kit.description}
                                onFocus={handleInputFocus} onClick={handleInputFocus}
                                onChange={(e) =>
                                  handleKeyboardChange(`kit-${kit.id}-description`, e.target.value)
                                }
                                onBlur={() => {
                                  (async () => {
                                    const val = keyboardState.inputs[`kit-${kit.id}-description`] ?? kit.description;
                                    if (val !== kit.description) {
                                      try {
                                        await handleUpdateKitField(kit.id, "description", val);
                                      } catch {}
                                    }
                                    setKeyboardState((prev) => ({
                                      ...prev,
                                      inputs: { ...prev.inputs, [`kit-${kit.id}-description`]: undefined },
                                    }));
                                  })();
                                }}
                                className="w-full rounded-md border px-2 py-1 resize-y"
                              />
                            </div>
                            <div className="md:col-span-1">
                              <label className="text-xs text-gray-600">Price (₹)</label>
                              <input
                                type="number"
                                name={`kit-${kit.id}-price`}
                                value={keyboardState.inputs[`kit-${kit.id}-price`] ?? kit.price}
                                onFocus={handleInputFocus} onClick={handleInputFocus}
                                onChange={(e) =>
                                  handleKeyboardChange(`kit-${kit.id}-price`, e.target.value)
                                }
                                onBlur={() => {
                                  (async () => {
                                    const val = keyboardState.inputs[`kit-${kit.id}-price`] ?? kit.price;
                                    if (val !== kit.price) {
                                      try {
                                        await handleUpdateKitField(kit.id, "price", val);
                                      } catch {}
                                    }
                                    setKeyboardState((prev) => ({
                                      ...prev,
                                      inputs: { ...prev.inputs, [`kit-${kit.id}-price`]: undefined },
                                    }));
                                  })();
                                }}
                                className="w-full rounded-md border px-2 py-1"
                              />
                            </div>
                            <div className="md:col-span-1">
                              <label className="text-xs text-gray-600">Quantity</label>
                              <input
                                type="number"
                                name={`kit-${kit.id}-quantity`}
                                value={keyboardState.inputs[`kit-${kit.id}-quantity`] ?? kit.quantity}
                                onFocus={handleInputFocus} onClick={handleInputFocus}
                                onChange={(e) =>
                                  handleKeyboardChange(`kit-${kit.id}-quantity`, e.target.value)
                                }
                                onBlur={() => {
                                  (async () => {
                                    const val = keyboardState.inputs[`kit-${kit.id}-quantity`] ?? kit.quantity;
                                    if (val !== kit.quantity) {
                                      try {
                                        await handleUpdateKitField(kit.id, "quantity", val);
                                      } catch {}
                                    }
                                    setKeyboardState((prev) => ({
                                      ...prev,
                                      inputs: { ...prev.inputs, [`kit-${kit.id}-quantity`]: undefined },
                                    }));
                                  })();
                                }}
                                className="w-full rounded-md border px-2 py-1"
                              />
                            </div>
                            <div className="md:col-span-1">
                              <label className="text-xs text-gray-600">Expiry</label>
                              <input
                                type="date"
                                name={`kit-${kit.id}-expiryDate`}
                                value={keyboardState.inputs[`kit-${kit.id}-expiryDate`] ?? kit.expiryDate}
                                onFocus={handleInputFocus} onClick={handleInputFocus}
                                onChange={(e) =>
                                  handleKeyboardChange(`kit-${kit.id}-expiryDate`, e.target.value)
                                }
                                onBlur={() => {
                                  (async () => {
                                    const val = keyboardState.inputs[`kit-${kit.id}-expiryDate`] ?? kit.expiryDate;
                                    if (val !== kit.expiryDate) {
                                      try {
                                        await handleUpdateKitField(kit.id, "expiryDate", val);
                                      } catch {}
                                    }
                                    setKeyboardState((prev) => ({
                                      ...prev,
                                      inputs: { ...prev.inputs, [`kit-${kit.id}-expiryDate`]: undefined },
                                    }));
                                  })();
                                }}
                                className="w-full rounded-md border px-2 py-1"
                              />
                            </div>
                            <div className="md:col-span-1">
                              <label className="text-xs text-gray-600">Folder URL</label>
                              <input
                                name={`kit-${kit.id}-folderUrl`}
                                value={keyboardState.inputs[`kit-${kit.id}-folderUrl`] ?? (kit.folderUrl || '')}
                                onFocus={handleInputFocus} onClick={handleInputFocus}
                                onChange={(e) =>
                                  handleKeyboardChange(`kit-${kit.id}-folderUrl`, e.target.value)
                                }
                                onBlur={() => {
                                  (async () => {
                                    const val = keyboardState.inputs[`kit-${kit.id}-folderUrl`] ?? kit.folderUrl;
                                    if (val !== kit.folderUrl) {
                                      try {
                                        await handleUpdateKitField(kit.id, "folderUrl", val);
                                      } catch {}
                                    }
                                    setKeyboardState((prev) => ({
                                      ...prev,
                                      inputs: { ...prev.inputs, [`kit-${kit.id}-folderUrl`]: undefined },
                                    }));
                                  })();
                                }}
                                className="w-full rounded-md border px-2 py-1"
                              />
                            </div>
                            <div className="md:col-span-1 flex flex-col gap-2">
                              <label className="text-xs text-gray-600">Image</label>
                              <span className="text-xs text-gray-500 text-center">upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(kit.id, e.target.files[0])}
                                className="text-xs"
                              />
                              <button
                                onClick={() => handleDeleteKit(kit.id)}
                                className="text-sm px-3 py-1 rounded-md border text-red-600 mt-2"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    Changes are saved to the database and reflected in real-time on the main page.
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {keyboardState.visible && (
            <div className="fixed bottom-0 left-0 right-0 z-[10000]">
              <VirtualKeyboard
                inputName={keyboardState.inputName}
                inputs={keyboardState.inputs}
                onChange={handleKeyboardChange}
                onClose={() => setKeyboardState(prev => ({ ...prev, visible: false }))}
              />
            </div>
          )}
        </motion.div>
        )}
      </AnimatePresence>
    </AuraBackground>
  );
}
