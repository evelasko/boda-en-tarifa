import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildSeatingRenderPayload } from '@/lib/seating-render';
import SeatingDiagramSingleTable from '@/components/admin/SeatingDiagramSingleTable';

export const dynamic = 'force-dynamic';

function parseTableNumber(raw: string): number | null {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0 || String(n) !== raw.trim()) {
    return null;
  }
  return n;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tableNumber: string }>;
}): Promise<Metadata> {
  const { tableNumber: raw } = await params;
  const tableNumber = parseTableNumber(raw);
  const payload = tableNumber !== null ? await buildSeatingRenderPayload() : null;
  const inLayout =
    payload !== null &&
    tableNumber !== null &&
    payload.layout.rows.flat().includes(tableNumber);
  const tableName =
    inLayout && tableNumber !== null
      ? (payload!.layout.names[String(tableNumber)] ?? `Mesa ${tableNumber}`)
      : null;

  return {
    title: tableName
      ? `Mesa ${tableNumber} · ${tableName} — Boda Enrique & Manuel`
      : 'Mesa — Boda Enrique & Manuel',
    description: 'Plano de servicio: invitados asignados a esta mesa.',
    robots: { index: false, follow: false },
  };
}

export default async function MesaPage({
  params,
}: {
  params: Promise<{ tableNumber: string }>;
}) {
  const { tableNumber: raw } = await params;
  const tableNumber = parseTableNumber(raw);
  if (tableNumber === null) {
    notFound();
  }

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

  const layoutTableNumbers = payload.layout.rows.flat();
  if (!layoutTableNumbers.includes(tableNumber)) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-cream text-charcoal p-4 sm:p-6">
      <SeatingDiagramSingleTable payload={payload} tableNumber={tableNumber} />
    </main>
  );
}
