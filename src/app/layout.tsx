import type { Metadata } from "next";
import ReactLenis from 'lenis/react'
import { AuthProvider } from '@/contexts/AuthContext'
import "./globals.css";

export const metadata: Metadata = {
  title: "Enrique Velasco & Manuel Sanz - 30 de Mayo, 2025",
  description: "Únete a nuestra celebración de boda en la playa de Tarifa, España",
  keywords: ["boda", "wedding", "Tarifa", "España", "Enrique", "Manuel", "matrimonio", "celebración"],
  authors: [{ name: "Enrique Velasco" }, { name: "Manuel Sanz" }],
  creator: "Enrique Velasco",
  publisher: "Enrique Velasco",

    
  // Alternate languages if you plan to support multiple languages
  alternates: {
    canonical: "https://bodaentarifa.com", // Update with your actual domain
    languages: {
      "es-ES": "https://bodaentarifa.com",
      // "en-US": "https://boda-en-tarifa.com/en", // Add if you support English
    },
  },
  
  // Open Graph metadata for social sharing
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://bodaentarifa.com", // Update with your actual domain
    title: "Enrique & Manuel - 30 de Mayo, 2025",
    description: "Únete a nuestra celebración de boda en la playa de Tarifa, España",
    siteName: "Boda Enrique & Manuel",
    images: [
      {
        url: "https://bodaentarifa.com/images/OG_EnriqueyManuel.jpg",
        width: 1200,
        height: 630,
        alt: "Enrique & Manuel - Invitación de Boda",
        type: "image/jpeg",
      },
    ],
  },
  
  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "Enrique & Manuel - 30 de Mayo, 2025",
    description: "Únete a nuestra celebración de boda en la playa de Tarifa, España",
    images: ["https://bodaentarifa.com/images/OG_EnriqueyManuel.jpg"],
    creator: "@enriqueymanuel", // Update with actual Twitter handle if available
  },
  
  // Additional metadata
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={'antialiased'} suppressHydrationWarning={true}>
        <AuthProvider>
          <ReactLenis root>{children}</ReactLenis>
        </AuthProvider>
      </body>
    </html>
  );
}
