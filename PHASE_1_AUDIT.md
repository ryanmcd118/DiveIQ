# Phase 1 Audit: Logged-Out Homepage Design System

## 📋 Executive Summary

The logged-out homepage (`/`) uses a **premium dark theme** with a sophisticated gradient background, cyan accent colors, and a modular component architecture. All styles are defined via **CSS Modules** with a centralized design token system.

---

## 1. File Map

### Entry Route & Layout

```
Route: `/` (src/app/page.tsx)
├── Conditionally renders PublicHomePage if !userId
├── Root Layout: src/app/layout.tsx
│   ├── Font: Inter (from next/font/google)
│   ├── Global CSS: src/app/globals.css
│   └── Wrappers: SessionProvider → UnitSystemProvider → AppShell
└── AppShell (src/features/auth/components/AppShell.tsx)
    └── Bypasses shell for logged-out homepage (returns children directly)
```

### Public Homepage Components

```
Main Component: src/features/public-home/components/PublicHomePage.tsx
├── Styles: PublicHomePage.module.css (953 lines)
└── Child Components:
    ├── PublicNavbar.tsx
    ├── HeroSection.tsx
    ├── FeatureTrio.tsx
    ├── PlannerStub.tsx
    ├── GallerySection.tsx
    ├── BrandStory.tsx
    ├── FinalCTA.tsx
    └── Footer.tsx
```

### Styling Sources

```
Design System (Centralized):
├── src/styles/design-system/tokens.css          # CSS custom properties
├── src/styles/design-system/typography.css      # Typography utility classes
└── src/styles/design-system/utilities.css       # Layout/utility classes

Global Styles:
└── src/app/globals.css                          # Base styles + imports

Component Styles:
└── src/features/public-home/components/PublicHomePage.module.css
    └── All homepage-specific styles (navbar, hero, features, planner, etc.)
```

---

## 2. Design Token Draft

### Color Palette

#### Backgrounds

```css
/* Page Background (Complex Gradient) */
--gradient-bg-page: linear-gradient(
  180deg,
  #0a1628 0%,
  /* slate-900 variant */ #061220 25%,
  #040e18 50%,
  #051118 75%,
  #071a22 100%
);

/* Design Token Values */
--color-bg-primary: #020617; /* slate-950 - base dark */
--color-bg-secondary: #0f172a; /* slate-900 */
--color-bg-tertiary: #1e293b; /* slate-800 */
--color-bg-elevated: #334155; /* slate-700 */
```

#### Surfaces (Cards/Containers)

```css
--color-surface: rgba(15, 23, 42, 0.6); /* Feature cards */
--color-surface-hover: rgba(15, 23, 42, 0.9);
--color-surface-alt: rgba(2, 6, 23, 0.6); /* Form inputs */
--color-surface-navbar: rgba(10, 22, 40, 0.85); /* Navbar with backdrop blur */
```

#### Text Colors

```css
--color-text-primary: #f1f5f9; /* slate-100 - main text */
--color-text-secondary: #e2e8f0; /* slate-200 */
--color-text-tertiary: #cbd5e1; /* slate-300 - nav links */
--color-text-muted: #94a3b8; /* slate-400 - body/secondary */
--color-text-disabled: #64748b; /* slate-500 */
```

#### Borders

```css
--color-border-default: rgba(51, 65, 85, 0.5); /* slate-700 at 50% */
--color-border-hover: rgba(6, 182, 212, 0.3); /* cyan accent on hover */
--color-border-focus: rgba(6, 182, 212, 0.15); /* cyan focus ring */
--color-border-navbar: rgba(6, 182, 212, 0.1); /* subtle navbar border */
```

#### Brand/Accent (Cyan)

```css
--color-accent-primary: #06b6d4; /* cyan-500 - main brand */
--color-accent-hover: #22d3ee; /* cyan-400 */
--color-accent-light: #67e8f9; /* cyan-300 - highlights, brand name */
--color-accent-dark: #0e7490; /* cyan-700 */
```

#### Semantic Colors

```css
--color-success: #10b981; /* green-500 */
--color-warning: #f59e0b; /* amber-500 */
--color-danger: #ef4444; /* red-500 */
--color-danger-hover: #f87171; /* red-400 */
```

### Typography

#### Font Family

```css
--font-sans:
  system-ui, -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
/* Note: Inter is loaded via next/font/google in layout.tsx */
```

#### Font Sizes

