/**
 * Type definitions for wedding website content
 */

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
  title: string;
  description?: string;
  venue: Venue;
  icon: EventIcon;
  color: EventColor;
}

export interface MetaContent {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
}

export interface HeroContent {
  backgroundImage: string;
  greeting: string;
  names: string;
  date: string;
  location: string;
}

export interface DressCodeInfo {
  title: string;
  weather: string[];
  beReadyFor: string[];
  suggestions: string[];
}

export interface TravelRoute {
  name: string;
  time: string;
  distance: string;
  tolls: string;
  mapUrl: string;
}

export interface TravelOption {
  destination?: string;
  airport?: string;
  details: string;
}

export interface TravelInfo {
  title: string;
  fromMadrid: {
    byCar: {
      title: string;
      routes: TravelRoute[];
      carPooling: string;
    };
    byTrain: {
      title: string;
      options: TravelOption[];
    };
    byAir: {
      title: string;
      options: TravelOption[];
    };
  };
  inTarifa: {
    title: string;
    beachAccess: string;
    tourism: string;
    busSchedule: {
      text: string;
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
  description: string;
  pricing?: {
    double?: string;
    single?: string;
    thirdNight?: string;
    status?: string;
  };
  website: string;
  bookingLinks?: string[];
  image: string;
}

export interface WeddingParty {
  title: string;
  officiant: {
    name: string;
    role: string;
  };
  personsOfHonor: string[];
  flowerKids: string[];
  ringBearer: {
    name: string;
    note?: string;
  };
}

export interface GiftOption {
  type: 'bank' | 'bizum' | 'crypto';
  details: string;
}

export interface Gifts {
  title: string;
  message: string;
  options: GiftOption[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface ContactInfo {
  title: string;
  description: string;
  email: string;
  phone: string;
  whatsappGroup?: {
    text: string;
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
  label: string;
}

export interface RSVPQuestion {
  id: string;
  type: RSVPQuestionType;
  required: boolean;
  label: string;
  options?: RSVPOption[];
  min?: number;
  max?: number;
}

export interface RSVPConfig {
  title: string;
  description: string;
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