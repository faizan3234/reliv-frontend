// SVG Icons for cross-platform compatibility (Raspberry Pi, mobile, etc.)
// These replace Unicode emojis that don't render properly on all devices

import React from 'react';

// ==================== EMOTION ICONS ====================

export const IconAngry = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
    <circle cx="32" cy="32" r="30" fill="#F87171"/>
    <circle cx="32" cy="32" r="26" fill="#EF4444"/>
    <ellipse cx="22" cy="26" rx="4" ry="5" fill="#7F1D1D"/>
    <ellipse cx="42" cy="26" rx="4" ry="5" fill="#7F1D1D"/>
    <line x1="14" y1="18" x2="28" y2="24" stroke="#991B1B" strokeWidth="3" strokeLinecap="round"/>
    <line x1="50" y1="18" x2="36" y2="24" stroke="#991B1B" strokeWidth="3" strokeLinecap="round"/>
    <path d="M20 46 Q32 38 44 46" stroke="#7F1D1D" strokeWidth="4" strokeLinecap="round" fill="none"/>
  </svg>
);

export const IconNeutral = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
    <circle cx="32" cy="32" r="30" fill="#FDE047"/>
    <circle cx="32" cy="32" r="26" fill="#FBBF24"/>
    <ellipse cx="22" cy="28" rx="4" ry="5" fill="#78350F"/>
    <ellipse cx="42" cy="28" rx="4" ry="5" fill="#78350F"/>
    <line x1="20" y1="44" x2="44" y2="44" stroke="#78350F" strokeWidth="4" strokeLinecap="round"/>
  </svg>
);

export const IconGood = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
    <circle cx="32" cy="32" r="30" fill="#BEF264"/>
    <circle cx="32" cy="32" r="26" fill="#A3E635"/>
    <ellipse cx="22" cy="26" rx="4" ry="5" fill="#365314"/>
    <ellipse cx="42" cy="26" rx="4" ry="5" fill="#365314"/>
    <path d="M18 40 Q32 50 46 40" stroke="#365314" strokeWidth="4" strokeLinecap="round" fill="none"/>
    <circle cx="16" cy="36" r="5" fill="#FDE68A" opacity="0.6"/>
    <circle cx="48" cy="36" r="5" fill="#FDE68A" opacity="0.6"/>
  </svg>
);

export const IconGreat = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
    <circle cx="32" cy="32" r="30" fill="#86EFAC"/>
    <circle cx="32" cy="32" r="26" fill="#4ADE80"/>
    <ellipse cx="22" cy="26" rx="4" ry="5" fill="#166534"/>
    <ellipse cx="42" cy="26" rx="4" ry="5" fill="#166534"/>
    <path d="M16 38 Q32 54 48 38" stroke="#166534" strokeWidth="4" strokeLinecap="round" fill="none"/>
    <path d="M20 42 Q32 52 44 42" fill="#DC2626"/>
    <circle cx="14" cy="36" r="6" fill="#FDBA74" opacity="0.5"/>
    <circle cx="50" cy="36" r="6" fill="#FDBA74" opacity="0.5"/>
  </svg>
);

export const IconExcellent = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
    <circle cx="32" cy="32" r="30" fill="#6EE7B7"/>
    <circle cx="32" cy="32" r="26" fill="#34D399"/>
    <path d="M16 26 Q22 20 28 26" stroke="#065F46" strokeWidth="3" strokeLinecap="round" fill="none"/>
    <path d="M36 26 Q42 20 48 26" stroke="#065F46" strokeWidth="3" strokeLinecap="round" fill="none"/>
    <path d="M14 36 Q32 58 50 36" fill="#DC2626"/>
    <circle cx="12" cy="34" r="6" fill="#FCD34D" opacity="0.6"/>
    <circle cx="52" cy="34" r="6" fill="#FCD34D" opacity="0.6"/>
    <polygon points="8,10 12,4 16,10 12,12" fill="#FBBF24"/>
    <polygon points="48,10 52,4 56,10 52,12" fill="#FBBF24"/>
  </svg>
);

