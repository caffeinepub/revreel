# Specification

## Summary
**Goal:** Retry the deployment of the full application, ensuring all previously implemented admin panel features compile and deploy successfully to the Internet Computer network.

**Planned changes:**
- Re-deploy the backend with the hardcoded admin Principal, `isAdmin` query function, and `deleteUser` update function intact
- Re-deploy the frontend with the `useIsAdmin` and `useDeleteUser` React Query hooks, the `AdminPanel` page, and the `/admin` route in `App.tsx`
- Ensure the build compiles cleanly without TypeScript, bundler, or backend compilation errors

**User-visible outcome:** The application deploys successfully and navigating to `/admin` renders the AdminPanel page, with the `isAdmin` check correctly gating access.
