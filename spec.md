# Specification

## Summary
**Goal:** Fix the missing upload button and ensure the Upload page works correctly for both reels (video) and pictures (images) in RevReel.

**Planned changes:**
- Add a clearly visible upload button (or floating action button) to the main navigation/bottom nav bar, accessible from the Feed, Profile, and Discover pages on both mobile and desktop layouts.
- Ensure the upload button navigates authenticated users to the `/upload` route; unauthenticated users are shown the AuthGuard login prompt.
- Fix the Upload page (`/upload`) so the file picker accepts `video/*` and `image/*` MIME types.
- Ensure the submit/upload button is visible and becomes enabled once a file, title, and category are provided.
- Verify the chunked upload flow completes successfully for video files and that image uploads also complete successfully.
- Navigate the user to the feed and display the new post upon successful upload.

**User-visible outcome:** Users can tap/click an upload button from the main navigation to reach the Upload page, select a video or image file, and successfully upload it — with the new post appearing in the feed afterward.