export const IconSad = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
    <circle cx="32" cy="32" r="30" fill="#93C5FD"/>
    <ellipse cx="22" cy="26" rx="4" ry="5" fill="#1E40AF"/>
    <ellipse cx="42" cy="26" rx="4" ry="5" fill="#1E40AF"/>
    <path d="M20 48 Q32 38 44 48" stroke="#1E40AF" strokeWidth="4" strokeLinecap="round" fill="none"/>
    <path d="M18 30 L22 26" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
    <path d="M46 30 L42 26" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const IconSmile = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
    <circle cx="32" cy="32" r="30" fill="#FBBF24"/>
    <circle cx="16" cy="38" r="6" fill="#FDBA74" opacity="0.7"/>
    <circle cx="48" cy="38" r="6" fill="#FDBA74" opacity="0.7"/>
    <ellipse cx="22" cy="26" rx="4" ry="5" fill="#78350F"/>
    <ellipse cx="42" cy="26" rx="4" ry="5" fill="#78350F"/>
    <path d="M18 40 Q32 52 46 40" stroke="#78350F" strokeWidth="4" strokeLinecap="round" fill="none"/>
  </svg>
);

// ==================== CELEBRATION ICONS ====================

export const IconCelebration = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
    <polygon points="8,56 20,8 32,56" fill="#F97316"/>
    <polygon points="20,56 32,16 44,56" fill="#FBBF24"/>
    <circle cx="14" cy="20" r="4" fill="#EF4444"/>
    <circle cx="50" cy="16" r="3" fill="#22C55E"/>
    <circle cx="44" cy="28" r="3" fill="#3B82F6"/>
    <circle cx="52" cy="40" r="4" fill="#A855F7"/>
    <path d="M48 8 L52 4 L56 12 L48 8" fill="#EC4899"/>
    <path d="M6 32 L2 28 L10 26 L6 32" fill="#14B8A6"/>
  </svg>
);

export const IconParty = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
    <polygon points="12,58 24,10 36,58" fill="#F97316"/>
    <polygon points="24,58 36,18 48,58" fill="#FBBF24"/>
    <rect x="8" y="4" width="8" height="8" fill="#EC4899" transform="rotate(15 12 8)"/>
    <rect x="44" y="8" width="6" height="6" fill="#22C55E" transform="rotate(-20 47 11)"/>
    <circle cx="52" cy="24" r="4" fill="#3B82F6"/>
    <circle cx="6" cy="28" r="3" fill="#A855F7"/>
    <path d="M54 44 Q58 38 62 44" stroke="#EF4444" strokeWidth="3" fill="none"/>
    <circle cx="48" cy="52" r="3" fill="#14B8A6"/>
  </svg>
);

// ==================== MEDICAL/HEALTH ICONS ====================

export const IconMedical = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
    <circle cx="32" cy="32" r="28" fill="#F97316"/>
    <rect x="26" y="14" width="12" height="36" rx="2" fill="white"/>
    <rect x="14" y="26" width="36" height="12" rx="2" fill="white"/>
  </svg>
);

export const IconStethoscope = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
    <path d="M16 8 L16 24 Q16 40 32 40 Q48 40 48 24 L48 8" stroke="#10B981" strokeWidth="4" fill="none"/>
    <circle cx="16" cy="6" r="5" fill="#34D399"/>
    <circle cx="48" cy="6" r="5" fill="#34D399"/>
    <circle cx="16" cy="6" r="2" fill="#D1FAE5"/>
    <circle cx="48" cy="6" r="2" fill="#D1FAE5"/>
    <line x1="32" y1="40" x2="32" y2="52" stroke="#10B981" strokeWidth="4"/>
    <circle cx="32" cy="56" r="7" fill="#059669"/>
    <circle cx="32" cy="56" r="4" fill="#34D399"/>
  </svg>
);

