# Specification

## Summary
**Goal:** Fix all backend Motoko and frontend TypeScript compilation errors so the application deploys successfully.

**Planned changes:**
- Audit and fix all Motoko compilation errors in `backend/main.mo` (type errors, missing imports, undefined references) so the actor compiles cleanly
- Audit and fix all TypeScript/Vite build errors in the React frontend, ensuring type imports, component props, and hook return types are correctly aligned across `frontend/src/hooks/useQueries.ts` and consuming components

**User-visible outcome:** The application deploys without errors and is fully accessible, with all existing features working as before.
