import type { SeatingLayout, SeatingLayoutInput } from '@/types/seating-layout';

export const MAX_SEATS_LIMIT = 20;

export const CANONICAL_SEED: SeatingLayoutInput = {
  rows: [
    [2, 1, 3],
    [4, 6, 10, 7],
    [5, 8, 9],
  ],
  names: {
    '1': 'Valdevaqueros',
    '2': 'Punta Paloma',
    '3': 'Los Lances',
    '4': 'Palmones',
    '5': 'Caños de Meca',
    '6': 'Bolonia',
    '7': 'Getares',
    '8': 'Arte y Vida',
    '9': 'El Palmar',
    '10': 'Zahara',
  },
  maxSeats: 12,
};

export class SeatingLayoutValidationError extends Error {
  details: string[];
  constructor(details: string[]) {
    super(details[0] ?? 'Layout inválido');
    this.name = 'SeatingLayoutValidationError';
    this.details = details;
  }
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * Validates the structural invariants of a SeatingLayoutInput. Throws
 * SeatingLayoutValidationError with a list of all problems found.
 */
export function validateLayout(
  input: unknown,
): asserts input is SeatingLayoutInput {
  const errors: string[] = [];

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new SeatingLayoutValidationError(['El payload debe ser un objeto.']);
  }

  const candidate = input as Record<string, unknown>;
  const { rows, names, maxSeats } = candidate;

  if (!Array.isArray(rows) || rows.length === 0) {
    errors.push('"rows" debe ser un array no vacío de filas.');
  }

  const tableNumbers: number[] = [];
  if (Array.isArray(rows)) {
    rows.forEach((row, rowIdx) => {
      if (!Array.isArray(row) || row.length === 0) {
        errors.push(`La fila ${rowIdx + 1} debe ser un array no vacío.`);
        return;
      }
      row.forEach((cell, cellIdx) => {
        if (!isPositiveInteger(cell)) {
          errors.push(
            `Fila ${rowIdx + 1}, posición ${cellIdx + 1}: debe ser un entero positivo.`,
          );
          return;
        }
        tableNumbers.push(cell);
      });
    });
  }

  const seen = new Set<number>();
  const dupes = new Set<number>();
  for (const n of tableNumbers) {
    if (seen.has(n)) dupes.add(n);
    seen.add(n);
  }
  if (dupes.size > 0) {
    errors.push(
      `Números de mesa duplicados: ${[...dupes].sort((a, b) => a - b).join(', ')}.`,
    );
  }

  if (!names || typeof names !== 'object' || Array.isArray(names)) {
    errors.push('"names" debe ser un objeto con claves numéricas.');
  } else {
    const nameKeys = Object.keys(names as Record<string, unknown>);
    const expectedKeys = [...seen].map((n) => String(n)).sort();
    const sortedKeys = [...nameKeys].sort();
    if (expectedKeys.join(',') !== sortedKeys.join(',')) {
      errors.push(
        `Las claves de "names" no coinciden con los números en "rows" (esperado: [${expectedKeys.join(', ')}], recibido: [${sortedKeys.join(', ')}]).`,
      );
    }
    for (const [key, value] of Object.entries(names as Record<string, unknown>)) {
      if (typeof value !== 'string' || value.trim().length === 0) {
        errors.push(`Nombre de mesa "${key}" no puede estar vacío.`);
      }
    }
  }

  if (
    typeof maxSeats !== 'number' ||
    !Number.isInteger(maxSeats) ||
    maxSeats < 1 ||
    maxSeats > MAX_SEATS_LIMIT
  ) {
    errors.push(`"maxSeats" debe ser un entero entre 1 y ${MAX_SEATS_LIMIT}.`);
  }

  if (errors.length > 0) {
    throw new SeatingLayoutValidationError(errors);
  }
}

/**
 * Resolves a raw `seating.tableName` value to a numeric table identifier in
 * the layout. Accepts either:
 *   - a numeric string ("1", "10") — checked first; returns the integer if
 *     it appears as a key in `layout.names`.
 *   - a case-insensitive, trimmed table name ("Valdevaqueros") — falls back
 *     to a reverse lookup against `layout.names` values.
 *
 * Returns `null` if neither form matches. The dual behaviour reflects the
 * current production data: the sheet (and therefore the existing
 * `seating/{guestUid}` docs) stores table numbers as strings, while future
 * direct writes may use the human-readable name.
 */
export function tableNumberByName(
  layout: Pick<SeatingLayout, 'names'>,
  raw: string,
): number | null {
  const needle = (raw ?? '').trim();
  if (!needle) return null;

  // Numeric form first — deterministic when a name happens to be all digits.
  if (/^\d+$/.test(needle)) {
    const n = Number(needle);
    if (Number.isInteger(n) && n > 0 && Object.prototype.hasOwnProperty.call(layout.names, String(n))) {
      return n;
    }
    return null;
  }

  const lowered = needle.toLowerCase();
  for (const [key, value] of Object.entries(layout.names)) {
    if (value.trim().toLowerCase() === lowered) {
      const n = Number(key);
      return Number.isFinite(n) ? n : null;
    }
  }
  return null;
}