export const IconHospital = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
    <rect x="8" y="16" width="48" height="44" rx="4" fill="#F97316"/>
    <rect x="24" y="4" width="16" height="16" rx="2" fill="#FBBF24"/>
    <rect x="28" y="8" width="8" height="8" fill="white"/>
    <rect x="16" y="28" width="12" height="12" rx="1" fill="white"/>
    <rect x="36" y="28" width="12" height="12" rx="1" fill="white"/>
    <rect x="26" y="44" width="12" height="16" rx="1" fill="white"/>
  </svg>
);

// ==================== ACTION ICONS ====================

export const IconThumbsUp = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
    <path d="M24 56 L8 56 L8 28 L24 28 L24 56" fill="#F97316"/>
    <path d="M24 32 L24 12 Q24 8 28 8 L32 8 Q36 8 36 12 L36 24 L52 24 Q56 24 56 28 L56 32 Q56 36 54 38 Q56 40 56 44 Q56 48 54 50 Q56 52 56 54 Q56 58 52 58 L28 58 Q24 58 24 54 L24 32" fill="#FBBF24"/>
  </svg>
);

export const IconStar = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
    <polygon 
      points="32,4 40,24 60,24 44,38 50,58 32,46 14,58 20,38 4,24 24,24" 
      fill="#FBBF24"
      stroke="#F59E0B"
      strokeWidth="2"
    />
  </svg>
);

export const IconSparkle = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
    <path d="M32 4 L36 26 L58 32 L36 38 L32 60 L28 38 L6 32 L28 26 Z" fill="#FBBF24"/>
    <path d="M12 12 L14 20 L22 22 L14 24 L12 32 L10 24 L2 22 L10 20 Z" fill="#F97316"/>
    <path d="M52 8 L53 14 L59 15 L53 16 L52 22 L51 16 L45 15 L51 14 Z" fill="#F97316"/>
  </svg>
);

export const IconLock = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
    <rect x="12" y="28" width="40" height="32" rx="4" fill="#6B7280"/>
    <path d="M20 28 L20 20 Q20 8 32 8 Q44 8 44 20 L44 28" stroke="#6B7280" strokeWidth="6" fill="none"/>
    <circle cx="32" cy="44" r="4" fill="white"/>
    <rect x="30" y="44" width="4" height="8" fill="white"/>
  </svg>
);

export const IconRocket = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none">
    <path d="M32 4 Q48 16 48 36 L40 44 L24 44 L16 36 Q16 16 32 4" fill="#F97316"/>
    <circle cx="32" cy="24" r="6" fill="white"/>
    <path d="M16 36 L8 48 L20 44" fill="#EF4444"/>
    <path d="M48 36 L56 48 L44 44" fill="#EF4444"/>
    <path d="M28 44 L24 58 L32 54 L40 58 L36 44" fill="#FBBF24"/>
  </svg>
);

export const IconBattery = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM11 20v-5.5H9L13 7v5.5h2L11 20z"/>
  </svg>
);

export const IconMeat = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <ellipse cx="12" cy="12" rx="8" ry="6" fill="currentColor"/>
    <ellipse cx="10" cy="10" rx="2" ry="1.5" fill="#FCD34D" opacity="0.6"/>
    <ellipse cx="14" cy="13" rx="1.5" ry="1" fill="#FCD34D" opacity="0.6"/>
  </svg>
);

export const IconEye = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
  </svg>
);

