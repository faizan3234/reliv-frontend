// src/components/Logo.jsx
import React from "react";

export default function Logo({
  className = "",
  size = "text-3xl md:text-4xl",
}) {
  return (
    <div className={`inline-flex items-center ${className}`} aria-hidden="true">
      <h1 className={`${size} font-extrabold leading-tight`}>
        {/* Re */}
        <span className="text-orange-500">Re</span>

        {/* liv */}
        <span className="text-black">
          l
          <span className="relative inline-block">
            ı
            <span
              className="absolute left-1/2"
              style={{
                top: "0.08em",              // 👈 moved 2x up from 0.23em
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
}
