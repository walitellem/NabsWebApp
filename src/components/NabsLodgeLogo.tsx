import React from 'react';

interface NabsLodgeLogoProps {
  className?: string;
  imgClassName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  alt?: string;
}

export const NabsLodgeLogo: React.FC<NabsLodgeLogoProps> = ({ 
  className = '', 
  size = 'md',
}) => {
  const sizeMap = {
    xs: 'w-8 h-8 text-sm',
    sm: 'w-10 h-10 text-base',
    md: 'w-11 h-11 text-lg',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-2xl',
  };

  const containerSize = sizeMap[size] || sizeMap.md;

  return (
    <div 
      className={`shrink-0 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-blue-500/20 select-none ${containerSize} ${className}`}
      title="NABS LODGE"
    >
      N
    </div>
  );
};

