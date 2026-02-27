import { Settings } from 'lucide-react';

export default function ConfigPage() {
  return (
    <div>
      <h1 className="type-heading-4 text-charcoal mb-6">Configuración</h1>
      <div className="bg-white rounded-lg border border-charcoal/10 p-8 text-center">
        <Settings size={40} className="mx-auto text-charcoal/30 mb-3" />
        <p className="text-charcoal/60 type-body-base mb-1">
          Remote Config
        </p>
        <p className="text-charcoal/40 type-body-small">
          Ver y editar los valores de Firebase Remote Config.
        </p>
      </div>
    </div>
  );
}
