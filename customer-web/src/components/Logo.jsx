import React from 'react';

export function Logo({ className = "h-8", width, height }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 76"
      className={className}
      width={width}
      height={height}
      aria-label="Reliv"
    >
      {/* Re in Orange (#F97316) */}
      <g fill="#F97316">
        {/* Capital R */}
        <path d="M 8 10 L 36 10 C 49 10 57 17 57 28 C 57 36 52 42 43 45 L 59 70 L 44 70 L 30 47 L 22 47 L 22 70 L 8 70 Z M 22 21 L 22 36 L 35 36 C 40.5 36 43.5 33 43.5 28.5 C 43.5 24 40.5 21 35 21 Z" />
        {/* Lowercase e */}
        <path d="M 90 48.5 C 90 36.5 82 28 69 28 C 56 28 46 37.5 46 50 C 46 63 56 71.5 70 71.5 C 79.5 71.5 86.5 67 89.5 60 L 77.5 56 C 76 59.5 73 61.5 69.5 61.5 C 63.5 61.5 60 57.5 59.5 52 L 90 52 C 90 50.8 90 49.6 90 48.5 Z M 59.5 44 C 60.5 39 64 36.5 69 36.5 C 74 36.5 77 39 77.8 44 Z" />
        {/* Dot of i */}
        <circle cx="123" cy="18" r="7" />
      </g>
      
      {/* liv in Black (#000000) */}
      <g fill="#000000">
        {/* Lowercase l */}
        <path d="M 99 10 L 112 10 L 112 70 L 99 70 Z" />
        {/* Lowercase dotless i */}
        <path d="M 117 30 L 129 30 L 129 70 L 117 70 Z" />
        {/* Lowercase v */}
        <path d="M 135 30 L 148 30 L 159 59 L 170 30 L 183 30 L 166 70 L 152 70 Z" />
      </g>
    </svg>
  );
}

export default Logo;
