'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  const navLinks = [
    { href: '#home', label: 'Inicio' },
    { href: '#events', label: 'Eventos' },
    { href: '#travel', label: 'Viaje' },
    { href: '#accommodations', label: 'Alojamiento' },
    { href: '#faq', label: 'FAQ' },
    { href: '#gifts', label: 'Regalos' },
    { href: '#contact', label: 'Contacto' },
  ]
  
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const id = href.substring(1)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsMobileMenuOpen(false)
    }
  }
  
  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      isScrolled ? 'bg-cream/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="type-heading-ornamental text-charcoal">
            E&M
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className="type-ui-label text-charcoal hover:text-coral transition-colors"
              >
                {link.label}
              </a>
            ))}
            
            {/* RSVP Button */}
            <Link
              href="/rsvp"
              className="px-6 py-2 bg-coral text-cream rounded-full hover:bg-coral/90 transition-colors type-ui-label"
            >
              RSVP
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-charcoal" />
            ) : (
              <Menu className="w-6 h-6 text-charcoal" />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div className={cn(
        'lg:hidden fixed inset-x-0 top-16 bg-cream/95 backdrop-blur-md transition-all duration-300 transform',
        isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      )}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className="type-ui-label text-charcoal hover:text-coral transition-colors py-2"
              >
                {link.label}
              </a>
            ))}
            
            <Link
              href="/rsvp"
              className="px-6 py-3 bg-coral text-cream rounded-full hover:bg-coral/90 transition-colors type-ui-label text-center mt-4"
            >
              RSVP
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}