# Specification

## Summary
**Goal:** Roll back the application to its Version 22 state to restore stable account recognition and registration behavior.

**Planned changes:**
- Revert all backend (main.mo) and frontend source files to their Version 22 equivalents
- Restore logic so existing users are recognized upon login via Internet Identity and are not prompted to create a new account
- Restore registration flow so new users can successfully complete profile setup without a "failed to register or create" error
- Ensure the ProfileSetupModal does not appear for users who already have an existing profile

**User-visible outcome:** Existing users can log in and access their profile, feed, and all authenticated features without errors. New users can register successfully without encountering failures.
