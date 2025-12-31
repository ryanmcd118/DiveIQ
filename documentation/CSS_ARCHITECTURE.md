# CSS Architecture - DiveIQ

## ✅ Implementation Complete!

Your DiveIQ app now uses a **modern, scalable CSS Modules architecture** with a comprehensive design system.

---

## 📁 Structure

```
src/styles/
├── design-system/
│   ├── tokens.css          # Design tokens (colors, spacing, typography)
│   ├── typography.css      # Typography classes
│   └── utilities.css       # Utility classes
│
├── components/
│   ├── Button.module.css      # Button variants
│   ├── Card.module.css        # Card components
│   ├── Form.module.css        # Form elements
│   ├── List.module.css        # List items
│   ├── Navigation.module.css  # Navigation
│   └── Layout.module.css      # Page layouts
│
└── globals.css             # Global styles + imports
```

---

## 🎨 Design System

### Tokens (CSS Custom Properties)

All design values are centralized in `tokens.css`:

**Colors:**

```css
--color-bg-primary         /* Main background */
--color-surface            /* Cards, containers */
--color-text-primary       /* Primary text */
--color-text-muted         /* Secondary text */
--color-accent-primary     /* Brand color (cyan) */
--color-danger             /* Error/delete states */
```

**Spacing:**

```css
--space-1  (4px)
--space-2  (8px)
--space-3  (12px)
--space-4  (16px)
--space-6  (24px)
--space-8  (32px)
```

**Border Radius:**

```css
--radius-sm  (6px)
--radius-md  (8px)
--radius-lg  (12px)
--radius-xl  (16px)
```

**Typography:**

```css
--font-size-xs   (12px)
--font-size-sm   (14px)
--font-size-base (16px)
--font-size-lg   (18px)
--font-size-xl   (20px)
--font-size-2xl  (24px)
--font-size-3xl  (30px)
--font-size-4xl  (36px)
```

---

## 🧩 Component Styles

### Button Components

```tsx
import buttonStyles from "@/styles/components/Button.module.css";

// Primary button
<button className={buttonStyles.primary}>
  Submit
</button>

// Secondary button
<button className={buttonStyles.secondary}>
  Cancel
</button>

// Danger button
<button className={buttonStyles.danger}>
  Delete
</button>

// Ghost button (minimal)
<button className={buttonStyles.ghost}>
  View More
</button>

// Icon delete button
<button className={buttonStyles.iconDelete}>
  ×
</button>
```

### Card Components

```tsx
import cardStyles from "@/styles/components/Card.module.css";

// Standard card
<div className={cardStyles.card}>
  <h2 className={cardStyles.title}>Title</h2>
  {/* content */}
</div>

// Compact card
<div className={cardStyles.cardCompact}>
  {/* less padding */}
</div>

// Form card
<form className={cardStyles.cardForm}>
  {/* auto-spaced form fields */}
</form>

// Stat card (dashboard)
<div className={cardStyles.stat}>
  <p className={cardStyles.statLabel}>Total Dives</p>
  <p className={cardStyles.statValue}>
    42
    <span className={cardStyles.statUnit}>dives</span>
  </p>
  <p className={cardStyles.statDescription}>Logged this year</p>
</div>

// List item card
<li className={cardStyles.listItem}>
  {/* static list item */}
</li>

<li className={cardStyles.listItemInteractive}>
  {/* clickable list item with hover effects */}
</li>
```

### Form Components

```tsx
import formStyles from "@/styles/components/Form.module.css";

<div className={formStyles.field}>
  <label className={formStyles.label}>Email</label>
  <input className={formStyles.input} type="email" />
</div>

// Select dropdown
<select className={formStyles.select}>
  <option>Choose...</option>
</select>

// Textarea
<textarea className={formStyles.textarea} rows={3} />

// Error message
{error && <p className={formStyles.error}>{error}</p>}

// Form grid (2 columns on desktop)
<div className={formStyles.formGrid}>
  <div className={formStyles.field}>...</div>
  <div className={formStyles.field}>...</div>
</div>

// Form grid (always 2 columns)
<div className={formStyles.formGrid2}>...</div>

// Button group
<div className={formStyles.buttonGroup}>
  <button>Save</button>
  <button>Cancel</button>
</div>
```

### List Components

