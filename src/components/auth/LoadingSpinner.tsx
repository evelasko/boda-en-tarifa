'use client';

import React from 'react';
import Typography, { combineTypographyClasses } from '@/lib/typography';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  message = "Cargando...", 
  className = "" 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="relative">
        <div className="w-8 h-8 border-4 border-coral/20 border-t-coral rounded-full animate-spin"></div>
      </div>
      <p className={combineTypographyClasses(
        Typography.UI.Caption,
        "text-charcoal/70"
      )}>
        {message}
      </p>
    </div>
  );
}
