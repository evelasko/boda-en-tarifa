import { Shield } from 'lucide-react';

export default function ModerationPage() {
  return (
    <div>
      <h1 className="type-heading-4 text-charcoal mb-6">Moderación</h1>
      <div className="bg-white rounded-lg border border-charcoal/10 p-8 text-center">
        <Shield size={40} className="mx-auto text-charcoal/30 mb-3" />
        <p className="text-charcoal/60 type-body-base mb-1">
          Moderación de comunidad
        </p>
        <p className="text-charcoal/40 type-body-small">
          Feed de publicaciones y tablón de anuncios.
        </p>
      </div>
    </div>
  );
}
