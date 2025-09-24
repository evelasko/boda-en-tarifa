'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import GoogleSignInButton from './GoogleSignInButton';
import AppleSignInButton from './AppleSignInButton';
import LoadingSpinner from './LoadingSpinner';
import Typography, { combineTypographyClasses } from '@/lib/typography';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to RSVP page when user successfully signs in
  useEffect(() => {
    if (user && !loading) {
      router.push('/rsvp');
      onClose();
    }
  }, [user, loading, router, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
      isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-cream rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transition-all duration-300 transform ${
        isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
      }`}>
        {/* Header */}
        <div className="bg-lobster-texture bg-contain bg-repeat-y p-8 text-center">
          <div className="w-full h-[20px] bg-divider-stick bg-repeat-x bg-contain mb-6" />
          
          <h2 className={combineTypographyClasses(
            Typography.Heading.H2, 
            "text-charcoal mix-blend-overlay mb-4"
          )}>
            Confirmar Asistencia
          </h2>
          
          <p className={combineTypographyClasses(
            Typography.UI.Lead, 
            "text-white mb-6 mix-blend-overlay"
          )}>
            Por favor inicia sesión para acceder al formulario RSVP
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            <LoadingSpinner message="Iniciando sesión..." />
          ) : (
            <>
              <div className="space-y-4 mb-6">
                <GoogleSignInButton className='text-black' />
                <AppleSignInButton />
              </div>
              
              <p className={combineTypographyClasses(
                Typography.UI.Caption, 
                "text-charcoal/70 text-center"
              )}>
                Utilizamos autenticación segura para verificar tu identidad
              </p>
            </>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 hover:scale-110 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          aria-label="Cerrar modal"
        >
          <svg 
            className="w-5 h-5 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
