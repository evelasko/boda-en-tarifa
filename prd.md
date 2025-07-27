# Product Requirements Document: Wedding Website

## Enrique & Manuel - May 30, 2025

---

## 1. Executive Summary

Create a sophisticated, mobile-first wedding website for Enrique & Manuel's beach wedding in Tarifa, Spain. The site will feature a unique aesthetic inspired by HBO's "The White Lotus" opening sequence, with painted vintage murals incorporating tropical and marine motifs. The website will serve as the primary information hub and RSVP platform for their multi-day celebration.

---

## 2. Project Context & Constraints

### Key Considerations

- **Same-sex wedding**: Ensure inclusive language and imagery throughout
- **No couple photos**: Design must rely on artistic elements and typography
- **Beach venue**: Content and design should reflect the coastal setting
- **Multi-day event**: Clear information architecture for 5 distinct events
- **International guests**: Bilingual considerations (Spanish/English)

### Technical Stack

- **Framework**: NextJS (already configured)
- **Styling**: TailwindCSS 4 with custom typography system
- **Authentication**: Firebase (Google & Apple providers)
- **Data Storage**: Google Sheets API for RSVP responses
- **Images**: Unsplash placeholders for initial build

---

## 3. Design Requirements

### Visual Theme: "The White Lotus" Aesthetic

#### Color Palette

```json
{
  "primary": {
    "coral": "#E4A085",      // Muted coral
    "sage": "#9CAF88",       // Soft sage green
    "sand": "#D4C5B9",       // Beach sand
    "ocean": "#7A9E9F"       // Muted ocean blue
  },
  "neutral": {
    "cream": "#FAF6F2",      // Background
    "charcoal": "#3A3A3A",   // Text
    "gold": "#C9A961"        // Accents
  },
  "muted": {
    "pink": "#DDB5A6",
    "green": "#A8B89C",
    "blue": "#8FA3A8"
  }
}
```

#### Design Elements

1. **Painted Mural Background**
   - Layered vintage botanical illustrations
   - Tropical flora: palm fronds, monstera, bird of paradise
   - Marine elements: coral, seaweed, tropical fish
   - Ornamental borders with Art Nouveau influences
   - Subtle texture overlay for painted effect

2. **Typography Integration**
   - Text integrated within ornamental frames
   - Decorative flourishes around headings
   - Vintage-inspired dividers between sections

3. **Animation & Interaction**
   - Subtle parallax scrolling for mural layers
   - Gentle float animations on decorative elements
   - Smooth reveal animations on scroll
   - Interactive hover states with organic movements

### Layout Structure

#### Mobile-First Grid System

```css
/* Base mobile grid */
--grid-mobile: 1fr;
--padding-mobile: 1rem;

/* Tablet enhancement */
--grid-tablet: repeat(6, 1fr);
--padding-tablet: 2rem;

/* Desktop optimization */
--grid-desktop: repeat(12, 1fr);
--padding-desktop: 3rem;
--max-width: 1440px;
```

---

## 4. Information Architecture

### Site Structure

```text
/                     # Homepage (all main content)
├── #hero            # Fullscreen hero
├── #details         # Event timeline
├── #travel          # Travel information
├── #stay            # Accommodations
├── #dresscode       # What to wear
├── #faq             # Questions
└── #contact         # Contact info

/rsvp                # RSVP form (authenticated)
├── /login          # Auth providers
├── /form           # Multi-step form
└── /confirmation   # Success state

/api                 # Backend routes
├── /auth           # Firebase auth
├── /rsvp           # Form submission
└── /sheets         # Google Sheets integration
```

### Navigation

- **Mobile**: Hamburger menu with smooth drawer animation
- **Desktop**: Fixed header with elegant scroll behavior
- **Both**: Smooth scroll to sections with active state indicators

---

## 5. Content Management System

### Content Structure (JSON)

Replace YAML with structured JSON for better type safety and easier updates:

```json
{
  "meta": {
    "title": "Enrique & Manuel - May 30, 2025",
    "description": "Join us for our beach wedding celebration in Tarifa",
    "languages": ["en", "es"],
    "defaultLanguage": "en"
  },
  "content": {
    "en": {
      "hero": { /* ... */ },
      "events": [ /* ... */ ],
      // ... other sections
    },
    "es": {
      // Spanish translations
    }
  }
}
```