export const IconMicroscope = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M9.46 6.28l.47.24c.27.13.59.04.75-.22l.71-1.18c.15-.24.09-.56-.14-.74l-.57-.45c-.55-.44-.72-1.21-.38-1.82l.63-1.07c.23-.38.7-.52 1.1-.32l3.35 1.67c.4.2.58.66.4 1.06l-.63 1.07c-.34.61-.17 1.37.41 1.77l.57.45c.23.18.3.5.14.74l-.71 1.18c-.16.26-.48.35-.75.22l-.47-.24c-.55-.28-1.24-.09-1.58.43l-1.16 1.75c-.35.52-.19 1.23.36 1.56l.33.2c.55.33.73 1.05.4 1.6l-3.08 5.21c-.36.6-1.12.79-1.7.43l-1.96-1.22c-.58-.36-.78-1.1-.44-1.69l3.08-5.21c.33-.55.2-1.26-.33-1.62l-.33-.2c-.55-.33-.72-1.04-.36-1.56l1.16-1.75c.34-.52 1.03-.71 1.58-.43zM5.5 22c-.83 0-1.5-.67-1.5-1.5S4.67 19 5.5 19H13c.55 0 1 .45 1 1s-.45 1-1 1H6.52c.28.29.46.69.46 1.12-.02.35-.16.67-.38.88H5.5z"/>
  </svg>
);

export const IconRuler = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h2v4h2V8h2v4h2V8h2v4h2V8h2v8z"/>
  </svg>
);

export const IconIce = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M22 11h-4.17l3.24-3.24-1.41-1.42L15 11h-2V9l4.66-4.66-1.42-1.41L13 6.17V2h-2v4.17L7.76 2.93 6.34 4.34 11 9v2H9L4.34 6.34 2.93 7.76 6.17 11H2v2h4.17l-3.24 3.24 1.41 1.42L9 13h2v2l-4.66 4.66 1.42 1.41L11 17.83V22h2v-4.17l3.24 3.24 1.42-1.41L13 15v-2h2l4.66 4.66 1.41-1.42L17.83 13H22z"/>
  </svg>
);

export const IconEarth = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M12 2L4 14h3v8h10v-8h3L12 2zm0 4l4 6h-2v6h-4v-6H8l4-6z"/>
  </svg>
);

export const IconHome = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>
);

export const IconUnlock = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
    <rect x="4" y="10" width="16" height="12" rx="2" fill="#22C55E"/>
    <path d="M8 10V6c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="#16A34A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <circle cx="12" cy="15" r="1.5" fill="white"/>
    <rect x="11.25" y="15" width="1.5" height="3" fill="white" rx="0.75"/>
  </svg>
);

export const IconHeartPulse = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    <path d="M7 11h3l1.5-3 3 6 1.5-3h3" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const IconScale = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M12 3L4 9v12h16V9l-8-6zm0 2.3l6 4.5V19H6v-9.2l6-4.5zM7 12h10v2H7v-2zm0 4h10v2H7v-2z"/>
  </svg>
);

export const IconWater = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
    <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" fill="#60A5FA"/>
    <path d="M12 20c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z" fill="#3B82F6"/>
    <ellipse cx="9" cy="12" rx="2" ry="3" fill="#BFDBFE" opacity="0.6"/>
  </svg>
);

export const IconBalance = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
    <rect x="11" y="3" width="2" height="18" fill="#F59E0B"/>
    <rect x="6" y="20" width="12" height="2" rx="1" fill="#D97706"/>
    <circle cx="12" cy="3" r="2" fill="#FBBF24"/>
    <path d="M4 9 L12 7 L20 9" stroke="#F59E0B" strokeWidth="2" fill="none"/>
    <path d="M2 14 Q4 10 6 14 L2 14" fill="#FCD34D"/>
    <path d="M18 14 Q20 10 22 14 L18 14" fill="#FCD34D"/>
    <circle cx="4" cy="12" r="1" fill="#D97706"/>
    <circle cx="20" cy="12" r="1" fill="#D97706"/>
  </svg>
);

export const IconTimer = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
    <circle cx="12" cy="13" r="8" fill="#E0E7FF"/>
    <circle cx="12" cy="13" r="7" fill="#6366F1"/>
    <rect x="11" y="2" width="2" height="3" fill="#4F46E5"/>
    <rect x="9" y="1" width="6" height="2" rx="1" fill="#818CF8"/>
    <path d="M12 8v5l3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <circle cx="12" cy="13" r="1" fill="white"/>
  </svg>
);

