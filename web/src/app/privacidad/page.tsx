import type { Metadata } from 'next'
import { Navigation } from '@/components/Navigation'
import { PrivacyPolicyContent } from '@/components/legal/PrivacyPolicyContent'

export const metadata: Metadata = {
  title: 'Politica de Privacidad — Bot Boda en Tarifa',
  description:
    'Politica de privacidad del bot de WhatsApp Thora para la boda Enrique y Manuel en Tarifa: datos recogidos, proveedores, retencion y derechos.',
  alternates: {
    canonical: 'https://bodaentarifa.com/privacidad',
  },
  openGraph: {
    type: 'article',
    locale: 'es_ES',
    url: 'https://bodaentarifa.com/privacidad',
    title: 'Politica de Privacidad — Bot Boda en Tarifa',
    description:
      'Como el bot de WhatsApp trata tus datos personales durante la boda en Tarifa.',
    siteName: 'Boda Enrique & Manuel',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PrivacidadPage() {
  return (
    <>
      <Navigation anchorPrefix="/" />
      <main className="min-h-screen bg-cream pt-24 pb-16 md:pt-28 md:pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <PrivacyPolicyContent />
        </div>
      </main>
    </>
  )
}
