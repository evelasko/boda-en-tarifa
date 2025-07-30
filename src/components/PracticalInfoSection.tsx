'use client'

import React from 'react'
import { Wind, Moon, AlertTriangle } from 'lucide-react'
import Typography, { combineTypographyClasses } from '@/lib/typography'
import Image from 'next/image'
import { SlideImage } from './SlideImage'
import { weatherWarnings, beReadyFor, dressCode } from '@/content/practicalInfo'

export function PracticalInfoSection() {
  
  return (
    <section id="practical" className="pt-20 lg:pt-32 bg-canoe-texture bg-contain bg-repeat-y">
      <div className="container mx-auto px-4">
      <h2 className={combineTypographyClasses(Typography.Display.Medium, 'mb-8 text-charcoal text-center')}>
          Bueno Saber
        </h2>
        
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* What to Wear */}
            <div className="space-y-6">
            <div className="text-center">
                <div className="flex justify-center">
                  <Image src="/icons/flipflops.png" alt="Map" width={100} height={100} />
                </div>
                <h3 className={combineTypographyClasses(Typography.Heading.H4, "text-charcoal mb-6")}>
                  Código de Vestimenta
                </h3>
              </div>
              
              {/* Weather Warnings */}
              <div className="bg-cream/50 rounded-lg p-6 border border-coral/20">
                <div className="flex items-center gap-2 mb-4">
                  <Wind className="w-5 h-5 text-coral" />
                  <h4 className="type-heading-tertiary text-charcoal">
                    Tiempo
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
              <div className="bg-cream/50 rounded-lg p-6 border border-sage/20">
                <div className="flex items-center gap-2 mb-4">
                  <Moon className="w-5 h-5 text-sage" />
                  <h4 className="type-heading-tertiary text-charcoal">
                    Prepárate Para
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
              <div className="bg-cream/50 rounded-lg p-6 border border-gold/20">
                <h4 className="type-heading-tertiary text-charcoal mb-4">
                  Libertad de Vestimenta
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
                <div className="flex justify-center">
                  <Image src="/icons/compass.png" alt="Map" width={100} height={100} />
                </div>
                <h3 className={combineTypographyClasses(Typography.Heading.H4, "text-charcoal mb-6")}>
                  Moverse por Tarifa
                </h3>
              </div>
              
              {/* Beach Access */}
              <div className="bg-cream/50 rounded-lg p-6 border border-ocean/20">
                <h4 className="type-heading-tertiary text-charcoal mb-4">
                  Playa y Lugares
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-ocean/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="type-ui-label text-ocean">✓</span>
                    </div>
                    <div>
                      <p className="type-body-base text-charcoal">
                        Playa y chiringitos a poca distancia andando
                      </p>
                      <p className="type-body-small text-charcoal/70">
                        Todos los lugares de la boda son fácilmente accesibles a pie
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tourism */}
              <div className="bg-cream/50 rounded-lg p-6 border border-coral/20">
                <h4 className="type-heading-tertiary text-charcoal mb-4">
                  Para Turismo
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-coral/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="type-ui-label text-coral">🚗</span>
                    </div>
                    <div>
                      <p className="type-body-base text-charcoal">
                        Se recomienda coche para hacer turismo
                      </p>
                      <p className="type-body-small text-charcoal/70">
                        Para explorar la hermosa costa y atracciones del interior
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Public Transport */}
              <div className="bg-cream/50 rounded-lg p-6 border border-sage/20">
                <h4 className="type-heading-tertiary text-charcoal mb-4">
                  Transporte Público
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-sage/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="type-ui-label text-sage">🚌</span>
                    </div>
                    <div>
                      <p className="type-body-base text-charcoal">
                        Autobuses hacia/desde el pueblo disponibles
                      </p>
                      <a
                        href="https://horizontesur.es/lineas-regulares/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="type-body-small text-sage hover:text-sage/80 transition-colors underline"
                      >
                        Ver horarios de autobús →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Image Area - Full Width */}
      <div className="w-full relative">
        <SlideImage
          src="/slides/canoe@large.jpg"
          alt="Kite slide continuation"
          originalWidth={1921}
          originalHeight={2826}
          maskHeight={350}
        />
      </div>
    </section>
  )
}