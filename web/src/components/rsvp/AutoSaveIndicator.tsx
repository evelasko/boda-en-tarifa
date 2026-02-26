'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSavedAt?: Date;
  isDirty: boolean;
  className?: string;
}

export function AutoSaveIndicator({ 
  isSaving, 
  lastSavedAt, 
  isDirty, 
  className 
}: AutoSaveIndicatorProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={cn('flex items-center space-x-2 text-sm', className)}>
      {isSaving ? (
        <div className="flex items-center space-x-2 text-blue-600">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
          <span>Guardando...</span>
        </div>
      ) : lastSavedAt ? (
        <div className={cn(
          'flex items-center space-x-2',
          isDirty ? 'text-orange-600' : 'text-green-600'
        )}>
          <div className={cn(
            'w-2 h-2 rounded-full',
            isDirty ? 'bg-orange-500' : 'bg-green-500'
          )} />
          <span>
            {isDirty ? 'Cambios sin guardar' : `Guardado a las ${formatTime(lastSavedAt)}`}
          </span>
        </div>
      ) : null}
    </div>
  );
}
