'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy, Loader2, MessageCircle, Send } from 'lucide-react';

interface MagicLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestName: string;
  magicLinkUrl: string | null;
  whatsappShareUrl: string | null;
  smsShareUrl: string | null;
  loading: boolean;
  error: string | null;
}

export default function MagicLinkModal({
  open,
  onOpenChange,
  guestName,
  magicLinkUrl,
  whatsappShareUrl,
  smsShareUrl,
  loading,
  error,
}: MagicLinkModalProps) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard() {
    if (!magicLinkUrl) return;
    try {
      await navigator.clipboard.writeText(magicLinkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = magicLinkUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Magic Link — {guestName}</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-ocean mx-auto mb-3" />
            <p className="text-charcoal/60">Generando magic link...</p>
          </div>
        )}

        {error && (
          <div className="py-6 text-center">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {magicLinkUrl && !loading && (
          <div className="space-y-4">
            <p className="text-sm text-charcoal/70">
              Enlace de acceso directo para <strong>{guestName}</strong>. Este token
              es temporal — genera uno nuevo si expira.
            </p>

            <div className="flex gap-2">
              <Input
                readOnly
                value={magicLinkUrl}
                className="font-mono text-xs"
                onFocus={(e) => e.target.select()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-sage" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {copied && (
              <p className="text-xs text-sage font-medium">Copiado al portapapeles</p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!whatsappShareUrl}
                asChild={Boolean(whatsappShareUrl)}
              >
                {whatsappShareUrl ? (
                  <a href={whatsappShareUrl} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-1.5 h-4 w-4" />
                    Compartir por WhatsApp
                  </a>
                ) : (
                  <span>
                    <MessageCircle className="mr-1.5 h-4 w-4 inline-block" />
                    WhatsApp no disponible
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!smsShareUrl}
                asChild={Boolean(smsShareUrl)}
              >
                {smsShareUrl ? (
                  <a href={smsShareUrl}>
                    <Send className="mr-1.5 h-4 w-4" />
                    Enviar por SMS
                  </a>
                ) : (
                  <span>
                    <Send className="mr-1.5 h-4 w-4 inline-block" />
                    SMS no disponible
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
