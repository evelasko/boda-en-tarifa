'use client'

import React from 'react'
import { ExternalLink, Star, Bell } from 'lucide-react'
import { SlideImage } from './SlideImage'
import Typography, { combineTypographyClasses } from '@/lib/typography'

interface Accommodation {
  id: string
  name: string
  type: 'hotel' | 'glamping'
  pricing: string | null
  link: string
  featured?: boolean
  comingSoon?: boolean
  bookingLinks?: string[]
  discount?: string
}

export function AccommodationsSection() {
  
  const accommodations: Accommodation[] = [
    {
      id: 'tres_mares',
      name: 'Chill Out Hotel Tres Mares',
      type: 'hotel',
      pricing: 'Double: 100€ • Single: 100€',
      link: 'https://www.tresmareshotel.com',
      featured: true,
      discount: 'Third night: 60€'
    },
    {
      id: '100_fun',
      name: '100% Fun Hotel',
      type: 'hotel',
      pricing: null,
      link: 'https://100x100fun.com',
      comingSoon: true,
      bookingLinks: [
        'https://direct-book.com/properties/100por100fundirect?locale=es&items[0][adults]=2&items[0][children]=0&items[0][infants]=0&currency=EUR&checkInDate=2025-07-27&checkOutDate=2025-07-28&trackPage=yes',
        'https://www.booking.com/Share-Wmsuvr2'
      ]
    },
    {
      id: 'copacabana',
      name: 'Copacabana Hotel',
      type: 'hotel',
      pricing: null,
      link: 'https://www.copacabanatarifa.com/es/inicio',
      comingSoon: true,
      bookingLinks: ['https://www.booking.com/Share-VhBGeU']
    },
    {
      id: 'kampaoh_paloma',
      name: 'Kampaoh Paloma',
      type: 'glamping',
      pricing: null,
      link: 'https://es.kampaoh.com/punta-paloma-playa-cadiz-andalucia/',
      comingSoon: true
    },
    {
      id: 'kampaoh_tarifa',
      name: 'Kampaoh Tarifa',
      type: 'glamping',
      pricing: null,
      link: 'https://es.kampaoh.com/tarifa-cadiz-andalucia/',
      comingSoon: true
    }
  ]
  
  return (
    <section id="accommodations" className="pt-20 lg:pt-32 bg-monkey-texture bg-contain bg-repeat-y">
      <div className="container mx-auto px-4">
      <h2 className={combineTypographyClasses(Typography.Display.Medium, 'mb-8 text-charcoal text-center')}>
          Dónde Alojarse
        </h2>
        
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accommodations.map((accommodation) => (
              <div
                key={accommodation.id}
                className={`relative border rounded-lg overflow-hidden transition-all hover:shadow-lg ${
                  accommodation.featured ? 'border-coral/50 bg-coral/5' : 'border-charcoal/20'
                }`}
              >
                {/* Featured Badge */}
                {accommodation.featured && (
                  <div className="absolute top-4 left-4 z-10">
                    <div className="bg-coral text-cream px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      <span className="type-ui-label">Destacado</span>
                    </div>
                  </div>
                )}
                
                {/* Image placeholder */}
                <div className="h-48 bg-gradient-to-br from-sand/30 to-ocean/30 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg width="60" height="60" viewBox="0 0 60 60" className="text-charcoal/20">
                      <rect x="10" y="20" width="40" height="25" stroke="currentColor" strokeWidth="2" fill="none" />
                      <polygon points="10,20 30,5 50,20" stroke="currentColor" strokeWidth="2" fill="none" />
                      <rect x="25" y="30" width="10" height="15" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  </div>
                  
                  {/* Type badge */}
                  <div className="absolute bottom-4 right-4">
                    <span className={`px-2 py-1 rounded-full text-xs type-ui-label ${
                      accommodation.type === 'hotel' 
                        ? 'bg-sage text-cream' 
                        : 'bg-gold text-charcoal'
                    }`}>
                      {accommodation.type === 'hotel' ? 'Hotel' : 'Glamping'}
                    </span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <h3 className="type-heading-tertiary text-charcoal mb-3">
                    {accommodation.name}
                  </h3>
                  
                  {/* Pricing */}
                  {accommodation.pricing ? (
                    <div className="mb-4">
                      <p className="type-body-base text-charcoal">
                        {accommodation.pricing}
                      </p>
                      {accommodation.discount && (
                        <p className="type-body-small text-coral mt-1">
                          {accommodation.discount}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-charcoal/70">
                        <Bell className="w-4 h-4" />
                        <span className="type-body-small">
                          Próximamente
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="space-y-2">
                    <a
                      href={accommodation.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block w-full px-4 py-2 rounded-full text-center transition-colors type-ui-label ${
                        accommodation.featured
                          ? 'bg-coral text-cream hover:bg-coral/90'
                          : 'border border-charcoal/20 text-charcoal hover:border-charcoal/40'
                      }`}
                    >
                      {accommodation.pricing ? 'Reservar Ahora' : 'Visitar Web'}
                    </a>
                    
                    {accommodation.comingSoon && (
                      <button className="w-full px-4 py-2 border border-charcoal/20 rounded-full text-charcoal hover:border-charcoal/40 transition-colors type-ui-label">
                        Suscribirse a Actualizaciones
                      </button>
                    )}
                    
                    {accommodation.bookingLinks && (
                      <div className="text-center">
                        <p className="type-body-small text-charcoal/50 mb-2">
                          Reserva rápida:
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          {accommodation.bookingLinks.map((link, index) => (
                            <a
                              key={index}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-charcoal/50 hover:text-charcoal transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="w-full relative mt-16">
      <div className="w-full bg-carving-1 h-[54px] bg-repeat-x drop-shadow-[0_15px_10px_rgba(0,0,0,0.3)] z-10 relative" />
      <SlideImage
        src="/slides/monkey@large.jpg"
        alt="A monkey holding a martini glass"
        originalWidth={1921}
        originalHeight={2171}
          maskHeight={0}
        />
        <div className="w-full bg-carving-1 h-[54px] bg-repeat-x drop-shadow-[0_15px_20px_rgba(0,0,0,0.3)] z-10 relative" />
      </div>
    </section>
  )
}