### Content Update Mechanism

1. **Development**: JSON file in `/content/wedding-content.json`
2. **Production**: Consider Contentful or Sanity CMS integration
3. **Fallback**: Environment variables for critical info

---

## 6. Component Requirements

### Hero Section

```jsx
<HeroSection>
  - Fullscreen painted mural background
  - Animated text reveal: "We are getting married!"
  - Names in ornamental frame: "Enrique & Manuel"
  - Date with decorative elements
  - Smooth scroll indicator (animated)
</HeroSection>
```

### Event Timeline

```jsx
<EventTimeline>
  - Vertical timeline on mobile
  - Alternating cards on desktop
  - Each event as an illustrated card:
    * Custom icon/illustration
    * Date & time
    * Location with map preview
    * Expandable details
  - Events:
    1. Early Welcome (May 29)
    2. Pre-Wedding (May 30)
    3. Ceremony (May 30)
    4. Celebration (May 30)
    5. Post-Wedding (May 31)
</EventTimeline>
```

### RSVP System

#### Authentication Flow

```jsx
<RSVPAuth>
  - Welcome message
  - Provider buttons:
    * "Continue with Google"
    * "Continue with Apple"
  - Privacy notice
  - Guest lookup by email
</RSVPAuth>
```

#### Form Design (Multi-Step)

```jsx
<RSVPForm>
  Step 1: Attendance
    - Beautiful toggle cards for each event
    - Visual feedback for selections
    
  Step 2: Guest Details
    - Dynamic guest count selector
    - Name inputs with elegant styling
    - Children attendance option
    
  Step 3: Preferences
    - Dietary restrictions (visual cards)
    - Transportation needs
    - Seating preferences
    
  Step 4: Personal Touch
    - Relationship status (fun options)
    - Message/advice textarea
    - Media upload for memories
    
  Step 5: Review & Submit
    - Summary view
    - Edit options
    - Confirmation animation
</RSVPForm>
```

### Travel Section

```jsx
<TravelGuide>
  - Interactive route selector
  - Collapsible travel options:
    * By car (with toll info)
    * By train (connection details)
    * By air (airport options)
  - Animated map illustrations
  - Carpool coordination link
</TravelGuide>
```

### Accommodations

```jsx
<AccommodationCards>
  - Grid of hotel options
  - Each card with:
    * Artistic illustration
    * Pricing details
    * Booking links
    * Special wedding rates
  - Filter by type (hotel/glamping)
</AccommodationCards>
```

---

## 7. Technical Implementation

### Firebase Configuration

```javascript
// Already configured in project
const firebaseConfig = {
  // Existing config
  authProviders: ['google.com', 'apple.com']
};
```

### Google Sheets Integration

```javascript
// API Structure
const sheetStructure = {
  columns: [
    'timestamp',
    'email',
    'name',
    'attendingCeremony',
    'attendingPreWedding',
    'attendingPostWedding',
    'guestCount',
    'guestNames',
    'dietaryRestrictions',
    'transportation',
    'message',
    'seatingPreference',
    'relationshipStatus',
    'specialRequests'
  ]
};
```

### API Routes

```javascript
// /api/rsvp/submit
POST - Submit new RSVP
PUT - Update existing RSVP
GET - Retrieve user's RSVP

// /api/rsvp/check
GET - Check if user has existing RSVP

// /api/auth/session
GET - Validate user session
```

---

## 8. Responsive Behavior

### Breakpoints

```css
/* Mobile First */
@media (min-width: 640px)  /* sm */
@media (min-width: 768px)  /* md */
@media (min-width: 1024px) /* lg */
@media (min-width: 1280px) /* xl */
@media (min-width: 1536px) /* 2xl */
```

### Key Responsive Features

1. **Hero**: Scale text and ornaments proportionally
2. **Timeline**: Vertical → Horizontal layout
3. **Cards**: 1 → 2 → 3 column grid
4. **Navigation**: Drawer → Fixed header
5. **Forms**: Full width → Centered modal

---

## 9. Performance & Accessibility

