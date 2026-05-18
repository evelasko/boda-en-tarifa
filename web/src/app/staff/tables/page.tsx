import type { Metadata } from 'next';
import { buildSeatingRenderPayload } from '@/lib/seating-render';
import SeatingDiagram from '@/components/admin/SeatingDiagram';
// Print rules + theme tokens live in web/src/styles/seating-diagram.css,
// imported once from globals.css and shared with /admin/seating.

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Plano de mesas — Boda Enrique & Manuel',
  description: 'Plano de servicio: ubicación de invitados por mesa.',
  robots: { index: false, follow: false },
};

export default async function StaffTablesPage() {
  const payload = await buildSeatingRenderPayload();

  if (!payload) {
    return (
      <main className="min-h-screen bg-cream text-charcoal flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="type-heading-5">Plano de mesas no disponible</h1>
          <p className="text-charcoal/70 text-sm">
            La configuración del plano aún no se ha inicializado. Contacta con los
            organizadores.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream text-charcoal p-4 sm:p-6">
      <SeatingDiagram payload={payload} variant="public" />
    </main>
  );
}
