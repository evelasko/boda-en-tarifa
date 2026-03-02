'use client';

import { useState, useCallback, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import { Button } from '@/components/ui/button';
import {
  WrapText,
  Minimize2,
  RotateCcw,
  Check,
  AlertCircle,
  Copy,
} from 'lucide-react';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  readOnly?: boolean;
}

export default function JsonEditor({
  value,
  onChange,
  onSave,
  onCancel,
  saving = false,
  readOnly = false,
}: JsonEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [originalValue] = useState(value);

  const validate = useCallback((val: string): boolean => {
    if (!val.trim()) {
      setError(null);
      return true;
    }
    try {
      JSON.parse(val);
      setError(null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON inválido');
      return false;
    }
  }, []);

  useEffect(() => {
    if (value.trim()) validate(value);
  }, [value, validate]);

  const handlePrettyPrint = useCallback(() => {
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
    } catch {
      // keep current value if invalid
    }
  }, [value, onChange]);

  const handleMinify = useCallback(() => {
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed));
    } catch {
      // keep current value if invalid
    }
  }, [value, onChange]);

  const handleRevert = useCallback(() => {
    onChange(originalValue);
    setError(null);
  }, [originalValue, onChange]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  const handleSave = useCallback(() => {
    if (validate(value)) onSave();
  }, [value, validate, onSave]);

  const highlight = useCallback((code: string) => {
    return Prism.highlight(code, Prism.languages.json, 'json');
  }, []);

  const hasChanges = value !== originalValue;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePrettyPrint}
          disabled={!!error || readOnly}
        >
          <WrapText className="mr-1.5 h-3.5 w-3.5" />
          Formatear
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleMinify}
          disabled={!!error || readOnly}
        >
          <Minimize2 className="mr-1.5 h-3.5 w-3.5" />
          Minificar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="mr-1.5 h-3.5 w-3.5 text-sage" />
          ) : (
            <Copy className="mr-1.5 h-3.5 w-3.5" />
          )}
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
        {hasChanges && !readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRevert}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Revertir
          </Button>
        )}
      </div>

      <div
        className={`rounded-lg border overflow-auto max-h-[500px] ${
          error
            ? 'border-red-300 bg-red-50/30'
            : 'border-charcoal/10 bg-charcoal/2'
        }`}
      >
        <Editor
          value={value}
          onValueChange={readOnly ? () => {} : onChange}
          highlight={highlight}
          padding={16}
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '13px',
            lineHeight: '1.5',
            minHeight: '120px',
          }}
          textareaClassName="focus:outline-none"
          disabled={readOnly}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!readOnly && (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!!error || saving || !hasChanges}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      )}
    </div>
  );
}
