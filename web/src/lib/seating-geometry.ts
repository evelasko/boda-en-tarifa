/**
 * Seat positioning math for the round-table diagram.
 *
 * Conventions:
 * - Compass angles: 0° = top (N), 90° = right (E), 180° = bottom (S),
 *   270° = left (W). Clockwise.
 * - Seat 1 is always at 315° (NW). Subsequent seats step clockwise by
 *   `360°/totalSeats`.
 * - `totalSeats` is the count of ASSIGNED seats at a table — empty seats
 *   are not drawn.
 * - SVG y-axis points down, so the conversion uses (sin, −cos), not the
 *   standard (cos, sin).
 */

export type SeatSide = 'top' | 'right' | 'bottom' | 'left';

export function seatAngleDegrees(seatNumber: number, totalSeats: number): number {
  if (totalSeats <= 0) {
    throw new Error('seatAngleDegrees: totalSeats must be >= 1');
  }
  if (seatNumber < 1 || seatNumber > totalSeats) {
    throw new Error(
      `seatAngleDegrees: seatNumber ${seatNumber} out of range for totalSeats ${totalSeats}`,
    );
  }
  const step = 360 / totalSeats;
  const raw = 315 + (seatNumber - 1) * step;
  return ((raw % 360) + 360) % 360;
}

export function compassToSvg(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

/**
 * Outward unit vector from table centre in SVG space at the given compass angle.
 * Multiply by a scalar to offset labels along the radial line.
 */
export function outwardUnitVector(angleDeg: number): { dx: number; dy: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { dx: Math.sin(rad), dy: -Math.cos(rad) };
}

/**
 * Which side of the table the seat sits on. Used to drive text-anchor and the
 * direction in which the seat label flows.
 *
 * Buckets (compass, clockwise):
 *   top    [315, 360) ∪ [0, 45)
 *   right  [45, 135)
 *   bottom [135, 225)
 *   left   [225, 315)
 */
export function seatSide(angleDeg: number): SeatSide {
  const a = ((angleDeg % 360) + 360) % 360;
  if (a >= 45 && a < 135) return 'right';
  if (a >= 135 && a < 225) return 'bottom';
  if (a >= 225 && a < 315) return 'left';
  return 'top';
}

/**
 * Convenience: the full ordered list of compass angles for a table with
 * `totalSeats` seats. Useful for tests and rendering.
 */
export function seatAnglesForTable(totalSeats: number): number[] {
  const out: number[] = [];
  for (let i = 1; i <= totalSeats; i++) {
    out.push(seatAngleDegrees(i, totalSeats));
  }
  return out;
}
