'use client'

import React from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Typography, { combineTypographyClasses } from '@/lib/typography'
import Image from 'next/image'
import { SlideImage } from './SlideImage'
import { faqs } from '@/content/faq'

export function FAQSection() {
  
  return (
    <section id="faq" className="pt-20 lg:pt-32 bg-lovers-texture-small bg-contain bg-repeat-y">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-[200px] h-[200px] flex items-center justify-center">
                <Image src="/icons/shell.png" alt="Help" width={200} height={200} />
              </div>
            </div>
            <h2 className={combineTypographyClasses(Typography.Display.Medium, 'mb-8 text-charcoal text-center')}>
              Preguntas Frecuentes
            </h2>
          </div>
          
          {/* FAQ Accordion */}
          <div className="bg-cream/30 rounded-lg p-6 lg:p-8 shadow-sm">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id} className="border-charcoal/10">
                  <AccordionTrigger className="text-left type-body-lead text-charcoal hover:text-coral transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="type-body-base text-charcoal/80">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          
          {/* Contact encouragement */}
          <div className="text-center mt-8">
            <p className="type-body-base text-charcoal/70">
              Still have questions? We&apos;d love to help!
            </p>
          </div>
        </div>
      </div>
            {/* Image Area - Full Width */}
            <div className="w-full relative">
        <SlideImage
          src="/slides/lovers@large.jpg"
          alt="Kite slide continuation"
          originalWidth={1921}
          originalHeight={3260}
          maskHeight={350}
        />
      </div>
    </section>
  )
}