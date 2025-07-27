import { Navigation } from '@/components/Navigation';
import { Hero } from '@/components/Hero';
import { OurStory } from '@/components/OurStory';
import { EventsTimeline } from '@/components/EventsTimeline';
import { RSVPCallToAction } from '@/components/RSVPCallToAction';
import { TravelSection } from '@/components/TravelSection';
import { AccommodationsSection } from '@/components/AccommodationsSection';
import { PracticalInfoSection } from '@/components/PracticalInfoSection';
import { WeddingPartySection } from '@/components/WeddingPartySection';
import { GiftsSection } from '@/components/GiftsSection';
import { FAQSection } from '@/components/FAQSection';
import { ContactSection } from '@/components/ContactSection';

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <OurStory />
        <EventsTimeline />
        <RSVPCallToAction />
        <TravelSection />
        <AccommodationsSection />
        <PracticalInfoSection />
        <WeddingPartySection />
        <GiftsSection />
        <FAQSection />
        <ContactSection />
      </main>
    </>
  );
}
