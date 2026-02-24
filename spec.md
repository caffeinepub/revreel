# Specification

## Summary
**Goal:** Fix the notification tap handler so it navigates to the referenced user's in-app profile page instead of triggering an external Google search.

**Planned changes:**
- Update the notification item tap/click handler in the Notifications page to use the app's internal TanStack Router for navigation
- Remove any external URL or href construction that causes a browser/Google search
- Ensure the correct username or principal is passed to the profile route for all user-referencing notification types

**User-visible outcome:** Tapping a notification now opens the correct user's profile page within the app, with no external browser navigation or Google search occurring.
