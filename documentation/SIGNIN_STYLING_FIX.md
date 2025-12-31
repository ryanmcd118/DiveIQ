# Signin Page Styling - Public Design System Consistency

## Files Changed

### 1. AppShell - Public Navbar for Auth Pages

- **`src/features/auth/components/AppShell.tsx`**
  - Added import for `PublicNavbar`
  - Added check for `/signin` and `/signup` routes
  - When not authenticated on auth pages, render `PublicNavbar` instead of logged-in navbar
  - This ensures signin/signup pages show the same public navbar as homepage

### 2. Signin Page Layout & Background

- **`src/app/(auth)/signin/page.tsx`**
  - Added `Background.pageGradient` class (same as homepage)
  - Wrapped form in `Card.elevatedForm` (same elevated card style)
  - Updated structure to use section container pattern

- **`src/app/(auth)/signin/signin.module.css`**
  - Updated `.container` to use full viewport height with gradient background
  - Added `.section` class matching public page section pattern
  - Constrained form card width to `28rem` (max-width)
  - Used design tokens: `--max-width-page`, `--section-padding-mobile`, `--section-padding-desktop`
  - Added padding-top to account for navbar height

### 3. Signin Form Button

- **`src/features/auth/components/SignInForm.tsx`**
  - Changed submit button from `Button.primary` to `Button.primaryGradient`
  - Matches homepage CTA styling (gradient cyan button with glow)

---

## Implementation Details

### Navbar Logic

```tsx
const isAuthPage = pathname === "/signin" || pathname === "/signup";
const showPublicNav = isAuthPage && !isAuthenticated && !isLoading;

if (showPublicNav) {
  return (
    <>
      <PublicNavbar />
      {children}
    </>
  );
}
```

This ensures:

- Signin/signup pages show public navbar when not authenticated
- Same navbar as homepage (Log in / Create account / Start a Dive Plan)
- Authenticated users on these pages still see logged-in navbar

### Page Structure

```
<div className="pageGradient">  <!-- Homepage gradient background -->
  <div className="section">      <!-- Max-width container, centered -->
    <div className="elevatedForm">  <!-- Elevated card container -->
      <header>...</header>
      <SignInForm />
    </div>
  </div>
</div>
```

### Form Styling

- Inputs already use `Form.module.css` styles (updated in Phase 2):
  - Dark background: `var(--color-surface-input)`
  - Cyan focus ring: `0 0 0 3px rgba(6, 182, 212, 0.15)`
- Submit button uses `Button.primaryGradient`:
  - Gradient cyan background
  - Glow shadow effect
  - Matches homepage CTAs

---

## Verification Checklist

- ✅ `/signin` uses same page gradient background as homepage
- ✅ `/signin` shows public navbar (Log in / Create account / Start a Dive Plan)
- ✅ Form card uses `Card.elevatedForm` (elevated, premium styling)
- ✅ Form inputs match public form styles (dark background, cyan focus)
- ✅ Submit button uses `Button.primaryGradient` (gradient CTA)
- ✅ Page uses same max-width container and section padding as public pages
- ✅ No other routes changed (only signin page and AppShell logic)
- ✅ No auth logic changes (only styling/layout)

---

## Summary

The `/signin` route now visually matches the logged-out homepage:

- **Same gradient background** (`Background.pageGradient`)
- **Same public navbar** (translucent, blur, cyan border)
- **Same elevated form card** (`Card.elevatedForm`)
- **Same primary button style** (`Button.primaryGradient`)
- **Same container patterns** (max-width, section padding)

The signin experience now feels like a natural part of the public landing experience, maintaining visual consistency throughout the user journey.
