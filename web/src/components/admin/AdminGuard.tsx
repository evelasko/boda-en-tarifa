'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import AppleSignInButton from '@/components/auth/AppleSignInButton';
import Link from 'next/link';

type AdminStatus = 'loading' | 'unauthenticated' | 'forbidden' | 'authorized';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<AdminStatus>('loading');

  useEffect(() => {
    if (loading) {
      setStatus('loading');
      return;
    }

    if (!user) {
      setStatus('unauthenticated');
      return;
    }

    let cancelled = false;

    async function checkAdmin() {
      try {
        const idToken = await user!.getIdToken();
        const res = await fetch('/admin/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });

        if (cancelled) return;

        if (res.ok) {
          const data = await res.json();
          setStatus(data.isAdmin ? 'authorized' : 'forbidden');
        } else {
          setStatus('forbidden');
        }
      } catch {
        if (!cancelled) setStatus('forbidden');
      }
    }

    checkAdmin();
    return () => { cancelled = true; };
  }, [user, loading, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ocean mx-auto mb-4" />
          <p className="text-charcoal/70 type-body-small">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="max-w-sm w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 border border-charcoal/10">
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-charcoal mb-2">
                Panel de Administración
              </h1>
              <p className="text-charcoal/70 type-body-small">
                Inicia sesión para acceder al panel
              </p>
            </div>
            <div className="space-y-3">
              <GoogleSignInButton className="text-black bg-white hover:!text-black" />
              <AppleSignInButton />
            </div>
            <div className="mt-6 text-center">
              <Link href="/" className="text-ocean hover:text-ocean/80 type-body-small">
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'forbidden') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="max-w-sm w-full mx-4 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 border border-charcoal/10">
            <div className="text-5xl mb-4">🚫</div>
            <h1 className="text-xl font-bold text-charcoal mb-2">
              Acceso Denegado
            </h1>
            <p className="text-charcoal/70 type-body-small mb-6">
              No tienes permisos de administrador. Si crees que esto es un error, contacta con los novios.
            </p>
            <Link
              href="/"
              className="inline-block bg-ocean text-white px-6 py-2 rounded-md hover:bg-ocean/90 transition-colors type-button"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
