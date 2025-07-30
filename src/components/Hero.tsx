'use client'

import React, { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Hero() {
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
      {/* Background Images */}
      <div className="absolute inset-0 w-full h-full">
        {/* Desktop/Tablet Background */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat hidden md:block"
          style={{
            backgroundImage: 'url(/images/hero-desktop.jpg)'
          }}
        />
        
        {/* Mobile Background */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat block md:hidden"
          style={{
            backgroundImage: 'url(/images/hero-mobile.jpg)'
          }}
        />
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 text-white">
        {/* <div className={cn(
          "transition-all duration-1000 delay-300",
          isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        )}>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4">
            {content.hero.names}
          </h1>
          <p className="text-xl md:text-2xl mb-2 opacity-90">
            {content.hero.greeting}
          </p>
          <p className="text-lg md:text-xl opacity-80">
            {new Date(content.hero.date).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })} • {content.hero.location}
          </p>
        </div> */}
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
        <ChevronDown className="w-8 h-8 text-white/70 animate-bounce hover:text-white transition-colors" />
      </button>
    </section>
  )
}