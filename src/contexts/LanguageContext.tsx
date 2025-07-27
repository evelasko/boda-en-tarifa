'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

export type Language = 'en' | 'es'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  en: {
    // Hero
    'hero.greeting': 'We are getting married!',
    'hero.names': 'Enrique & Manuel',
    'hero.date': 'May 30, 2025',
    'hero.location': 'Tarifa, Spain',
    
    // Navigation
    'nav.home': 'Home',
    'nav.events': 'Events',
    'nav.travel': 'Travel',
    'nav.accommodations': 'Stay',
    'nav.rsvp': 'RSVP',
    'nav.faq': 'FAQ',
    'nav.gifts': 'Gifts',
    'nav.contact': 'Contact',
    
    // Our Story
    'story.title': 'Our Story',
    'story.content': 'Join us for a three-day celebration of love on the beaches of Tarifa. From intimate gatherings to dancing under the stars, we invite you to share in our joy as we begin this new chapter together.',
    
    // Events
    'events.title': 'Wedding Events',
    'events.early_welcome.title': 'Early Welcome',
    'events.early_welcome.date': 'May 29, 2025',
    'events.early_welcome.time': '3:00 PM',
    'events.pre_wedding.title': 'Pre-Wedding Party',
    'events.pre_wedding.date': 'May 30, 2025',
    'events.pre_wedding.time': '9:00 PM',
    'events.ceremony.title': 'Wedding Ceremony',
    'events.ceremony.date': 'May 30, 2025',
    'events.ceremony.time': '5:00 PM',
    'events.celebration.title': 'Wedding Celebration',
    'events.celebration.date': 'May 30, 2025',
    'events.celebration.time': '7:00 PM',
    'events.post_wedding.title': 'Post-Wedding Brunch',
    'events.post_wedding.date': 'May 31, 2025',
    'events.post_wedding.time': '2:00 PM',
    'events.view_map': 'View Map',
    
    // RSVP
    'rsvp.title': 'Join Us',
    'rsvp.subtitle': 'Please let us know if you can celebrate with us',
    'rsvp.deadline': 'RSVP by April 30, 2025',
    'rsvp.button': 'RSVP Now',
    
    // Travel
    'travel.title': 'Getting There',
    'travel.by_car': 'By Car',
    'travel.by_train': 'By Train',
    'travel.by_air': 'By Air',
    'travel.carpool': 'Carpool Available',
    'travel.duration': 'Duration',
    'travel.cost': 'Cost',
    'travel.route': 'Route',
    
    // Accommodations
    'accommodations.title': 'Where to Stay',
    'accommodations.featured': 'Featured Hotel',
    'accommodations.book_now': 'Book Now',
    'accommodations.coming_soon': 'Coming Soon',
    'accommodations.subscribe': 'Subscribe for Updates',
    'accommodations.discount': 'Special wedding rate',
    
    // Practical Info
    'practical.title': 'What You Need to Know',
    'practical.dress_code': 'What to Wear',
    'practical.weather': 'Weather',
    'practical.getting_around': 'Getting Around',
    'practical.bus_schedule': 'Bus Schedule',
    
    // Wedding Party
    'party.title': 'Wedding Party',
    'party.officiant': 'Officiant',
    'party.persons_of_honor': 'Persons of Honor',
    'party.flower_kids': 'Flower Kids',
    'party.ring_bearer': 'Ring Bearer',
    
    // Gifts
    'gifts.title': 'Gifts',
    'gifts.content': 'Your presence is the greatest gift. If you wish to contribute to our honeymoon fund, here are the options:',
    'gifts.bank': 'Bank Transfer',
    'gifts.bizum': 'Bizum',
    'gifts.crypto': 'Crypto',
    
    // FAQ
    'faq.title': 'Frequently Asked Questions',
    
    // Contact
    'contact.title': 'Get in Touch',
    'contact.whatsapp': 'Join WhatsApp Group',
  },
  es: {
    // Hero
    'hero.greeting': '¡Nos casamos!',
    'hero.names': 'Enrique & Manuel',
    'hero.date': '30 de Mayo, 2025',
    'hero.location': 'Tarifa, España',
    
    // Navigation
    'nav.home': 'Inicio',
    'nav.events': 'Eventos',
    'nav.travel': 'Viaje',
    'nav.accommodations': 'Alojamiento',
    'nav.rsvp': 'RSVP',
    'nav.faq': 'FAQ',
    'nav.gifts': 'Regalos',
    'nav.contact': 'Contacto',
    
    // Our Story
    'story.title': 'Nuestra Historia',
    'story.content': 'Únete a nosotros para una celebración de tres días de amor en las playas de Tarifa. Desde reuniones íntimas hasta bailar bajo las estrellas, te invitamos a compartir nuestra alegría mientras comenzamos este nuevo capítulo juntos.',
    
    // Events
    'events.title': 'Eventos de la Boda',
    'events.early_welcome.title': 'Bienvenida Temprana',
    'events.early_welcome.date': '29 de Mayo, 2025',
    'events.early_welcome.time': '15:00',
    'events.pre_wedding.title': 'Fiesta Pre-Boda',
    'events.pre_wedding.date': '30 de Mayo, 2025',
    'events.pre_wedding.time': '21:00',
    'events.ceremony.title': 'Ceremonia de Boda',
    'events.ceremony.date': '30 de Mayo, 2025',
    'events.ceremony.time': '17:00',
    'events.celebration.title': 'Celebración de Boda',
    'events.celebration.date': '30 de Mayo, 2025',
    'events.celebration.time': '19:00',
    'events.post_wedding.title': 'Brunch Post-Boda',
    'events.post_wedding.date': '31 de Mayo, 2025',
    'events.post_wedding.time': '14:00',
    'events.view_map': 'Ver Mapa',
    
    // RSVP
    'rsvp.title': 'Únete a Nosotros',
    'rsvp.subtitle': 'Por favor, haznos saber si puedes celebrar con nosotros',
    'rsvp.deadline': 'RSVP antes del 30 de Abril, 2025',
    'rsvp.button': 'Confirmar Asistencia',
    
    // Travel
    'travel.title': 'Cómo Llegar',
    'travel.by_car': 'En Coche',
    'travel.by_train': 'En Tren',
    'travel.by_air': 'En Avión',
    'travel.carpool': 'Compartir Coche Disponible',
    'travel.duration': 'Duración',
    'travel.cost': 'Costo',
    'travel.route': 'Ruta',
    
    // Accommodations
    'accommodations.title': 'Dónde Alojarse',
    'accommodations.featured': 'Hotel Destacado',
    'accommodations.book_now': 'Reservar Ahora',
    'accommodations.coming_soon': 'Próximamente',
    'accommodations.subscribe': 'Suscríbete para Actualizaciones',
    'accommodations.discount': 'Tarifa especial de boda',
    
    // Practical Info
    'practical.title': 'Lo Que Necesitas Saber',
    'practical.dress_code': 'Qué Ponerse',
    'practical.weather': 'Clima',
    'practical.getting_around': 'Cómo Moverse',
    'practical.bus_schedule': 'Horario de Autobuses',
    
    // Wedding Party
    'party.title': 'Cortejo de Boda',
    'party.officiant': 'Oficiante',
    'party.persons_of_honor': 'Personas de Honor',
    'party.flower_kids': 'Niños de las Flores',
    'party.ring_bearer': 'Portador de Anillos',
    
    // Gifts
    'gifts.title': 'Regalos',
    'gifts.content': 'Lo importante es que vengan, aunque nos encanta viajar, y si quisieran que lleguemos más lejos pueden contribuir a través de:',
    'gifts.bank': 'Transferencia Bancaria',
    'gifts.bizum': 'Bizum',
    'gifts.crypto': 'Crypto',
    
    // FAQ
    'faq.title': 'Preguntas Frecuentes',
    
    // Contact
    'contact.title': 'Contacto',
    'contact.whatsapp': 'Unirse al Grupo de WhatsApp',
  }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')
  
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key
  }
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}