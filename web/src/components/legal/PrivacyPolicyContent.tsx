import Link from 'next/link'

const PRIVACY_EMAIL = 'enrique.prez.velasco@gmail.com'
const PRIVACY_URL = 'https://bodaentarifa.com/privacidad'

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-10" aria-labelledby={id}>
      <h2 id={id} className="type-heading-4 text-charcoal mb-4">
        {title}
      </h2>
      <div className="space-y-4 type-body-base text-charcoal/85">{children}</div>
    </section>
  )
}

function BulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-coral/70">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

function PrivacyEmailLink() {
  return (
    <a
      href={`mailto:${PRIVACY_EMAIL}`}
      className="text-ocean underline underline-offset-2 hover:text-ocean/80"
    >
      {PRIVACY_EMAIL}
    </a>
  )
}

export function PrivacyPolicyContent() {
  return (
    <article className="privacy-policy">
      <header className="mb-12 border-b border-charcoal/10 pb-8">
        <p className="type-body-small text-charcoal/60 mb-3">Bot de WhatsApp · Thora al habla</p>
        <h1 className="type-heading-2 text-charcoal mb-4">
          Politica de Privacidad del Bot Thora al habla
        </h1>
        <p className="type-body-small text-charcoal/60">Ultima actualizacion: 21 de mayo de 2026</p>
        <p className="type-body-lead text-charcoal/80 mt-6">
          Esta Politica de Privacidad explica como el bot de WhatsApp &ldquo;Thora al habla&rdquo;
          (&ldquo;Thora&rdquo;) trata los datos personales cuando los invitados interactuan con el.
        </p>
        <p className="type-body-base text-charcoal/80 mt-4">
          Se trata de un proyecto privado, para un unico evento, creado por la pareja para
          coordinar la boda y comunicarse con los invitados. Aun asi, aplicamos un estandar alto de
          privacidad y seguridad.
        </p>
      </header>

      <Section id="quien" title="1) Quien controla estos datos">
        <BulletList
          items={[
            <>
              <strong>Responsables del tratamiento (en este proyecto):</strong> Enrique y Manuel
              (la pareja).
            </>,
            <>
              <strong>Contacto para solicitudes de privacidad:</strong>{' '}
              <PrivacyEmailLink />
            </>,
          ]}
        />
      </Section>

      <Section id="que-hace" title="2) Que hace este bot">
        <p>El bot ayuda a los invitados con:</p>
        <BulletList
          items={[
            'Logistica y recordatorios de eventos.',
            'RSVP y formularios estructurados (WhatsApp Flows).',
            'Envio opcional de fotos/videos para el album de la boda.',
            'Escalado a un operador humano cuando sea necesario.',
          ]}
        />
        <p>No es un servicio de marketing ni de publicidad.</p>
      </Section>

      <Section id="datos" title="3) Que datos recogemos">
        <p>Segun como interactues, podemos tratar:</p>
        <BulletList
          items={[
            <>
              <strong>Datos de identidad y contacto:</strong> numero de telefono, nombre/apellidos,
              idioma preferido.
            </>,
            <>
              <strong>Datos de participacion en la boda:</strong> respuestas RSVP, elecciones de
              asistencia a eventos, notas dieteticas/de accesibilidad.
            </>,
            <>
              <strong>Datos de conversacion:</strong> mensajes enviados/recibidos con el bot y
              metadatos de interaccion.
            </>,
            <>
              <strong>Datos multimedia:</strong> fotos/videos enviados por WhatsApp, con banderas de
              moderacion y consentimiento.
            </>,
            <>
              <strong>Datos operativos/de seguridad:</strong> antiabuso, estado de entrega, errores
              y eventos de auditoria.
            </>,
            <>
              <strong>Datos opcionales de personalizacion:</strong> datos internos limitados de
              dosieres de invitados (para mejorar contexto y acuses de foto), incluidas fotos de
              referencia si se facilitaron directamente a la pareja.
            </>,
          ]}
        />
      </Section>

      <Section id="finalidad" title="4) Para que tratamos estos datos">
        <p>Tratamos los datos para:</p>
        <BulletList
          items={[
            'Coordinar la logistica de la boda y la comunicacion con invitados.',
            'Responder preguntas de invitados en espanol/ingles.',
            'Recoger informacion estructurada para la organizacion del evento.',
            'Moderar y publicar contenido del album solo cuando el consentimiento lo permita.',
            'Proteger el servicio frente a usos indebidos y amenazas de seguridad.',
          ]}
        />
        <p>
          <strong>No</strong> vendemos datos personales ni los usamos para publicidad
          comportamental.
        </p>
      </Section>

      <Section id="base-juridica" title="5) Base juridica">
        <p>En este contexto de evento personal, el tratamiento se apoya principalmente en:</p>
        <BulletList
          items={[
            <>
              <strong>Consentimiento</strong> (para participar en comunicaciones del bot y compartir
              contenido opcional).
            </>,
            <>
              <strong>Interes legitimo organizativo</strong> para ejecutar la logistica del evento de
              forma segura y fiable.
            </>,
          ]}
        />
        <p>
          Si no quieres seguir participando, puedes darte de baja en cualquier momento (ver Seccion
          10).
        </p>
      </Section>

      <Section id="proveedores" title="6) Proveedores y destinatarios de datos">
        <p>Para operar el bot, los datos pueden ser tratados por:</p>
        <BulletList
          items={[
            <>
              <strong>Meta (WhatsApp Cloud API)</strong> — transporte de mensajeria y entrega de
              plantillas/Flows.
            </>,
            <>
              <strong>Google Firebase (Firestore, Functions, logs)</strong> — procesamiento backend
              y almacenamiento.
            </>,
            <>
              <strong>Anthropic (Claude)</strong> — comprension del lenguaje y generacion de
              respuestas.
            </>,
            <>
              <strong>Cloudinary</strong> — almacenamiento multimedia y flujo de moderacion de
              fotos/videos enviados por invitados.
            </>,
            <>
              <strong>Open-Meteo</strong> — consulta meteorologica (utilidad no comercial).
            </>,
          ]}
        />
        <p>Limitamos el acceso a operadores autorizados.</p>
      </Section>

      <Section id="transferencias" title="7) Transferencias internacionales">
        <p>Algunos proveedores pueden procesar datos fuera de tu pais. En particular:</p>
        <BulletList
          items={[
            'Los proveedores de mensajeria y nube pueden procesar datos entre distintas regiones.',
            'El procesamiento de IA puede implicar infraestructura en EE. UU.',
          ]}
        />
        <p>
          Minimizamos los datos compartidos, usamos proveedores reconocidos y aplicamos controles
          estrictos de acceso.
        </p>
      </Section>

      <Section id="seguridad" title="8) Medidas de seguridad">
        <p>Aplicamos controles por capas, incluyendo:</p>
        <BulletList
          items={[
            'Verificacion de firma del webhook para rechazar peticiones entrantes falsificadas.',
            'Logica estricta de lista de permitidos (allowlist) para interacciones.',
            'Acceso admin solo para operadores autenticados con rol.',
            'Limites de velocidad, control antiabuso y deduplicacion.',
            'Gestion de secretos fuera del codigo fuente.',
            'Minimizacion de datos en logs (por ejemplo, telefono redactado en logs operativos).',
            'Flujo de moderacion para multimedia antes de cualquier publicacion en album.',
          ]}
        />
        <p>
          Ningun sistema es 100% libre de riesgo, pero estos controles estan disenados para reducir
          la exposicion de forma material.
        </p>
      </Section>

      <Section id="retencion" title="9) Retencion">
        <p>Ventanas de retencion por defecto:</p>
        <BulletList
          items={[
            <>
              <strong>Historial de conversaciones:</strong> hasta 90 dias despues de la boda; luego
              se elimina/anonimiza.
            </>,
            <>
              <strong>Registros antiabuso de remitentes desconocidos:</strong> retencion operativa
              corta.
            </>,
            <>
              <strong>Registros de auditoria/seguridad:</strong> retencion mas larga cuando sea
              necesaria para trazabilidad.
            </>,
            <>
              <strong>Multimedia aprobada en album:</strong> puede conservarse mas tiempo para el
              album, salvo solicitud de borrado.
            </>,
            <>
              <strong>Datos internos de dosieres/fotos de referencia:</strong> se tratan como
              sensibles internos y se purgan en la fase de desmantelamiento post-evento.
            </>,
          ]}
        />
        <p>
          Podemos conservar agregados anonimizados limitados para estadisticas basicas del proyecto.
        </p>
      </Section>

      <Section id="derechos" title="10) Tus opciones y derechos">
        <p>Puedes:</p>
        <BulletList
          items={[
            <>
              <strong>Darte de baja al instante</strong> enviando:{' '}
              <code className="rounded bg-charcoal/5 px-1.5 py-0.5 text-sm">stop</code>,{' '}
              <code className="rounded bg-charcoal/5 px-1.5 py-0.5 text-sm">parar</code>,{' '}
              <code className="rounded bg-charcoal/5 px-1.5 py-0.5 text-sm">darme de baja</code>,{' '}
              <code className="rounded bg-charcoal/5 px-1.5 py-0.5 text-sm">unsubscribe</code>,{' '}
              <code className="rounded bg-charcoal/5 px-1.5 py-0.5 text-sm">no more</code> o
              similar.
            </>,
            <>
              <strong>Solicitar borrado</strong> de tus datos.
            </>,
            <>
              <strong>Solicitar acceso/correccion</strong> de tus datos.
            </>,
            <>
              <strong>Hacer consultas</strong> sobre como se tratan tus datos.
            </>,
          ]}
        />
        <p>
          Para ejercer derechos, contacta en: <PrivacyEmailLink />
        </p>
        <p>
          Atenderemos las solicitudes con la mayor rapidez razonable para un servicio de escala
          evento.
        </p>
      </Section>

      <Section id="multimedia" title="11) Multimedia y consentimiento">
        <BulletList
          items={[
            'El contenido multimedia que envias pasa por un flujo de moderacion.',
            'Si falta consentimiento para publicar o este se deniega, ese contenido se mantiene privado y no se publica en el album compartido.',
            'Si hay consentimiento, el contenido aprobado puede aparecer en el album de la boda.',
          ]}
        />
      </Section>

      <Section id="menores" title="12) Menores y datos sensibles">
        <p>
          Este bot no esta pensado para recoger categorias especiales de datos. Evita compartir por
          chat informacion medica, legal, financiera u otra especialmente confidencial, salvo que sea
          estrictamente necesaria para la logistica del evento.
        </p>
        <p>
          Si aparecen menores en contenido compartido, las decisiones de publicacion siguen sujetas
          a moderacion y controles de consentimiento.
        </p>
      </Section>

      <Section id="cambios" title="13) Cambios en esta politica">
        <p>
          Podemos actualizar esta politica para reflejar cambios operativos o legales. La version
          mas reciente se publicara en:
        </p>
        <p>
          <Link
            href="/privacidad"
            className="text-ocean underline underline-offset-2 hover:text-ocean/80 break-all"
          >
            {PRIVACY_URL}
          </Link>
        </p>
        <p>
          Para cambios sustanciales, usaremos medios razonables para informar a los invitados cuando
          sea practicable.
        </p>
      </Section>

      <section className="mb-4" aria-labelledby="aviso-corto">
        <h2 id="aviso-corto" className="type-heading-4 text-charcoal mb-4">
          14) Aviso corto (para mensajes de onboarding)
        </h2>
        <blockquote className="rounded-lg border border-charcoal/10 bg-white/60 px-5 py-4 type-body-base text-charcoal/85 italic">
          Al usar este bot, aceptas que tus mensajes se procesen para coordinar la boda por Enrique
          y Manuel, usando WhatsApp (Meta), Firebase (Google), Anthropic (Claude) y Cloudinary.
          Puedes darte de baja en cualquier momento respondiendo &ldquo;stop&rdquo;, y puedes
          solicitar borrado en <PrivacyEmailLink />.
        </blockquote>
      </section>
    </article>
  )
}