export const IconEyeVision = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
    <path d="M12 4C7 4 2.73 7.11 1 12c1.73 4.89 6 8 11 8s9.27-3.11 11-8c-1.73-4.89-6-8-11-8z" fill="#DBEAFE"/>
    <path d="M12 5C7.45 5 3.57 7.62 2 12c1.57 4.38 5.45 7 10 7s8.43-2.62 10-7c-1.57-4.38-5.45-7-10-7z" fill="#60A5FA"/>
    <circle cx="12" cy="12" r="4" fill="white"/>
    <circle cx="12" cy="12" r="2.5" fill="#1E40AF"/>
    <circle cx="13" cy="11" r="1" fill="white"/>
  </svg>
);

export const IconGear = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
    <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58z" fill="#9CA3AF"/>
    <circle cx="12" cy="12" r="3.5" fill="#6B7280"/>
    <circle cx="12" cy="12" r="2" fill="#D1D5DB"/>
  </svg>
);

export const IconSword = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
    <path d="M6.92 5L5 7l6 6-2 2 1.5 1.5 2-2 2 2L16 16l-2-2 6-6-2-2-6 6-2-2 6-6-1-1L9 9 7.5 7.5 14 1l-7.08 4z" fill="#94A3B8"/>
    <path d="M2 22l4-4 2 2-4 4-2-2z" fill="#78350F"/>
    <path d="M3 21l3-3 1 1-3 3-1-1z" fill="#B45309"/>
  </svg>
);

export const IconTemperature = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
    <path d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4z" fill="#FEE2E2"/>
    <path d="M12 20c-1.65 0-3-1.35-3-3 0-1.08.58-2.03 1.44-2.56L11 14V5c0-.55.45-1 1-1s1 .45 1 1v9l.56.44c.86.53 1.44 1.48 1.44 2.56 0 1.65-1.35 3-3 3z" fill="#EF4444"/>
    <circle cx="12" cy="17" r="2" fill="#DC2626"/>
  </svg>
);

// ==================== COMMUNICATION ICONS ====================

export const IconChat = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
  </svg>
);

export const IconClipboard = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"/>
  </svg>
);

export const IconWarning = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
    <path d="M1 21h22L12 2 1 21z" fill="#FEF3C7"/>
    <path d="M3 20h18L12 4 3 20z" fill="#FBBF24"/>
    <rect x="11" y="10" width="2" height="5" rx="1" fill="#78350F"/>
    <circle cx="12" cy="17" r="1.2" fill="#78350F"/>
  </svg>
);

export const IconHeartYellow = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
    <defs>
      <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F97316"/>
        <stop offset="50%" stopColor="#FBBF24"/>
        <stop offset="100%" stopColor="#FDE047"/>
      </linearGradient>
    </defs>
    <path fill="url(#heartGradient)" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    <path fill="#FEF3C7" opacity="0.5" d="M7.5 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
  </svg>
);

export const IconFire = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
  </svg>
);

export const IconMoney = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
  </svg>
);

// ==================== ADDITIONAL ICONS ====================

export const IconThermometer = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-8c0-.55.45-1 1-1s1 .45 1 1h-1v1h1v2h-1v1h1v2h-2V5z"/>
  </svg>
);

export const IconCircle = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <circle cx="12" cy="12" r="10"/>
  </svg>
);

export const IconBolt = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
    <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z" fill="#FBBF24"/>
    <path d="M12 21h-1l1-7H8.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C9.48 10.94 11.42 7.54 14 3h1l-1 7h2.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 12 21 12 21z" fill="#F59E0B" opacity="0.7"/>
  </svg>
);

export const IconGift = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>
  </svg>
);

