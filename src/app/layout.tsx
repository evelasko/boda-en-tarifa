import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Enrique & Manuel - 30 de Mayo, 2025",
  description: "Únete a nuestra celebración de boda en la playa de Tarifa, España",
  keywords: ["boda", "wedding", "Tarifa", "España", "Enrique", "Manuel", "matrimonio", "celebración"],
  authors: [{ name: "Enrique & Manuel" }],
  creator: "Enrique & Manuel",
  publisher: "Enrique & Manuel",
  
  // Open Graph metadata for social sharing
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://boda-en-tarifa.com", // Update with your actual domain
    title: "Enrique & Manuel - 30 de Mayo, 2025",
    description: "Únete a nuestra celebración de boda en la playa de Tarifa, España",
    siteName: "Boda Enrique & Manuel",
    images: [
      {
        url: "/images/OG_EnriqueyManuel.jpg",
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
    images: ["/images/OG_EnriqueyManuel.jpg"],
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
  
  // Alternate languages if you plan to support multiple languages
  alternates: {
    canonical: "https://bodaentarifa.com", // Update with your actual domain
    languages: {
      "es-ES": "https://bodaentarifa.com",
      // "en-US": "https://boda-en-tarifa.com/en", // Add if you support English
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
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/tqk3qdr.css" precedence="default" />
      </head>
      <body className={'antialiased'} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
