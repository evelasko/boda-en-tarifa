'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { cloudinaryUrl } from '@/lib/cloudinary';
import type { SeatingPayload } from '@/types/time-gated';

interface SeatingUploaderProps {
  payload: SeatingPayload;
  onUpload: (file: File) => Promise<void>;
  onClearImage: () => Promise<void>;
  uploading: boolean;
}

export default function SeatingUploader({
  payload,
  onUpload,
  onClearImage,
  uploading,
}: SeatingUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasImage = !!payload.imagePublicId;

  function handleFileChange(file: File | undefined) {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) return;
    if (file.size > 10 * 1024 * 1024) return;
    onUpload(file);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-ocean" />
        <h3 className="type-body-base font-semibold text-charcoal">Imagen del plano de mesas</h3>
      </div>

      {hasImage ? (
        <div className="space-y-3">
          <div className="relative rounded-lg border border-charcoal/10 overflow-hidden bg-charcoal/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cloudinaryUrl(payload.imagePublicId!, 800)}
              alt="Plano de mesas"
              className="w-full max-h-96 object-contain"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-4 w-4" />
              )}
              Reemplazar imagen
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={onClearImage}
              disabled={uploading}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Eliminar
            </Button>
          </div>
          <p className="type-body-small text-charcoal/40">
            ID: {payload.imagePublicId}
          </p>
        </div>
      ) : (
        <div
          className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragOver ? 'border-ocean bg-ocean/5' : 'border-charcoal/20 hover:border-charcoal/40'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFileChange(e.dataTransfer.files[0]);
          }}
        >
          <Upload className="mx-auto h-8 w-8 text-charcoal/30 mb-3" />
          <p className="type-body-base text-charcoal/60 mb-1">
            Arrastra una imagen aquí o haz clic para seleccionar
          </p>
          <p className="type-body-small text-charcoal/40">
            JPG, PNG o WebP — máximo 10 MB
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-1.5 h-4 w-4" />
            )}
            {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files?.[0])}
      />

      {hasImage && (
        <p className="type-body-small text-charcoal/50">
          Vista previa:{' '}
          <a
            href={cloudinaryUrl(payload.imagePublicId!)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-ocean"
          >
            ver imagen completa
          </a>
        </p>
      )}
    </div>
  );
}
