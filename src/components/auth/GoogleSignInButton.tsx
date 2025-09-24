'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FcGoogle } from 'react-icons/fc';

interface GoogleSignInButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function GoogleSignInButton({ 
  className = '', 
  children 
}: GoogleSignInButtonProps) {
  const { signInWithGoogle, loading, error } = useAuth();

  return (
    <div className="w-full">
      <button
        onClick={signInWithGoogle}
        disabled={loading}
        className={`
          w-full flex items-center justify-center gap-3 px-6 py-3 
          border border-gray-300 rounded-lg shadow-sm
          hover:bg-gray-50 hover:border-gray-400 hover:shadow-md
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
          ${className}
        `}
      >
        <FcGoogle className="w-5 h-5" />
        {children || (loading ? 'Signing in...' : 'Continue with Google')}
      </button>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
