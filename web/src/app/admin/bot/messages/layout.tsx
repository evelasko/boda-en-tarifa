'use client';

import { usePathname } from 'next/navigation';
import { ConversationListPanel } from '@/components/admin/bot/ConversationListPanel';

function activePhoneFromPath(pathname: string): string | undefined {
  const prefix = '/admin/bot/messages/';
  if (!pathname.startsWith(prefix)) return undefined;
  const rest = pathname.slice(prefix.length);
  if (!rest || rest.includes('/')) return undefined;
  return decodeURIComponent(rest);
}

export default function ConversationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activePhone = activePhoneFromPath(pathname);

  return (
    <div className="space-y-3">
      <p className="text-sm text-charcoal/60">
        Hilos de WhatsApp con Thora. Solo lectura — para responder usa{' '}
        <a href="/admin/bot/escalations" className="text-ocean hover:underline">
          Escalaciones
        </a>
        .
      </p>

      <div
        className="
          flex flex-col lg:flex-row
          h-[calc(100dvh-14rem)] min-h-[32rem] max-h-[56rem]
          bg-white rounded-lg border border-charcoal/10 overflow-hidden
        "
      >
        <div
          className={`
            w-full lg:w-80 xl:w-96 shrink-0 min-h-0 border-b lg:border-b-0
            ${activePhone ? 'hidden lg:flex lg:flex-col' : 'flex flex-col h-[min(50dvh,28rem)] lg:h-full'}
          `}
        >
          <ConversationListPanel activePhone={activePhone} />
        </div>
        <div
          className={`
            flex-1 min-h-0 min-w-0 flex flex-col
            ${activePhone ? '' : 'hidden lg:flex'}
          `}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
