'use client'

import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Gift, CreditCard, Smartphone, Bitcoin } from 'lucide-react'

export function GiftsSection() {
  const { t } = useLanguage()
  
  return (
    <section id="gifts" className="py-20 lg:py-32 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center">
              <Gift className="w-8 h-8 text-gold" />
            </div>
          </div>
          
          <h2 className="type-heading-primary text-charcoal mb-8">
            {t('gifts.title')}
          </h2>
          
          <p className="type-body-large text-charcoal mb-12">
            {t('gifts.content')}
          </p>
          
          {/* Gift Options */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-sand/10 rounded-lg p-6">
              <CreditCard className="w-8 h-8 text-sage mx-auto mb-4" />
              <h3 className="type-heading-tertiary text-charcoal mb-2">
                {t('gifts.bank')}
              </h3>
              <p className="type-body-small text-charcoal/70">
                Traditional bank transfer option
              </p>
            </div>
            
            <div className="bg-coral/10 rounded-lg p-6">
              <Smartphone className="w-8 h-8 text-coral mx-auto mb-4" />
              <h3 className="type-heading-tertiary text-charcoal mb-2">
                {t('gifts.bizum')}
              </h3>
              <p className="type-body-small text-charcoal/70">
                Quick mobile payment
              </p>
            </div>
            
            <div className="bg-ocean/10 rounded-lg p-6">
              <Bitcoin className="w-8 h-8 text-ocean mx-auto mb-4" />
              <h3 className="type-heading-tertiary text-charcoal mb-2">
                {t('gifts.crypto')}
              </h3>
              <p className="type-body-small text-charcoal/70">
                ETH, Bitcoin & more
              </p>
            </div>
          </div>
          
          <p className="type-body-small text-charcoal/50">
            Contact us for specific payment details
          </p>
          
          {/* Decorative element */}
          <div className="flex justify-center mt-12">
            <svg width="120" height="40" viewBox="0 0 120 40">
              <g className="text-gold">
                <path d="M10,20 Q30,10 60,20 T110,20" stroke="currentColor" strokeWidth="1" fill="none" />
                <circle cx="30" cy="15" r="2" fill="currentColor" opacity="0.5" />
                <circle cx="60" cy="20" r="3" fill="currentColor" />
                <circle cx="90" cy="15" r="2" fill="currentColor" opacity="0.5" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}