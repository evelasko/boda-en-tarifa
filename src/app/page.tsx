import { Hero } from '@/components/sections/Hero';
import { getWeddingContent, getCurrentLocale } from '@/lib/content';

export default function Home() {
  const content = getWeddingContent();
  const locale = getCurrentLocale();

  return (
    <main>
      <Hero content={content.hero} locale={locale} />
      
      {/* Future sections will go here */}
      <section className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="type-heading-2 text-[var(--color-charcoal)] mb-4">
            Coming Soon...
          </h2>
          <p className="type-body-base text-[var(--color-charcoal)]/70">
            Event timeline, travel information, and more sections will be added here.
          </p>
        </div>
      </section>
    </main>
  );
}
