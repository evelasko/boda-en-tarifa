import { WeddingContent } from '@/types/content';
import contentData from '@/content/wedding-content.json';

export function getWeddingContent(): WeddingContent {
  // Type assertion is needed because JSON imports don't preserve literal types
  return contentData as WeddingContent;
}