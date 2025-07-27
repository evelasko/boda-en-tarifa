'use client'

import React, { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { MapPin, Clock, ExternalLink, Facebook, Instagram } from 'lucide-react'
import { FaCocktail, FaMusic, FaRing, FaGlassCheers, FaCoffee } from 'react-icons/fa'
import { cn } from '@/lib/utils'

interface Event {
  id: string
  icon: React.ReactNode
  color: string
  location: {
    name: string
    address: string
    map: string
    link?: string
    social?: {
      facebook?: string
      instagram?: string
    }
  }
}

export function EventsTimeline() {
  const { t } = useLanguage()
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  
  const events: Event[] = [
    {
      id: 'early_welcome',
      icon: <FaCocktail className="w-6 h-6" />,
      color: 'coral',
      location: {
        name: 'Chiringuito Tumbao',
        address: '11380 Valdevaqueros, Cádiz',
        map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3745.854350480207!2d-5.684484288116694!3d36.0659281723508!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd0c8bb6648de745%3A0xed583e1129a8f0d8!2sTumbao!5e1!3m2!1sen!2ses!4v1753561799173!5m2!1sen!2ses',
        link: 'https://www.tumbaotarifa.com',
        social: {
          facebook: 'https://www.facebook.com/tumbaotarifa',
          instagram: 'https://www.instagram.com/tumbaotarifa'
        }
      }
    },
    {
      id: 'pre_wedding',
      icon: <FaMusic className="w-6 h-6" />,
      color: 'sage',
      location: {
        name: 'Casa Explora — Tarifa',
        address: 'Ctra. Cádiz-Málaga km 76,2, 11380 Tarifa, Cádiz',
        map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3745.888080349413!2d-5.6777601881167055!3d36.065219772351035!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd0c8ba36e4da971%3A0x4ca26961ee2e5be5!2sCasa%20Explora!5e1!3m2!1sen!2ses!4v1753562019741!5m2!1sen!2ses',
        link: 'https://www.casaexploratarifa.com',
        social: {
          facebook: 'https://www.facebook.com/casaexplora',
          instagram: 'https://www.instagram.com/casaexplora'
        }
      }
    },
    {
      id: 'ceremony',
      icon: <FaRing className="w-6 h-6" />,
      color: 'ocean',
      location: {
        name: 'Chiringuito BiBo',
        address: 'Calle de la Playa, 123, Jerez de la Frontera, Spain',
        map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3745.888080349413!2d-5.6777601881167055!3d36.065219772351035!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd0c8ba36e4da971%3A0x4ca26961ee2e5be5!2sCasa%20Explora!5e1!3m2!1sen!2ses!4v1753562019741!5m2!1sen!2ses',
        link: 'https://www.casaexploratarifa.com',
        social: {
          facebook: 'https://www.facebook.com/casaexplora',
          instagram: 'https://www.instagram.com/casaexplora'
        }
      }
    },
    {
      id: 'celebration',
      icon: <FaGlassCheers className="w-6 h-6" />,
      color: 'gold',
      location: {
        name: 'Chill Out Hotel Tres Mares — Tarifa',
        address: 'Calle de la Playa, 123, Jerez de la Frontera, Spain',
        map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3745.8435276608575!2d-5.679404688116657!3d36.066155472350644!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd0c8bb83029eff7%3A0x7edd4e0e58b89b2a!2sTres%20mares!5e1!3m2!1sen!2ses!4v1753564882060!5m2!1sen!2ses',
        link: 'https://www.tresmareshotel.com',
        social: {
          facebook: 'https://www.facebook.com/ChilloutHotelTresMares/',
          instagram: 'https://www.instagram.com/hoteltresmares'
        }
      }
    },
    {
      id: 'post_wedding',
      icon: <FaCoffee className="w-6 h-6" />,
      color: 'sand',
      location: {
        name: 'Chill Out Hotel Tres Mares — Tarifa',
        address: 'Calle de la Playa, 123, Jerez de la Frontera, Spain',
        map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3745.8435276608575!2d-5.679404688116657!3d36.066155472350644!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd0c8bb83029eff7%3A0x7edd4e0e58b89b2a!2sTres%20mares!5e1!3m2!1sen!2ses!4v1753564882060!5m2!1sen!2ses',
        link: 'https://www.tresmareshotel.com',
        social: {
          facebook: 'https://www.facebook.com/ChilloutHotelTresMares/',
          instagram: 'https://www.instagram.com/hoteltresmares'
        }
      }
    }
  ]
  
  const colorClasses = {
    coral: 'bg-coral text-cream',
    sage: 'bg-sage text-cream',
    ocean: 'bg-ocean text-cream',
    gold: 'bg-gold text-charcoal',
    sand: 'bg-sand text-charcoal'
  }
  
  const borderColorClasses = {
    coral: 'border-coral',
    sage: 'border-sage',
    ocean: 'border-ocean',
    gold: 'border-gold',
    sand: 'border-sand'
  }
  
  return (
    <section id="events" className="py-20 lg:py-32 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="type-heading-primary text-charcoal text-center mb-16">
          {t('events.title')}
        </h2>
        
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {events.map((event) => (
              <div
                key={event.id}
                className={cn(
                  "border-2 rounded-lg p-6 transition-all hover:shadow-lg",
                  borderColorClasses[event.color as keyof typeof borderColorClasses]
                )}
              >
                {/* Icon and Title */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    colorClasses[event.color as keyof typeof colorClasses]
                  )}>
                    {event.icon}
                  </div>
                  <div>
                    <h3 className="type-heading-tertiary text-charcoal">
                      {t(`events.${event.id}.title`)}
                    </h3>
                  </div>
                </div>
                
                {/* Date and Time */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-charcoal/70">
                    <Clock className="w-4 h-4" />
                    <span className="type-ui-label">
                      {t(`events.${event.id}.date`)} • {t(`events.${event.id}.time`)}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-charcoal/70">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <div className="type-body-small">
                      <p className="font-medium">{event.location.name}</p>
                      <p>{event.location.address}</p>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                    className={cn(
                      "w-full px-4 py-2 rounded-full border transition-colors type-ui-label",
                      borderColorClasses[event.color as keyof typeof borderColorClasses],
                      `hover:${colorClasses[event.color as keyof typeof colorClasses]}`
                    )}
                  >
                    {t('events.view_map')}
                  </button>
                  
                  {/* Social Links */}
                  {event.location.social && (
                    <div className="flex items-center justify-center gap-4 pt-2">
                      {event.location.social.facebook && (
                        <a
                          href={event.location.social.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-charcoal/50 hover:text-charcoal transition-colors"
                        >
                          <Facebook className="w-5 h-5" />
                        </a>
                      )}
                      {event.location.social.instagram && (
                        <a
                          href={event.location.social.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-charcoal/50 hover:text-charcoal transition-colors"
                        >
                          <Instagram className="w-5 h-5" />
                        </a>
                      )}
                      {event.location.link && (
                        <a
                          href={event.location.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-charcoal/50 hover:text-charcoal transition-colors"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Expandable Map */}
                {expandedEvent === event.id && (
                  <div className="mt-4 rounded-lg overflow-hidden">
                    <iframe
                      src={event.location.map}
                      width="100%"
                      height="200"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}