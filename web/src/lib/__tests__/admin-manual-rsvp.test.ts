import {
  buildManualRsvpDocument,
  resolveExistingRsvpConflict,
} from '../admin-manual-rsvp';
import type { Guest } from '@/types/guest';

describe('admin manual RSVP helpers', () => {
  const guest: Guest = {
    uid: 'guest_001',
    email: 'guest@example.com',
    fullName: 'Invitado Demo',
    relationToGrooms: 'Amigo',
    relationshipStatus: 'soltero',
    side: 'ambos',
    profileClaimed: false,
    isDirectoryVisible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('applies expected defaults when optional RSVP fields are omitted', () => {
    const doc = buildManualRsvpDocument(
      guest.uid,
      guest,
      {
        displayName: 'Nombre RSVP',
        attendance: 'yes',
        nightsStaying: ['friday'],
        transportationNeeds: ['no_help'],
        mainCoursePreference: 'fish',
      },
      'admin_uid',
      {}
    );

    expect(doc.responses.accommodationManagement).toBe('no');
    expect(doc.responses.roomSharing).toBe('');
    expect(doc.responses.dietaryRestrictions).toBe('');
    expect(doc.userId).toBe(guest.uid);
    expect(doc.linkedGuestUid).toBe(guest.uid);
    expect(doc.linkSource).toBe('manual');
    expect(doc.source).toBe('manual');
    expect(doc.enteredByAdminUid).toBe('admin_uid');
    expect(doc.submittedAt).toBeDefined();
    expect(doc.lastUpdatedAt).toBeDefined();
  });

  it('keeps optional manual metadata when provided', () => {
    const doc = buildManualRsvpDocument(
      guest.uid,
      guest,
      {
        displayName: 'Nombre RSVP',
        attendance: 'no',
        nightsStaying: ['saturday'],
        transportationNeeds: ['not_sure'],
        mainCoursePreference: 'vegetarian',
      },
      'admin_uid',
      {
        notes: 'Datos transcritos por teléfono',
        proxySourceRsvpUid: 'proxy_123',
      }
    );

    expect(doc.linkNotes).toBe('Datos transcritos por teléfono');
    expect(doc.proxySourceRsvpUid).toBe('proxy_123');
  });

  it('resolves RSVP conflict precedence correctly', () => {
    expect(resolveExistingRsvpConflict(true, true)).toBe('doc');
    expect(resolveExistingRsvpConflict(true, false)).toBe('doc');
    expect(resolveExistingRsvpConflict(false, true)).toBe('linked');
    expect(resolveExistingRsvpConflict(false, false)).toBeNull();
  });
});
