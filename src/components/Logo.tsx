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
      <img
        src="/logo.svg"
        alt="LingoBridge"
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default Logo;
