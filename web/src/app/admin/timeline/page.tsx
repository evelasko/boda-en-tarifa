import { Calendar } from 'lucide-react';

export default function TimelinePage() {
  return (
    <div>
      <h1 className="type-heading-4 text-charcoal mb-6">Timeline</h1>
      <div className="bg-white rounded-lg border border-charcoal/10 p-8 text-center">
        <Calendar size={40} className="mx-auto text-charcoal/30 mb-3" />
        <p className="text-charcoal/60 type-body-base mb-1">
          Gestión del hero banner y programa de eventos
        </p>
        <p className="text-charcoal/40 type-body-small">
          Editar fechas, horarios y detalles de cada evento.
        </p>
      </div>
    </div>
  );
}
