# Specification

## Summary
**Goal:** Fix the bug where a newly uploaded video does not appear in the feed after a successful upload.

**Planned changes:**
- Invalidate or refetch the feed React Query cache after the `createVideo` mutation completes successfully, so the feed updates automatically without a manual page refresh.
- Verify and fix the backend `createVideo` function to ensure uploaded videos are persisted in stable storage and returned by the `getVideos` feed query immediately after creation.

**User-visible outcome:** After uploading a video, the user is navigated to the feed and the newly uploaded video is immediately visible in the list without needing to refresh the page.
