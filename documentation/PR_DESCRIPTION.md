This PR overhauls the public homepage, introduces a new structured format for AI dive briefings, and opens up the dive planner to logged-out users.

### Homepage redesign

Added a full marketing homepage at `/` with hero, feature highlights, an interactive planner demo, gallery placeholder, brand story section, and footer. The planner stub on the homepage lets visitors generate AI briefings without creating an account — same preview endpoint, just embedded inline.

All new components live in `src/features/public-home/`. Styling follows the existing dark gradient + cyan accent aesthetic. The homepage route (`src/app/page.tsx`) now conditionally renders `PublicHomePage` for logged-out users or `DashboardPageContent` for authenticated users.

**App shell refactoring**: Introduced a new `AppShell` component that conditionally renders navigation based on authentication state. For unauthenticated users on the homepage, it renders children directly (allowing `PublicHomePage` to use its own `PublicNavbar`). For all other routes or authenticated users, it shows the standard app navigation. This change simplified the root layout by moving navigation logic out of `layout.tsx`.

**Asset updates**: Replaced default Next.js assets (next.svg, vercel.svg, etc.) with custom feature icons (`feature-icon_checklist.svg`, `feature-icon_logbook.svg`, `feature-icon_map.svg`) and a new hero image. Updated favicon.

### Structured AI briefings

Replaced the old plain-text AI advice with a structured briefing format. The new `AIBriefing` type includes:

- A conditions snapshot (one-liner summary)
- Quick look chips for difficulty, water temp, visibility, sea state, and confidence level
- "What matters most" callout
- Expandable accordion sections with bullets/paragraphs
- Source tags indicating whether data comes from forecast, seasonal averages, or inference

The `AIDiveBriefing` component renders all of this with loading skeletons, a compact preview mode for the homepage, and a scrollable full mode for the planner page. The OpenAI service was refactored to return structured JSON instead of freeform text, with updated system prompts that emphasize location-specific, non-generic advice.

**Layout enhancements**: Updated `PageGrid.module.css` with 129 new lines of layout code, including scrollable AI briefing containers with custom scrollbar styling, placeholder cards, and improved responsive layout structure for the plan page.

### Logged-out planner access

Previously, hitting `/dive-plans` while logged out showed an auth gate. Now it shows the full planner UI. Users can fill out the form and generate an AI briefing without signing in.

The key change: submitting the form no longer auto-saves. Instead, there's an explicit "Save Dive Plan" button that only appears after a briefing has been generated. For authenticated users, clicking it saves immediately. For guests, it opens an auth modal with signup/login forms. After successful auth, the plan saves automatically and the Past Plans section becomes visible.

New components: `SaveDivePlanButton` and `AuthModal`. 

**API updates**: Updated `/api/dive-plans/preview` (public endpoint for guest users) and `/api/dive-plans` (POST/PUT for authenticated users) to use the new structured briefing format. Both endpoints now return both `aiBriefing` (structured) and `aiAdvice` (legacy string, extracted from `whatMattersMost`) for backward compatibility.

### Changes at a glance

- 10 new files for the public homepage
- New `AppShell` component for conditional navigation rendering
- New `AIDiveBriefing` component and types for structured output
- Refactored `usePlanPageState` to separate preview generation from saving
- Added `SaveDivePlanButton` and `AuthModal` components
- Updated `/api/dive-plans/preview` and `/api/dive-plans` to support structured briefings
- Enhanced `PageGrid.module.css` with scrollable briefing container layouts
- Removed default Next.js assets, added custom feature icons and hero image
- Updated favicon
- ~3,800 lines added, ~260 lines removed across 38 files

