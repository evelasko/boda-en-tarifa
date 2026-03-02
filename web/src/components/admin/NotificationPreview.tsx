'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface NotificationPreviewProps {
  title: string;
  body: string;
}

function IOSPreview({ title, body }: NotificationPreviewProps) {
  return (
    <div className="mx-auto max-w-[320px]">
      <div className="rounded-2xl bg-white/95 shadow-lg backdrop-blur-sm border border-charcoal/5 p-3">
        <div className="flex items-start gap-2.5">
          <div className="h-9 w-9 rounded-[10px] bg-linear-to-br from-coral to-coral/80 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">B</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[11px] font-semibold text-charcoal/90 uppercase tracking-wide">
                Boda en Tarifa
              </span>
              <span className="text-[10px] text-charcoal/40">ahora</span>
            </div>
            <p className="text-[13px] font-semibold text-charcoal leading-tight truncate">
              {title || 'Título de la notificación'}
            </p>
            <p className="text-[12px] text-charcoal/70 leading-snug line-clamp-3 mt-0.5">
              {body || 'Cuerpo de la notificación'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AndroidPreview({ title, body }: NotificationPreviewProps) {
  return (
    <div className="mx-auto max-w-[320px]">
      <div className="rounded-xl bg-[#2b2d31] shadow-lg p-3">
        <div className="flex items-start gap-2.5">
          <div className="h-6 w-6 rounded-full bg-coral/90 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-white text-[9px] font-bold">B</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] text-white/60">Boda en Tarifa</span>
              <span className="text-[10px] text-white/30">· ahora</span>
            </div>
            <p className="text-[13px] font-medium text-white leading-tight truncate">
              {title || 'Título de la notificación'}
            </p>
            <p className="text-[12px] text-white/60 leading-snug line-clamp-3 mt-0.5">
              {body || 'Cuerpo de la notificación'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationPreview({
  title,
  body,
}: NotificationPreviewProps) {
  return (
    <Tabs defaultValue="ios" className="w-full">
      <TabsList className="bg-charcoal/5 rounded-lg">
        <TabsTrigger
          value="ios"
          className="data-[state=active]:bg-white data-[state=active]:text-charcoal text-charcoal/60"
        >
          iOS
        </TabsTrigger>
        <TabsTrigger
          value="android"
          className="data-[state=active]:bg-white data-[state=active]:text-charcoal text-charcoal/60"
        >
          Android
        </TabsTrigger>
      </TabsList>
      <TabsContent value="ios" className="mt-4">
        <IOSPreview title={title} body={body} />
      </TabsContent>
      <TabsContent value="android" className="mt-4">
        <div className="bg-charcoal/5 rounded-xl p-4">
          <AndroidPreview title={title} body={body} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
