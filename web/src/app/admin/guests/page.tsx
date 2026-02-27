import { Users } from 'lucide-react';

export default function GuestsPage() {
  return (
    <div>
      <h1 className="type-heading-4 text-charcoal mb-6">Invitados</h1>
      <div className="bg-white rounded-lg border border-charcoal/10 p-8 text-center">
        <Users size={40} className="mx-auto text-charcoal/30 mb-3" />
        <p className="text-charcoal/60 type-body-base mb-1">
          Gestión de lista de invitados
        </p>
        <p className="text-charcoal/40 type-body-small">
          CRUD, importar/exportar CSV y generación de magic links.
        </p>
      </div>
    </div>
  );
}
