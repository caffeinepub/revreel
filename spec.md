# Specification

## Summary
**Goal:** Fix the profile page "not found" error and resolve all related routing, backend, and frontend code issues in the RevReel app.

**Planned changes:**
- Fix profile route configuration in App.tsx so that `/profile/:userId` (or the correct path) resolves properly with the correct route parameter name
- Fix Profile.tsx to correctly read route params, distinguish own profile vs. another user's profile, and pass the right user identifier to all backend queries
- Audit and fix all navigation links and programmatic navigations (Layout.tsx, VideoCard.tsx, Notifications.tsx, Leaderboard.tsx, Conversation.tsx, Inbox.tsx, etc.) to use the correct profile route path and user identifier
- Fix backend `getUserProfile`, `saveCallerUserProfile`, and `updateProfile` functions to handle missing profiles gracefully without trapping
- Fix `useFetchUserProfile`, `useSaveCallerUserProfile`, and `useUpdateProfile` hooks to correctly decode backend responses and handle new-user vs. invalid-user cases
- Fix any remaining TypeScript errors, broken imports, missing route definitions, incorrect query key usage, and stale cache invalidation issues across the frontend

**User-visible outcome:** Users can navigate to any profile page (own or others') without encountering a "not found" error, and all profile-related functionality works correctly throughout the app.