```css
--font-size-xs: 0.75rem; /* 12px */
--font-size-sm: 0.875rem; /* 14px */
--font-size-base: 1rem; /* 16px */
--font-size-lg: 1.125rem; /* 18px */
--font-size-xl: 1.25rem; /* 20px */
--font-size-2xl: 1.5rem; /* 24px */
--font-size-3xl: 1.875rem; /* 30px */
--font-size-4xl: 2.25rem; /* 36px */
```

#### Font Weights

```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

#### Line Heights

```css
--line-height-tight: 1.25; /* Headlines */
--line-height-normal: 1.5; /* Body */
--line-height-relaxed: 1.75; /* Large body text */
```

#### Letter Spacing

```css
/* Used in headlines: -0.03em */
/* Used in brand/logo: -0.025em */
```

### Spacing & Layout

#### Spacing Scale

```css
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
```

#### Layout Constraints

```css
--max-width-page: 80rem; /* 1280px - main container */
--max-width-narrow: 48rem; /* 768px - brand story */
--section-padding-mobile: var(--space-12) var(--space-6); /* 48px 24px */
--section-padding-desktop: 5rem var(--space-8); /* 80px 32px */
```

#### Grid & Gaps

```css
--grid-gap-sm: var(--space-4); /* 16px */
--grid-gap-md: var(--space-6); /* 24px */
--grid-gap-lg: var(--space-8); /* 32px */
--grid-gap-xl: 4rem; /* 64px - hero grid */
```

### Border Radius

```css
--radius-sm: 0.375rem; /* 6px */
--radius-md: 0.5rem; /* 8px */
--radius-lg: 0.75rem; /* 12px */
--radius-xl: 1rem; /* 16px - cards, images */
--radius-full: 9999px; /* Buttons, pills */
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl:
  0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

/* Custom Glow Effects (Cyan) */
--glow-primary: 0 0 20px rgba(6, 182, 212, 0.3); /* Nav CTA */
--glow-primary-hover: 0 4px 24px rgba(6, 182, 212, 0.4);
--glow-hero-cta: 0 0 30px rgba(6, 182, 212, 0.35);
--glow-hero-cta-hover: 0 8px 40px rgba(6, 182, 212, 0.5);
--glow-planner-button: 0 4px 24px rgba(6, 182, 212, 0.3);
--glow-planner-button-hover: 0 8px 32px rgba(6, 182, 212, 0.45);
```

### Transitions

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
```

### Z-Index

```css
--z-dropdown: 1000;
--z-sticky: 1100; /* Navbar */
--z-modal: 1300;
--z-popover: 1400;
--z-tooltip: 1500;
```

---

## 3. UI Primitives

### Buttons

#### Primary Button (Gradient CTA)

```css
/* Structure */
display: inline-flex;
align-items: center;
gap: var(--space-2);
padding: var(--space-4) var(--space-8); /* 16px 32px */
font-size: var(--font-size-base);
font-weight: var(--font-weight-semibold);
color: #0a1628; /* Dark text on light gradient */
background: linear-gradient(
  135deg,
  var(--color-accent-light) 0%,
  var(--color-accent-primary) 100%
);
border: none;
border-radius: var(--radius-full);
box-shadow: var(--glow-primary);
transition: all var(--transition-base);

/* Hover */
transform: translateY(-2px);
box-shadow: var(--glow-primary-hover);
```

#### Secondary Button (Text Link)

```css
font-size: var(--font-size-base);
font-weight: var(--font-weight-medium);
color: var(--color-text-tertiary);
text-decoration: none;
padding: var(--space-2);
transition: color var(--transition-base);

/* Hover */
color: var(--color-accent-light);
```

### Cards

#### Feature Card

```css
position: relative;
padding: var(--space-8); /* 32px */
background: rgba(15, 23, 42, 0.6);
border: 1px solid rgba(51, 65, 85, 0.5);
border-radius: var(--radius-xl);
transition: all var(--transition-slow);

/* Hover */
border-color: rgba(6, 182, 212, 0.3);
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
transform: translateY(-4px);
```

#### Planner Card

```css
background: rgba(15, 23, 42, 0.8);
border: 1px solid rgba(51, 65, 85, 0.5);
border-radius: var(--radius-xl);
padding: var(--space-8);
box-shadow: 0 16px 64px rgba(0, 0, 0, 0.4);
```

### Form Elements

#### Input/Select

```css
width: 100%;
padding: var(--space-3) var(--space-4); /* 12px 16px */
font-size: var(--font-size-base);
color: var(--color-text-primary);
background: rgba(2, 6, 23, 0.6);
border: 1px solid rgba(51, 65, 85, 0.6);
border-radius: var(--radius-lg);
transition: all var(--transition-base);

/* Focus */
outline: none;
border-color: var(--color-accent-primary);
box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15);
```

