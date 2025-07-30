'use client'
import Image from 'next/image'
import React from 'react'
import Typography, { combineTypographyClasses } from '@/lib/typography'
import { SlideImage } from './SlideImage'

export function GiftsSection() {
  
  return (
    <section id="gifts" className="pt-20 lg:pt-32 bg-sea-texture bg-contain bg-repeat-y">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-[200] h-[200] flex items-center justify-center">
              <Image src="/icons/gift.png" alt="Gift" width={200} height={200} />
            </div>
          </div>
          
          <h2 className={combineTypographyClasses(Typography.Display.Medium, 'mb-8 text-white/70 text-center')}>
            Regalos
          </h2>
          
          <p className="type-body-large text-white/80 mb-12">
            Lo importante es que vengáis, aunque nos encanta viajar, y si quisierais que lleguemos más lejos podéis contribuir a través de la siguiente cuenta, Bizum, ETH bitcoin etc.
          </p>
          
          {/* Gift Options */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-sand/10 rounded-lg p-6">
            <div className="flex justify-center">
            <Image src="/icons/card.png" alt="Card" width={100} height={100} />
            </div>
              <h3 className="type-heading-tertiary text-white/70 mb-2">
                Transferencia Bancaria
              </h3>
              <p className="type-body-small text-white/50">
                Opción tradicional de transferencia bancaria
              </p>
            </div>
            
            <div className="bg-coral/10 rounded-lg p-6">
            <div className="flex justify-center">
            <Image src="/icons/smartphone.png" alt="Bizum" width={100} height={100} />
            </div>
              <h3 className="type-heading-tertiary text-white mb-2">
                Bizum
              </h3>
              <p className="type-body-small text-white/70">
                Pago móvil rápido
              </p>
            </div>
            
            <div className="bg-ocean/10 rounded-lg p-6">
              <div className="flex justify-center">
                <Image src="/icons/coin.png" alt="Bitcoin" width={100} height={100} />
              </div>
              <h3 className="type-heading-tertiary text-white mb-2">
                Criptomonedas
              </h3>
              <p className="type-body-small text-white/70">
                ETH, Bitcoin y más
              </p>
            </div>
          </div>
          
          <p className="type-body-small text-white/50">
            Contáctanos para detalles específicos de pago
          </p>
          
        </div>
      </div>
      {/* Image Area - Full Width */}
      <div className="w-full relative">
        <SlideImage
          src="/slides/sea.jpg"
          alt="Kite slide continuation"
          originalWidth={1920}
          originalHeight={2033}
          maskHeight={350}
        />
      </div>
    </section>
  )
}