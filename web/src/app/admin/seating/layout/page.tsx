import { readSeatingLayout } from '@/lib/seating-layout-server';
import SeatingLayoutEditor from '@/components/admin/SeatingLayoutEditor';
import SeatingLayoutSeedPrompt from '@/components/admin/SeatingLayoutSeedPrompt';

export const dynamic = 'force-dynamic';

export default async function SeatingLayoutConfigPage() {
  const layout = await readSeatingLayout();
  if (!layout) {
    return <SeatingLayoutSeedPrompt />;
  }
  return <SeatingLayoutEditor initial={layout} />;
}
