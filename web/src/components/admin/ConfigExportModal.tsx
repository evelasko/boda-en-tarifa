'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, Download, ExternalLink, Loader2 } from 'lucide-react';

interface ConfigExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fetchExport: () => Promise<Record<string, string>>;
}

export default function ConfigExportModal({
  open,
  onOpenChange,
  fetchExport,
}: ConfigExportModalProps) {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (!open) {
      setData(null);
      setError(null);
      setCopied(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const exportData = await fetchExport();
        if (!cancelled) {
          setData(JSON.stringify(exportData, null, 2));
        }
      } catch {
        if (!cancelled) setError('Error al cargar la exportación');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [open, fetchExport]);

  useEffect(() => {
    if (data && codeRef.current) {
      codeRef.current.innerHTML = Prism.highlight(data, Prism.languages.json, 'json');
    }
  }, [data]);

  const handleCopy = useCallback(async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [data]);

  const handleDownload = useCallback(() => {
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `remote-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Exportar para Firebase Remote Config</DialogTitle>
          <DialogDescription>
            Copia este JSON y pégalo en la{' '}
            <a
              href="https://console.firebase.google.com/project/_/config"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ocean underline underline-offset-2 inline-flex items-center gap-1"
            >
              Consola de Firebase <ExternalLink className="h-3 w-3" />
            </a>
            , sección Remote Config.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-ocean" />
          </div>
        )}

        {error && (
          <div className="text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {data && (
          <>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="mr-1.5 h-3.5 w-3.5 text-sage" />
                ) : (
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                )}
                {copied ? 'Copiado' : 'Copiar al portapapeles'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Descargar JSON
              </Button>
            </div>

            <div className="rounded-lg border border-charcoal/10 bg-charcoal/2 overflow-auto flex-1 min-h-0">
              <pre
                ref={codeRef}
                className="p-4 text-[13px] leading-relaxed whitespace-pre"
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                }}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
