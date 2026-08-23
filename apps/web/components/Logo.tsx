import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  variant?: 'icon' | 'full' | 'mark';
}

export default function GrocGoLogo({ size = 32, className = '', showText = true, variant = 'full' }: LogoProps) {
  if (variant === 'icon') {
    return (
      <img
        src="/logo.svg"
        alt="GrocGo"
        width={size}
        height={size}
        className={`object-contain ${className}`}
        draggable={false}
      />
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.svg"
        alt="GrocGo"
        width={size}
        height={size}
        className="object-contain"
        draggable={false}
      />
      {showText && (
        <span className="font-black text-gray-900" style={{ fontSize: size * 0.55 }}>
          Groc<span className="text-grocgo-600">Go</span>
        </span>
      )}
    </div>
  );
}
