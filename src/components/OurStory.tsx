'use client'

import React from 'react'
import Typography, { combineTypographyClasses } from '@/lib/typography'
import { SlideImage } from './SlideImage'

export function OurStory() {
  
  return (
    <section 
      id="story" 
      className="relative bg-ski-texture bg-contain bg-repeat-y"
    >
      <div className="w-full h-[68px] bg-hero-frame bg-repeat-x bg-contain" />
      <div className="container pt-20 lg:pt-32 mx-auto px-4 max-w-4xl">
        {/* Content Area */}
        <div className="text-center mb-8">
        <h2 className={combineTypographyClasses(Typography.Display.Medium, 'mb-8 text-charcoal text-center')}>
            Nuestra Historia
          </h2>
          
          <p className="type-body-large text-charcoal/80 text-center">
            Desde el primer día que nos conocimos, supimos que habíamos encontrado algo especial. Ahora, después de compartir tantos momentos maravillosos juntos, estamos listos para comenzar esta nueva aventura como esposos. Queremos celebrar este día tan importante con las personas que más queremos en un lugar que tiene un significado especial para nosotros: Tarifa.
          </p>
        </div>
      </div>
      <div className="w-full relative">
        <SlideImage
          src="/slides/ski@large.jpg"
          alt="Ski slide continuation"
          originalWidth={1920}
          originalHeight={2661}
          maskHeight={350}
        />
      </div>
    </section>
  )
}