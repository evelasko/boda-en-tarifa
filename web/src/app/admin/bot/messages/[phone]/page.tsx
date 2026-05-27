'use client';

import { use } from 'react';
import { ConversationThreadPanel } from '@/components/admin/bot/ConversationThreadPanel';

export default function ConversationThreadPage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const resolved = use(params);
  const phone = decodeURIComponent(resolved.phone);

  return <ConversationThreadPanel phone={phone} />;
}
