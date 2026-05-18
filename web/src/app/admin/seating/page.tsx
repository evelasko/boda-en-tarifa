import { buildSeatingRenderPayload } from '@/lib/seating-render';
import SeatingDiagram from '@/components/admin/SeatingDiagram';
import SeatingLayoutSeedPrompt from '@/components/admin/SeatingLayoutSeedPrompt';
// Print rules + theme tokens live in web/src/styles/seating-diagram.css,
// which is imported once from globals.css and applies to both this page
// and /staff/tables.

export const dynamic = 'force-dynamic';

export default async function SeatingPage() {
  const payload = await buildSeatingRenderPayload();
  if (!payload) {
    return <SeatingLayoutSeedPrompt />;
  }
  return <SeatingDiagram payload={payload} />;
}
