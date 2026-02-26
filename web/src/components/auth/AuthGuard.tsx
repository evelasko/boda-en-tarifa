'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import GoogleSignInButton from './GoogleSignInButton';
import AppleSignInButton from './AppleSignInButton';
import Image from 'next/image';
import Link from 'next/link';
interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <section id="rsvp-cta" className="bg-lovers-texture-small bg-contain bg-repeat-y relative">
         <div className="absolute inset-0">
           <Image
            src="/slides/lovers@large.jpg"
            alt="Kite slide continuation"
            fill
            className="w-full h-screen object-cover"
           />
         </div>
         <div className="relative min-h-screen flex items-center justify-center">
           <div className="max-w-md w-full mx-4">
             <div className="bg-white/20 backdrop-blur-md rounded-lg shadow-lg p-8 border border-charcoal/20">
               <div className="text-center mb-8">
                 <h1 className="text-2xl font-bold text-gray-900 mb-2">
                   RSVP Requiere Iniciar Sesión
                 </h1>
                 <p className="text-charcoal">
                   Por favor inicie sesión para acceder al formulario
                 </p>
               </div>
               
               <div className="space-y-4">
                 <GoogleSignInButton className="text-black bg-white hover:!text-black" />
                 <AppleSignInButton />
               </div>
               
               <p className="text-xs text-black/70 text-center mt-4">
                 Usamos autenticación segura para verificar su identidad para el formulario RSVP
               </p>
             <div className="mt-6 text-center">
               <Link href="/" className="inline-flex flex-col items-center text-charcoal hover:text-charcoal/80">
                 <Image
                   src="/icons/steer.png"
                   alt="Home"
                   width={32}
                   height={32}
                   className="mb-2"
                 />
                 <span>Volver al inicio</span>
               </Link>
             </div>
             </div>
           </div>
         </div>
      </section>
    );
  }

  return <>{children}</>;
}