### Links

```css
/* Nav Link */
font-size: var(--font-size-sm);
font-weight: var(--font-weight-medium);
color: var(--color-text-tertiary);
text-decoration: none;
transition: color var(--transition-base);

/* Hover */
color: var(--color-text-primary);

/* Footer Link */
font-size: var(--font-size-sm);
color: var(--color-text-muted);
text-decoration: none;
transition: color var(--transition-base);

/* Hover */
color: var(--color-text-primary);
```

---

## 4. Background Effects

### Page Background

```css
/* Complex multi-stop gradient */
background: linear-gradient(
  180deg,
  #0a1628 0%,
  #061220 25%,
  #040e18 50%,
  #051118 75%,
  #071a22 100%
);
```

### Navbar

```css
background: rgba(10, 22, 40, 0.85);
backdrop-filter: blur(16px);
border-bottom: 1px solid rgba(6, 182, 212, 0.1);
```

### Hero Image Overlay

```css
/* Vignette effect */
background: linear-gradient(
  180deg,
  transparent 0%,
  transparent 40%,
  rgba(5, 10, 20, 0.125) 60%,
  rgba(5, 10, 20, 0.275) 100%
);
```

### Placeholder Shimmer

```css
/* Animated gradient shimmer */
background: linear-gradient(
  45deg,
  transparent 45%,
  rgba(6, 182, 212, 0.05) 50%,
  transparent 55%
);
background-size: 200% 200%;
animation: shimmer 3s infinite;
```

### Brand Divider

```css
/* Horizontal gradient line */
width: 4rem;
height: 2px;
background: linear-gradient(
  90deg,
  transparent,
  var(--color-accent-primary),
  transparent
);
```

---

## 5. Component Inventory

### Existing Reusable Primitives

#### From Design System (`src/styles/design-system/`)

- ✅ **Typography classes**: `.heading-1` through `.heading-5`, `.body-large`, `.body`, `.body-small`, `.caption`
- ✅ **Text utilities**: `.text-muted`, `.text-disabled`, `.text-accent`, `.text-danger`
- ✅ **Layout utilities**: `.container`, `.container-narrow`, `.flex-center`, `.flex-between`, `.stack`, `.stack-sm`, `.stack-lg`
- ✅ **Focus utilities**: `.focus-ring`
- ✅ **Truncate utilities**: `.truncate`, `.line-clamp-2`, `.line-clamp-3`

#### From Component Styles (`src/styles/components/`)

- ✅ **Button.module.css**: `.primary`, `.secondary`, `.danger`, etc.
- ✅ **Card.module.css**: `.card`, `.card-compact`, `.card-form`
- ✅ **Form.module.css**: `.input`, `.select`, `.textarea`, `.label`, `.field`
- ✅ **Layout.module.css**: `.page`, `.pageContent`, `.main`, `.pageHeader`, `.pageTitle`
- ✅ **Navigation.module.css**: `.header`, `.nav`, `.brand`, `.link`, `.linkAccent`
- ✅ **List.module.css**: List item styles

### Homepage-Specific Components (Not Yet Reusable)

#### Currently Scoped to `PublicHomePage.module.css`

- ❌ **Navbar styles**: `.navbar`, `.navContainer`, `.navBrand`, `.navLinks`, `.navCta`
- ❌ **Hero styles**: `.hero`, `.heroGrid`, `.heroContent`, `.heroHeadline`, `.heroSubheadline`, `.heroCtas`, `.heroImageContainer`, `.heroImage`, `.heroImageOverlay`
- ❌ **Feature card styles**: `.featureTrio`, `.featureGrid`, `.featureCard`, `.featureIcon`, `.featureTitle`, `.featureBody`
- ❌ **Planner styles**: `.plannerSection`, `.plannerCard`, `.plannerForm`, `.plannerInput`, `.plannerSelect`, `.plannerButton`, `.plannerResultPanel`
- ❌ **Gallery styles**: `.gallerySection`, `.galleryBlock`, `.galleryContent`, `.galleryTitle`
- ❌ **Brand story styles**: `.brandSection`, `.brandContainer`, `.brandTitle`, `.brandBody`, `.brandDivider`
- ❌ **Final CTA styles**: `.finalCta`, `.finalCtaTitle`, `.finalCtaButtons`
- ❌ **Footer styles**: `.footer`, `.footerContainer`, `.footerCopy`, `.footerLinks`, `.footerLink`
- ❌ **Placeholder styles**: `.placeholder`, `.placeholderHero`, `.placeholderGallery`, `.placeholderLabel`

