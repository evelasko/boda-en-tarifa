# Boda en Tarifa Bot Privacy Policy

Last updated: 2026-05-21

This Privacy Policy explains how the "Boda en Tarifa" WhatsApp bot ("Thora") handles personal data when guests interact with it.

This is a private, one-event project created by the couple for wedding logistics and guest communication. Even so, we apply a high privacy and security standard.

## 1) Who controls this data

- **Data controllers (for this project):** Enrique and Manuel (the couple).
- **Contact for privacy requests:** [enrique.prez.velasco@gmail.com](mailto:enrique.prez.velasco@gmail.com)

## 2) What this bot does

The bot helps guests with:

- Event logistics and reminders.
- RSVP and structured forms (WhatsApp Flows).
- Optional photo/video sharing for the wedding album.
- Escalation to a human operator when needed.

It is not a marketing or advertising service.

## 3) Data we collect

Depending on your interaction, we may process:

- **Identity and contact data:** phone number, first/last name, preferred language.
- **Wedding participation data:** RSVP responses, event attendance choices, dietary/accessibility notes.
- **Conversation data:** messages sent to/from the bot and interaction metadata.
- **Media data:** photos/videos sent in WhatsApp, with moderation and consent flags.
- **Operational/security data:** anti-abuse, delivery status, error logs, and audit events.
- **Optional personalization data:** limited internal guest-dossier data (for better contextual replies and photo acknowledgements), including reference photos if provided directly to the couple.

## 4) Why we process this data

We process data to:

- Coordinate wedding logistics and guest communication.
- Answer guest questions in Spanish/English.
- Collect structured event inputs (for planning and operations).
- Moderate and publish album content only when consent allows.
- Protect the service from misuse and security threats.

We do **not** sell personal data and do **not** use it for behavioral advertising.

## 5) Legal basis

For this personal event context, processing is based primarily on:

- **Consent** (for participating in bot communication and sharing optional content).
- **Legitimate organizational interest** in running event logistics safely and reliably.

If you no longer want to participate, you can opt out at any time (see Section 10).

## 6) Service providers and data recipients

To operate the bot, data may be processed by:

- **Meta (WhatsApp Cloud API)** - messaging transport and template/Flow delivery.
- **Google Firebase (Firestore, Functions, logging)** - backend processing and storage.
- **Anthropic (Claude)** - language understanding and response generation.
- **Cloudinary** - media storage and moderation workflow for guest-submitted photos/videos.
- **Open-Meteo** - weather lookup (non-marketing utility).

We limit access to authorized operators only.

## 7) International transfers

Some providers may process data outside your country. In particular:

- Messaging and cloud providers may process data across regions.
- AI processing may involve US-based infrastructure.

We minimize shared data, use vetted providers, and apply strict access controls.

## 8) Security safeguards

We use layered controls, including:

- Webhook signature verification to reject forged inbound requests.
- Strict allowlist logic for guest interactions.
- Operator-only admin access with authenticated roles.
- Rate limits, abuse throttling, and deduplication guards.
- Secrets managed outside source code.
- Data minimization in logs (for example, redacted phone output in operational logs).
- Moderation flow for media before any public album exposure.

No system can be 100% risk-free, but these controls are designed to materially reduce exposure.

## 9) Retention

Default retention windows:

- **Conversation history:** retained for up to 90 days after the wedding, then deleted/anonymized.
- **Unknown inbound anti-abuse records:** short-lived operational retention.
- **Audit/security records:** retained longer where needed for accountability.
- **Approved album media:** may be retained longer for the wedding album unless deletion is requested.
- **Internal guest-dossier/reference-photo data:** treated as sensitive internal data and purged during post-event decommissioning.

We may retain limited anonymized aggregates for basic project stats.

## 10) Your choices and rights

You can:

- **Opt out instantly** by messaging: `stop`, `parar`, `darme de baja`, `unsubscribe`, `no more`, or similar.
- **Request deletion** of your data.
- **Request access/correction** of your data.
- **Ask questions** about how your data is processed.

To exercise rights, contact: [enrique.prez.velasco@gmail.com](mailto:enrique.prez.velasco@gmail.com)

We will handle requests as quickly as reasonably possible for an event-scale service.

## 11) Media and consent

- Media you send is handled through a moderation workflow.
- If consent to publication is missing or denied, media is kept private and not published to the shared album.
- If consent is granted, approved media can appear in the wedding album.

## 12) Children and sensitive data

This bot is not intended for collecting special-category data. Please avoid sharing sensitive medical, legal, financial, or other highly confidential information in chat unless strictly necessary for event logistics.

If children appear in shared media, publication decisions remain subject to moderation and consent controls.

## 13) Changes to this policy

We may update this policy to reflect operational or legal changes. The latest version will be published at:

- `https://bodaentarifa.com/privacy-bot`

For substantial changes, we will use reasonable means to notify guests where practical.

## 14) Short notice (for onboarding messages)

By using this bot, you agree that your messages are processed for wedding coordination by Enrique and Manuel, using WhatsApp (Meta), Firebase (Google), Anthropic (Claude), and Cloudinary. You can opt out anytime by replying "stop", and you can request deletion at [enrique.prez.velasco@gmail.com](mailto:enrique.prez.velasco@gmail.com).