```tsx
import listStyles from "@/styles/components/List.module.css";

// List container
<ul className={listStyles.list}>
  {/* 16px gap */}
</ul>

<ul className={listStyles.listCompact}>
  {/* 12px gap */}
</ul>

// Empty state
<p className={listStyles.empty}>
  No items yet.
</p>

// Dive list items
<div className={listStyles.diveHeader}>
  <span className={listStyles.diveTitle}>Title</span>
  <span className={listStyles.diveDate}>2024-12-04</span>
</div>
<p className={listStyles.diveStats}>30m · 45min</p>
<p className={listStyles.diveMeta}>Buddy: John</p>
<p className={listStyles.diveNotes}>Notes...</p>
```

### Navigation Components

```tsx
import navStyles from "@/styles/components/Navigation.module.css";

<header className={navStyles.header}>
  <nav className={navStyles.nav}>
    <Link href="/" className={navStyles.brand}>
      <span className={navStyles.logo}>DiveIQ</span>
    </Link>
    <div className={navStyles.links}>
      <Link href="/dashboard" className={navStyles.link}>
        Dashboard
      </Link>
    </div>
  </nav>
</header>

// Accent links
<Link href="/details" className={navStyles.linkAccent}>
  View More
</Link>

<Link href="/details" className={navStyles.linkAccentSmall}>
  Small Link
</Link>
```

### Layout Components

```tsx
import layoutStyles from "@/styles/components/Layout.module.css";

// Page container
<main className={layoutStyles.page}>
  <div className={layoutStyles.pageContent}>
    {/* auto-centered, max-width content */}
  </div>
</main>

// Page header
<header className={layoutStyles.pageHeader}>
  <div>
    <h1 className={layoutStyles.pageTitle}>Page Title</h1>
    <p className={layoutStyles.pageSubtitle}>Subtitle</p>
  </div>
  <div className={layoutStyles.headerActions}>
    <button>Action 1</button>
    <button>Action 2</button>
  </div>
</header>

// Dashboard grids
<div className={layoutStyles.statsGrid}>
  {/* 3-column grid on desktop */}
</div>

<div className={layoutStyles.dashboardGrid}>
  {/* 2fr + 1.5fr grid on desktop */}
</div>

// Section with vertical spacing
<div className={layoutStyles.section}>
  {/* auto-spaced children */}
</div>
```

---

## 🎯 Typography Classes

Available globally from `typography.css`:

```tsx
<h1 className="heading-1">Largest Heading</h1>
<h2 className="heading-2">Second Level</h2>
<h3 className="heading-3">Third Level</h3>
<h4 className="heading-4">Fourth Level</h4>
<h5 className="heading-5">Fifth Level</h5>

<p className="body-large">Large body text</p>
<p className="body">Normal body text</p>
<p className="body-small">Small body text</p>
<p className="caption">Caption text</p>

<span className="text-muted">Muted text</span>
<span className="text-disabled">Disabled text</span>
<span className="text-accent">Accent colored text</span>
<span className="text-danger">Error text</span>
```

---

## 🛠 Utility Classes

Available globally from `utilities.css`:

```tsx
// Layout
<div className="container">
  {/* Centered, max-width container */}
</div>

<div className="flex-center">
  {/* Centered flex */}
</div>

<div className="flex-between">
  {/* Space-between flex */}
</div>

<div className="stack">
  {/* Vertical stack with 16px gap */}
</div>

<div className="stack-sm">
  {/* Vertical stack with 8px gap */}
</div>

// Transitions
<div className="transition">
  {/* Smooth transition on all properties */}
</div>

<button className="transition-colors">
  {/* Transition only colors */}
</button>

// Text truncation
<p className="truncate">
  {/* Single line with ellipsis */}
</p>

<p className="line-clamp-2">
  {/* 2 lines max with ellipsis */}
</p>

// Accessibility
<span className="sr-only">
  {/* Screen reader only */}
</span>
```

---

## 🎨 Using Design Tokens

Access tokens with `var()` in inline styles or CSS:

```tsx
// Inline styles
<div style={{
  padding: "var(--space-4)",
  backgroundColor: "var(--color-surface)",
  borderRadius: "var(--radius-lg)"
}}>
  Content
</div>

// In CSS Modules
.myComponent {
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  margin-top: var(--space-6);
}
```

---

## 🚀 Making Global Changes

### Change Primary Color

**File:** `src/styles/design-system/tokens.css`

