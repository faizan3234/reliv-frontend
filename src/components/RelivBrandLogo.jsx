import React from 'react';
import logo from '../assets/relivlogo.jpeg';

// Frame the supplied artwork without its large white margins; no redrawn logo.
export default function RelivBrandLogo({ width = 124 }) {
  return (
    <svg viewBox="100 320 830 290" width={width} height={width * 290 / 830}
      role="img" aria-label="Reliv" style={{ display: 'block', flexShrink: 0 }}>
      <image href={logo} width="1024" height="1024" />
    </svg>
  );
}
