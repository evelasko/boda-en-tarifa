# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 wedding website for Enrique & Manuel's beach wedding in Tarifa, Spain (May 30, 2025). The site features a sophisticated design inspired by HBO's "The White Lotus" opening sequence with painted vintage murals and tropical/marine motifs.

## Development Commands

### Core Commands
- `npm run dev` - Start development server with TurboPack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### TypeScript Check
Since there's no explicit typecheck script, use:
- `npx tsc --noEmit` - Check TypeScript types without emitting files

## Architecture & Key Components

### Tech Stack
- **Framework**: Next.js 15.4.4 with App Router
- **Styling**: TailwindCSS 4 with custom `@theme` directive
- **Language**: TypeScript 5
- **Auth**: Firebase (configured but not yet implemented)
- **Font System**: Custom typography using Adobe Fonts (Trajan Pro 3 & Gotham)

### Project Structure
```
src/
├── app/           # Next.js App Router pages
├── components/    # React components (e.g., TypographyDemo)
└── lib/           # Core utilities
    ├── firebase.ts    # Firebase configuration
    └── typography.ts  # Typography design system constants
```

### Key Design Systems

1. **Typography System** (`src/lib/typography.ts`):
   - Comprehensive type scale with responsive fluid sizing
   - Golden ratio mathematical progression
   - Integrated with custom CSS in `globals.css`
   - Classes follow pattern: `type-[category]-[variant]`

2. **Content Structure** (`content/content.yaml`):
   - Multi-event wedding schedule (5 events over 3 days)
   - RSVP questions and travel information
   - Accommodations and venue details

### Important Implementation Details

1. **Adobe Fonts Integration**: Currently commented out in layout.tsx:27. Uncomment when ready:
   ```jsx
   <link rel="stylesheet" href="https://use.typekit.net/tqk3qdr.css" />
   ```

2. **Firebase Environment Variables** required:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

3. **Planned Features** (from prd.md):
   - Multi-step RSVP system with Firebase Auth (Google & Apple)
   - Google Sheets integration for RSVP responses
   - Bilingual support (Spanish/English)
   - "White Lotus" aesthetic with painted mural backgrounds

### Design Tokens

**Color Palette** (from prd.md):
- Primary: coral (#E4A085), sage (#9CAF88), sand (#D4C5B9), ocean (#7A9E9F)
- Neutral: cream (#FAF6F2), charcoal (#3A3A3A), gold (#C9A961)
- Muted variants for subtle interactions

### Development Considerations

1. **Mobile-First Approach**: All components should be designed mobile-first
2. **Same-sex Wedding**: Use inclusive language throughout
3. **No Couple Photos**: Design relies on artistic elements and typography
4. **Beach Venue**: Content reflects coastal Tarifa setting
5. **Multi-day Event**: Clear information architecture for 5 distinct events

### Current Status

- ✅ Basic Next.js setup complete
- ✅ Typography system fully implemented with demo
- ✅ Firebase configuration in place
- ⏳ Homepage hero section pending
- ⏳ RSVP authentication system pending
- ⏳ Google Sheets integration pending
- ⏳ Content sections (travel, accommodations, etc.) pending