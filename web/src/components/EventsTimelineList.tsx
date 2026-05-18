'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { MapPin, Clock, ExternalLink, Facebook, Instagram, Map } from 'lucide-react'
import { parseCalendarDate } from '@/lib/calendar-date'
import { cn } from '@/lib/utils'
import { getWeddingContent } from '@/lib/content'
import Typography, { combineTypographyClasses } from '@/lib/typography'
import { SlideImage } from './SlideImage'

const borderColorClasses = {
  coral: 'border-coral',
  sage: 'border-sage',
  ocean: 'border-ocean',
  gold: 'border-gold',
  sand: 'border-sand',
} as const

const colorClasses = {
  coral: 'bg-coral text-cream',
  sage: 'bg-sage text-cream',
  ocean: 'bg-ocean text-cream',
  gold: 'bg-gold text-charcoal',
  sand: 'bg-sand text-charcoal',
} as const

type EventsTimelineVariant = 'embedded' | 'standalone'

interface EventsTimelineListProps {
  variant?: EventsTimelineVariant
}

export function EventsTimelineList({ variant = 'embedded' }: EventsTimelineListProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  const content = getWeddingContent()
  const events = content.events

  const isStandalone = variant === 'standalone'

  const formatDate = (dateString: string, includeYear: boolean = true) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }

    if (includeYear) {
      options.year = 'numeric'
    }

    return parseCalendarDate(dateString).toLocaleDateString('es-ES', options)
  }

  return (
    <section
      id="events"
      className={cn(
        'bg-kite-texture bg-contain bg-repeat-y',
        isStandalone && 'min-h-screen pt-16 sm:pt-20'
      )}
    >
      <div className="w-full h-[83px] bg-divider-stick bg-repeat-x bg-contain" />
      <div
        className={cn(
          'container mx-auto px-3 sm:px-4',
          isStandalone ? 'pt-8 sm:pt-12 lg:pt-16' : 'pt-20 lg:pt-32'
        )}
      >
        <h2
          className={cn(
            combineTypographyClasses(Typography.Display.Medium, 'text-charcoal text-center'),
            isStandalone ? 'mb-8 sm:mb-12 lg:mb-16' : 'mb-16 lg:mb-24'
          )}
        >
          Eventos
        </h2>

        <div
          className={cn(
            'mx-auto',
            isStandalone ? 'max-w-2xl sm:max-w-3xl lg:max-w-4xl pt-2 sm:pt-8' : 'max-w-4xl pt-16'
          )}
        >
          <div className={cn(isStandalone ? 'space-y-3 sm:space-y-4' : 'space-y-4')}>
            {events.map((event) => (
              <div
                key={event.id}
                className={cn(
                  'border-l-4 bg-cream/30 rounded-r-lg hover:bg-cream/50 transition-all',
                  isStandalone ? 'pl-4 py-3 sm:pl-6 sm:py-4' : 'pl-6 py-4',
                  borderColorClasses[event.color as keyof typeof borderColorClasses]
                )}
              >
                <div
                  className={cn(
                    'flex gap-3 sm:gap-4',
                    isStandalone ? 'flex-row items-start' : 'flex-col md:flex-row'
                  )}
                >
                  <div
                    className={cn(
                      'shrink-0',
                      isStandalone
                        ? 'w-[72px] sm:w-[88px] lg:w-[120px]'
                        : 'w-[100px] md:w-[200px] mx-auto md:mx-0'
                    )}
                  >
                    <Image
                      src={`/icons/${event.icon}.png`}
                      alt={event.icon}
                      width={200}
                      height={200}
                      className={cn(
                        'rounded-lg object-cover',
                        isStandalone
                          ? 'w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px]'
                          : 'w-[100px] h-[100px] md:w-[200px] md:h-[200px]'
                      )}
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
                    <h3
                      className={cn(
                        combineTypographyClasses(Typography.Heading.H2, 'text-charcoal'),
                        isStandalone
                          ? 'text-left text-xl sm:text-2xl leading-tight'
                          : 'text-center md:text-left'
                      )}
                    >
                      {event.title}
                    </h3>

                    <div
                      className={cn(
                        Typography.UI.Quote,
                        'text-black text-left',
                        isStandalone ? 'mb-4 sm:mb-6' : 'text-center pr-4 md:pl-0 md:text-left mb-10'
                      )}
                    >
                      {event.description}
                    </div>

                    <div
                      className={cn(
                        'flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4 text-charcoal/80'
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center gap-2',
                          isStandalone ? 'justify-start' : 'justify-center md:justify-start'
                        )}
                      >
                        <Clock className="w-4 h-4 shrink-0" />
                        <span className="type-ui-medium font-medium">
                          {isStandalone ? (
                            formatDate(event.date, false)
                          ) : (
                            <>
                              <span className="md:hidden">{formatDate(event.date, false)}</span>
                              <span className="hidden md:inline">{formatDate(event.date, true)}</span>
                            </>
                          )}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'type-ui-large font-bold text-charcoal',
                          isStandalone ? 'text-left' : 'text-center md:text-left'
                        )}
                      >
                        {event.time}
                      </span>
                    </div>

                    <div
                      className={cn(
                        'flex flex-col gap-3',
                        isStandalone
                          ? 'sm:flex-row sm:items-start sm:justify-between'
                          : 'md:flex-row md:items-start md:justify-between gap-4'
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-start gap-2 text-charcoal/60 flex-1 min-w-0',
                          isStandalone ? 'justify-start' : 'justify-center md:justify-start'
                        )}
                      >
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                        <div
                          className={cn(
                            'type-body-small',
                            isStandalone ? 'text-left' : 'text-center md:text-left'
                          )}
                        >
                          <p className="font-medium">{event.venue.name}</p>
                          <p className="text-sm leading-snug">{event.venue.address}</p>
                        </div>
                      </div>

                      <div
                        className={cn(
                          'flex items-center gap-3 shrink-0',
                          isStandalone ? 'justify-start sm:justify-end' : 'justify-center md:justify-end'
                        )}
                      >
                        {event.venue.social && (
                          <div className="flex items-center gap-3">
                            {event.venue.social.facebook && (
                              <a
                                href={event.venue.social.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-charcoal/50 hover:text-charcoal transition-colors p-1"
                                aria-label="Facebook"
                              >
                                <Facebook className="w-4 h-4" />
                              </a>
                            )}
                            {event.venue.social.instagram && (
                              <a
                                href={event.venue.social.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-charcoal/50 hover:text-charcoal transition-colors p-1"
                                aria-label="Instagram"
                              >
                                <Instagram className="w-4 h-4" />
                              </a>
                            )}
                            {event.venue.website && (
                              <a
                                href={event.venue.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-charcoal/50 hover:text-charcoal transition-colors p-1"
                                aria-label="Sitio web del venue"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedEvent(expandedEvent === event.id ? null : event.id)
                          }
                          className={cn(
                            'rounded-full border transition-colors type-ui-label text-sm min-h-11',
                            isStandalone
                              ? 'inline-flex items-center gap-2 px-4 py-2'
                              : 'px-4 py-2 md:mr-4',
                            borderColorClasses[event.color as keyof typeof borderColorClasses],
                            `hover:${colorClasses[event.color as keyof typeof colorClasses]}`
                          )}
                        >
                          {isStandalone ? (
                            <>
                              <Map className="w-4 h-4 shrink-0" />
                              <span>Ver mapa</span>
                            </>
                          ) : (
                            <>
                              <span className="md:hidden">
                                <Map className="w-4 h-4" />
                              </span>
                              <span className="hidden md:inline">Ver Mapa</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {expandedEvent === event.id && (
                  <div className="mt-4 sm:mt-6 rounded-lg overflow-hidden border border-charcoal/20">
                    <iframe
                      src={event.venue.mapEmbed}
                      width="100%"
                      height={isStandalone ? 220 : 250}
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Mapa de ${event.venue.name}`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full relative">
        <SlideImage
          src="/slides/kite.webp"
          alt="Kite slide continuation"
          originalWidth={1920}
          originalHeight={2489}
          maskHeight={isStandalone ? 220 : 350}
        />
      </div>
    </section>
  )
}
