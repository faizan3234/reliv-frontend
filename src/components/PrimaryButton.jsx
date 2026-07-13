// src/components/PrimaryButton.jsx
import React from "react";

export default function PrimaryButton({
  children,
  onClick,
  className = "",
  ariaLabel,
  type = "button",
  disabled = false,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-base
                  shadow-md focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all
                  ${disabled ? "bg-orange-300 text-white cursor-not-allowed opacity-60" : "bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg active:scale-[0.98]"}
                  ${className}`}
    >
      {children}
    </button>
  );
}
