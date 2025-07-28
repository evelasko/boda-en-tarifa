'use client'

import React, { useState } from 'react'
import { MapPin, Clock, ExternalLink, Facebook, Instagram } from 'lucide-react'
import { FaCocktail, FaMusic, FaRing, FaGlassCheers, FaCoffee } from 'react-icons/fa'
import { cn } from '@/lib/utils'
import { getWeddingContent } from '@/lib/content'

export function EventsTimeline() {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  const content = getWeddingContent()
  const events = content.events
  
  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'cocktail': return <FaCocktail className="w-6 h-6" />
      case 'music': return <FaMusic className="w-6 h-6" />
      case 'rings': return <FaRing className="w-6 h-6" />
      case 'party': return <FaGlassCheers className="w-6 h-6" />
      case 'brunch': return <FaCoffee className="w-6 h-6" />
      default: return <FaCocktail className="w-6 h-6" />
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
    <section id="events" className="py-20 lg:py-32 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="type-heading-primary text-charcoal text-center mb-16">
          Eventos de la Boda
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
                    {getIcon(event.icon)}
                  </div>
                  <div>
                    <h3 className="type-heading-tertiary text-charcoal">
                      {event.title}
                    </h3>
                  </div>
                </div>
                
                {/* Date and Time */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-charcoal/70">
                    <Clock className="w-4 h-4" />
                    <span className="type-ui-label">
                      {new Date(event.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })} • {event.time}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-charcoal/70">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <div className="type-body-small">
                      <p className="font-medium">{event.venue.name}</p>
                      <p>{event.venue.address}</p>
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
                    Ver Mapa
                  </button>
                  
                  {/* Social Links */}
                  {event.venue.social && (
                    <div className="flex items-center justify-center gap-4 pt-2">
                      {event.venue.social.facebook && (
                        <a
                          href={event.venue.social.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-charcoal/50 hover:text-charcoal transition-colors"
                        >
                          <Facebook className="w-5 h-5" />
                        </a>
                      )}
                      {event.venue.social.instagram && (
                        <a
                          href={event.venue.social.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-charcoal/50 hover:text-charcoal transition-colors"
                        >
                          <Instagram className="w-5 h-5" />
                        </a>
                      )}
                      {event.venue.website && (
                        <a
                          href={event.venue.website}
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
                      src={event.venue.mapEmbed}
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