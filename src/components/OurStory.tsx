'use client'

import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

export function OurStory() {
  const { t } = useLanguage()
  
  return (
    <section id="story" className="py-20 lg:py-32 bg-cream">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Decorative element */}
        <div className="flex justify-center mb-8">
          <svg width="60" height="60" viewBox="0 0 60 60">
            <g className="text-gold">
              <circle cx="30" cy="30" r="28" stroke="currentColor" strokeWidth="1" fill="none" />
              <path d="M30,10 Q40,20 30,30 Q20,20 30,10" fill="currentColor" opacity="0.3" />
              <path d="M30,30 Q40,40 30,50 Q20,40 30,30" fill="currentColor" opacity="0.3" />
            </g>
          </svg>
        </div>
        
        <h2 className="type-heading-primary text-charcoal text-center mb-8">
          {t('story.title')}
        </h2>
        
        <p className="type-body-large text-charcoal/80 text-center">
          {t('story.content')}
        </p>
        
        {/* Bottom decorative element */}
        <div className="flex justify-center mt-12">
          <svg width="120" height="40" viewBox="0 0 120 40">
            <path
              d="M10,20 Q30,10 60,20 T110,20"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              className="text-coral"
            />
          </svg>
        </div>
      </div>
    </section>
  )
}