'use client'

import React from 'react'
import { ExternalLink, Star, Bell } from 'lucide-react'
import { SlideImage } from './SlideImage'
import Typography, { combineTypographyClasses } from '@/lib/typography'
import Image from 'next/image'

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
  image?: string
}

export function AccommodationsSection() {
  
  const accommodations: Accommodation[] = [
    {
      id: 'tres_mares',
      name: 'Chill Out Hotel Tres Mares',
      type: 'hotel',
      pricing: 'Doble: a partir de 60€',
      link: 'https://www.tresmareshotel.com',
      featured: true,
      discount: 'CÓDIGO DE RESERVA: MANUELYENRIQUE',
      image: '/images/tres-mares-1.jpg'
    },
    {
      id: '100_fun',
      name: '100% Fun Hotel',
      type: 'hotel',
      featured: true,
      pricing: '🔔 Próximamente',
      link: 'https://100x100fun.com',
      comingSoon: false,
      discount: 'CÓDIGO DE RESERVA DISPONIBLE EN DICIEMBRE',
      image: '/images/100-hotel-1.jpg'
    },
    {
      id: 'copacabana',
      name: 'Copacabana Hotel',
      type: 'hotel',
      featured: true,
      pricing: 'Mínimo 2 noches, precio en la web',
      link: 'https://www.copacabanatarifa.com/es/inicio',
      discount: 'Descuento del 20% en la tercera noche (SIN CÓDIGO)',
      comingSoon: false,
      image: '/images/copacabana-tarifa.jpg'
    },
    // {
    //   id: 'kampaoh_paloma',
    //   name: 'Kampaoh Paloma',
    //   type: 'glamping',
    //   pricing: null,
    //   link: 'https://es.kampaoh.com/punta-paloma-playa-cadiz-andalucia/',
    //   comingSoon: false,
    //   image: '/images/kampaoh-paloma-1.jpeg'
    // },
    // {
    //   id: 'kampaoh_tarifa',
    //   name: 'Kampaoh Tarifa',
    //   type: 'glamping',
    //   pricing: null,
    //   link: 'https://es.kampaoh.com/tarifa-cadiz-andalucia/',
    //   comingSoon: false,
    //   image: '/images/kampaoh-tarifa-1.jpeg'
    // }
  ]
  
  return (
    <section id="accommodations" className="pt-20 lg:pt-32 bg-monkey-texture bg-contain bg-repeat-y">
      <div className="container mx-auto px-4">
      <h2 className={combineTypographyClasses(Typography.Display.Medium, 'mb-8 !text-charcoal text-center')}>
          Dónde Alojarse
        </h2>
        
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accommodations.map((accommodation, index) => (
              <div
                key={accommodation.id}
                className={`relative border bg-coral/20 hover:bg-coral/30 rounded-lg overflow-hidden transition-all hover:shadow-lg ${
                  accommodation.featured ? 'border-coral/50 bg-coral/5' : 'border-charcoal/50'
                }`}
              >
                {/* Featured Badge */}
                {accommodation.featured && index === 0 && (
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
                  {accommodation.image ? (
                    <Image src={accommodation.image} alt={accommodation.name} fill className="object-cover" />
                  ) : (
                    <svg width="60" height="60" viewBox="0 0 60 60" className="text-white/20">
                      <rect x="10" y="20" width="40" height="25" stroke="currentColor" strokeWidth="2" fill="none" />
                      <polygon points="10,20 30,5 50,20" stroke="currentColor" strokeWidth="2" fill="none" />
                      <rect x="25" y="30" width="10" height="15" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  )}
                    
                  </div>
                  
                  {/* Type badge */}
                  <div className="absolute bottom-4 right-4">
                    <span className={`px-2 py-1 rounded-full text-xs type-ui-label ${
                      accommodation.type === 'hotel' 
                        ? 'bg-sage text-cream' 
                        : 'bg-gold text-white'
                    }`}>
                      {accommodation.type === 'hotel' ? 'Hotel' : 'Glamping'}
                    </span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <h3 className="type-heading-tertiary font-bold text-white mb-3">
                    {accommodation.name}
                  </h3>
                  
                  {/* Pricing */}
                  {accommodation.pricing ? (
                    <div className="mb-4">
                      <p className="type-body-base text-white">
                        {accommodation.pricing}
                      </p>
                      {accommodation.discount && (
                        <p className="type-body-small text-coral !font-extrabold mt-1">
                          {accommodation.discount}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-white/70">
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
                          : 'border border-coral text-white hover:border-charcoal/40'
                      }`}
                    >
                      {accommodation.pricing ? 'Reservar Ahora' : 'Visitar Web'}
                    </a>
                    
                    {accommodation.comingSoon && (
                      <button className="w-full px-4 py-2 border border-coral rounded-full text-white hover:border-charcoal/40 transition-colors type-ui-label">
                        Suscribirse a Actualizaciones
                      </button>
                    )}
                    
                    {accommodation.bookingLinks && (
                      <div className="text-center">
                        <p className="type-body-small text-white/50 mb-2">
                          Reserva rápida:
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          {accommodation.bookingLinks.map((link, index) => (
                            <a
                              key={index}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white/50 hover:text-white transition-colors"
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