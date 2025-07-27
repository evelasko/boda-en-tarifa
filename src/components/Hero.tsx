'use client'

import React, { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Hero() {
  const { t } = useLanguage()
  const [isLoaded, setIsLoaded] = useState(false)
  
  useEffect(() => {
    setIsLoaded(true)
  }, [])
  
  const scrollToNext = () => {
    const storySection = document.getElementById('story')
    if (storySection) {
      storySection.scrollIntoView({ behavior: 'smooth' })
    }
  }
  
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Layered Mural Background */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-sand/20 via-cream to-cream" />
        
        {/* Painted mural layers */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
          {/* Background layer - large leaves */}
          <g className="opacity-10">
            <path d="M0,300 Q200,200 400,250 T800,200 L800,600 L0,600 Z" fill="currentColor" className="text-sage" />
            <path d="M800,400 Q600,300 400,350 T0,300 L0,600 L800,600 Z" fill="currentColor" className="text-ocean" />
          </g>
          
          {/* Middle layer - botanical elements */}
          <g className="opacity-20">
            <circle cx="150" cy="200" r="80" fill="currentColor" className="text-coral/30" />
            <circle cx="650" cy="350" r="100" fill="currentColor" className="text-sage/40" />
            <path d="M300,100 Q350,200 300,300 Q250,200 300,100" fill="currentColor" className="text-sage" />
            <path d="M500,250 Q550,350 500,450 Q450,350 500,250" fill="currentColor" className="text-ocean" />
          </g>
          
          {/* Foreground layer - decorative flourishes */}
          <g className="opacity-30">
            <path d="M100,500 Q150,450 200,500 T300,500" stroke="currentColor" strokeWidth="2" fill="none" className="text-gold" />
            <path d="M500,150 Q550,100 600,150 T700,150" stroke="currentColor" strokeWidth="2" fill="none" className="text-coral" />
          </g>
        </svg>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-4">
        {/* Animated greeting */}
        <h2 className={cn(
          "type-body-lead text-coral mb-6 transition-all duration-1000 transform",
          isLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          {t('hero.greeting')}
        </h2>
        
        {/* Names in ornamental frame */}
        <div className={cn(
          "relative mb-8 transition-all duration-1000 delay-300 transform",
          isLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          {/* Ornamental frame */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 120">
            <path
              d="M50,10 Q20,10 20,40 Q20,60 50,60 L350,60 Q380,60 380,40 Q380,10 350,10 L50,10"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              className="text-gold"
            />
            <path
              d="M10,30 L30,30 M370,30 L390,30 M10,40 L30,40 M370,40 L390,40"
              stroke="currentColor"
              strokeWidth="1"
              className="text-gold"
            />
          </svg>
          
          <h1 className="type-display-huge text-charcoal relative z-10 py-8">
            {t('hero.names')}
          </h1>
        </div>
        
        {/* Date and location */}
        <div className={cn(
          "space-y-2 transition-all duration-1000 delay-500 transform",
          isLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          <p className="type-heading-secondary text-charcoal">
            {t('hero.date')}
          </p>
          <p className="type-body-lead text-charcoal/80">
            {t('hero.location')}
          </p>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <button
        onClick={scrollToNext}
        className={cn(
          "absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-1000 delay-700",
          isLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}
        aria-label="Scroll to next section"
      >
        <ChevronDown className="w-8 h-8 text-charcoal/50 animate-bounce" />
      </button>
    </section>
  )
}