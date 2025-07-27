'use client'

import React from 'react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

export function RSVPCallToAction() {
  const { t } = useLanguage()
  
  return (
    <section id="rsvp-cta" className="py-20 lg:py-32 bg-gradient-to-br from-coral/10 to-sand/10">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Decorative element */}
          <div className="flex justify-center mb-8">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <g className="text-coral">
                <path 
                  d="M40,10 L45,25 L60,25 L48,35 L53,50 L40,40 L27,50 L32,35 L20,25 L35,25 Z" 
                  fill="currentColor" 
                  opacity="0.2"
                />
                <path 
                  d="M40,10 L45,25 L60,25 L48,35 L53,50 L40,40 L27,50 L32,35 L20,25 L35,25 Z" 
                  stroke="currentColor" 
                  strokeWidth="1" 
                  fill="none"
                />
              </g>
            </svg>
          </div>
          
          <h2 className="type-heading-primary text-charcoal mb-4">
            {t('rsvp.title')}
          </h2>
          
          <p className="type-body-large text-charcoal/80 mb-8">
            {t('rsvp.subtitle')}
          </p>
          
          <p className="type-body-lead text-coral mb-8">
            {t('rsvp.deadline')}
          </p>
          
          <Link
            href="/rsvp"
            className="inline-block px-8 py-4 bg-coral text-cream rounded-full hover:bg-coral/90 transition-all transform hover:scale-105 type-ui-label shadow-lg"
          >
            {t('rsvp.button')}
          </Link>
          
          {/* Bottom decorative element */}
          <div className="flex justify-center mt-12">
            <svg width="200" height="40" viewBox="0 0 200 40">
              <path
                d="M20,20 Q50,10 100,20 T180,20"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                className="text-gold"
              />
              <circle cx="100" cy="20" r="3" fill="currentColor" className="text-gold" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}