import React from 'react';
import { THEME_COLOR } from '../constants';

interface BrandLogoProps {
  className?: string;
  color?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = "w-8 h-8", color = THEME_COLOR }) => {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg" fill="none">
      {/* Abstract X Shape */}
      <path d="M20 20 L40 20 L80 90 L60 90 Z" fill={color} />
      <path d="M80 20 L60 20 L20 90 L40 90 Z" fill={color} opacity="0.9" />
      

    </svg>
  );
};
