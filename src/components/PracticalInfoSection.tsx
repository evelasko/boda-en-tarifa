'use client'

import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Wind, Moon, Shirt, MapPin, AlertTriangle } from 'lucide-react'

export function PracticalInfoSection() {
  const { t } = useLanguage()
  
  const weatherWarnings = [
    "first of all it is a very windy beach",
    "the night is usually chilly",
    "if the wind comes from the west, expect cold under shade"
  ]
  
  const beReadyFor = [
    "walking over irregular surfaces",
    "chilly nights, bring some cover up",
    "it IS a beach wedding, expect naughty sand"
  ]
  
  const dressCode = [
    "white is perfectly allowed, no one will steal our shine",
    "there is no need to be formal, and feel free to be as fancy as you want",
    "just show up in whatever floats your boat",
    "and beware: you WILL definitely DANCE the night away"
  ]
  
  return (
    <section id="practical" className="py-20 lg:py-32 bg-sand/10">
      <div className="container mx-auto px-4">
        <h2 className="type-heading-primary text-charcoal text-center mb-16">
          {t('practical.title')}
        </h2>
        
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* What to Wear */}
            <div className="space-y-6">
              <div className="text-center">
                <Shirt className="w-12 h-12 text-coral mx-auto mb-4" />
                <h3 className="type-heading-secondary text-charcoal mb-6">
                  {t('practical.dress_code')}
                </h3>
              </div>
              
              {/* Weather Warnings */}
              <div className="bg-white rounded-lg p-6 border border-coral/20">
                <div className="flex items-center gap-2 mb-4">
                  <Wind className="w-5 h-5 text-coral" />
                  <h4 className="type-heading-tertiary text-charcoal">
                    {t('practical.weather')}
                  </h4>
                </div>
                <ul className="space-y-2">
                  {weatherWarnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-coral mt-0.5 flex-shrink-0" />
                      <span className="type-body-small text-charcoal">
                        {warning}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Be Ready For */}
              <div className="bg-white rounded-lg p-6 border border-sage/20">
                <div className="flex items-center gap-2 mb-4">
                  <Moon className="w-5 h-5 text-sage" />
                  <h4 className="type-heading-tertiary text-charcoal">
                    Be Ready For
                  </h4>
                </div>
                <ul className="space-y-2">
                  {beReadyFor.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-sage rounded-full mt-2 flex-shrink-0" />
                      <span className="type-body-small text-charcoal">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Dress Code */}
              <div className="bg-white rounded-lg p-6 border border-gold/20">
                <h4 className="type-heading-tertiary text-charcoal mb-4">
                  Dress Code Freedom
                </h4>
                <ul className="space-y-2">
                  {dressCode.map((rule, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0" />
                      <span className="type-body-small text-charcoal">
                        {rule}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Getting Around */}
            <div className="space-y-6">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-ocean mx-auto mb-4" />
                <h3 className="type-heading-secondary text-charcoal mb-6">
                  Getting Around Tarifa
                </h3>
              </div>
              
              {/* Beach Access */}
              <div className="bg-white rounded-lg p-6 border border-ocean/20">
                <h4 className="type-heading-tertiary text-charcoal mb-4">
                  Beach & Venues
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-ocean/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="type-ui-label text-ocean">✓</span>
                    </div>
                    <div>
                      <p className="type-body-base text-charcoal">
                        Beach & chiringitos at walking distance
                      </p>
                      <p className="type-body-small text-charcoal/70">
                        All wedding venues are easily accessible on foot
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tourism */}
              <div className="bg-white rounded-lg p-6 border border-coral/20">
                <h4 className="type-heading-tertiary text-charcoal mb-4">
                  For Tourism
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-coral/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="type-ui-label text-coral">🚗</span>
                    </div>
                    <div>
                      <p className="type-body-base text-charcoal">
                        Car recommended for sightseeing
                      </p>
                      <p className="type-body-small text-charcoal/70">
                        To explore the beautiful coast and inland attractions
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Public Transport */}
              <div className="bg-white rounded-lg p-6 border border-sage/20">
                <h4 className="type-heading-tertiary text-charcoal mb-4">
                  Public Transport
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-sage/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="type-ui-label text-sage">🚌</span>
                    </div>
                    <div>
                      <p className="type-body-base text-charcoal">
                        Buses to/from town available
                      </p>
                      <a
                        href="https://horizontesur.es/lineas-regulares/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="type-body-small text-sage hover:text-sage/80 transition-colors underline"
                      >
                        Check bus schedule →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}