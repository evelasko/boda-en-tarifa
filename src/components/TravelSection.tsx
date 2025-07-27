'use client'

import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Car, Train, Plane, MapPin, Clock, Euro, ExternalLink, Users } from 'lucide-react'

export function TravelSection() {
  const { t } = useLanguage()
  
  return (
    <section id="travel" className="py-20 lg:py-32 bg-cream">
      <div className="container mx-auto px-4">
        <h2 className="type-heading-primary text-charcoal text-center mb-16">
          {t('travel.title')}
        </h2>
        
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="car" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-sand/20">
              <TabsTrigger value="car" className="data-[state=active]:bg-coral data-[state=active]:text-cream">
                <Car className="w-4 h-4 mr-2" />
                {t('travel.by_car')}
              </TabsTrigger>
              <TabsTrigger value="train" className="data-[state=active]:bg-sage data-[state=active]:text-cream">
                <Train className="w-4 h-4 mr-2" />
                {t('travel.by_train')}
              </TabsTrigger>
              <TabsTrigger value="air" className="data-[state=active]:bg-ocean data-[state=active]:text-cream">
                <Plane className="w-4 h-4 mr-2" />
                {t('travel.by_air')}
              </TabsTrigger>
            </TabsList>
            
            {/* By Car */}
            <TabsContent value="car" className="mt-8">
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Via A5 */}
                  <div className="border border-coral/30 rounded-lg p-6">
                    <h4 className="type-heading-tertiary text-charcoal mb-4">Via A5: Badajoz</h4>
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
                      className="inline-flex items-center gap-2 mt-4 text-coral hover:text-coral/80 transition-colors type-ui-label"
                    >
                      View Route <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  
                  {/* Via A4 */}
                  <div className="border border-coral/30 rounded-lg p-6">
                    <h4 className="type-heading-tertiary text-charcoal mb-4">Via A4: Málaga</h4>
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
                      className="inline-flex items-center gap-2 mt-4 text-coral hover:text-coral/80 transition-colors type-ui-label"
                    >
                      View Route <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                
                {/* Carpool */}
                <div className="bg-gold/10 rounded-lg p-6 text-center">
                  <Users className="w-8 h-8 text-gold mx-auto mb-2" />
                  <p className="type-body-lead text-charcoal mb-2">
                    {t('travel.carpool')}
                  </p>
                  <p className="type-body-small text-charcoal/70">
                    Contact us to coordinate with other guests
                  </p>
                </div>
              </div>
            </TabsContent>
            
            {/* By Train */}
            <TabsContent value="train" className="mt-8">
              <div className="space-y-4">
                <div className="border border-sage/30 rounded-lg p-6">
                  <h4 className="type-heading-tertiary text-charcoal mb-2">AVE to Seville</h4>
                  <p className="type-body-small text-charcoal/70 mb-2">
                    2 hours / ~40€ + Car rental or bus to Tarifa
                  </p>
                </div>
                
                <div className="border border-sage/30 rounded-lg p-6">
                  <h4 className="type-heading-tertiary text-charcoal mb-2">AVE to San Fernando</h4>
                  <p className="type-body-small text-charcoal/70 mb-2">
                    4 hours / ~30€ + Car rental or bus to Tarifa
                  </p>
                </div>
                
                <div className="border border-sage/30 rounded-lg p-6">
                  <h4 className="type-heading-tertiary text-charcoal mb-2">Train to Algeciras</h4>
                  <p className="type-body-small text-charcoal/70 mb-2">
                    6 hours / ~80€ + Car rental or bus to Tarifa
                  </p>
                </div>
                
                <p className="type-body-small text-charcoal/50 text-center mt-6">
                  All train options require additional transportation to reach the venues
                </p>
              </div>
            </TabsContent>
            
            {/* By Air */}
            <TabsContent value="air" className="mt-8">
              <div className="space-y-4">
                <div className="border border-ocean/30 rounded-lg p-6">
                  <h4 className="type-heading-tertiary text-charcoal mb-2">Fly to Jerez Airport</h4>
                  <p className="type-body-small text-charcoal/70 mb-2">
                    1h 15min flight / ~130€ + 1h 16min car rental to Tarifa
                  </p>
                  <p className="type-ui-label text-ocean">Closest Spanish airport</p>
                </div>
                
                <div className="border border-ocean/30 rounded-lg p-6">
                  <h4 className="type-heading-tertiary text-charcoal mb-2">Fly to Tangier, Morocco</h4>
                  <p className="type-body-small text-charcoal/70 mb-2">
                    1h 30min flight / ~80€
                  </p>
                  <p className="type-body-small text-charcoal/70 mb-2">
                    + Ferry to Tarifa: 1h 15min / ~40€
                  </p>
                  <p className="type-body-small text-charcoal/70">
                    + Bus to hotel: 15 minutes
                  </p>
                  <p className="type-ui-label text-ocean">Adventure option!</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Getting Around */}
          <div className="mt-16 text-center">
            <h3 className="type-heading-secondary text-charcoal mb-6">
              {t('practical.getting_around')}
            </h3>
            <div className="space-y-4">
              <p className="type-body-large text-charcoal">
                Beach & chiringitos are at walking distance
              </p>
              <p className="type-body-base text-charcoal/70">
                To explore and do tourism, you&apos;ll need a car
              </p>
              <a
                href="https://horizontesur.es/lineas-regulares/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-coral hover:text-coral/80 transition-colors type-ui-label"
              >
                {t('practical.bus_schedule')} <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}