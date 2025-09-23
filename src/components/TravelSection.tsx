'use client'

import React from 'react'
import Image from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MapPin, Clock, Euro, ExternalLink, Users } from 'lucide-react'
import Typography, { combineTypographyClasses } from '@/lib/typography'
import { SlideImage } from './SlideImage'

export function TravelSection() {
  
  return (
    <section id="travel" className="relative bg-icons-texture bg-repeat">
      <div className="w-full h-[83px] bg-divider-stick bg-repeat-x bg-contain" />
      <div className="pt-20 lg:pt-32 container mx-auto px-4">
        <h2 className={combineTypographyClasses(Typography.Display.Medium, 'mb-8 text-charcoal text-center')}>
          Cómo Llegar
        </h2>
        
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="car" className="w-full bg-transparent">
            <TabsList className="grid w-full grid-cols-3 h-auto p-2 bg-transparent">
              <TabsTrigger value="car" className="data-[state=active]:border-2 data-[state=active]:border-olive data-[state=active]:bg-transparent data-[state=active]:text-olive flex flex-col items-center gap-2 p-4 h-auto border-2 border-transparent bg-transparent text-olive">
                <Image 
                  src="/icons/car.png" 
                  alt="Car icon" 
                  width={100} 
                  height={100}
                  className="object-contain"
                />
                <span className="text-sm font-black">EN COCHE</span>
              </TabsTrigger>
              <TabsTrigger value="train" className="data-[state=active]:border-2 data-[state=active]:border-olive data-[state=active]:bg-transparent data-[state=active]:text-olive flex flex-col items-center gap-2 p-4 h-auto border-2 border-transparent bg-transparent text-olive">
                <Image 
                  src="/icons/train.png" 
                  alt="Train icon" 
                  width={100} 
                  height={100}
                  className="object-contain"
                />
                <span className="text-sm font-black">EN TREN</span>
              </TabsTrigger>
              <TabsTrigger value="air" className="data-[state=active]:border-2 data-[state=active]:border-olive data-[state=active]:bg-transparent data-[state=active]:text-olive flex flex-col items-center gap-2 p-4 h-auto border-2 border-transparent bg-transparent text-olive">
                <Image 
                  src="/icons/plane.png" 
                  alt="Plane icon" 
                  width={100} 
                  height={100}
                  className="object-contain"
                />
                <span className="text-sm font-black">EN AVION</span>
              </TabsTrigger>
            </TabsList>
            
            {/* By Car */}
            <TabsContent value="car" className="mt-8">
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Via A5 */}
                  <div className="border border-olive/50 rounded-lg p-6">
                    <h4 className={combineTypographyClasses(Typography.Heading.H6, "text-charcoal mb-4")}>Via A5: Badajoz</h4>
                    <div className="space-y-2 text-charcoal/70">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="type-body-small">6 hours 30 minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="type-body-small">720km</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Euro className="w-4 h-4" />
                        <span className="type-body-small">No tolls</span>
                      </div>
                    </div>
                    <a
                      href="https://maps.app.goo.gl/o3YswB3q9V4PyK4H6"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 text-olive hover:text-olive/80 transition-colors type-ui-label"
                    >
                      View Route <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  
                  {/* Via A4 */}
                  <div className="border border-olive/50 rounded-lg p-6">
                    <h4 className={combineTypographyClasses(Typography.Heading.H6, "text-charcoal mb-4")}>Via A4: Málaga</h4>
                    <div className="space-y-2 text-charcoal/70">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="type-body-small">6 hours</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="type-body-small">691km</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Euro className="w-4 h-4" />
                        <span className="type-body-small">~30€ tolls</span>
                      </div>
                    </div>
                    <a
                      href="https://maps.app.goo.gl/6ekGdAANCfxHbD296"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 text-olive hover:text-olive/80 transition-colors type-ui-label"
                    >
                      View Route <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                
                {/* Carpool */}
                <div className="bg-gold/10 rounded-lg p-6 text-center">
                  <Users className="w-8 h-8 text-gold mx-auto mb-2" />
                  <p className="type-body-lead text-charcoal mb-2">
                    Compartir Coche Disponible
                  </p>
                  <p className="type-body-small text-charcoal/70">
                    Contáctanos para coordinar con otros invitados
                  </p>
                </div>
              </div>
            </TabsContent>
            
            {/* By Train */}
            <TabsContent value="train" className="mt-8">
              <div className="space-y-4">
                <div className="border border-olive/50 rounded-lg p-6">
                  <h4 className={combineTypographyClasses(Typography.Heading.H6, "text-charcoal mb-2")}>AVE a Sevilla</h4>
                  <p className="type-body-small text-charcoal/70 mb-2">
                    2 horas / + 2 horas 21 minutos en coche a Tarifa
                  </p>
                </div>
                
                <div className="border border-olive/50 rounded-lg p-6">
                  <h4 className={combineTypographyClasses(Typography.Heading.H6, "text-charcoal mb-2")}>AVE a San Fernando</h4>
                  <p className="type-body-small text-charcoal/70 mb-2">
                    4 horas / + 1 hora 10 minutos en coche a Tarifa
                  </p>
                </div>
                
                <div className="border border-olive/50 rounded-lg p-6">
                  <h4 className={combineTypographyClasses(Typography.Heading.H6, "text-charcoal mb-2")}>Tren a Algeciras</h4>
                  <p className="type-body-small text-charcoal/70 mb-2">
                    6 horas / + 45 minutos en coche a Tarifa
                  </p>
                </div>

                <div className="border border-olive/50 rounded-lg p-6">
                  <h4 className={combineTypographyClasses(Typography.Heading.H6, "text-charcoal mb-2")}>AVE a Málaga</h4>
                  <p className="type-body-small text-charcoal/70 mb-2">
                    3 horas / + 1 hora 45 minutos en coche a Tarifa
                  </p>
                </div>
                
                <p className="type-body-small text-charcoal/50 text-center mt-6">
                  Todas las opciones de tren requieren un transporte adicional para llegar a Tarifa
                </p>
              </div>
            </TabsContent>
            
            {/* By Air */}
            <TabsContent value="air" className="mt-8">
              <div className="space-y-4">
                {[
                  {
                    title: "Vuelos a Jerez Airport",
                    duration: "+ 1 hora 31 minutos en coche a Tarifa",
                    label: "Aeropuerto Español más cercano"
                  },
                  {
                    title: "Vuelos a Tánger, Marruecos", 
                    details: [
                      "+ Ferry a Tarifa: 1h 15min / ~40€",
                      "+ Bus al hotel: 15 minutos"
                    ],
                    label: "Opción aventurera!"
                  },
                  {
                    title: "Vuelos a Gibraltar Airport",
                    duration: "+ 50 minutos en coche a Tarifa",
                    label: "Aeropuerto más cercano…"
                  },
                  {
                    title: "Vuelos a Málaga Airport",
                    duration: "+ 1 hora 45 minutos en coche a Tarifa",
                    label: "Aeropuerto más popular"
                  }
                ].map((airport, index) => (
                  <div key={index} className="border border-olive/50 rounded-lg p-6">
                    <h4 className={combineTypographyClasses(Typography.Heading.H6, "text-charcoal mb-2")}>
                      {airport.title}
                    </h4>
                    {airport.duration && (
                      <p className="type-body-small text-charcoal/70 !font-[500] mb-2">
                        {airport.duration}
                      </p>
                    )}
                    {airport.details && airport.details.map((detail, i) => (
                      <p key={i} className="type-body-small text-charcoal/70 !font-[500] mb-2">
                        {detail}
                      </p>
                    ))}
                    <p className="type-ui-label font-bold text-olive">{airport.label}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Getting Around */}
          <div className="mt-16 text-center">
            <h3 className="type-heading-secondary text-charcoal mb-6">
              Moverse por Tarifa
            </h3>
            <div className="space-y-4">
              <p className="type-body-large text-charcoal">
                La playa y chiringitos están a poca distancia andando del hotel
              </p>
              <p className="type-body-base text-charcoal/70">
                Para explorar y hacer turismo, necesitarás un coche
              </p>
              <a
                href="https://horizontesur.es/lineas-regulares/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 pb-12 font-bold text-coral hover:text-coral/80 transition-colors type-ui-label"
              >
                Horarios de Autobús <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full bg-carving-1 h-[54px] bg-repeat-x drop-shadow-[0_15px_10px_rgba(0,0,0,0.3)] z-10 relative" />
      <SlideImage
        src="/slides/bird@large.jpg"
        alt="Bird with ring in its beak"
        originalWidth={1921}
        originalHeight={2039} maskHeight={0}
      />
      <div className="w-full bg-carving-1 h-[54px] bg-repeat-x drop-shadow-[15px_5px_10px_rgba(0,0,0,0.3)] z-10 relative" />
    </section>
  )
}