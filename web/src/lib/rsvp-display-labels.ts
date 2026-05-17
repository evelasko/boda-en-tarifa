import type { MainCoursePreference, NightOption } from '@/types/rsvp';

export const NIGHT_OPTION_LABELS: Record<NightOption, string> = {
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
  other: 'Otra combinación',
};

export const NIGHT_OPTION_INITIALS: Record<NightOption, string> = {
  friday: 'V',
  saturday: 'S',
  sunday: 'D',
  other: 'O',
};

export const MAIN_COURSE_LABELS: Record<MainCoursePreference, string> = {
  fish: 'Pescado',
  meat: 'Carne',
  vegetarian: 'Vegetariano',
};

export const RSVP_SOURCE_LABELS = {
  web: 'Web',
  whatsapp: 'WhatsApp',
  manual: 'Manual',
} as const;

export function formatMainCourse(
  value: MainCoursePreference | null | undefined
): string {
  if (!value) return '—';
  return MAIN_COURSE_LABELS[value] ?? '—';
}

export function formatNightOptionsCompact(nights: NightOption[]): string {
  if (!nights.length) return '—';
  return nights.map((n) => NIGHT_OPTION_INITIALS[n] ?? n).join(', ');
}

export function formatNightOptionsFull(
  nights: NightOption[],
  otherNightsCombination?: string | null
): string {
  if (!nights.length && !otherNightsCombination?.trim()) return '—';
  const parts = nights.map((n) => NIGHT_OPTION_LABELS[n] ?? n);
  if (otherNightsCombination?.trim()) {
    parts.push(otherNightsCombination.trim());
  }
  return parts.join(' · ');
}
