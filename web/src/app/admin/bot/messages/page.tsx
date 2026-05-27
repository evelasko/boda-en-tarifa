'use client';

import { MessageSquare } from 'lucide-react';

export default function ConversationsIndexPage() {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center h-full p-8 text-center">
      <MessageSquare size={40} className="text-charcoal/20 mb-4" />
      <h3 className="type-body-base font-medium text-charcoal">
        Selecciona una conversación
      </h3>
      <p className="text-sm text-charcoal/60 mt-2 max-w-sm">
        Elige un invitado en la lista para ver el hilo. Usa los filtros «50+ msg»
        o «100+ msg» para localizar hilos largos.
      </p>
    </div>
  );
}
