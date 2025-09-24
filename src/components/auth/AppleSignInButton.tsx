'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaApple } from 'react-icons/fa';

interface AppleSignInButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function AppleSignInButton({ 
  className = '', 
  children 
}: AppleSignInButtonProps) {
  const { signInWithApple, loading, error } = useAuth();

  return (
    <div className="w-full">
      <button
        onClick={signInWithApple}
        disabled={loading}
        className={`
          w-full flex items-center justify-center gap-3 px-6 py-3 
          bg-black text-white rounded-lg shadow-sm
          hover:bg-gray-800 hover:shadow-md
          focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
          ${className}
        `}
      >
        <FaApple className="w-5 h-5" />
        {children || (loading ? 'Signing in...' : 'Continue with Apple')}
      </button>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
