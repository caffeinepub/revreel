# Specification

## Summary
**Goal:** Fix the "expected v3 response body" error that occurs when a user attempts to upload a video or photo on the Upload page.

**Planned changes:**
- Update the backend upload/storage handler in `backend/main.mo` to return a response body that matches the v3 API contract expected by the frontend actor client.
- Ensure the frontend Upload page correctly parses the updated backend response without throwing a v3 response body parse error.
- Preserve user-friendly error messages for invalid upload cases (oversized file, unsupported format).

**User-visible outcome:** Users can successfully upload a video or photo without encountering the "expected v3 response body" error, and are redirected to the feed where the newly uploaded content appears.
