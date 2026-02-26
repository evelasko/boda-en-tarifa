import { Navigation } from '@/components/Navigation';
import { Hero } from '@/components/Hero';
import { OurStory } from '@/components/OurStory';
import { EventsTimelineList } from '@/components/EventsTimelineList';
import { RSVPCallToAction } from '@/components/RSVPCallToAction';
import { TravelSection } from '@/components/TravelSection';
import { AccommodationsSection } from '@/components/AccommodationsSection';
import { PracticalInfoSection } from '@/components/PracticalInfoSection';
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
        <EventsTimelineList />
        <RSVPCallToAction />
        <TravelSection />
        <AccommodationsSection />
        <PracticalInfoSection />
        {/* <WeddingPartySection /> */}
        <GiftsSection />
        <FAQSection />
        <ContactSection />
      </main>
    </>
  );
}
