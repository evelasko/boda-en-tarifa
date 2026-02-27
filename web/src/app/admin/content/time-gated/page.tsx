import { Clock } from 'lucide-react';

export default function TimeGatedContentPage() {
  return (
    <div>
      <h1 className="type-heading-4 text-charcoal mb-6">Contenido Programado</h1>
      <div className="bg-white rounded-lg border border-charcoal/10 p-8 text-center">
        <Clock size={40} className="mx-auto text-charcoal/30 mb-3" />
        <p className="text-charcoal/60 type-body-base mb-1">
          Contenido con fecha de publicación
        </p>
        <p className="text-charcoal/40 type-body-small">
          Carta de asientos, menús y otro contenido que se revela en fecha programada.
        </p>
      </div>
    </div>
  );
}
