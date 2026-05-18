import {
  buildAdminRsvpResponsePatch,
  validateAdminRsvpEditablePatch,
} from '../admin-rsvp-update';

describe('admin-rsvp-update', () => {
  const existing = {
    attendance: 'yes',
    displayName: 'Ana',
    dietaryRestrictions: 'Sin gluten',
    mainCoursePreference: 'fish',
    roomSharing: 'Con María',
    nightsStaying: ['friday'],
  };

  it('validateAdminRsvpEditablePatch rejects invalid main course', () => {
    const errors = validateAdminRsvpEditablePatch({
      mainCoursePreference: 'pasta',
    } as Parameters<typeof validateAdminRsvpEditablePatch>[0]);
    expect(errors.mainCoursePreference).toBeTruthy();
  });

  it('validateAdminRsvpEditablePatch accepts valid main course', () => {
    const errors = validateAdminRsvpEditablePatch({
      mainCoursePreference: 'vegetarian',
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('buildAdminRsvpResponsePatch preserves unrelated keys', () => {
    const merged = buildAdminRsvpResponsePatch(existing, {
      mainCoursePreference: 'meat',
    });
    expect(merged.attendance).toBe('yes');
    expect(merged.displayName).toBe('Ana');
    expect(merged.nightsStaying).toEqual(['friday']);
    expect(merged.mainCoursePreference).toBe('meat');
    expect(merged.dietaryRestrictions).toBe('Sin gluten');
  });

  it('buildAdminRsvpResponsePatch removes dietary when null', () => {
    const merged = buildAdminRsvpResponsePatch(existing, {
      mainCoursePreference: 'fish',
      dietaryRestrictions: null,
    });
    expect(merged).not.toHaveProperty('dietaryRestrictions');
  });

  it('buildAdminRsvpResponsePatch removes dietary when empty string', () => {
    const merged = buildAdminRsvpResponsePatch(existing, {
      mainCoursePreference: 'fish',
      dietaryRestrictions: '   ',
    });
    expect(merged).not.toHaveProperty('dietaryRestrictions');
  });

  it('buildAdminRsvpResponsePatch sets dietary text', () => {
    const merged = buildAdminRsvpResponsePatch(
      { ...existing, dietaryRestrictions: undefined },
      {
        mainCoursePreference: 'fish',
        dietaryRestrictions: '  Vegano  ',
      }
    );
    expect(merged.dietaryRestrictions).toBe('Vegano');
  });

  it('buildAdminRsvpResponsePatch updates room and brunch', () => {
    const merged = buildAdminRsvpResponsePatch(existing, {
      mainCoursePreference: 'fish',
      roomSharing: ' Individual ',
      sundayBrunch: true,
    });
    expect(merged.roomSharing).toBe('Individual');
    expect(merged.sundayBrunch).toBe(true);
  });
});
