'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { CSVGuestRow, CSVValidationResult } from '@/types/guest';

const VALID_SIDES = ['novioA', 'novioB', 'ambos'];
const VALID_STATUSES = ['soltero', 'enPareja', 'buscando'];
const REQUIRED_HEADERS = ['fullName', 'email', 'side', 'relationToGrooms', 'relationshipStatus'];

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: Array<{ row: number; data: CSVGuestRow }>) => Promise<void>;
  existingEmails: Set<string>;
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',' || ch === ';') {
          result.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

export default function CSVImportModal({
  open,
  onOpenChange,
  onImport,
  existingEmails,
}: CSVImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload');
  const [validationResults, setValidationResults] = useState<CSVValidationResult[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const resetState = useCallback(() => {
    setStep('upload');
    setValidationResults([]);
    setImportError(null);
    setImportResult(null);
  }, []);

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) resetState();
    onOpenChange(newOpen);
  }

  function validateRows(headers: string[], rows: string[][]): CSVValidationResult[] {
    const headerMap: Record<string, number> = {};
    headers.forEach((h, i) => {
      headerMap[h.trim()] = i;
    });

    const missing = REQUIRED_HEADERS.filter((h) => !(h in headerMap));
    if (missing.length > 0) {
      setImportError(`Columnas faltantes: ${missing.join(', ')}. Las columnas requeridas son: ${REQUIRED_HEADERS.join(', ')}`);
      return [];
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const seenEmails = new Set<string>();

    return rows.map((cols, idx) => {
      const data: CSVGuestRow = {
        fullName: cols[headerMap['fullName']] || '',
        email: cols[headerMap['email']] || '',
        side: cols[headerMap['side']] || '',
        relationToGrooms: cols[headerMap['relationToGrooms']] || '',
        relationshipStatus: cols[headerMap['relationshipStatus']] || '',
      };

      const errors: string[] = [];
      if (!data.fullName.trim()) errors.push('Nombre vacío');
      if (!data.email.trim()) errors.push('Email vacío');
      else if (!emailRegex.test(data.email.trim())) errors.push('Email inválido');
      else {
        const lowerEmail = data.email.trim().toLowerCase();
        if (existingEmails.has(lowerEmail)) errors.push('Email ya registrado');
        if (seenEmails.has(lowerEmail)) errors.push('Email duplicado en CSV');
        seenEmails.add(lowerEmail);
      }
      if (!data.side.trim()) errors.push('Lado vacío');
      else if (!VALID_SIDES.includes(data.side.trim())) errors.push(`Lado inválido: ${data.side}`);
      if (!data.relationToGrooms.trim()) errors.push('Relación vacía');
      if (!data.relationshipStatus.trim()) errors.push('Estado vacío');
      else if (!VALID_STATUSES.includes(data.relationshipStatus.trim()))
        errors.push(`Estado inválido: ${data.relationshipStatus}`);

      return { row: idx + 2, data, valid: errors.length === 0, errors };
    });
  }

  function processFile(file: File) {
    setImportError(null);

    if (!file.name.endsWith('.csv') && !file.type.includes('csv') && !file.type.includes('text')) {
      setImportError('El archivo debe ser un CSV');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);

      if (rows.length === 0) {
        setImportError('El CSV está vacío o solo contiene encabezados');
        return;
      }

      const results = validateRows(headers, rows);
      if (results.length > 0) {
        setValidationResults(results);
        setStep('preview');
      }
    };
    reader.readAsText(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  async function handleImport() {
    const validRows = validationResults
      .filter((r) => r.valid)
      .map((r) => ({ row: r.row, data: r.data }));

    if (validRows.length === 0) return;

    setStep('importing');
    try {
      await onImport(validRows);
      setImportResult({ created: validRows.length, skipped: validationResults.length - validRows.length });
      setStep('done');
    } catch {
      setImportError('Error al importar. Inténtalo de nuevo.');
      setStep('preview');
    }
  }

  const validCount = validationResults.filter((r) => r.valid).length;
  const invalidCount = validationResults.filter((r) => !r.valid).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Invitados desde CSV</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver ? 'border-ocean bg-ocean/5' : 'border-charcoal/20'
              }`}
            >
              <Upload className="h-10 w-10 mx-auto text-charcoal/30 mb-3" />
              <p className="text-charcoal/70 mb-2">
                Arrastra un archivo CSV aquí o haz clic para seleccionar
              </p>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <Button variant="outline" asChild>
                <label htmlFor="csv-upload" className="cursor-pointer">
                  Seleccionar archivo
                </label>
              </Button>
            </div>

            {importError && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 rounded p-3 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            <div className="bg-cream/50 rounded p-4 text-sm text-charcoal/60">
              <p className="font-medium mb-1">Formato esperado del CSV:</p>
              <code className="block bg-white rounded p-2 text-xs font-mono border">
                fullName,email,side,relationToGrooms,relationshipStatus
                <br />
                Juan García,juan@email.com,novioA,Primo,soltero
              </code>
              <p className="mt-2">
                Valores válidos para <strong>side</strong>: novioA, novioB, ambos
                <br />
                Valores válidos para <strong>relationshipStatus</strong>: soltero, enPareja, buscando
              </p>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="default">{validCount} válidos</Badge>
              {invalidCount > 0 && (
                <Badge variant="destructive">{invalidCount} con errores</Badge>
              )}
            </div>

            {importError && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 rounded p-3 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            <div className="rounded-lg border border-charcoal/10 overflow-x-auto max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Fila</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Lado</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationResults.map((r) => (
                    <TableRow
                      key={r.row}
                      className={r.valid ? '' : 'bg-red-50/50'}
                    >
                      <TableCell className="font-mono text-xs">{r.row}</TableCell>
                      <TableCell className="text-sm">{r.data.fullName}</TableCell>
                      <TableCell className="text-sm">{r.data.email}</TableCell>
                      <TableCell className="text-sm">{r.data.side}</TableCell>
                      <TableCell>
                        {r.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-sage" />
                        ) : (
                          <span className="text-xs text-red-600">
                            {r.errors.join(', ')}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetState}>
                Volver
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Importar {validCount} invitado{validCount !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ocean mx-auto mb-4" />
            <p className="text-charcoal/70">Importando invitados...</p>
          </div>
        )}

        {step === 'done' && importResult && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-sage mx-auto" />
            <div>
              <p className="text-lg font-medium text-charcoal">Importación completada</p>
              <p className="text-charcoal/60 mt-1">
                {importResult.created} invitado{importResult.created !== 1 ? 's' : ''} creado{importResult.created !== 1 ? 's' : ''}
                {importResult.skipped > 0 && (
                  <>, {importResult.skipped} omitido{importResult.skipped !== 1 ? 's' : ''}</>
                )}
              </p>
            </div>
            <DialogFooter className="justify-center">
              <Button onClick={() => handleOpenChange(false)}>Cerrar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
