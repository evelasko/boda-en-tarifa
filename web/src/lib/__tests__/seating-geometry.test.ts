import {
  seatAngleDegrees,
  seatAnglesForTable,
  compassToSvg,
  outwardUnitVector,
  seatSide,
} from '../seating-geometry';

const TWO_PI_EPS = 1e-9;

function approx(actual: number, expected: number, eps = 1e-9) {
  expect(Math.abs(actual - expected)).toBeLessThan(eps);
}

describe('seatAngleDegrees', () => {
  it('places seat 1 at 315° regardless of table size', () => {
    for (const total of [1, 2, 3, 4, 6, 8, 10, 12, 20]) {
      expect(seatAngleDegrees(1, total)).toBe(315);
    }
  });

  it('matches the spec example for 8 seats', () => {
    expect(seatAnglesForTable(8)).toEqual([315, 0, 45, 90, 135, 180, 225, 270]);
  });

  it('matches the spec example for 3 seats', () => {
    expect(seatAnglesForTable(3)).toEqual([315, 75, 195]);
  });

  it('matches the spec example for 12 seats', () => {
    expect(seatAnglesForTable(12)).toEqual([
      315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285,
    ]);
  });

  it('matches the spec example for 1 seat', () => {
    expect(seatAnglesForTable(1)).toEqual([315]);
  });

  it('produces angles in [0, 360)', () => {
    for (const total of [1, 2, 3, 4, 5, 7, 8, 9, 12]) {
      for (let i = 1; i <= total; i++) {
        const a = seatAngleDegrees(i, total);
        expect(a).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThan(360);
      }
    }
  });

  it('throws for invalid inputs', () => {
    expect(() => seatAngleDegrees(0, 8)).toThrow();
    expect(() => seatAngleDegrees(9, 8)).toThrow();
    expect(() => seatAngleDegrees(1, 0)).toThrow();
  });
});

describe('compassToSvg', () => {
  it('puts 0° (top/N) directly above the centre', () => {
    const { x, y } = compassToSvg(100, 100, 50, 0);
    approx(x, 100);
    approx(y, 50);
  });

  it('puts 90° (right/E) directly to the right of the centre', () => {
    const { x, y } = compassToSvg(100, 100, 50, 90);
    approx(x, 150);
    approx(y, 100);
  });

  it('puts 180° (bottom/S) directly below the centre', () => {
    const { x, y } = compassToSvg(100, 100, 50, 180);
    approx(x, 100);
    approx(y, 150);
  });

  it('puts 270° (left/W) directly to the left of the centre', () => {
    const { x, y } = compassToSvg(100, 100, 50, 270);
    approx(x, 50);
    approx(y, 100);
  });

  it('puts 315° (NW) up-left of the centre', () => {
    const { x, y } = compassToSvg(100, 100, 50, 315);
    const r = 50 / Math.SQRT2;
    approx(x, 100 - r);
    approx(y, 100 - r);
  });
});

describe('outwardUnitVector', () => {
  it('returns a unit vector pointing outward at compass angle', () => {
    const top = outwardUnitVector(0);
    approx(top.dx, 0);
    approx(top.dy, -1);

    const right = outwardUnitVector(90);
    approx(right.dx, 1);
    approx(right.dy, 0);

    const bottom = outwardUnitVector(180);
    approx(bottom.dx, 0);
    approx(bottom.dy, 1);

    const left = outwardUnitVector(270);
    approx(left.dx, -1);
    approx(left.dy, 0);
  });

  it('has unit length for arbitrary angles', () => {
    for (const a of [12, 75, 135, 240, 315, 359]) {
      const { dx, dy } = outwardUnitVector(a);
      approx(Math.hypot(dx, dy), 1, TWO_PI_EPS);
    }
  });
});

describe('seatSide', () => {
  it('classifies the four cardinal directions', () => {
    expect(seatSide(0)).toBe('top');
    expect(seatSide(90)).toBe('right');
    expect(seatSide(180)).toBe('bottom');
    expect(seatSide(270)).toBe('left');
  });

  it('treats 315° (seat 1 NW) as top', () => {
    expect(seatSide(315)).toBe('top');
  });

  it('uses half-open buckets at quadrant boundaries', () => {
    expect(seatSide(45)).toBe('right');
    expect(seatSide(135)).toBe('bottom');
    expect(seatSide(225)).toBe('left');
  });

  it('normalises angles outside [0, 360)', () => {
    expect(seatSide(360)).toBe('top');
    expect(seatSide(-90)).toBe('left');
    expect(seatSide(450)).toBe('right');
  });
});
