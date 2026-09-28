import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

interface NabsLodgeLogoProps {
  className?: string;
  imgClassName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  alt?: string;
}

export const NabsLodgeLogo: React.FC<NabsLodgeLogoProps> = ({ 
  className = '', 
  size = 'md',
  alt = 'Nabslodge Logo'
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  const sizeMap = {
    xs: 'h-8 w-8',
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20',
  };

  const sizePxMap = {
    xs: 32,
    sm: 40,
    md: 48,
    lg: 64,
    xl: 80,
  };

  const containerSize = sizeMap[size] || sizeMap.md;
  const pxSize = sizePxMap[size] || 48;

  if (imageFailed) {
    return (
      <div 
        style={{ width: `${pxSize}px`, height: `${pxSize}px`, minWidth: `${pxSize}px`, maxWidth: `${pxSize}px`, minHeight: `${pxSize}px`, maxHeight: `${pxSize}px`, display: 'inline-flex' }} 
        className={`${containerSize} bg-emerald-700 text-white items-center justify-center rounded-lg shadow-sm shrink-0 font-bold border-2 border-emerald-800 ${className}`}
      >
        <div className="p-1 border border-emerald-950 rounded-md flex items-center justify-center">
          <Building2 className="w-5 h-5" />
        </div>
      </div>
    );
  }

  return (
    <img 
      src="/logo.png" 
      alt={alt} 
      referrerPolicy="no-referrer"
      onError={() => setImageFailed(true)}
      style={{ 
        width: `${pxSize}px`, 
        height: `${pxSize}px`, 
        minWidth: `${pxSize}px`, 
        maxWidth: `${pxSize}px`, 
        minHeight: `${pxSize}px`, 
        maxHeight: `${pxSize}px`, 
        objectFit: 'contain', 
        display: 'inline-block' 
      }} 
      className={`${containerSize} object-contain shrink-0 rounded-lg ${className}`} 
    />
  );
};