```css
:root {
  --color-accent-primary: #f59e0b; /* Changed from cyan to orange */
  --color-accent-hover: #fbbf24;
  --color-accent-light: #fcd34d;
}
```

**Result:** ALL buttons, links, and focus states update automatically! ✨

### Adjust Spacing

**File:** `src/styles/design-system/tokens.css`

```css
:root {
  --space-4: 1.5rem; /* Increase from 1rem to 1.5rem */
}
```

**Result:** All components using `--space-4` update throughout the app!

### Change Card Styles

**File:** `src/styles/components/Card.module.css`

```css
.card {
  background-color: var(--color-bg-tertiary); /* Lighter background */
  border-width: 2px; /* Thicker border */
  border-radius: var(--radius-xl); /* More rounded */
}
```

**Result:** All cards across the app update!

### Change Button Styles

**File:** `src/styles/components/Button.module.css`

```css
.primary {
  padding: var(--space-3) var(--space-6); /* Larger buttons */
  font-size: var(--font-size-base); /* Bigger text */
  border-radius: var(--radius-full); /* Pill-shaped */
}
```

**Result:** All primary buttons update!

---

## 📝 Adding New Components

### Creating a New CSS Module

1. Create file: `src/styles/components/MyComponent.module.css`
2. Define styles using design tokens:

```css
.myComponent {
  background-color: var(--color-surface);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
}

.myVariant {
  composes: myComponent; /* Inherit base styles */
  background-color: var(--color-accent-primary);
  color: var(--color-bg-primary);
}
```

3. Use in component:

```tsx
import styles from "@/styles/components/MyComponent.module.css";

export function MyComponent() {
  return <div className={styles.myComponent}>Content</div>;
}
```

---

## ✨ Benefits

### ✅ Single Source of Truth

Change a color in one place → updates everywhere

### ✅ Type-Safe

TypeScript ensures class names exist (CSS Modules integration)

### ✅ Scoped Styles

No global class name conflicts

### ✅ Better Performance

Only loads CSS for components you actually use

### ✅ Maintainable

Easy to understand and modify

### ✅ Scalable

Architecture grows with your app

### ✅ Modern CSS

Use all CSS features (Grid, custom properties, etc.)

### ✅ Component-First

Styles co-located with components logically

---

## 🎓 Best Practices

### 1. Use Design Tokens First

Always use tokens instead of hardcoded values:

```tsx
// ❌ Bad
<div style={{ padding: "16px", color: "#94a3b8" }}>

// ✅ Good
<div style={{ padding: "var(--space-4)", color: "var(--color-text-muted)" }}>
```

### 2. Use Existing Modules

Check if a module exists before creating new styles:

```tsx
// ✅ Good - reuse existing
import buttonStyles from "@/styles/components/Button.module.css";
<button className={buttonStyles.primary}>Save</button>;
```

### 3. Compose Styles

Use `composes` in CSS Modules for inheritance:

```css
.baseButton {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
}

.primaryButton {
  composes: baseButton;
  background-color: var(--color-accent-primary);
}
```

### 4. Keep Inline Styles Minimal

Use CSS Modules for most styling, inline styles for dynamic values:

```tsx
// ✅ Good
<div
  className={cardStyles.card}
  style={{ width: `${dynamicWidth}px` }}
>
```

### 5. Use Semantic Class Names

Name classes by purpose, not appearance:

```css
/* ❌ Bad */
.blueButton {
}
.smallText {
}

/* ✅ Good */
.primaryButton {
}
.caption {
}
```

---

## 🔍 Quick Reference

| Need           | Import         | Class      |
| -------------- | -------------- | ---------- |
| Primary button | `buttonStyles` | `.primary` |
| Card container | `cardStyles`   | `.card`    |
| Form input     | `formStyles`   | `.input`   |
| Page layout    | `layoutStyles` | `.page`    |
| Navigation     | `navStyles`    | `.header`  |
| List           | `listStyles`   | `.list`    |

---

## 🎉 Summary

Your DiveIQ app now has a **professional, scalable CSS architecture**!

- ✅ Design system with tokens
- ✅ Modular component styles
- ✅ Global utilities
- ✅ Type-safe CSS Modules
- ✅ Single source of truth for all styles
- ✅ Easy global updates

**Making style changes is now:**

1. Find the design token or component module
2. Update in ONE place
3. See changes everywhere instantly

Enjoy your new CSS superpowers! 🚀
