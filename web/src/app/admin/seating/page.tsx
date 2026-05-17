import { buildSeatingRenderPayload } from '@/lib/seating-render';
import SeatingDiagram from '@/components/admin/SeatingDiagram';
import SeatingLayoutSeedPrompt from '@/components/admin/SeatingLayoutSeedPrompt';
import './print.css';

export const dynamic = 'force-dynamic';

export default async function SeatingPage() {
  const payload = await buildSeatingRenderPayload();
  if (!payload) {
    return <SeatingLayoutSeedPrompt />;
  }
  return <SeatingDiagram payload={payload} />;
}
