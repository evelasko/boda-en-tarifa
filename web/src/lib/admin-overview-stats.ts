import type { GuestSide, GuestWithRSVP, RelationshipStatus } from '@/types/guest';

export function parseGuestAge(age: number | string | undefined | null): number | null {
  if (age === undefined || age === null || age === '') return null;
  const raw = typeof age === 'number' ? age : String(age).trim().replace(',', '.');
  const n = typeof raw === 'number' ? raw : parseFloat(raw);
  if (!Number.isFinite(n) || n < 0 || n > 120) return null;
  return Math.round(n);
}

const AGE_BUCKETS: { key: string; label: string; min: number; max: number }[] = [
  { key: '0-17', label: '0–17', min: 0, max: 17 },
  { key: '18-29', label: '18–29', min: 18, max: 29 },
  { key: '30-39', label: '30–39', min: 30, max: 39 },
  { key: '40-49', label: '40–49', min: 40, max: 49 },
  { key: '50-64', label: '50–64', min: 50, max: 64 },
  { key: '65+', label: '65+', min: 65, max: 120 },
];

export type AgeBucketStat = { key: string; label: string; count: number; pctOfTotal: number };

export type AdminOverviewStats = {
  total: number;
  rsvp: {
    confirmed: number;
    pending: number;
    declined: number;
    maybe: number;
  };
  contactPending: number;
  profileClaimed: number;
  minors: number;
  directoryVisible: number;
  side: Record<GuestSide, { count: number; pctOfTotal: number }>;
  relationship: Record<RelationshipStatus, { count: number; pctOfTotal: number }>;
  ages: {
    withAgeCount: number;
    average: number | null;
    unknownCount: number;
    buckets: AgeBucketStat[];
  };
};

export function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

export function computeAdminOverviewStats(guests: GuestWithRSVP[]): AdminOverviewStats {
  const total = guests.length;

  const confirmed = guests.filter((g) => g.rsvpStatus === 'yes').length;
  const pending = guests.filter((g) => g.rsvpStatus === 'no_response').length;
  const declined = guests.filter((g) => g.rsvpStatus === 'no').length;
  const maybe = guests.filter((g) => g.rsvpStatus === 'maybe').length;

  const contactPending = guests.filter((g) => g.contactPending === true).length;
  const profileClaimed = guests.filter((g) => g.profileClaimed === true).length;
  const minors = guests.filter((g) => g.child === true).length;
  const directoryVisible = guests.filter((g) => g.isDirectoryVisible !== false).length;

  const sides: GuestSide[] = ['novioA', 'novioB', 'ambos'];
  const side = {} as AdminOverviewStats['side'];
  for (const s of sides) {
    const count = guests.filter((g) => g.side === s).length;
    side[s] = { count, pctOfTotal: pct(count, total) };
  }

  const relKeys: RelationshipStatus[] = ['soltero', 'enPareja', 'buscando'];
  const relationship = {} as AdminOverviewStats['relationship'];
  for (const r of relKeys) {
    const count = guests.filter((g) => g.relationshipStatus === r).length;
    relationship[r] = { count, pctOfTotal: pct(count, total) };
  }

  const numericAges: number[] = [];
  const bucketCounts = new Map<string, number>();
  for (const b of AGE_BUCKETS) bucketCounts.set(b.key, 0);

  let unknownCount = 0;
  for (const g of guests) {
    const a = parseGuestAge(g.age);
    if (a === null) {
      unknownCount += 1;
      continue;
    }
    numericAges.push(a);
    const bucket = AGE_BUCKETS.find((b) => a >= b.min && a <= b.max);
    if (bucket) {
      bucketCounts.set(bucket.key, (bucketCounts.get(bucket.key) ?? 0) + 1);
    } else {
      unknownCount += 1;
    }
  }

  const withAgeCount = numericAges.length;
  const average =
    withAgeCount > 0 ? Math.round((numericAges.reduce((s, n) => s + n, 0) / withAgeCount) * 10) / 10 : null;

  const buckets: AgeBucketStat[] = AGE_BUCKETS.map((b) => {
    const count = bucketCounts.get(b.key) ?? 0;
    return { key: b.key, label: b.label, count, pctOfTotal: pct(count, total) };
  });

  return {
    total,
    rsvp: { confirmed, pending, declined, maybe },
    contactPending,
    profileClaimed,
    minors,
    directoryVisible,
    side,
    relationship,
    ages: { withAgeCount, average, unknownCount, buckets },
  };
}
