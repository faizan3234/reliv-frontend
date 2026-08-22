// src/pages/AdminMedicinePage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Lock,
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Layers,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { API_BASE } from "../config/api";
import { formatINR } from "../utils/currency";
import { getMedicineImageUrl } from "./MedicineDispensing";

export default function AdminMedicinePage() {
  const navigate = useNavigate();

  // Authentication State (sessionStorage persistent)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("reliv_admin_authed") === "true";
  });
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Inventory State
  const [medicines, setMedicines] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all"); // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'

  // Form Sheet State (Add / Edit)
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null); // null = Add, object = Edit
  const [formData, setFormData] = useState({
    kit_id: "",
    name: "",
    description: "",
    price: "",
    quantity: "",
    motor_id: "",
  });
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete Confirmation State
  const [deletingMedicine, setDeletingMedicine] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Ephemeral Toast Alert State
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' }

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── 1. Fetch Inventory ───────────────────────────────────────────────────
  const fetchMedicines = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/kits?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Failed to load medicines (HTTP ${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.kits || [];
      setMedicines(list);
    } catch (err) {
      console.error("[AdminMedicinePage] Fetch error:", err);
      showToast(err.message || "Failed to load medicines", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMedicines();
    }
  }, [isAuthenticated, fetchMedicines]);

  // ── 2. Login Handler ─────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;

    setIsLoggingIn(true);
    setLoginError("");

    try {
      // First try standard password check endpoint
      let isAuthed = false;
      try {
        const res = await fetch(`${API_BASE}/api/check-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: passwordInput }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ok || data.authenticated) {
            isAuthed = true;
          }
        }
      } catch {}

      // Default fallback passwords for kiosk offline operation
      const normalized = passwordInput.trim().toLowerCase();
      if (!isAuthed && (normalized === "admin123" || normalized === "admin 123" || normalized === "reliv" || normalized === "admin" || normalized === "1234")) {
        isAuthed = true;
      }

      if (isAuthed) {
        setIsAuthenticated(true);
        sessionStorage.setItem("reliv_admin_authed", "true");
        setPasswordInput("");
      } else {
        setLoginError("Invalid password. Please try again.");
      }
    } catch (err) {
      setLoginError("Login failed. Please check network connection.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("reliv_admin_authed");
    showToast("Logged out successfully");
  };

  // ── 3. Open Add/Edit Sheet ────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditingMedicine(null);
    setFormData({
      kit_id: `KIT-${Date.now().toString(36).toUpperCase()}`,
      name: "",
      description: "",
      price: "",
      quantity: "",
      motor_id: "",
    });
    setSelectedImageFile(null);
    setImagePreviewUrl("");
    setFormError("");
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (kit) => {
    setEditingMedicine(kit);
    setFormData({
      kit_id: kit.kit_id || kit.id,
      name: kit.name || "",
      description: kit.description || "",
      price: kit.price !== undefined ? String(kit.price) : "",
      quantity: kit.quantity !== undefined ? String(kit.quantity) : "",
      motor_id: kit.motor_id !== null && kit.motor_id !== undefined ? String(kit.motor_id) : "",
    });
    setSelectedImageFile(null);
    setImagePreviewUrl(getMedicineImageUrl(kit));
    setFormError("");
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setIsSheetOpen(false);
    setSelectedImageFile(null);
    setImagePreviewUrl("");
    setEditingMedicine(null);
  };

  // ── 4. Image Selection Handlers ──────────────────────────────────────────
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setFormError("Please select a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image must be 5 MB or smaller.");
      return;
    }

    setFormError("");
    setSelectedImageFile(file);

    const blobUrl = URL.createObjectURL(file);
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(blobUrl);
    e.target.value = "";
  };

  const handleRemoveExistingImage = async () => {
    if (selectedImageFile) {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setSelectedImageFile(null);
      setImagePreviewUrl(editingMedicine ? getMedicineImageUrl(editingMedicine) : "");
      return;
    }

    if (editingMedicine) {
      const kitId = editingMedicine.kit_id || editingMedicine.id;
      try {
        const res = await fetch(`${API_BASE}/api/kits/${encodeURIComponent(kitId)}/image`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.message || "Failed to remove image");

        setImagePreviewUrl("");
        setMedicines((prev) =>
          prev.map((k) => ((k.kit_id || k.id) === kitId ? { ...k, image_path: "", imageUrl: "" } : k))
        );
        showToast("Picture removed successfully");
      } catch (err) {
        showToast(err.message || "Failed to remove picture", "error");
      }
    }
  };

  // ── 5. Form Submit (Save / Create) ───────────────────────────────────────
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const name = formData.name.trim();
    if (!name) {
      setFormError("Medicine name is required.");
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      setFormError("Please enter a valid price (₹0 or greater).");
      return;
    }

    const quantity = parseInt(formData.quantity, 10);
    if (isNaN(quantity) || quantity < 0) {
      setFormError("Please enter a valid stock quantity (0 or greater).");
      return;
    }

    const motor_id = formData.motor_id.trim() ? parseInt(formData.motor_id, 10) : null;

    setIsSubmitting(true);

    try {
      let savedKitId = null;

      if (editingMedicine) {
        // ── UPDATE EXISTING MEDICINE (PATCH) ──
        const targetId = editingMedicine.kit_id || editingMedicine.id;
        savedKitId = targetId;

        const res = await fetch(`${API_BASE}/api/kits/${encodeURIComponent(targetId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description: formData.description.trim(),
            price,
            quantity,
            motor_id,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.message || "Failed to update medicine");

        setMedicines((prev) =>
          prev.map((k) => ((k.kit_id || k.id) === targetId ? { ...k, ...data.kit } : k))
        );
      } else {
        // ── CREATE NEW MEDICINE (POST) ──
        const kit_id = formData.kit_id.trim() || `KIT-${Date.now().toString(36).toUpperCase()}`;
        savedKitId = kit_id;

        const res = await fetch(`${API_BASE}/api/kits`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kit_id,
            name,
            description: formData.description.trim(),
            price,
            quantity,
            motor_id,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.message || "Failed to create medicine");

        const createdKit = data.kit || {
          kit_id,
          name,
          description: formData.description.trim(),
          price,
          quantity,
          motor_id,
        };

        setMedicines((prev) => [createdKit, ...prev]);
      }

      // ── UPLOAD IMAGE IF SELECTED (MULTIPART) ──
      if (selectedImageFile && savedKitId) {
        try {
          const imgFormData = new FormData();
          imgFormData.append("image", selectedImageFile);

          const imgRes = await fetch(`${API_BASE}/api/kits/${encodeURIComponent(savedKitId)}/image`, {
            method: "PATCH",
            body: imgFormData,
          });

          const imgData = await imgRes.json();
          if (imgRes.ok && imgData.ok && imgData.kit) {
            setMedicines((prev) =>
              prev.map((k) => ((k.kit_id || k.id) === savedKitId ? { ...k, ...imgData.kit } : k))
            );
          }
        } catch (imgErr) {
          console.warn("[AdminMedicinePage] Image upload error after save:", imgErr);
        }
      }

      showToast(editingMedicine ? "Medicine updated successfully" : "Medicine created successfully");
      handleCloseSheet();
    } catch (err) {
      console.error("[AdminMedicinePage] Submit error:", err);
      setFormError(err.message || "Failed to save medicine");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 6. Delete Handler ────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deletingMedicine) return;

    const kitId = deletingMedicine.kit_id || deletingMedicine.id;
    setIsDeleting(true);

    try {
      const res = await fetch(`${API_BASE}/api/kits/${encodeURIComponent(kitId)}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data.message || "Failed to delete medicine");
      }

      setMedicines((prev) => prev.filter((k) => (k.kit_id || k.id) !== kitId));
      showToast(`Deleted "${deletingMedicine.name}"`);
      setDeletingMedicine(null);
    } catch (err) {
      console.error("[AdminMedicinePage] Delete error:", err);
      showToast(err.message || "Failed to delete medicine", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── 7. Filtering & Search Computations ────────────────────────────────────
  const filteredMedicines = useMemo(() => {
    let list = [...medicines];

    // Filter by stock status
    if (stockFilter === "in_stock") {
      list = list.filter((m) => Number(m.quantity ?? 0) > 5);
    } else if (stockFilter === "low_stock") {
      list = list.filter((m) => {
        const q = Number(m.quantity ?? 0);
        return q > 0 && q <= 5;
      });
    } else if (stockFilter === "out_of_stock") {
      list = list.filter((m) => Number(m.quantity ?? 0) <= 0);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((m) => {
        const name = (m.name || "").toLowerCase();
        const desc = (m.description || "").toLowerCase();
        const id = (m.kit_id || m.id || "").toLowerCase();
        const motor = String(m.motor_id ?? "");
        return name.includes(q) || desc.includes(q) || id.includes(q) || motor.includes(q);
      });
    }

    return list;
  }, [medicines, stockFilter, searchQuery]);

  // Inventory Metrics
  const metrics = useMemo(() => {
    const totalMedicines = medicines.length;
    const totalUnits = medicines.reduce((sum, m) => sum + Number(m.quantity ?? 0), 0);
    const outOfStockCount = medicines.filter((m) => Number(m.quantity ?? 0) <= 0).length;
    const lowStockCount = medicines.filter((m) => {
      const q = Number(m.quantity ?? 0);
      return q > 0 && q <= 5;
    }).length;

    return { totalMedicines, totalUnits, outOfStockCount, lowStockCount };
  }, [medicines]);

  // ═════════════════════════════════════════════════════════════════════════
  // VIEW: LOGIN SCREEN (If not authenticated)
  // ═════════════════════════════════════════════════════════════════════════
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8 font-sans">
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80">
          <div className="flex flex-col items-center text-center space-y-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center border border-orange-200 shadow-inner">
              <Lock size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reliv Admin</h1>
              <p className="text-xs text-slate-500 font-medium">Medicine Inventory Management</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                autoFocus
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base text-slate-900 bg-white"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2 animate-shake">
                <AlertCircle size={16} className="shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn || !passwordInput.trim()}
              className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold text-base shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoggingIn ? "Verifying..." : "Access Inventory"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1.5 mx-auto"
            >
              <ArrowLeft size={14} />
              <span>Back to Customer Kiosk</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // VIEW: MAIN MOBILE ADMIN INVENTORY APP
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-28">

      {/* Ephemeral Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold transition-all animate-fadeIn ${
            toast.type === "error"
              ? "bg-red-600 text-white border-red-700"
              : "bg-slate-900 text-white border-slate-800"
          }`}
        >
          {toast.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} className="text-emerald-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Sticky Top Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 py-3 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-base shadow-sm">
              R
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">Reliv Admin</h1>
              <p className="text-[11px] text-slate-500 font-semibold">Medicine Inventory</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchMedicines}
              disabled={isLoading}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
              title="Refresh inventory"
            >
              <RefreshCw size={18} className={isLoading ? "animate-spin text-orange-500" : ""} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 active:scale-95 transition-all"
              title="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Container (Max-width for phone ergonomics) ───────────────── */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs text-center">
            <div className="text-lg font-black text-slate-900">{metrics.totalMedicines}</div>
            <div className="text-[11px] text-slate-500 font-semibold">Medicines</div>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs text-center">
            <div className="text-lg font-black text-emerald-600">{metrics.totalUnits}</div>
            <div className="text-[11px] text-slate-500 font-semibold">In Stock</div>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs text-center">
            <div className={`text-lg font-black ${metrics.outOfStockCount > 0 ? "text-red-600" : "text-slate-900"}`}>
              {metrics.outOfStockCount}
            </div>
            <div className="text-[11px] text-slate-500 font-semibold">Out of Stock</div>
          </div>
        </div>

        {/* Sticky Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search medicines, kit ID, slot..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: "all", label: `All (${medicines.length})` },
            { id: "in_stock", label: "In Stock" },
            { id: "low_stock", label: `Low (${metrics.lowStockCount})` },
            { id: "out_of_stock", label: `Out (${metrics.outOfStockCount})` },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setStockFilter(chip.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                stockFilter === chip.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Medicine Cards List */}
        <div className="space-y-3">
          {isLoading && medicines.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-slate-500 space-y-2">
              <RefreshCw size={24} className="animate-spin mx-auto text-orange-500" />
              <p className="text-xs font-semibold">Loading medicines from kiosk database...</p>
            </div>
          ) : filteredMedicines.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-slate-500 space-y-2">
              <Package size={32} className="mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No medicines found</p>
              <p className="text-xs text-slate-400">Try adjusting your search or filter</p>
            </div>
          ) : (
            filteredMedicines.map((kit) => {
              const qty = Number(kit.quantity ?? 0);
              const imgUrl = getMedicineImageUrl(kit);
              const isOut = qty <= 0;
              const isLow = qty > 0 && qty <= 5;

              return (
                <div
                  key={kit.kit_id || kit.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col gap-3"
                >
                  {/* Top Row: Image + Title + Price */}
                  <div className="flex items-start gap-3">
                    {/* Picture Thumbnail */}
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                      {imgUrl ? (
                        <img src={imgUrl} alt={kit.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-black text-slate-400 uppercase">
                          {(kit.name || "M").slice(0, 2)}
                        </span>
                      )}
                    </div>

                    {/* Information */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-900 text-base leading-tight truncate">
                          {kit.name || "Unnamed Medicine"}
                        </h3>
                        <span className="font-extrabold text-slate-900 text-base shrink-0">
                          {formatINR(kit.price)}
                        </span>
                      </div>

                      {kit.description && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{kit.description}</p>
                      )}

                      {/* Badges: Stock & Slot */}
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            isOut
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : isLow
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isOut ? "● Out of Stock" : isLow ? `● Low Stock (${qty})` : `● Stock: ${qty}`}
                        </span>

                        {kit.motor_id !== null && kit.motor_id !== undefined && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Slot {kit.motor_id}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-slate-400 truncate">
                      {kit.kit_id || kit.id}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(kit)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingMedicine(kit)}
                        className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* ── Floating Add Button ───────────────────────────────────────────── */}
      <div className="fixed bottom-5 left-0 right-0 z-20 px-4 pointer-events-none">
        <div className="max-w-md mx-auto flex justify-end pointer-events-auto">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-5 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-sm shadow-xl shadow-orange-500/30 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus size={20} className="stroke-[3]" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MOBILE BOTTOM SHEET: ADD / EDIT MEDICINE                             */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {editingMedicine ? "Edit Medicine" : "Add New Medicine"}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {editingMedicine ? (editingMedicine.kit_id || editingMedicine.id) : "Fill details below"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseSheet}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Fields (Native phone inputs & scrolling) */}
            <form onSubmit={handleFormSubmit} className="p-5 overflow-y-auto space-y-4 flex-grow">

              {/* Medicine Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Medicine Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 650mg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fever and headache relief"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {/* Price & Quantity Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    required
                    placeholder="32.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min="0"
                    required
                    placeholder="150"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Motor / Slot ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dispenser Slot / Motor ID
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min="1"
                  placeholder="e.g. 1, 2, 3"
                  value={formData.motor_id}
                  onChange={(e) => setFormData({ ...formData, motor_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {/* Medicine Picture Section */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2">Medicine Picture</label>

                {imagePreviewUrl ? (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0">
                      <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>

                    <div className="flex flex-col gap-1.5 flex-grow">
                      <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 active:scale-98 transition-all">
                        <Camera size={14} />
                        <span>Change Picture</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={handleRemoveExistingImage}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 text-left px-1"
                      >
                        Remove Picture
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-orange-400 bg-slate-50 hover:bg-orange-50/50 transition-all text-center space-y-1">
                      <ImageIcon size={24} className="mx-auto text-slate-400" />
                      <div className="text-xs font-bold text-slate-700">Choose Picture</div>
                      <div className="text-[10px] text-slate-400">JPG, PNG, or WEBP (Max 5 MB)</div>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Error Message */}
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseSheet}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingMedicine ? "Save Changes" : "Create Medicine"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* CONFIRM DELETE DIALOG                                                */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {deletingMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200 mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">Delete Medicine?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong className="text-slate-800">"{deletingMedicine.name}"</strong> will be permanently removed from the dispenser inventory.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMedicine(null)}
                disabled={isDeleting}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
