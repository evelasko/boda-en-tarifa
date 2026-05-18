import { splitGuestName } from '../seating-name';

describe('splitGuestName', () => {
  it('returns ["", ""] for empty input', () => {
    expect(splitGuestName('')).toEqual(['', '']);
    expect(splitGuestName('   ')).toEqual(['', '']);
  });

  it('returns a single uppercase line for a one-word name', () => {
    expect(splitGuestName('Madonna')).toEqual(['MADONNA', '']);
  });

  it('splits a two-word name: last word → line 2', () => {
    expect(splitGuestName('Juan Pérez')).toEqual(['JUAN', 'PÉREZ']);
  });

  it('preserves accented characters when uppercasing', () => {
    expect(splitGuestName('Noel Darío Sánchez')).toEqual([
      'NOEL DARÍO',
      'SÁNCHEZ',
    ]);
  });

  it('puts "Jr." with the preceding surname (period form)', () => {
    expect(splitGuestName('José Velasco Jr.')).toEqual(['JOSÉ', 'VELASCO JR.']);
  });

  it('puts "Jr" with the preceding surname (no period)', () => {
    expect(splitGuestName('José Velasco Jr')).toEqual(['JOSÉ', 'VELASCO JR']);
  });

  it('is case-insensitive on the Jr. tag', () => {
    expect(splitGuestName('José Velasco jr.')).toEqual(['JOSÉ', 'VELASCO JR.']);
  });

  it('handles long compound names — last word still wins', () => {
    expect(splitGuestName('María del Carmen García López')).toEqual([
      'MARÍA DEL CARMEN GARCÍA',
      'LÓPEZ',
    ]);
  });

  it('handles long compound names with Jr. suffix', () => {
    expect(splitGuestName('José Ángel Velasco Jr.')).toEqual([
      'JOSÉ ÁNGEL',
      'VELASCO JR.',
    ]);
  });

  it('falls back to one line when applying Jr. rule would empty line 1', () => {
    // "Foo Jr." → splitAt = 0 would yield line 1 = "" / line 2 = "FOO JR.".
    // We prefer one line over an empty leading line.
    expect(splitGuestName('Foo Jr.')).toEqual(['FOO JR.', '']);
  });

  it('collapses runs of internal whitespace', () => {
    expect(splitGuestName('  Juan   Pérez  ')).toEqual(['JUAN', 'PÉREZ']);
  });

  it('does NOT treat unrelated suffixes as Jr.', () => {
    // "III" is a roman suffix but the spec doesn't list it; it splits as
    // the normal last-word rule.
    expect(splitGuestName('John Smith III')).toEqual(['JOHN SMITH', 'III']);
  });
});