export const IconPill = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M4.22 11.29l5.66-5.66c2.34-2.34 6.14-2.34 8.49 0 2.34 2.34 2.34 6.14 0 8.49l-5.66 5.66c-2.34 2.34-6.14 2.34-8.49 0-2.34-2.35-2.34-6.15 0-8.49zm2.83 5.66c1.17 1.17 3.07 1.17 4.24 0L14.12 14l-4.24-4.24-2.83 2.83c-1.17 1.17-1.17 3.07 0 4.24v.12z"/>
  </svg>
);

export const IconPackage = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>
);

export const IconStore = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"/>
  </svg>
);

export const IconChart = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
  </svg>
);

export const IconUser = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

export const IconClock = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
    <circle cx="12" cy="12" r="10" fill="#DBEAFE"/>
    <circle cx="12" cy="12" r="8" fill="#3B82F6"/>
    <path d="M12 6v6l4 2" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="12" cy="12" r="1.5" fill="white"/>
  </svg>
);

export const IconClean = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
    <path d="M16 11h-1V3c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v8H8c-2.76 0-5 2.24-5 5v7h18v-7c0-2.76-2.24-5-5-5z" fill="#06B6D4"/>
    <path d="M5 16c0-1.65 1.35-3 3-3h8c1.65 0 3 1.35 3 3v5H5v-5z" fill="#22D3EE"/>
    <path d="M9 3h6v8H9z" fill="#67E8F9"/>
    <circle cx="7" cy="6" r="2" fill="#A5F3FC"/>
    <circle cx="17" cy="8" r="1.5" fill="#A5F3FC"/>
  </svg>
);

export const IconDoctor = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
    <circle cx="8" cy="8" r="4" fill="#C4B5FD"/>
    <path d="M4 17v2h12v-2c0-2.66-4-4-6-4s-6 1.34-6 4z" fill="#8B5CF6"/>
    <rect x="16" y="8" width="6" height="2" rx="1" fill="#A78BFA"/>
    <rect x="18" y="6" width="2" height="6" rx="1" fill="#A78BFA"/>
  </svg>
);

export const IconArt = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
    <circle cx="12" cy="12" r="9" fill="#FEF3C7"/>
    <circle cx="6.5" cy="10.5" r="1.5" fill="#EF4444"/>
    <circle cx="9.5" cy="6.5" r="1.5" fill="#F59E0B"/>
    <circle cx="14.5" cy="6.5" r="1.5" fill="#22C55E"/>
    <circle cx="17.5" cy="10.5" r="1.5" fill="#3B82F6"/>
    <path d="M12 21c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5" fill="#A855F7"/>
  </svg>
);

export const IconCancel = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
    <circle cx="12" cy="12" r="10" fill="#FECACA"/>
    <circle cx="12" cy="12" r="8" fill="#EF4444"/>
    <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const IconMail = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
);

export const IconKeyboard = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/>
  </svg>
);

export const IconPhone = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
  </svg>
);

export const IconTrophy = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
  </svg>
);

export const IconMuscle = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M12 4c-1.5 0-2.68 1.03-3.02 2.41l-.7 2.79-2.42.61c-.9.22-1.56 1.01-1.56 1.94v5.5c0 1.1.9 2 2 2h3.5c.55 0 1-.45 1-1v-1.5c0-.28.22-.5.5-.5s.5.22.5.5v1.5c0 .55.45 1 1 1h3.5c1.1 0 2-.9 2-2v-5.5c0-.93-.66-1.72-1.56-1.94l-2.42-.61-.7-2.79C15.68 5.03 14.5 4 13 4h-1zm-1.5 6.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5S9 12.83 9 12s.67-1.5 1.5-1.5zm4 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z"/>
  </svg>
);

export const IconTarget = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3-8c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z"/>
  </svg>
);

export const IconHeart = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

