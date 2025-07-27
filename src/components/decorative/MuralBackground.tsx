'use client';

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface MuralBackgroundProps {
  layers?: ('coral' | 'monstera' | 'palm' | 'wave')[];
  className?: string;
  children?: React.ReactNode;
}

export const MuralBackground: React.FC<MuralBackgroundProps> = ({
  layers = ['coral', 'monstera'],
  className = '',
  children,
}) => {
  const { scrollY } = useScroll();
  
  // Parallax transforms for different layers
  const layer1Y = useTransform(scrollY, [0, 1000], [0, -150]);
  const layer2Y = useTransform(scrollY, [0, 1000], [0, -100]);
  const layer3Y = useTransform(scrollY, [0, 1000], [0, -50]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-ocean)] via-[var(--color-sand)] to-[var(--color-cream)]" />
      
      {/* Watercolor texture overlay */}
      <div 
        className="absolute inset-0 opacity-30 mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
          filter: 'sepia(10%) saturate(0.8) hue-rotate(10deg)',
        }}
      />
      
      {/* Layer 1: Background flora */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ y: layer1Y }}
      >
        <svg 
          className="absolute -bottom-20 -left-20 w-96 h-96 text-[var(--color-sage)] opacity-20"
          viewBox="0 0 400 400"
          fill="currentColor"
        >
          {/* Simplified monstera leaf */}
          <path d="M200 50 Q150 100 120 150 Q100 200 120 250 Q150 300 200 350 Q250 300 280 250 Q300 200 280 150 Q250 100 200 50 M160 150 Q180 170 200 150 Q220 170 240 150 M160 250 Q180 230 200 250 Q220 230 240 250" />
        </svg>
      </motion.div>
      
      {/* Layer 2: Mid-ground marine elements */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ y: layer2Y }}
      >
        <svg 
          className="absolute -bottom-10 -right-20 w-80 h-80 text-[var(--color-coral)] opacity-25"
          viewBox="0 0 300 300"
          fill="currentColor"
        >
          {/* Simplified coral */}
          <circle cx="150" cy="250" r="20" />
          <circle cx="130" cy="230" r="15" />
          <circle cx="170" cy="230" r="15" />
          <circle cx="150" cy="210" r="12" />
          <path d="M150 250 Q140 200 150 150 Q160 200 150 250" strokeWidth="8" stroke="currentColor" fill="none" />
        </svg>
      </motion.div>
      
      {/* Layer 3: Foreground decorative elements */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ y: layer3Y }}
      >
        {/* Art nouveau style border */}
        <svg 
          className="absolute top-0 left-0 w-full h-32"
          viewBox="0 0 1200 128"
          preserveAspectRatio="none"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.3"
        >
          <path 
            d="M0,64 Q300,32 600,64 T1200,64" 
            className="text-[var(--color-gold)]"
          />
          <path 
            d="M0,96 Q300,64 600,96 T1200,96" 
            className="text-[var(--color-gold)]"
          />
        </svg>
      </motion.div>
      
      {/* Content layer */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Painted effect overlay */}
      <div 
        className="absolute inset-0 pointer-events-none mix-blend-soft-light opacity-50"
        style={{
          backgroundImage: `url("https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1920&q=80&blur=20")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(40px)',
        }}
      />
    </div>
  );
};