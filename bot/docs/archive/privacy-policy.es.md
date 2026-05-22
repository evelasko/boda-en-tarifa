# Politica de Privacidad del Bot Boda en Tarifa

Ultima actualizacion: 2026-05-21

Esta Politica de Privacidad explica como el bot de WhatsApp "Boda en Tarifa" ("Thora") trata los datos personales cuando los invitados interactuan con el.

Se trata de un proyecto privado, para un unico evento, creado por la pareja para coordinar la boda y comunicarse con los invitados. Aun asi, aplicamos un estandar alto de privacidad y seguridad.

## 1) Quien controla estos datos

- **Responsables del tratamiento (en este proyecto):** Enrique y Manuel (la pareja).
- **Contacto para solicitudes de privacidad:** [enrique.prez.velasco@gmail.com](mailto:enrique.prez.velasco@gmail.com)

## 2) Que hace este bot

El bot ayuda a los invitados con:

- Logistica y recordatorios de eventos.
- RSVP y formularios estructurados (WhatsApp Flows).
- Envio opcional de fotos/videos para el album de la boda.
- Escalado a un operador humano cuando sea necesario.

No es un servicio de marketing ni de publicidad.

## 3) Que datos recogemos

Segun como interactues, podemos tratar:

- **Datos de identidad y contacto:** numero de telefono, nombre/apellidos, idioma preferido.
- **Datos de participacion en la boda:** respuestas RSVP, elecciones de asistencia a eventos, notas dieteticas/de accesibilidad.
- **Datos de conversacion:** mensajes enviados/recibidos con el bot y metadatos de interaccion.
- **Datos multimedia:** fotos/videos enviados por WhatsApp, con banderas de moderacion y consentimiento.
- **Datos operativos/de seguridad:** antiabuso, estado de entrega, errores y eventos de auditoria.
- **Datos opcionales de personalizacion:** datos internos limitados de dosieres de invitados (para mejorar contexto y acuses de foto), incluidas fotos de referencia si se facilitaron directamente a la pareja.

## 4) Para que tratamos estos datos

Tratamos los datos para:

- Coordinar la logistica de la boda y la comunicacion con invitados.
- Responder preguntas de invitados en espanol/ingles.
- Recoger informacion estructurada para la organizacion del evento.
- Moderar y publicar contenido del album solo cuando el consentimiento lo permita.
- Proteger el servicio frente a usos indebidos y amenazas de seguridad.

**No** vendemos datos personales ni los usamos para publicidad comportamental.

## 5) Base juridica

En este contexto de evento personal, el tratamiento se apoya principalmente en:

- **Consentimiento** (para participar en comunicaciones del bot y compartir contenido opcional).
- **Interes legitimo organizativo** para ejecutar la logistica del evento de forma segura y fiable.

Si no quieres seguir participando, puedes darte de baja en cualquier momento (ver Seccion 10).

## 6) Proveedores y destinatarios de datos

Para operar el bot, los datos pueden ser tratados por:

- **Meta (WhatsApp Cloud API)** - transporte de mensajeria y entrega de plantillas/Flows.
- **Google Firebase (Firestore, Functions, logs)** - procesamiento backend y almacenamiento.
- **Anthropic (Claude)** - comprension del lenguaje y generacion de respuestas.
- **Cloudinary** - almacenamiento multimedia y flujo de moderacion de fotos/videos enviados por invitados.
- **Open-Meteo** - consulta meteorologica (utilidad no comercial).

Limitamos el acceso a operadores autorizados.

## 7) Transferencias internacionales

Algunos proveedores pueden procesar datos fuera de tu pais. En particular:

- Los proveedores de mensajeria y nube pueden procesar datos entre distintas regiones.
- El procesamiento de IA puede implicar infraestructura en EE. UU.

Minimizamos los datos compartidos, usamos proveedores reconocidos y aplicamos controles estrictos de acceso.

## 8) Medidas de seguridad

Aplicamos controles por capas, incluyendo:

- Verificacion de firma del webhook para rechazar peticiones entrantes falsificadas.
- Logica estricta de lista de permitidos (allowlist) para interacciones.
- Acceso admin solo para operadores autenticados con rol.
- Limites de velocidad, control antiabuso y deduplicacion.
- Gestion de secretos fuera del codigo fuente.
- Minimizacion de datos en logs (por ejemplo, telefono redactado en logs operativos).
- Flujo de moderacion para multimedia antes de cualquier publicacion en album.

Ningun sistema es 100% libre de riesgo, pero estos controles estan disenados para reducir la exposicion de forma material.

## 9) Retencion

Ventanas de retencion por defecto:

- **Historial de conversaciones:** hasta 90 dias despues de la boda; luego se elimina/anonimiza.
- **Registros antiabuso de remitentes desconocidos:** retencion operativa corta.
- **Registros de auditoria/seguridad:** retencion mas larga cuando sea necesaria para trazabilidad.
- **Multimedia aprobada en album:** puede conservarse mas tiempo para el album, salvo solicitud de borrado.
- **Datos internos de dosieres/fotos de referencia:** se tratan como sensibles internos y se purgan en la fase de desmantelamiento post-evento.

Podemos conservar agregados anonimizados limitados para estadisticas basicas del proyecto.

## 10) Tus opciones y derechos

Puedes:

- **Darte de baja al instante** enviando: `stop`, `parar`, `darme de baja`, `unsubscribe`, `no more` o similar.
- **Solicitar borrado** de tus datos.
- **Solicitar acceso/correccion** de tus datos.
- **Hacer consultas** sobre como se tratan tus datos.

Para ejercer derechos, contacta en: [enrique.prez.velasco@gmail.com](mailto:enrique.prez.velasco@gmail.com)

Atenderemos las solicitudes con la mayor rapidez razonable para un servicio de escala evento.

## 11) Multimedia y consentimiento

- El contenido multimedia que envias pasa por un flujo de moderacion.
- Si falta consentimiento para publicar o este se deniega, ese contenido se mantiene privado y no se publica en el album compartido.
- Si hay consentimiento, el contenido aprobado puede aparecer en el album de la boda.

## 12) Menores y datos sensibles

Este bot no esta pensado para recoger categorias especiales de datos. Evita compartir por chat informacion medica, legal, financiera u otra especialmente confidencial, salvo que sea estrictamente necesaria para la logistica del evento.

Si aparecen menores en contenido compartido, las decisiones de publicacion siguen sujetas a moderacion y controles de consentimiento.

## 13) Cambios en esta politica

Podemos actualizar esta politica para reflejar cambios operativos o legales. La version mas reciente se publicara en:

- `https://bodaentarifa.com/privacy-bot`

Para cambios sustanciales, usaremos medios razonables para informar a los invitados cuando sea practicable.

## 14) Aviso corto (para mensajes de onboarding)

Al usar este bot, aceptas que tus mensajes se procesen para coordinar la boda por Enrique y Manuel, usando WhatsApp (Meta), Firebase (Google), Anthropic (Claude) y Cloudinary. Puedes darte de baja en cualquier momento respondiendo "stop", y puedes solicitar borrado en [enrique.prez.velasco@gmail.com](mailto:enrique.prez.velasco@gmail.com).