### Performance Goals

- Lighthouse score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s

### Optimization Strategy

1. **Images**:
   - WebP format with fallbacks
   - Lazy loading for below-fold content
   - Blur-up placeholders
   - Responsive srcset

2. **Code**:
   - Component code splitting
   - Dynamic imports for RSVP flow
   - Minimize bundle size
   - Tree-shake unused CSS

### Accessibility Requirements

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader optimization
- Focus management
- Sufficient color contrast
- Inclusive language throughout

---

## 10. Implementation Phases

### Phase 1: Foundation (Core Structure)

1. Set up content management system (JSON)
2. Implement typography system from previous requirements
3. Create base layout components
4. Design and implement hero section
5. Build responsive navigation

### Phase 2: Content Sections

1. Event timeline with all 5 events
2. Travel information section
3. Accommodations grid
4. Dress code with weather info
5. FAQ accordion
6. Contact section

### Phase 3: RSVP System

1. Authentication flow with Firebase
2. Multi-step form UI
3. Google Sheets integration
4. Response editing capability
5. Confirmation states

### Phase 4: Polish & Animation

1. Implement "White Lotus" mural design
2. Add scroll animations
3. Interactive elements
4. Loading states
5. Error handling

### Phase 5: Testing & Launch

1. Cross-browser testing
2. Mobile device testing
3. Accessibility audit
4. Performance optimization
5. Deployment preparation

---

## 11. Content Guidelines

### Tone of Voice

- Warm and welcoming
- Elegant but not stuffy
- Inclusive and celebratory
- Clear and informative
- Playful where appropriate

### Copy Examples

```text
Hero: "Love is love is love • Enrique & Manuel"
CTA: "Join our celebration"
RSVP: "We'd love to know if you'll be there"
Travel: "Your journey to our special day"
```

---

## 12. Placeholder Image Requirements

### Unsplash Search Terms

- "tropical plants watercolor"
- "beach wedding decor"
- "tarifa spain beach"
- "botanical illustration vintage"
- "mediterranean coastal"
- "wedding table settings beach"
- "sunset ocean spain"

### Image Treatments

- Overlay with muted color filters
- Blend modes for painted effect
- Decorative frames/borders
- Consistent aspect ratios

---

## 13. Development Notes

### File Structure

```text
/app
  /page.tsx              # Homepage
  /rsvp
    /page.tsx           # RSVP flow
    /layout.tsx         # Auth wrapper
  /api
    /auth/*             # Firebase routes
    /rsvp/*             # Form endpoints
    /sheets/*           # Google integration

/components
  /sections/*           # Page sections
  /ui/*                 # Reusable components
  /rsvp/*              # RSVP components
  /decorative/*        # Ornamental elements

/content
  /wedding-content.json # All content
  /translations.json    # i18n strings

/public
  /fonts               # Typekit fonts
  /images              # Optimized assets
  /illustrations       # SVG decorations

/styles
  /global.css          # Typography system
  /animations.css      # Custom animations
```

### State Management

- React Context for auth state
- Local state for form progress
- Session storage for draft responses
- SWR for data fetching

### Error Handling

- Graceful auth failures
- Network error recovery
- Form validation messages
- Fallback UI states

---

## 14. Success Metrics

1. **User Experience**
   - 90% RSVP completion rate
   - < 3 support inquiries per 100 guests
   - Mobile engagement > 60%

2. **Technical**
   - All Lighthouse scores > 90
   - Zero critical accessibility issues
   - < 3s page load time

3. **Design**
   - Positive guest feedback
   - Social media shares
   - Screenshot-worthy moments

---

## 15. Final Implementation Checklist

- [ ] Content structure finalized
- [ ] Typography system implemented
- [ ] Responsive grid established
- [ ] Hero section with animations
- [ ] All 5 event cards designed
- [ ] Travel section interactive
- [ ] Accommodations grid complete
- [ ] RSVP authentication working
- [ ] Multi-step form functional
- [ ] Google Sheets integration tested
- [ ] Decorative elements placed
- [ ] Animations smooth on mobile
- [ ] Accessibility audit passed
- [ ] Performance optimized
- [ ] Cross-browser tested
- [ ] Production deployment ready
