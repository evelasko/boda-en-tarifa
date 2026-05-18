import {
  buildAdminRsvpDetailRows,
  filterAdminRsvpDetailRows,
} from '../admin-rsvp-detail';
import {
  formatNightOptionsCompact,
  formatNightOptionsFull,
  formatMainCourse,
} from '../rsvp-display-labels';

describe('admin RSVP detail helpers', () => {
  const guestSummaries = new Map([
    ['guest_1', { uid: 'guest_1', fullName: 'Ana García', email: 'ana@example.com' }],
  ]);
  const emailToGuestUids = new Map([['ana@example.com', ['guest_1']]]);

  const rsvpDocs = [
    {
      id: 'auth_uid_1',
      data: () => ({
        userEmail: 'ana@example.com',
        userDisplayName: 'Ana RSVP',
        isSubmitted: true,
        lastUpdatedAt: { toDate: () => new Date('2025-05-01T12:00:00Z') },
        submittedAt: { toDate: () => new Date('2025-05-01T12:00:00Z') },
        linkedGuestUid: 'guest_1',
        linkSource: 'manual',
        source: 'web',
        responses: {
          displayName: 'Ana RSVP',
          attendance: 'yes',
          mainCoursePreference: 'fish',
          dietaryRestrictions: 'Sin gluten',
          nightsStaying: ['friday', 'saturday'],
          roomSharing: 'Con María',
          sundayBrunch: true,
        },
      }),
    },
    {
      id: 'draft_uid',
      data: () => ({
        userEmail: 'draft@example.com',
        isSubmitted: false,
        lastUpdatedAt: { toDate: () => new Date('2025-05-02T12:00:00Z') },
        responses: {
          attendance: 'maybe',
          nightsStaying: ['sunday'],
        },
      }),
    },
  ];

  it('maps Firestore docs to detail rows with response fields', () => {
    const rows = buildAdminRsvpDetailRows(rsvpDocs, guestSummaries, emailToGuestUids);
    expect(rows).toHaveLength(2);

    const linked = rows.find((r) => r.rsvpUid === 'auth_uid_1');
    expect(linked?.mainCoursePreference).toBe('fish');
    expect(linked?.dietaryRestrictions).toBe('Sin gluten');
    expect(linked?.nightsStaying).toEqual(['friday', 'saturday']);
    expect(linked?.roomSharing).toBe('Con María');
    expect(linked?.sundayBrunch).toBe(true);
    expect(linked?.source).toBe('web');
    expect(linked?.linkedGuest?.fullName).toBe('Ana García');

    const draft = rows.find((r) => r.rsvpUid === 'draft_uid');
    expect(draft?.isSubmitted).toBe(false);
    expect(draft?.mainCoursePreference).toBeNull();
    expect(draft?.nightsStaying).toEqual(['sunday']);
    expect(draft?.sundayBrunch).toBeNull();
  });

  it('filterAdminRsvpDetailRows respects attendance and submitted filters', () => {
    const rows = buildAdminRsvpDetailRows(rsvpDocs, guestSummaries, emailToGuestUids);

    const yesOnly = filterAdminRsvpDetailRows(rows, { attendance: 'yes' });
    expect(yesOnly).toHaveLength(1);
    expect(yesOnly[0].rsvpUid).toBe('auth_uid_1');

    const drafts = filterAdminRsvpDetailRows(rows, { isSubmitted: 'false' });
    expect(drafts).toHaveLength(1);
    expect(drafts[0].rsvpUid).toBe('draft_uid');
  });

  it('filterAdminRsvpDetailRows searches dietary and room fields', () => {
    const rows = buildAdminRsvpDetailRows(rsvpDocs, guestSummaries, emailToGuestUids);
    const byDiet = filterAdminRsvpDetailRows(rows, { search: 'gluten' });
    expect(byDiet).toHaveLength(1);

    const byRoom = filterAdminRsvpDetailRows(rows, { search: 'maría' });
    expect(byRoom).toHaveLength(1);
  });
});

describe('rsvp display labels', () => {
  it('formatNightOptionsCompact uses initials', () => {
    expect(formatNightOptionsCompact(['friday', 'saturday'])).toBe('V, S');
    expect(formatNightOptionsCompact([])).toBe('—');
  });

  it('formatNightOptionsFull includes other nights text', () => {
    expect(
      formatNightOptionsFull(['other'], 'Lunes a miércoles')
    ).toContain('Otra combinación');
    expect(formatNightOptionsFull(['other'], 'Lunes a miércoles')).toContain('Lunes');
  });

  it('formatMainCourse returns Spanish labels', () => {
    expect(formatMainCourse('vegetarian')).toBe('Vegetariano');
    expect(formatMainCourse(null)).toBe('—');
  });
});