export const IconBone = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M8 14c-2.21 0-4 1.79-4 4s1.79 4 4 4c1.1 0 2.1-.45 2.83-1.17l6.17-6.17c.72.72 1.72 1.17 2.83 1.17 2.21 0 4-1.79 4-4s-1.79-4-4-4c-1.1 0-2.1.45-2.83 1.17l-6.17 6.17C10.1 14.45 9.1 14 8 14zm0-2c1.1 0 2.1.45 2.83 1.17L17 7.17C16.28 6.45 15.83 5.45 15.83 4.34c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4c-1.1 0-2.1-.45-2.83-1.17L10.83 13.34C11.55 14.06 12 15.06 12 16.17c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4z"/>
  </svg>
);

export const IconProtein = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M18.06 3l-3.27 3.27C14.2 5.73 13.4 5.4 12.53 5.4c-.87 0-1.67.33-2.27.87L7 3H4l4.93 4.93C8.35 8.53 8 9.23 8 10c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2 0-.77-.35-1.47-.93-2.07L20 3h-1.94zM10 18c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-5h-4v5z"/>
  </svg>
);

export const IconDiamond = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M19 3H5L2 9l10 12L22 9l-3-6zM9.62 8l1.5-3h1.76l1.5 3H9.62zM11 10v6.68L5.44 10H11zm2 0h5.56L13 16.68V10zm6.26-2h-2.65l-1.5-3h2.65l1.5 3zM6.24 5h2.65l-1.5 3H4.74l1.5-3z"/>
  </svg>
);

export const IconBuilding = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
  </svg>
);

export const IconLeaf = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
    <path d="M6 21c0-4.97 4.03-9 9-9 1.66 0 3.22.45 4.56 1.23C18.73 7.89 14.15 4 9 4c-1.5 0-2.93.33-4.22.92C4.28 6.55 4 8.24 4 10c0 5.52 4.48 10 10 10h1c-1.1-.34-2.1-.86-3-1.5" fill="#86EFAC"/>
    <path d="M17 12c-2.76 0-5 2.24-5 5 0 .34.04.67.1 1H15c4.42 0 8-3.58 8-8v-1c-.34.06-.67.09-1 .09-2.76 0-5-2.24-5-5.09V4c-1.93.81-3.29 2.72-3.29 4.93 0 0 2.07.71 4.29 1.57 1.5.58 2.63 1.91 2.83 3.5" fill="#22C55E"/>
    <path d="M6 21l3-3" stroke="#15803D" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const IconLightbulb = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/>
  </svg>
);

export const IconSpeaker = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
  </svg>
);

// Animated loading spinner (blue)
export const IconSpinner = ({ size = 16, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={`animate-spin ${className}`} style={style} fill="none">
    <circle cx="12" cy="12" r="10" stroke="#93C5FD" strokeWidth="3" opacity="0.3"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

// Cross/X icon for error states (red)
export const IconCross = ({ size = 16, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="none">
    <circle cx="12" cy="12" r="10" fill="#FEE2E2"/>
    <path d="M15 9L9 15M9 9l6 6" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const IconPause = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
  </svg>
);

export const IconHandshake = ({ size = 48, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} style={style} fill="none">
    <path d="M8 28 L20 20 L28 28 L36 20 L44 28" stroke="#F97316" strokeWidth="4" strokeLinecap="round" fill="none"/>
    <path d="M20 20 L20 44" stroke="#FBBF24" strokeWidth="6" strokeLinecap="round"/>
    <path d="M44 20 L44 44" stroke="#FBBF24" strokeWidth="6" strokeLinecap="round"/>
    <circle cx="20" cy="48" r="6" fill="#FCD34D"/>
    <circle cx="44" cy="48" r="6" fill="#FCD34D"/>
    <path d="M26 36 L38 36" stroke="#F97316" strokeWidth="4" strokeLinecap="round"/>
    <circle cx="32" cy="12" r="8" fill="#FB923C"/>
    <path d="M28 10 L32 14 L36 10" stroke="#FEF3C7" strokeWidth="2" strokeLinecap="round" fill="none"/>
  </svg>
);
