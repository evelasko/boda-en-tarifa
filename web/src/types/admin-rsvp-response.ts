import type {
  AttendanceStatus,
  MainCoursePreference,
  NightOption,
  RsvpGuestLinkSource,
  RsvpSubmissionSource,
} from '@/types/rsvp';

export type AdminRsvpLinkBucket = 'linked' | 'auto_match' | 'needs_review';

export type AdminRsvpGuestSummary = {
  uid: string;
  fullName: string;
  email: string;
};

export type AdminRsvpResponseRow = {
  rsvpUid: string;
  userEmail: string;
  displayName: string;
  attendance: AttendanceStatus | null;
  isSubmitted: boolean;
  lastUpdatedAt: string;
  submittedAt: string | null;
  linkStatus: AdminRsvpLinkBucket;
  linkedGuestUid: string | null;
  linkSource: RsvpGuestLinkSource | null;
  linkNotes: string | null;
  suggestedGuest: AdminRsvpGuestSummary | null;
  linkedGuest: AdminRsvpGuestSummary | null;
};

export type AdminRsvpListResponse = {
  rows: AdminRsvpResponseRow[];
  counts: {
    all: number;
    linked: number;
    auto_match: number;
    needs_review: number;
  };
};

export type AdminRsvpDetailRow = AdminRsvpResponseRow & {
  mainCoursePreference: MainCoursePreference | null;
  dietaryRestrictions: string;
  nightsStaying: NightOption[];
  otherNightsCombination: string | null;
  roomSharing: string;
  source: RsvpSubmissionSource | null;
};

export type AdminRsvpDetailListResponse = {
  rows: AdminRsvpDetailRow[];
  counts: {
    all: number;
    submitted: number;
    draft: number;
    linked: number;
  };
};
