'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { MapPin, Clock, ExternalLink, Facebook, Instagram, Map } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getWeddingContent } from '@/lib/content'
import Typography, { combineTypographyClasses } from '@/lib/typography'
import { SlideImage } from './SlideImage'

export function EventsTimelineList() {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  const content = getWeddingContent()
  const events = content.events
  
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

  // Format date responsively
  const formatDate = (dateString: string, includeYear: boolean = true) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }
    
    if (includeYear) {
      options.year = 'numeric'
    }
    
    return new Date(dateString).toLocaleDateString('es-ES', options)
  }

  return (
    <section id="events" className="bg-[url('/slides/kite-texture@large.jpg')] bg-contain bg-repeat-y">
      <div className="w-full h-[83px] bg-[url('/illustrations/carving-1.png')] bg-repeat-x bg-contain" />
      <div className="container mx-auto pt-20 lg:pt-32 px-4">
        <h2 className={combineTypographyClasses(Typography.Display.Medium, 'mb-8 text-charcoal text-center')}>
          Eventos
        </h2>
        
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className={cn(
                  "border-l-4 pl-6 py-4 bg-cream/30 rounded-r-lg hover:bg-cream/50 transition-all",
                  borderColorClasses[event.color as keyof typeof borderColorClasses]
                )}
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Column 1: Image Icon - 100px on mobile, 200px on desktop */}
                  <div className="w-[100px] md:w-[200px] flex-shrink-0 mx-auto md:mx-0">
                    <Image 
                      src={`/icons/${event.icon}.png`} 
                      alt={event.icon} 
                      width={200} 
                      height={200} 
                      className="rounded-lg w-[100px] h-[100px] md:w-[200px] md:h-[200px] object-cover"
                    />
                  </div>
                  
                  {/* Column 2: Event Content - Stacked on mobile, side by side on desktop */}
                  <div className="flex-1 space-y-3">
                    {/* Row 1: Event Title */}
                    <h3 className={combineTypographyClasses(Typography.Heading.H2, 'text-charcoal text-center md:text-left')}>
                      {event.title}
                    </h3>
                    
                    {/* Row 2: Event Description */}
                    <div className={cn(Typography.UI.Quote, "text-black text-center md:text-left mb-10")}>
                      {event.description}
                    </div>
                    
                    {/* Row 3: Date and Time - Same row on all screen sizes */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-charcoal/80">
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        <Clock className="w-4 h-4" />
                        <span className="type-ui-medium font-medium">
                          {/* Hide year on mobile screens */}
                          <span className="md:hidden">
                            {formatDate(event.date, false)}
                          </span>
                          <span className="hidden md:inline">
                            {formatDate(event.date, true)}
                          </span>
                        </span>
                      </div>
                      <span className="type-ui-large font-bold text-charcoal text-center md:text-left">
                        {event.time}
                      </span>
                    </div>
                    
                    {/* Row 4: Location Row - Stacked on mobile, two columns on desktop */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      {/* Sub-column 1: Venue Name and Address */}
                      <div className="flex items-start gap-2 text-charcoal/60 flex-1 justify-center md:justify-start">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div className="type-body-small text-center md:text-left">
                          <p className="font-medium">{event.venue.name}</p>
                          <p className="text-sm">{event.venue.address}</p>
                        </div>
                      </div>
                      
                      {/* Sub-column 2: Social Links and Map Button - Inline on all screens */}
                      <div className="flex items-center justify-center md:justify-end gap-3 md:flex-shrink-0">
                        {/* Social Links */}
                        {event.venue.social && (
                          <div className="flex items-center gap-3">
                            {event.venue.social.facebook && (
                              <a
                                href={event.venue.social.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-charcoal/50 hover:text-charcoal transition-colors"
                              >
                                <Facebook className="w-4 h-4" />
                              </a>
                            )}
                            {event.venue.social.instagram && (
                              <a
                                href={event.venue.social.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-charcoal/50 hover:text-charcoal transition-colors"
                              >
                                <Instagram className="w-4 h-4" />
                              </a>
                            )}
                            {event.venue.website && (
                              <a
                                href={event.venue.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-charcoal/50 hover:text-charcoal transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        )}
                        
                        {/* Map Button - Icon only on mobile, text on desktop */}
                        <button
                          onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                          className={cn(
                            "px-4 py-2 rounded-full border transition-colors type-ui-label text-sm",
                            borderColorClasses[event.color as keyof typeof borderColorClasses],
                            `hover:${colorClasses[event.color as keyof typeof colorClasses]}`
                          )}
                        >
                          {/* Show icon only on mobile */}
                          <span className="md:hidden">
                            <Map className="w-4 h-4" />
                          </span>
                          {/* Show text on desktop */}
                          <span className="hidden md:inline">
                            Ver Mapa
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Expandable Map */}
                {expandedEvent === event.id && (
                  <div className="mt-6 rounded-lg overflow-hidden border border-charcoal/20">
                    <iframe
                      src={event.venue.mapEmbed}
                      width="100%"
                      height="250"
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
      
      {/* Image Area - Full Width */}
      <div className="w-full relative">
        <SlideImage
          src="/slides/kite@large.jpg"
          alt="Kite slide continuation"
          originalWidth={1921}
          originalHeight={2490}
          maskHeight={350}
        />
      </div>
    </section>
  )
}