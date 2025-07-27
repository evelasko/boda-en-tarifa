'use client';

import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Typography, combineTypographyClasses } from '@/lib/typography';
import { MuralBackground } from '@/components/decorative/MuralBackground';
import { textReveal, fadeInUp, staggerContainer } from '@/lib/animations';
import { HeroContent } from '@/types/content';

interface HeroProps {
  content: HeroContent;
  locale?: 'en' | 'es';
}

export const Hero: React.FC<HeroProps> = ({ content, locale = 'en' }) => {
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  
  // Parallax transforms
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const textY = useTransform(scrollY, [0, 300], [0, 50]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', options);
  };

  return (
    <section className="relative min-h-screen overflow-hidden">
      <MuralBackground className="absolute inset-0">
        {/* Background image with painted effect */}
        <motion.div 
          className="absolute inset-0 z-0"
          style={{ y: heroY }}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url("${content.backgroundImage}")`,
              filter: 'sepia(10%) saturate(0.8) hue-rotate(10deg)',
            }}
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-cream)]/30 to-[var(--color-cream)]/80" />
        </motion.div>
      </MuralBackground>

      {/* Content */}
      <motion.div 
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center"
        style={{ y: textY, opacity }}
      >
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="max-w-5xl"
        >
          {/* Greeting */}
          <motion.p 
            variants={fadeInUp}
            className={combineTypographyClasses(
              Typography.UI.Lead,
              'mb-8 text-[var(--color-charcoal)]'
            )}
          >
            {locale === 'es' ? content.greeting.es : content.greeting.en}
          </motion.p>

          {/* Names - Main focal point */}
          <motion.h1 
            variants={textReveal}
            className={combineTypographyClasses(
              Typography.Display.Large,
              'mb-6 text-[var(--color-charcoal)]'
            )}
          >
            {content.names}
          </motion.h1>

          {/* Decorative separator */}
          <motion.div
            variants={fadeInUp}
            className="mx-auto mb-8 h-px w-32 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent"
          />

          {/* Date and Location */}
          <motion.div
            variants={fadeInUp}
            className="space-y-2"
          >
            <p className={combineTypographyClasses(
              Typography.Heading.H3,
              'text-[var(--color-charcoal)]'
            )}>
              {formatDate(content.date)}
            </p>
            <p className={combineTypographyClasses(
              Typography.Body.Large,
              'text-[var(--color-charcoal)]/80'
            )}>
              {locale === 'es' ? content.location.es : content.location.en}
            </p>
          </motion.div>

          {/* Ornamental frame around content */}
          <motion.svg
            variants={fadeInUp}
            className="absolute -top-20 -left-20 w-40 h-40 text-[var(--color-gold)] opacity-30"
            viewBox="0 0 200 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20,20 Q20,50 50,50 Q50,20 80,20 M20,20 Q50,20 50,50 Q20,50 20,80" />
          </motion.svg>
          
          <motion.svg
            variants={fadeInUp}
            className="absolute -bottom-20 -right-20 w-40 h-40 text-[var(--color-gold)] opacity-30 rotate-180"
            viewBox="0 0 200 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20,20 Q20,50 50,50 Q50,20 80,20 M20,20 Q50,20 50,50 Q20,50 20,80" />
          </motion.svg>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: [0, 10, 0],
          }}
          transition={{
            opacity: { delay: 2, duration: 0.8 },
            y: { 
              delay: 2.5,
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }
          }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2">
            <span className={combineTypographyClasses(
              Typography.UI.Caption,
              'text-[var(--color-charcoal)]/60'
            )}>
              {locale === 'es' ? 'Desliza hacia abajo' : 'Scroll down'}
            </span>
            <svg
              className="w-6 h-6 text-[var(--color-charcoal)]/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};