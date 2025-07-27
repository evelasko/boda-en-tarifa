'use client'

import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Crown, Heart, Flower, Heart as RingIcon } from 'lucide-react'

export function WeddingPartySection() {
  const { t } = useLanguage()
  
  const weddingParty = {
    officiant: "Rey",
    personsOfHonor: [
      "Cristina Sanz",
      "Reyes Martínez", 
      "Gemma Pagés",
      "Javier Otero"
    ],
    flowerKids: [
      "Irene Alonso",
      "Emmanuel Pérez",
      "Sara Alonso", 
      "Jeremías Pérez"
    ],
    ringBearer: "Thora"
  }
  
  return (
    <section id="wedding-party" className="py-20 lg:py-32 bg-cream">
      <div className="container mx-auto px-4">
        <h2 className="type-heading-primary text-charcoal text-center mb-16">
          {t('party.title')}
        </h2>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Officiant */}
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-gold" />
                </div>
                <h3 className="type-heading-secondary text-charcoal mb-4">
                  {t('party.officiant')}
                </h3>
                <div className="bg-white rounded-lg p-6 border border-gold/20">
                  <p className="type-heading-tertiary text-charcoal">
                    {weddingParty.officiant}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Ring Bearer */}
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-coral/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RingIcon className="w-8 h-8 text-coral" />
                </div>
                <h3 className="type-heading-secondary text-charcoal mb-4">
                  {t('party.ring_bearer')}
                </h3>
                <div className="bg-white rounded-lg p-6 border border-coral/20">
                  <p className="type-heading-tertiary text-charcoal">
                    {weddingParty.ringBearer}
                  </p>
                  <p className="type-body-small text-charcoal/70 mt-2">
                    Our furry family member 🐕
                  </p>
                </div>
              </div>
            </div>
            
            {/* Persons of Honor */}
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-sage" />
                </div>
                <h3 className="type-heading-secondary text-charcoal mb-4">
                  {t('party.persons_of_honor')}
                </h3>
                <div className="bg-white rounded-lg p-6 border border-sage/20">
                  <div className="space-y-3">
                    {weddingParty.personsOfHonor.map((person, index) => (
                      <div key={index} className="flex items-center justify-center">
                        <div className="w-2 h-2 bg-sage rounded-full mr-3" />
                        <p className="type-body-base text-charcoal">
                          {person}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Flower Kids */}
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-ocean/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Flower className="w-8 h-8 text-ocean" />
                </div>
                <h3 className="type-heading-secondary text-charcoal mb-4">
                  {t('party.flower_kids')}
                </h3>
                <div className="bg-white rounded-lg p-6 border border-ocean/20">
                  <div className="space-y-3">
                    {weddingParty.flowerKids.map((child, index) => (
                      <div key={index} className="flex items-center justify-center">
                        <div className="w-2 h-2 bg-ocean rounded-full mr-3" />
                        <p className="type-body-base text-charcoal">
                          {child}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative bottom element */}
          <div className="flex justify-center mt-12">
            <svg width="160" height="60" viewBox="0 0 160 60">
              <g className="text-gold">
                <path d="M20,30 Q40,20 80,30 T140,30" stroke="currentColor" strokeWidth="1" fill="none" />
                <circle cx="80" cy="30" r="4" fill="currentColor" />
                <path d="M70,25 L80,30 L90,25" stroke="currentColor" strokeWidth="1" fill="none" />
                <path d="M70,35 L80,30 L90,35" stroke="currentColor" strokeWidth="1" fill="none" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}