### What Needs to Be Created/Extracted in Phase 2

1. **Gradient Background System**
   - Extract page gradient as a reusable class or component prop
   - Create variants for different page types

2. **Button Variants**
   - Extract gradient primary button as `.btn-primary-gradient` (distinct from existing `.btn-primary`)
   - Extract secondary text link as `.btn-secondary-text`

3. **Card Variants**
   - Extract feature card style as `.card-feature` or `.card-elevated`
   - Extract planner card style as `.card-form-elevated`

4. **Section Container**
   - Extract `.section` pattern (max-width + padding) as reusable utility

5. **Image Overlay System**
   - Extract hero image overlay/vignette as reusable utility class

6. **Navbar Variants**
   - Extract public navbar styles (with backdrop blur) as separate component styles
   - Keep logged-in navbar separate but apply same design tokens

---

## 6. Phase 2 Plan

### Goal

Apply the logged-out homepage design system to logged-in app pages (Dashboard, Dive Plans, Dive Logs) **without changing business logic**.

### Approach

1. **Extract & Standardize Design Tokens**
   - Ensure all homepage-specific values (gradients, glows) are added to `tokens.css`
   - Create new token categories: `--gradient-*`, `--glow-*` for reusable effects
   - Document any hardcoded values that should become tokens

2. **Create Reusable Component Styles**
   - Extract button variants (gradient primary, secondary text) to `Button.module.css`
   - Extract card variants (feature, elevated) to `Card.module.css`
   - Extract section container pattern to `Layout.module.css` or utilities
   - Create `Background.module.css` for gradient/vignette effects

3. **Update Logged-In Page Styles**
   - Apply same color palette (dark slate backgrounds, cyan accents)
   - Use same typography scale and weights
   - Apply same spacing scale and max-width constraints
   - Replace flat backgrounds with subtle gradients where appropriate
   - Update navigation to match public navbar aesthetic (backdrop blur, subtle borders)

4. **Component-by-Component Migration**
   - **Navigation**: Update `Navigation.module.css` to match public navbar (backdrop blur, gradient border)
   - **Dashboard**: Apply feature card styles to stat cards, use same grid patterns
   - **Forms**: Ensure inputs match planner form styling (dark backgrounds, cyan focus)
   - **Lists**: Apply same card hover effects and spacing
   - **Buttons**: Replace existing buttons with gradient primary variant

5. **Maintain Visual Hierarchy**
   - Keep same headline sizes and weights
   - Preserve same section spacing patterns
   - Apply same card elevation/shadow system

6. **Testing & Refinement**
   - Verify all interactive states (hover, focus, active) match homepage
   - Ensure responsive breakpoints align
   - Check accessibility (contrast, focus indicators)

### Key Principles

- ✅ **No business logic changes** - Only styling updates
- ✅ **Reuse existing tokens** - Don't duplicate values
- ✅ **Progressive enhancement** - Start with colors/spacing, then add effects
- ✅ **Component isolation** - Each component should work independently
- ✅ **Backward compatibility** - Don't break existing logged-in functionality

---

## 7. Additional Notes

### Styling Architecture

- **Primary Method**: CSS Modules (`.module.css`)
- **Design Tokens**: CSS Custom Properties in `tokens.css`
- **No Tailwind Usage**: Tailwind is installed but not actively used (PostCSS config exists but no Tailwind classes found)
- **Font Loading**: Inter font loaded via Next.js `next/font/google`

### Hardcoded Values to Tokenize

- Page gradient stops: `#0a1628`, `#061220`, `#040e18`, `#051118`, `#071a22`
- Button text color on gradient: `#0a1628`
- Glow shadow values: Multiple rgba(6, 182, 212, ...) values
- Section padding desktop: `5rem` (should use spacing token)
- Hero grid gap desktop: `4rem` (should use spacing token)

### Responsive Breakpoints

- Mobile: Default (< 768px)
- Tablet: `@media (min-width: 768px)`
- Desktop: `@media (min-width: 1024px)`

### Special Effects

- **Backdrop blur**: Used on navbar (`backdrop-filter: blur(16px)`)
- **Transform on hover**: Buttons and cards use `translateY(-2px)` or `translateY(-4px)`
- **Box shadow glows**: Cyan-colored shadows for accent elements
- **Image filters**: Hero image uses `brightness(1.08)`

---

**Phase 1 audit complete — ready for Phase 2 prompt.**
