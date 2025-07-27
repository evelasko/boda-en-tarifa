'use client'

import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { HelpCircle } from 'lucide-react'

export function FAQSection() {
  const { t } = useLanguage()
  
  const faqs = [
    {
      id: 'q1',
      question: 'Puedo venir con alguien mas?',
      answer: 'Claro que sí, pero avísanos con antelación para poder incluir a tu acompañante en la lista y asegurar que tenemos todo preparado para vuestra visita.'
    },
    {
      id: 'q2', 
      question: 'Are kids welcome?',
      answer: 'Sure, but you handle them! We love having children at our celebration, but please note that we won&apos;t have dedicated childcare or special facilities for infants.'
    },
    {
      id: 'q3',
      question: 'Can I bring my dog?',
      answer: 'Of course! We\'re dog lovers and welcome your furry friends, but please let us know in advance so we can ensure the venues are prepared for four-legged guests.'
    },
    {
      id: 'q4',
      question: 'What should I do if I can\'t attend?',
      answer: 'We totally understand that life happens! Just let us know as soon as possible through your RSVP so we can adjust our planning accordingly. We\'ll miss you but there will be plenty of photos to share!'
    },
    {
      id: 'q5',
      question: 'The ceremony\'s location is at walking distance, what if I can\'t walk it?',
      answer: 'Don&apos;t worry! While most venues are within walking distance, we can arrange transportation for guests who need assistance. Just mention this in your RSVP or contact us directly.'
    },
    {
      id: 'q6',
      question: 'Question not listed? Feel free to ask!',
      answer: 'We&apos;re here to help! If you have any other questions or concerns, don&apos;t hesitate to reach out to us directly. You can contact us via email, phone, or join our WhatsApp group for quick answers.'
    }
  ]
  
  return (
    <section id="faq" className="py-20 lg:py-32 bg-sand/10">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-coral/20 rounded-full flex items-center justify-center">
                <HelpCircle className="w-8 h-8 text-coral" />
              </div>
            </div>
            <h2 className="type-heading-primary text-charcoal">
              {t('faq.title')}
            </h2>
          </div>
          
          {/* FAQ Accordion */}
          <div className="bg-white rounded-lg p-6 lg:p-8 shadow-sm">
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
    </section>
  )
}