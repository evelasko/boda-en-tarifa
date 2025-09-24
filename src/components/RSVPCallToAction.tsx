'use client'

import React, { useState } from 'react'
import { SlideImage } from './SlideImage'
import SignInModal from './auth/SignInModal'
import Typography, { combineTypographyClasses } from '@/lib/typography'

export function RSVPCallToAction() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  return (
    <>
      <section id="rsvp-cta" className="bg-lobster-texture bg-contain bg-repeat-y">
        <div className="w-full h-[83px] bg-divider-stick bg-repeat-x bg-contain" />
        <div className="pt-20 lg:pt-32 container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">         
            <h2 className={combineTypographyClasses(Typography.Heading.H2, "text-charcoal mix-blend-overlay mb-4")}>
              Únete a Nosotros
            </h2>
            
            <p className={combineTypographyClasses(Typography.UI.Lead, "text-white/80 mb-8")}>
              Esperamos celebrar contigo este día tan especial
            </p>
            
            <p className={combineTypographyClasses(Typography.UI.Lead, "text-white mb-8 mix-blend-overlay")}>
              Por favor confirma tu asistencia lo antes posible.<br />Luego si sucediera algo, avísanos sin falta
            </p>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className={combineTypographyClasses(
                Typography.UI.Button,
                "inline-block px-8 py-4 my-8 bg-coral text-cream rounded-full hover:bg-coral/90 transition-all transform hover:scale-105 type-ui-label shadow-lg cursor-pointer"
              )}
            >
              Confirmar Asistencia
            </button>
            
          </div>
        </div>
        <SlideImage
          src="/slides/lobster@large.jpg"
          alt="Lobster"
          originalWidth={1921}
          originalHeight={2974} maskHeight={200} />
      </section>

      <SignInModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
}