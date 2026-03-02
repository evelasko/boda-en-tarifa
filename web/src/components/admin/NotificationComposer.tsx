'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import NotificationPreview from './NotificationPreview';
import type { User } from 'firebase/auth';

const TITLE_MAX = 65;
const BODY_MAX = 240;

interface NotificationComposerProps {
  user: User;
  onSent: () => void;
}

export default function NotificationComposer({
  user,
  onSent,
}: NotificationComposerProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const titleValid = title.trim().length > 0 && title.length <= TITLE_MAX;
  const bodyValid = body.trim().length > 0 && body.length <= BODY_MAX;
  const canSend = titleValid && bodyValid && !sending;

  async function handleSend() {
    setConfirmOpen(false);
    setSending(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          deepLink: deepLink.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Error al enviar la notificación');
        return;
      }

      toast.success('Notificación enviada', {
        description: `FCM ID: ${data.fcmMessageId}`,
      });

      setTitle('');
      setBody('');
      setDeepLink('');
      onSent();
    } catch {
      toast.error('Error de red al enviar la notificación');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white rounded-lg border border-charcoal/10 p-6">
      <h2 className="type-heading-5 text-charcoal mb-4">
        Enviar notificación
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="notif-title">
              Título{' '}
              <span className="text-charcoal/40 font-normal">
                ({title.length}/{TITLE_MAX})
              </span>
            </Label>
            <Input
              id="notif-title"
              placeholder="Ej: Cambio de planes"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
              maxLength={TITLE_MAX}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notif-body">
              Mensaje{' '}
              <span className="text-charcoal/40 font-normal">
                ({body.length}/{BODY_MAX})
              </span>
            </Label>
            <Textarea
              id="notif-body"
              placeholder="Ej: Nos movemos a Tumbao por el viento. Ven cuando quieras."
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
              maxLength={BODY_MAX}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notif-deeplink">
              Deep Link{' '}
              <span className="text-charcoal/40 font-normal">(opcional)</span>
            </Label>
            <Input
              id="notif-deeplink"
              placeholder="Ej: /itinerary/map"
              value={deepLink}
              onChange={(e) => setDeepLink(e.target.value)}
            />
            <p className="text-xs text-charcoal/40">
              URI de la app (GoRouter): /home, /community, /itinerary/map
            </p>
          </div>

          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={!canSend}
            className="w-full sm:w-auto"
          >
            {sending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-4 w-4" />
            )}
            Enviar notificación
          </Button>
        </div>

        {/* Preview */}
        <div>
          <p className="type-body-small text-charcoal/50 mb-3">Vista previa</p>
          <NotificationPreview title={title} body={body} />
        </div>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Enviar notificación?</DialogTitle>
            <DialogDescription>
              Se enviará a todos los invitados suscritos al topic{' '}
              <code className="bg-charcoal/5 px-1 rounded text-xs">wedding</code>.
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <NotificationPreview title={title} body={body} />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSend}>
              <Send className="mr-1.5 h-4 w-4" />
              Confirmar envío
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
