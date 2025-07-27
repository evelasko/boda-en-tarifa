/**
 * Type definitions for wedding website content
 */

export interface LocalizedString {
  en: string;
  es: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
}

export interface Venue {
  name: string;
  address: string;
  coordinates: Coordinates;
  mapEmbed: string;
  mapUrl: string;
  website?: string;
  social?: SocialLinks;
}

export type EventType = 'welcome' | 'pre-wedding' | 'ceremony' | 'celebration' | 'post-wedding';
export type EventIcon = 'cocktail' | 'music' | 'rings' | 'party' | 'brunch';
export type EventColor = 'coral' | 'sage' | 'ocean' | 'gold' | 'sand';

export interface WeddingEvent {
  id: string;
  type: EventType;
  date: string;
  time: string;
  title: LocalizedString;
  description?: LocalizedString;
  venue: Venue;
  icon: EventIcon;
  color: EventColor;
}

export interface MetaContent {
  title: LocalizedString;
  description: LocalizedString;
  keywords: string[];
  ogImage: string;
}

export interface HeroContent {
  backgroundImage: string;
  greeting: LocalizedString;
  names: string;
  date: string;
  location: LocalizedString;
}

export interface DressCodeInfo {
  title: LocalizedString;
  weather: {
    en: string[];
    es: string[];
  };
  beReadyFor: {
    en: string[];
    es: string[];
  };
  suggestions: {
    en: string[];
    es: string[];
  };
}

export interface TravelRoute {
  name: LocalizedString;
  time: string;
  distance: string;
  tolls: string | LocalizedString;
  mapUrl: string;
}

export interface TravelOption {
  destination?: string;
  airport?: string;
  details: LocalizedString;
}

export interface TravelInfo {
  title: LocalizedString;
  fromMadrid: {
    byCar: {
      title: LocalizedString;
      routes: TravelRoute[];
      carPooling: LocalizedString;
    };
    byTrain: {
      title: LocalizedString;
      options: TravelOption[];
    };
    byAir: {
      title: LocalizedString;
      options: TravelOption[];
    };
  };
  inTarifa: {
    title: LocalizedString;
    beachAccess: LocalizedString;
    tourism: LocalizedString;
    busSchedule: {
      text: LocalizedString;
      link: string;
    };
  };
}

export type AccommodationType = 'hotel' | 'glamping';

export interface Accommodation {
  id: string;
  name: string;
  type: AccommodationType;
  featured?: boolean;
  description: LocalizedString;
  pricing?: {
    double?: string;
    single?: string;
    thirdNight?: string;
    status?: LocalizedString;
  };
  website: string;
  bookingLinks?: string[];
  image: string;
}

export interface WeddingParty {
  title: LocalizedString;
  officiant: {
    name: string;
    role: LocalizedString;
  };
  personsOfHonor: string[];
  flowerKids: string[];
  ringBearer: {
    name: string;
    note?: LocalizedString;
  };
}

export interface GiftOption {
  type: 'bank' | 'bizum' | 'crypto';
  details: string;
}

export interface Gifts {
  title: LocalizedString;
  message: LocalizedString;
  options: GiftOption[];
}

export interface FAQItem {
  id: string;
  question: LocalizedString;
  answer: LocalizedString;
}

export interface ContactInfo {
  title: LocalizedString;
  description: LocalizedString;
  email: string;
  phone: string;
  whatsappGroup?: {
    text: LocalizedString;
    link: string;
  };
}

export type RSVPQuestionType = 
  | 'multiselect' 
  | 'number' 
  | 'boolean' 
  | 'text' 
  | 'text-array' 
  | 'textarea' 
  | 'select';

export interface RSVPOption {
  value: string;
  label: LocalizedString;
}

export interface RSVPQuestion {
  id: string;
  type: RSVPQuestionType;
  required: boolean;
  label: LocalizedString;
  options?: RSVPOption[];
  min?: number;
  max?: number;
}

export interface RSVPConfig {
  title: LocalizedString;
  description: LocalizedString;
  deadline: string;
  questions: RSVPQuestion[];
}

export interface WeddingContent {
  meta: MetaContent;
  hero: HeroContent;
  events: WeddingEvent[];
  dressCode: DressCodeInfo;
  travel: TravelInfo;
  accommodations: Accommodation[];
  weddingParty: WeddingParty;
  gifts: Gifts;
  faq: FAQItem[];
  contact: ContactInfo;
  rsvp: RSVPConfig;
}