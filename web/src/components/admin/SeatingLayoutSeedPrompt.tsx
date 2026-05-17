'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';

export default function SeatingLayoutSeedPrompt() {
  const { user } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const seed = useCallback(async () => {
    if (!user) {
      toast.error('No autenticado');
      return;
    }
    setBusy(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/seating/layout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Error' }));
        toast.error(data.error ?? 'No se pudo inicializar el plano');
        return;
      }
      toast.success('Plano inicializado con los valores por defecto');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }, [router, user]);

  return (
    <div className="max-w-xl mx-auto bg-white border border-charcoal/10 rounded-lg p-8 text-center space-y-4">
      <Sparkles className="h-8 w-8 mx-auto text-gold" />
      <h1 className="type-heading-5 text-charcoal">Plano de mesas no inicializado</h1>
      <p className="text-charcoal/70 text-sm">
        Crea la configuración por defecto (10 mesas en 3 filas, nombres de playas).
        Después podrás editarlo desde esta misma página.
      </p>
      <Button onClick={seed} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Inicializar con valores por defecto
      </Button>
    </div>
  );
}
