'use client';

import React, { useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { SpanishRSVPForm } from '@/components/rsvp/SpanishRSVPForm';

function RSVPFormContent() {
  const { user, logout } = useAuth();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleSuccess = () => {
    setShowSuccessMessage(true);
  };

  const handleError = (error: string) => {
    console.error('RSVP Error:', error);
    // You could show a toast notification here
  };

  if (showSuccessMessage) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Respuesta enviada con éxito!
              </h2>
              <p className="text-gray-600 mb-6">
                Gracias por confirmar tu asistencia. Te esperamos en nuestra boda.
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowSuccessMessage(false)}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Editar respuesta
              </button>
              <button 
                onClick={logout}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SpanishRSVPForm 
      user={user!}
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
}

export default function RSVPForm() {
  return (
    <AuthGuard>
      <RSVPFormContent />
    </AuthGuard>
  );
}