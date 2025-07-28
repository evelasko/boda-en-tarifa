'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { MapPin, Clock, ExternalLink, Facebook, Instagram } from 'lucide-react'
import { FaCocktail, FaMusic, FaRing, FaGlassCheers, FaCoffee } from 'react-icons/fa'
import { cn } from '@/lib/utils'
import { getWeddingContent } from '@/lib/content'
import Typography, { combineTypographyClasses } from '@/lib/typography'

export function EventsTimelineList() {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  const content = getWeddingContent()
  const events = content.events
  
  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'cocktail': return <FaCocktail className="w-5 h-5" />
      case 'music': return <FaMusic className="w-5 h-5" />
      case 'rings': return <FaRing className="w-5 h-5" />
      case 'party': return <FaGlassCheers className="w-5 h-5" />
      case 'brunch': return <FaCoffee className="w-5 h-5" />
      default: return <FaCocktail className="w-5 h-5" />
    }
  }
  
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
    <section id="events" className="py-20 lg:py-32 bg-[url('/textures/icons-texture.png')] bg-repeat">
      <div className="container mx-auto px-4">
        <h2 className={combineTypographyClasses(Typography.Display.Medium, 'mb-8 text-charcoal')}>
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Main Event Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        "w-[200px] h-[200px] rounded-lg flex items-center justify-center flex-shrink-0",
                      )}>
                        <Image src={`/icons/${event.icon}.png`} alt={event.icon} width={200} height={200} />
                      </div>
                      <h3 className={combineTypographyClasses(Typography.Heading.H2, 'text-charcoal')}>
                        {event.title}
                      </h3>
                      <div className={cn(
                        Typography.UI.Quote,
                        "text-charcoal/80")}>
                        {event.description}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-charcoal/80 mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="type-ui-medium font-medium">
                          {new Date(event.date).toLocaleDateString('es-ES', { 
                            weekday: 'long',
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <span className="type-ui-large font-bold text-charcoal">
                        {event.time}
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-2 text-charcoal/60">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="type-body-small">
                        <p className="font-medium">{event.venue.name}</p>
                        <p className="text-sm">{event.venue.address}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions Section */}
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
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
                    
                    <button
                      onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                      className={cn(
                        "px-4 py-2 rounded-full border transition-colors type-ui-label text-sm",
                        borderColorClasses[event.color as keyof typeof borderColorClasses],
                        `hover:${colorClasses[event.color as keyof typeof colorClasses]}`
                      )}
                    >
                      Ver Mapa
                    </button>
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
    </section>
  )
}