'use client'

import React from 'react'
import { Phone, MessageCircle, Heart } from 'lucide-react'

export function ContactSection() {
  
  return (
    <section id="contact" className="pt-20 lg:pt-32 bg-lovers-texture-small bg-contain bg-repeat-y">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <h2 className="type-heading-primary text-cream mb-8">
            Contacto
          </h2>
          
          <p className="type-body-large text-cream/80 mb-12">
            ¡No podemos esperar a celebrar con vosotros en Tarifa!
          </p>
          
          {/* Contact Methods */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-charcoal/50 border border-cream/10 rounded-lg p-6">
              <Phone className="w-8 h-8 text-sage mx-auto mb-4" />
              <h3 className="type-heading-tertiary text-cream mb-2">Phone</h3>
              <a
                href="tel:+34655433018"
                className="type-body-base text-cream/80 hover:text-sage transition-colors"
              >
                +34 655 433 018
              </a>
            </div>
            
            <div className="bg-charcoal/50 border border-cream/10 rounded-lg p-6">
              <Phone className="w-8 h-8 text-coral mx-auto mb-4" />
              <h3 className="type-heading-tertiary text-cream mb-2">Phone</h3>
              <a
                href="tel:+34609971307"
                className="type-body-base text-cream/80 hover:text-sage transition-colors"
              >
                +34 609 971 307
              </a>
            </div>
            
            <div className="bg-charcoal/50 border border-cream/10 rounded-lg p-6">
              <MessageCircle className="w-8 h-8 text-gold mx-auto mb-4" />
              <h3 className="type-heading-tertiary text-cream mb-2">WhatsApp</h3>
              <button className="type-body-base text-cream/80 hover:text-gold transition-colors">
                Grupo de WhatsApp
              </button>
              <p className="type-body-small text-cream/50 mt-1">
                Enlace próximamente
              </p>
            </div>
          </div>
          
          {/* Decorative element */}
          <div className="flex justify-center mb-8">
            <svg width="120" height="60" viewBox="0 0 120 60">
              <g className="text-gold">
                <path d="M20,30 Q40,20 60,30 T100,30" stroke="currentColor" strokeWidth="1" fill="none" />
                <Heart className="w-6 h-6" style={{ transform: 'translate(54px, 24px)' }} fill="currentColor" />
              </g>
            </svg>
          </div>
          
          {/* Footer */}
          <div className="border-t border-cream/10 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="type-heading-ornamental text-cream">E&M</span>
                <span className="type-body-small text-cream/50">
                  30 de Mayo, 2025 • Tarifa, España
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-cream/50">
                <Heart className="w-4 h-4 text-coral" />
                <span className="type-body-small">
                  Hecho con amor para nuestra boda en la playa
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}