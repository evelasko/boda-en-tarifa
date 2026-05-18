import type { Metadata } from 'next'
import { Navigation } from '@/components/Navigation'
import { EventsTimelineList } from '@/components/EventsTimelineList'

export const metadata: Metadata = {
  title: 'Eventos — Enrique & Manuel',
  description: 'Programa de eventos de la boda en Tarifa: fechas, horarios y ubicaciones.',
}

export default function EventosPage() {
  return (
    <>
      <Navigation anchorPrefix="/" />
      <main>
        <EventsTimelineList variant="standalone" />
      </main>
    </>
  )
}
