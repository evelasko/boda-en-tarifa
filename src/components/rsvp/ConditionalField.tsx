'use client';

import React from 'react';

interface ConditionalFieldProps {
  condition: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ConditionalField({ 
  condition, 
  children, 
  className 
}: ConditionalFieldProps) {
  if (!condition) return null;

  return (
    <div className={className}>
      {children}
    </div>
  );
}
