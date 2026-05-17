/**
 * Pure-logic tests for `validateLayout` and `tableNumberByName`.
 *
 * These do not import the server-only `seating-layout` module directly —
 * doing so would pull in `firebase-admin` initialization. Instead we test
 * the small pure pieces by re-importing from a path that bypasses
 * `server-only`: jest resolves the module the same way Next does, but the
 * `server-only` marker has no runtime side-effect outside a server bundle.
 */

import {
  validateLayout,
  tableNumberByName,
  SeatingLayoutValidationError,
  CANONICAL_SEED,
} from '../seating-layout';
import type { SeatingLayout } from '@/types/seating-layout';

describe('validateLayout', () => {
  it('accepts the canonical seed', () => {
    expect(() => validateLayout(CANONICAL_SEED)).not.toThrow();
  });

  it('rejects a duplicate table number across rows', () => {
    const bad = {
      ...CANONICAL_SEED,
      rows: [
        [2, 1, 3],
        [4, 6, 10, 7],
        [5, 8, 9, 1],
      ],
      names: { ...CANONICAL_SEED.names },
    };
    expect(() => validateLayout(bad)).toThrow(SeatingLayoutValidationError);
  });

  it('rejects when names keys do not match rows numbers', () => {
    const bad = {
      ...CANONICAL_SEED,
      names: { ...CANONICAL_SEED.names, '11': 'Extra' },
    };
    expect(() => validateLayout(bad)).toThrow(SeatingLayoutValidationError);
  });

  it('rejects when a name is empty', () => {
    const bad = {
      ...CANONICAL_SEED,
      names: { ...CANONICAL_SEED.names, '1': '   ' },
    };
    expect(() => validateLayout(bad)).toThrow(SeatingLayoutValidationError);
  });

  it('rejects maxSeats out of range', () => {
    expect(() => validateLayout({ ...CANONICAL_SEED, maxSeats: 0 })).toThrow();
    expect(() => validateLayout({ ...CANONICAL_SEED, maxSeats: 21 })).toThrow();
    expect(() =>
      validateLayout({ ...CANONICAL_SEED, maxSeats: 4.5 }),
    ).toThrow();
  });

  it('rejects an empty rows array', () => {
    const bad = { ...CANONICAL_SEED, rows: [] as number[][], names: {} };
    expect(() => validateLayout(bad)).toThrow();
  });

  it('rejects a non-integer table number', () => {
    const bad = {
      ...CANONICAL_SEED,
      rows: [[2.5, 1, 3], [4, 6, 10, 7], [5, 8, 9]],
    };
    expect(() => validateLayout(bad)).toThrow();
  });

  it('returns all problems in `details`', () => {
    const bad = {
      rows: [[1, 1]],
      names: { '2': 'X' },
      maxSeats: 999,
    };
    try {
      validateLayout(bad);
      throw new Error('expected validation to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(SeatingLayoutValidationError);
      const e = err as SeatingLayoutValidationError;
      expect(e.details.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('tableNumberByName', () => {
  const layout: Pick<SeatingLayout, 'names'> = {
    names: CANONICAL_SEED.names,
  };

  it('resolves an exact name match', () => {
    expect(tableNumberByName(layout, 'Valdevaqueros')).toBe(1);
  });

  it('is case-insensitive and trims whitespace', () => {
    expect(tableNumberByName(layout, '  valdevaqueros  ')).toBe(1);
    expect(tableNumberByName(layout, 'PUNTA PALOMA')).toBe(2);
  });

  it('returns null for an unknown name', () => {
    expect(tableNumberByName(layout, 'Tarifa Beach')).toBeNull();
  });

  it('returns null for empty or whitespace input', () => {
    expect(tableNumberByName(layout, '')).toBeNull();
    expect(tableNumberByName(layout, '   ')).toBeNull();
  });

  it('resolves a numeric string to the table number (production sheet form)', () => {
    expect(tableNumberByName(layout, '1')).toBe(1);
    expect(tableNumberByName(layout, '10')).toBe(10);
    expect(tableNumberByName(layout, '  7  ')).toBe(7);
  });

  it('returns null for a numeric string outside the layout', () => {
    expect(tableNumberByName(layout, '99')).toBeNull();
    expect(tableNumberByName(layout, '0')).toBeNull();
  });
});
