// src/pages/PhotoUpload.jsx — LIGHT THEME, gallery-first, pinch-zoom crop, session expires
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase, LEADERBOARD_BUCKET } from "../config/supabase";
import Logo from "../components/Logo";

const SESSION_KEY_PREFIX = "reliv_photo_done_";
const CROP_SIZE = 280; // px — circle diameter on screen

export default function PhotoUpload() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sid");
  const userName = decodeURIComponent(searchParams.get("name") || "User");

  const [rawFile, setRawFile] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  // Crop state
  const [showCrop, setShowCrop] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const dragRef = useRef({ active: false, startX: 0, startY: 0, startOx: 0, startOy: 0 });
  const pinchRef = useRef({ active: false, startDist: 0, startScale: 1 });
  const cropAreaRef = useRef(null);
  const canvasRef = useRef(null);

  // Instagram step state
  const [step, setStep] = useState("crop"); // crop | instagram | confirm
  const [igUsername, setIgUsername] = useState("");
  const igInputRef = useRef(null);
  const [croppedPreview, setCroppedPreview] = useState(null);

  // Auto-focus the Instagram input when step becomes "instagram"
  useEffect(() => {
    if (step === "instagram") {
      // Delay needed for iOS — DOM must be fully painted before focus works
      const t = setTimeout(() => {
        if (igInputRef.current) {
          igInputRef.current.focus();
          // iOS sometimes needs a second nudge
          igInputRef.current.click();
        }
      }, 350);
      return () => clearTimeout(t);
    }
  }, [step]);

  // Generate cropped preview when moving to confirm
  const generatePreview = useCallback(() => {
    if (!imgSrc || !imgNatural.w) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      const sz = 256;
      c.width = sz; c.height = sz;
      const ctx = c.getContext("2d");
      ctx.beginPath();
      ctx.arc(sz / 2, sz / 2, sz / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      const srcCenterX = img.naturalWidth / 2 - offset.x / scale;
      const srcCenterY = img.naturalHeight / 2 - offset.y / scale;
      const srcSize = CROP_SIZE / scale;
      ctx.drawImage(img, srcCenterX - srcSize / 2, srcCenterY - srcSize / 2, srcSize, srcSize, 0, 0, sz, sz);
      setCroppedPreview(c.toDataURL("image/jpeg", 0.8));
    };
    img.src = imgSrc;
  }, [imgSrc, imgNatural, offset, scale]);

  useEffect(() => {
    document.title = "Reliv — Photo Upload";
    try { window.history.replaceState({}, "Reliv — Photo Upload", "/photo-upload"); } catch { /* */ }
  }, []);

  useEffect(() => {
    if (!sessionId) { setExpired(true); return; }
    try {
      const used = localStorage.getItem(SESSION_KEY_PREFIX + sessionId);
      if (used) setExpired(true);
    } catch { /* */ }
  }, [sessionId]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) { setError("Please upload a JPG, PNG, or WEBP image."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB."); return; }
    setError(null);
    setRawFile(file);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setImgSrc(url);
      // Fit image so shortest side fills the crop circle
      const ratio = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
      setScale(ratio);
      setOffset({ x: 0, y: 0 });
      setStep("crop");
      setIgUsername("");
      setCroppedPreview(null);
      setShowCrop(true);
    };
    img.src = url;
  };

  // ── Touch / pointer handlers for pan & pinch ──
  const getTouch = (e) => e.touches ? e.touches : [e];
  const dist = (t) => t.length < 2 ? 0 : Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY);

  const onPointerDown = useCallback((e) => {
    const touches = getTouch(e);
    if (touches.length === 2) {
      pinchRef.current = { active: true, startDist: dist(touches), startScale: scale };
      dragRef.current.active = false;
    } else if (touches.length === 1) {
      dragRef.current = { active: true, startX: touches[0].clientX, startY: touches[0].clientY, startOx: offset.x, startOy: offset.y };
    }
  }, [scale, offset]);

  const onPointerMove = useCallback((e) => {
    const touches = getTouch(e);
    if (pinchRef.current.active && touches.length === 2) {
      e.preventDefault();
      const d = dist(touches);
      const newScale = pinchRef.current.startScale * (d / pinchRef.current.startDist);
      const minScale = Math.max(CROP_SIZE / imgNatural.w, CROP_SIZE / imgNatural.h);
      setScale(Math.max(minScale, Math.min(newScale, 5)));
    } else if (dragRef.current.active && touches.length === 1) {
      e.preventDefault();
      const dx = touches[0].clientX - dragRef.current.startX;
      const dy = touches[0].clientY - dragRef.current.startY;
      setOffset({ x: dragRef.current.startOx + dx, y: dragRef.current.startOy + dy });
    }
  }, [imgNatural]);

  const onPointerUp = useCallback(() => {
    dragRef.current.active = false;
    pinchRef.current.active = false;
  }, []);

  // Clamp offset so image can't leave the crop circle
  useEffect(() => {
    if (!imgNatural.w) return;
    const imgW = imgNatural.w * scale;
    const imgH = imgNatural.h * scale;
    const maxX = Math.max(0, (imgW - CROP_SIZE) / 2);
    const maxY = Math.max(0, (imgH - CROP_SIZE) / 2);
    setOffset((o) => ({
      x: Math.max(-maxX, Math.min(maxX, o.x)),
      y: Math.max(-maxY, Math.min(maxY, o.y)),
    }));
  }, [scale, imgNatural]);

  // ── Crop to canvas & upload ──
  const cropAndUpload = async () => {
    if (!imgSrc || !rawFile || !sessionId || expired) return;
    if (!supabase) { setError("Connection error. Please try again."); return; }
    setUploading(true);
    setError(null);

    try {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = imgSrc; });

      const canvas = canvasRef.current || document.createElement("canvas");
      const outSize = 512; // final output px
      canvas.width = outSize;
      canvas.height = outSize;
      const ctx = canvas.getContext("2d");

      // Circular clip
      ctx.beginPath();
      ctx.arc(outSize / 2, outSize / 2, outSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Compute source rect from offset + scale
      const srcCenterX = img.naturalWidth / 2 - offset.x / scale;
      const srcCenterY = img.naturalHeight / 2 - offset.y / scale;
      const srcSize = CROP_SIZE / scale;

      ctx.drawImage(
        img,
        srcCenterX - srcSize / 2, srcCenterY - srcSize / 2, srcSize, srcSize,
        0, 0, outSize, outSize
      );

      const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.85));
      if (!blob) throw new Error("Could not process image");
      const filePath = `${sessionId}_${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(LEADERBOARD_BUCKET)
        .upload(filePath, blob, { cacheControl: "3600", upsert: false, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      // Update photo_path + instagram in one call
      const updateData = { photo_path: filePath };
      const cleanIg = igUsername.trim().replace(/^@/, "");
      if (cleanIg) updateData.instagram = cleanIg;

      const { error: updateError } = await supabase
        .from("leaderboard")
        .update(updateData)
        .eq("session_id", sessionId);
      if (updateError) throw updateError;

      try { localStorage.setItem(SESSION_KEY_PREFIX + sessionId, "1"); } catch { /* */ }
      setDone(true);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── Expired ──
  if (expired) {
    return (
      <div className="mobile-entry-page" style={pageStyle}>
        <div style={cardStyle}>
          <Logo size="text-3xl" className="mb-4" />
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏰</div>
          <h2 style={{ color: "#111827", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Session Expired</h2>
          <p style={{ color: "#6b7280", fontSize: 14, maxWidth: 280 }}>
            This upload link has already been used or has expired. Get a fresh QR code from the kiosk.
          </p>
        </div>
      </div>
    );
  }

  // ── Success ──
  if (done) {
    return (
      <div className="mobile-entry-page" style={pageStyle}>
        <div style={cardStyle}>
          <Logo size="text-3xl" className="mb-4" />
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h2 style={{ color: "#111827", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>You're on the board!</h2>
          <p style={{ color: "#6b7280", fontSize: 14, maxWidth: 300 }}>
            Your photo is now on the campus leaderboard, {userName}! Check it out on the kiosk screen.
          </p>
          <div style={{
            marginTop: 20, background: "#fff7ed", border: "1px solid #fed7aa",
            borderRadius: 12, padding: "10px 20px",
          }}>
            <span style={{ color: "#ea580c", fontSize: 13, fontWeight: 600 }}>🏆 Health Hero status: Unlocked</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Crop View ──
  if (showCrop && imgSrc && step === "crop") {
    const imgW = imgNatural.w * scale;
    const imgH = imgNatural.h * scale;

    return (
      <div className="mobile-entry-page" style={pageStyle}>
        <div style={{ ...cardStyle, padding: "28px 20px", maxWidth: 380 }}>
          <h3 style={{ color: "#111827", fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
            Adjust Your Photo
          </h3>
          <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 20 }}>
            Drag to move • Pinch to zoom • This is how it'll look on the leaderboard
          </p>

          {/* Crop area */}
          <div
            ref={cropAreaRef}
            onTouchStart={onPointerDown}
            onTouchMove={onPointerMove}
            onTouchEnd={onPointerUp}
            onMouseDown={onPointerDown}
            onMouseMove={onPointerMove}
            onMouseUp={onPointerUp}
            onMouseLeave={onPointerUp}
            style={{
              width: CROP_SIZE, height: CROP_SIZE, borderRadius: "50%",
              overflow: "hidden", margin: "0 auto 8px", position: "relative",
              border: "3px solid #F97316",
              boxShadow: "0 8px 30px rgba(249,115,22,0.2)",
              touchAction: "none", cursor: "grab", userSelect: "none",
              background: "#f3f4f6",
            }}
          >
            <img
              src={imgSrc}
              alt="Crop preview"
              draggable={false}
              style={{
                position: "absolute",
                width: imgW, height: imgH,
                left: `calc(50% - ${imgW / 2 - offset.x}px)`,
                top: `calc(50% - ${imgH / 2 - offset.y}px)`,
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Zoom slider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px auto", maxWidth: 260 }}>
            <span style={{ fontSize: 14, color: "#9ca3af" }}>🔍</span>
            <input
              type="range"
              min={Math.max(CROP_SIZE / imgNatural.w, CROP_SIZE / imgNatural.h)}
              max={5}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: "#F97316" }}
            />
            <span style={{ fontSize: 14, color: "#9ca3af" }}>🔎</span>
          </div>

          {error && (
            <div style={{
              color: "#dc2626", fontSize: 13, marginBottom: 12,
              background: "#fef2f2", padding: "8px 16px", borderRadius: 8, border: "1px solid #fecaca",
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={() => { setShowCrop(false); setImgSrc(null); setRawFile(null); }}
              style={{
                background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb",
                borderRadius: 9999, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              ← Pick another
            </button>
            <button
              onClick={() => { generatePreview(); setStep("instagram"); }}
              style={{
                background: "linear-gradient(135deg, #F97316, #ea580c)",
                color: "#fff", border: "none", borderRadius: 9999,
                padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 15px rgba(249,115,22,0.25)",
              }}
            >
              Looks good! →
            </button>
          </div>
        </div>
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    );
  }

  // ── Instagram Username Step ──
  if (showCrop && imgSrc && step === "instagram") {
    return (
      <div className="mobile-entry-page" style={pageStyle}>
        <div style={{ ...cardStyle, padding: "28px 24px", maxWidth: 380 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
          <h3 style={{ color: "#111827", fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
            Add Your Instagram
          </h3>
          <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 24 }}>
            People can scan your QR on the leaderboard and follow you!
          </p>

          <label style={{ display: "block", fontSize: 13, color: "#6b7280", marginBottom: 6, fontWeight: 600 }}>
            Instagram username
          </label>
          <input
            ref={igInputRef}
            type="text"
            name="instagram_username"
            enterKeyHint="done"
            defaultValue={igUsername}
            placeholder="your_username"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            style={{
              display: "block",
              width: "100%",
              maxWidth: 280,
              margin: "0 auto 12px",
              fontSize: "16px",
              lineHeight: "1.5",
              padding: "14px 16px",
              borderRadius: 12,
              border: "1.5px solid #d1d5db",
              outline: "none",
              boxSizing: "border-box",
              backgroundColor: "#fff",
              color: "#111827",
              WebkitAppearance: "none",
            }}
          />

          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
            <button
              onClick={() => setStep("crop")}
              style={{
                background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb",
                borderRadius: 9999, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              ← Back
            </button>
            <button
              onClick={() => {
                const raw = (igInputRef.current?.value || "").replace(/\s/g, "").toLowerCase().replace(/^@/, "");
                if (raw) { setIgUsername(raw); setStep("confirm"); }
              }}
              style={{
                background: "linear-gradient(135deg, #F97316, #ea580c)",
                color: "#fff",
                border: "none", borderRadius: 9999,
                padding: "12px 28px", fontSize: 14, fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(249,115,22,0.25)",
              }}
            >
              Next →
            </button>
            <button
              onClick={() => { setIgUsername(""); setStep("confirm"); }}
              style={{
                background: "transparent", color: "#9ca3af", border: "none",
                fontSize: 13, fontWeight: 500, cursor: "pointer", textDecoration: "underline",
                padding: "12px 8px",
              }}
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Confirm Step ──
  if (showCrop && imgSrc && step === "confirm") {
    return (
      <div className="mobile-entry-page" style={pageStyle}>
        <div style={{ ...cardStyle, padding: "28px 24px", maxWidth: 380 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
          <h3 style={{ color: "#111827", fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
            Confirm & Upload
          </h3>

          {/* Preview circle — actual cropped result */}
          <div style={{
            width: 120, height: 120, borderRadius: "50%", overflow: "hidden",
            border: "3px solid #F97316", margin: "0 auto 16px",
            boxShadow: "0 6px 24px rgba(249,115,22,0.2)",
            background: "#f3f4f6",
          }}>
            {croppedPreview ? (
              <img src={croppedPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>📸</div>
            )}
          </div>

          <div style={{
            background: "#f9fafb", borderRadius: 14, padding: "14px 18px",
            marginBottom: 12, border: "1px solid #e5e7eb", textAlign: "left",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#6b7280", fontSize: 13 }}>Name</span>
              <span style={{ color: "#111827", fontSize: 13, fontWeight: 700 }}>{userName}</span>
            </div>
            {igUsername.trim() && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280", fontSize: 13 }}>Instagram</span>
                <span style={{ color: "#111827", fontSize: 13, fontWeight: 700 }}>@{igUsername.trim()}</span>
              </div>
            )}
          </div>

          {igUsername.trim() && (
            <p style={{ color: "#ef4444", fontSize: 11, fontWeight: 600, marginBottom: 12 }}>
              ⚠️ Instagram username cannot be changed later
            </p>
          )}

          {error && (
            <div style={{
              color: "#dc2626", fontSize: 13, marginBottom: 12,
              background: "#fef2f2", padding: "8px 16px", borderRadius: 8, border: "1px solid #fecaca",
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={() => setStep("instagram")}
              style={{
                background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb",
                borderRadius: 9999, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              ← Edit
            </button>
            <button
              onClick={cropAndUpload}
              disabled={uploading}
              style={{
                background: uploading ? "#fdba74" : "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#fff", border: "none", borderRadius: 9999,
                padding: "12px 28px", fontSize: 14, fontWeight: 700,
                cursor: uploading ? "not-allowed" : "pointer",
                opacity: uploading ? 0.8 : 1,
                boxShadow: "0 4px 15px rgba(34,197,94,0.25)",
              }}
            >
              {uploading ? "Uploading..." : "Confirm & Upload 🏆"}
            </button>
          </div>
        </div>
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    );
  }

  // ── Pick Photo ──
  return (
    <div className="mobile-entry-page" style={pageStyle}>
      <div style={cardStyle}>
        <Logo size="text-3xl" className="mb-5" />

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#fff7ed", border: "1px solid #fed7aa",
          borderRadius: 9999, padding: "4px 14px", marginBottom: 16,
        }}>
          <span style={{ fontSize: 14 }}>📸</span>
          <span style={{ color: "#ea580c", fontSize: 12, fontWeight: 700 }}>LEADERBOARD PHOTO</span>
        </div>

        <h2 style={{ color: "#111827", fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
          Choose Your Photo
        </h2>
        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 28, maxWidth: 300 }}>
          Pick a photo from your gallery — you'll crop it next!
        </p>

        <div
          onClick={() => fileRef.current?.click()}
          style={{
            width: 180, height: 180, borderRadius: "50%",
            border: "2px dashed #d1d5db", background: "#f9fafb",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", margin: "0 auto 24px",
            transition: "all 0.3s ease",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>🖼️</div>
            <div style={{ color: "#9ca3af", fontSize: 12, fontWeight: 500 }}>Tap to choose</div>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {error && (
          <div style={{
            color: "#dc2626", fontSize: 13, marginBottom: 16,
            background: "#fef2f2", padding: "8px 16px", borderRadius: 8, border: "1px solid #fecaca",
          }}>
            {error}
          </div>
        )}

        <p style={{ color: "#d1d5db", fontSize: 11, marginTop: 8 }}>JPG, PNG or WEBP • Max 5MB</p>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh", background: "#f8fafc",
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  padding: "32px 20px",
};

const cardStyle = {
  background: "#ffffff", borderRadius: 24, padding: "40px 32px",
  maxWidth: 420, width: "100%", textAlign: "center",
  border: "1px solid #e5e7eb", boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
};
