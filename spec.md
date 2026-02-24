# Specification

## Summary
**Goal:** Add a public landing page at the root route `/` where unauthenticated users can join/log in to RevReel, and redirect authenticated users directly to the feed.

**Planned changes:**
- Create a new `LandingPage` component at route `/` with a hero section featuring the RevReel logo, a bold tagline, and a "Join RevReel" button that triggers Internet Identity login
- On successful login, redirect the user to `/feed`; if already authenticated, auto-redirect from `/` to `/feed`
- Update the TanStack Router configuration so `/` renders `LandingPage` without the Layout shell, while all existing app routes remain intact
- Style the landing page with the existing dark theme, neon accents, glassmorphism, and Barlow font consistent with the rest of the app
- Use the new `landing-hero.png` as the hero background image

**User-visible outcome:** Unauthenticated visitors land on a visually striking branded page and can click "Join RevReel" to authenticate and enter the app. Authenticated users are taken straight to the feed.
