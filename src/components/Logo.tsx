import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
}

const Logo: React.FC<LogoProps> = ({ className, size = '100%' }) => {
  return (
    <div 
      className={`flex items-center justify-center overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <svg 
        viewBox="0 0 512 512" 
        className="w-full h-full"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Chinese 'L' Gate - Detailed */}
        <path d="M120 400 V230 H220 V400 H120Z" fill="#E31E24" />
        <path d="M100 230 Q170 180 240 230 M100 230 L115 250 Q170 210 225 250 L240 230" fill="#E31E24" />
        <path d="M70 200 Q170 140 270 200 M70 200 L85 225 Q170 175 255 225 L270 200" fill="#E31E24" />
        
        {/* Base of L gate pillars */}
        <rect x="120" y="380" width="10" height="20" fill="#B2181C" />
        <rect x="210" y="380" width="10" height="20" fill="#B2181C" />

        {/* The Bridge / Ribbon (Russian Flag colors) */}
        <path 
          d="M200 320 C280 280 340 300 420 280" 
          stroke="#FFFFFF" 
          strokeWidth="20" 
          strokeLinecap="round"
        />
        <path 
          d="M200 335 C280 295 340 315 420 295" 
          stroke="#0056D2" 
          strokeWidth="20" 
          strokeLinecap="round"
        />
        <path 
          d="M200 350 C280 310 340 330 420 310" 
          stroke="#E31E24" 
          strokeWidth="20" 
          strokeLinecap="round"
        />

        {/* Russian 'B' Onion Dome Shape - Detailed */}
        <g transform="translate(360, 200)">
          {/* Main Body of B */}
          <path d="M0 200 H60 C90 200 90 150 60 150 H0 V200Z" fill="#00ACC1" />
          <path d="M0 150 H50 C80 150 80 110 50 110 H0 V150Z" fill="#00ACC1" />
          
          {/* Onion Dome */}
          <path d="M5 110 C5 40 75 40 75 110 Z" fill="#00ACC1" />
          {/* Gold Tip */}
          <path d="M35 50 Q35 30 40 25 Q45 30 45 50 Z" fill="#FFD700" />
          {/* Base of dome border */}
          <rect x="5" y="105" width="70" height="5" fill="#FFD700" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
};

export default Logo;
