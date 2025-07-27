import { WeddingContent } from '@/types/content';
import contentData from '@/content/wedding-content.json';

export function getWeddingContent(): WeddingContent {
  // Type assertion is needed because JSON imports don't preserve literal types
  return contentData as WeddingContent;
}

export function getCurrentLocale(): 'en' | 'es' {
  // For now, default to English - will implement proper i18n later
  return 'en';
}