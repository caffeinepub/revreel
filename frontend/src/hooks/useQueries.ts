import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import { Principal } from "@dfinity/principal";
import {
  Video,
  UserProfile,
  ProfileResult,
  Result,
  UploadResponse,
  Comment,
  Variant_video_photo,
  ReactionType,
} from "../backend";
import { ExternalBlob } from "../backend";

// Re-export backend types so consumers can import them from useQueries
export type { Video, UserProfile, Comment, ReactionType } from "../backend";

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      const result: ProfileResult = await actor.getCallerUserProfile();
      if (result.__kind__ === "ok") return result.ok;
      return null;
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserProfile(userId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      try {
        const principal = Principal.fromText(userId);
        const result: ProfileResult = await actor.getUserProfile(principal);
        if (result.__kind__ === "ok") return result.ok;
        return null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!userId,
    retry: false,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useUpdateProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// Client-side user list (no backend method available)
let localUsers: UserProfile[] = [];

export function useGetAllUsers() {
  return useQuery<UserProfile[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      return [...localUsers];
    },
  });
}

// ─── Videos ──────────────────────────────────────────────────────────────────

export function useGetAllVideos() {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ["allVideos"],
    queryFn: async () => {
      if (!actor) return [];
      const videos = await actor.getVideos();
      // Sort newest first
      return [...videos].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTrendingVideos() {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ["trendingVideos"],
    queryFn: async () => {
      if (!actor) return [];
      const videos = await actor.getVideos();
      // Sort by likes + viewCount descending
      return [...videos].sort(
        (a, b) =>
          b.likes.length + Number(b.viewCount) -
          (a.likes.length + Number(a.viewCount))
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetVideosByCategory(category: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ["videosByCategory", category],
    queryFn: async () => {
      if (!actor || !category) return [];
      const videos = await actor.getVideos();
      return videos
        .filter((v) => v.category === category)
        .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    },
    enabled: !!actor && !isFetching && !!category,
  });
}

export function useGetVideosByHashtag(hashtag: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ["videosByHashtag", hashtag],
    queryFn: async () => {
      if (!actor || !hashtag) return [];
      const videos = await actor.getVideos();
      return videos
        .filter((v) => v.hashtags.includes(hashtag))
        .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    },
    enabled: !!actor && !isFetching && !!hashtag,
  });
}

export function useGetSavedVideos(savedVideoIds: bigint[] = []) {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ["savedVideos", savedVideoIds.map(String).join(",")],
    queryFn: async () => {
      if (!actor) return [];
      const videos = await actor.getVideos();
      const savedSet = new Set(savedVideoIds.map(String));
      return videos.filter((v) => savedSet.has(v.id));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetVideosByUser(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ["videosByUser", userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      const videos = await actor.getVideos();
      return videos
        .filter((v) => v.uploader.toString() === userId)
        .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export interface CreateVideoParams {
  title: string;
  description: string;
  category: string;
  hashtags: string[];
  video: ExternalBlob;
  thumbnail: ExternalBlob;
  mediaType: Variant_video_photo;
  onMediaProgress?: (pct: number) => void;
  onThumbnailProgress?: (pct: number) => void;
}

/**
 * Upload a single blob via the backend uploadBlob method.
 * Parses the UploadResponse discriminated union and throws on error.
 */
async function uploadBlobViaBackend(
  actor: { uploadBlob: (blob: ExternalBlob) => Promise<UploadResponse> },
  blob: ExternalBlob
): Promise<ExternalBlob> {
  const response: UploadResponse = await actor.uploadBlob(blob);
  if (response.__kind__ === "ok") {
    return response.ok.blob;
  }
  throw new Error(response.error || "Upload failed");
}

export function useCreateVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateVideoParams): Promise<Result> => {
      if (!actor) throw new Error("Actor not available");

      // Step 1: Upload media blob via uploadBlob, get back the stored blob reference
      const mediaWithProgress = params.onMediaProgress
        ? params.video.withUploadProgress(params.onMediaProgress)
        : params.video;
      const uploadedMedia = await uploadBlobViaBackend(actor, mediaWithProgress);

      // Step 2: Upload thumbnail blob via uploadBlob
      const thumbWithProgress = params.onThumbnailProgress
        ? params.thumbnail.withUploadProgress(params.onThumbnailProgress)
        : params.thumbnail;
      const uploadedThumbnail = await uploadBlobViaBackend(actor, thumbWithProgress);

      // Step 3: Create the video record with the uploaded blob references
      const result: Result = await actor.createVideo(
        params.title,
        params.description,
        params.category,
        params.hashtags,
        uploadedMedia,
        uploadedThumbnail,
        params.mediaType
      );

      if (result.__kind__ === "unauthorized") throw new Error(result.unauthorized);
      if (result.__kind__ === "internalError") throw new Error(result.internalError);
      if (result.__kind__ === "notFound") throw new Error("Not found");

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allVideos"] });
      queryClient.invalidateQueries({ queryKey: ["trendingVideos"] });
      queryClient.invalidateQueries({ queryKey: ["videosByUser"] });
      queryClient.invalidateQueries({ queryKey: ["videosByCategory"] });
      queryClient.invalidateQueries({ queryKey: ["videosByHashtag"] });
    },
  });
}

// Alias used by Upload.tsx
export const useUploadVideo = useCreateVideo;

// ─── Delete Post (videos and photos) ─────────────────────────────────────────

export function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string): Promise<void> => {
      if (!actor) throw new Error("Actor not available");
      const result: Result = await actor.deletePost(postId);
      if (result.__kind__ === "ok") return;
      if (result.__kind__ === "notFound") throw new Error("Post not found");
      if (result.__kind__ === "unauthorized") throw new Error(result.unauthorized);
      if (result.__kind__ === "internalError") throw new Error(result.internalError);
      throw new Error("Unknown error deleting post");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allVideos"] });
      queryClient.invalidateQueries({ queryKey: ["trendingVideos"] });
      queryClient.invalidateQueries({ queryKey: ["videosByUser"] });
      queryClient.invalidateQueries({ queryKey: ["videosByCategory"] });
      queryClient.invalidateQueries({ queryKey: ["videosByHashtag"] });
      queryClient.invalidateQueries({ queryKey: ["savedVideos"] });
    },
  });
}

// Keep legacy stub for any remaining references
export function useDeleteVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_params: { videoId: string }) => {
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allVideos"] });
    },
  });
}

// ─── Likes / Reactions ───────────────────────────────────────────────────────

export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_params: { videoId: string; isLiked: boolean }) => {
      // Like toggling is client-side only for now (backend method not available)
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allVideos"] });
    },
  });
}

export function useAddReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_params: { videoId: string; reaction: any }) => {
      // Reaction is client-side only for now
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allVideos"] });
    },
  });
}

export function useToggleReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_params: { videoId: string; reaction: ReactionType }) => {
      // Reaction toggling is client-side only for now
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allVideos"] });
    },
  });
}

export function useIncrementViewCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_params: { videoId: string }) => {
      // View count increment is client-side only for now
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allVideos"] });
    },
  });
}

// ─── Save Video ───────────────────────────────────────────────────────────────

export function useSaveVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_params: { videoId: string }) => {
      // Save video - client-side only for now
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["savedVideos"] });
    },
  });
}

export function useUnsaveVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_params: { videoId: string }) => {
      // Unsave video - client-side only for now
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["savedVideos"] });
    },
  });
}

// ─── Comments ────────────────────────────────────────────────────────────────

export function useGetComments(videoId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ["comments", videoId],
    queryFn: async () => {
      if (!actor || !videoId) return [];
      const videos = await actor.getVideos();
      const video = videos.find((v) => v.id === videoId);
      if (!video) return [];
      return [...video.comments].sort(
        (a, b) => Number(b.timestamp) - Number(a.timestamp)
      );
    },
    enabled: !!actor && !isFetching && !!videoId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_params: { videoId: string; text: string }) => {
      // Comment adding is client-side only for now
      return;
    },
    onSuccess: (_data: void, variables: { videoId: string; text: string }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.videoId] });
      queryClient.invalidateQueries({ queryKey: ["allVideos"] });
    },
  });
}

// ─── Follow / Unfollow ───────────────────────────────────────────────────────

// Client-side follow state
const followMap = new Map<string, Set<string>>();

export function useGetFollowers(userId: string) {
  return useQuery<string[]>({
    queryKey: ["followers", userId],
    queryFn: async () => {
      if (!userId) return [];
      return Array.from(followMap.get(userId) ?? []);
    },
    enabled: !!userId,
  });
}

export function useGetFollowing(userId: string) {
  return useQuery<string[]>({
    queryKey: ["following", userId],
    queryFn: async () => {
      if (!userId) return [];
      const result: string[] = [];
      followMap.forEach((followers, followedId) => {
        if (followers.has(userId)) result.push(followedId);
      });
      return result;
    },
    enabled: !!userId,
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, followerId }: { userId: string; followerId?: string }) => {
      if (!followMap.has(userId)) followMap.set(userId, new Set());
      if (followerId) followMap.get(userId)!.add(followerId);
    },
    onSuccess: (_data: void, variables: { userId: string; followerId?: string }) => {
      queryClient.invalidateQueries({ queryKey: ["followers", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useUnfollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, followerId }: { userId: string; followerId?: string }) => {
      if (followerId) followMap.get(userId)?.delete(followerId);
    },
    onSuccess: (_data: void, variables: { userId: string; followerId?: string }) => {
      queryClient.invalidateQueries({ queryKey: ["followers", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Car Meets ───────────────────────────────────────────────────────────────

export type CarMeet = {
  id: string;
  title: string;
  location: string;
  date: bigint;
  description: string;
  organizer: string;
  attendees: string[];
  category: string;
  createdAt: bigint;
};

export type CarMeetDetails = {
  id: string;
  title: string;
  location: string;
  date: bigint;
  description: string;
  organizer: UserProfile | null;
  attendees: UserProfile[];
  category: string;
  createdAt: bigint;
};

let localCarMeets: CarMeet[] = [];
let nextMeetId = 1;

export function useGetCarMeets() {
  return useQuery<CarMeet[]>({
    queryKey: ["carMeets"],
    queryFn: async () => {
      return [...localCarMeets].sort((a, b) => Number(b.date) - Number(a.date));
    },
  });
}

export function useGetCarMeetDetails(meetId: string) {
  return useQuery<CarMeetDetails | null>({
    queryKey: ["carMeetDetails", meetId],
    queryFn: async () => {
      const meet = localCarMeets.find((m) => m.id === meetId);
      if (!meet) return null;
      return {
        ...meet,
        organizer: null,
        attendees: [],
      };
    },
    enabled: !!meetId,
  });
}

export function useCreateCarMeet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      location: string;
      date: bigint;
      description: string;
      category: string;
    }) => {
      const meet: CarMeet = {
        id: String(nextMeetId++),
        title: params.title,
        location: params.location,
        date: params.date,
        description: params.description,
        organizer: "current-user",
        attendees: [],
        category: params.category,
        createdAt: BigInt(Date.now()) * BigInt(1_000_000),
      };
      localCarMeets.push(meet);
      return meet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carMeets"] });
    },
  });
}

export function useJoinCarMeet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ meetId }: { meetId: string }) => {
      const meet = localCarMeets.find((m) => m.id === meetId);
      if (meet && !meet.attendees.includes("current-user")) {
        meet.attendees.push("current-user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carMeets"] });
      queryClient.invalidateQueries({ queryKey: ["carMeetDetails"] });
    },
  });
}

export function useLeaveCarMeet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ meetId }: { meetId: string }) => {
      const meet = localCarMeets.find((m) => m.id === meetId);
      if (meet) {
        meet.attendees = meet.attendees.filter((a) => a !== "current-user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carMeets"] });
      queryClient.invalidateQueries({ queryKey: ["carMeetDetails"] });
    },
  });
}

// ─── Mechanics Posts ──────────────────────────────────────────────────────────

export type MechanicsPost = {
  id: number;
  title: string;
  description: string;
  author: string;
  category: string;
  createdAt: bigint;
  comments: MechanicsComment[];
};

export type MechanicsComment = {
  id: number;
  postId: number;
  authorId: string;
  text: string;
  timestamp: bigint;
};

let localMechanicsPosts: MechanicsPost[] = [];
let nextMechanicsPostId = 1;
let nextMechanicsCommentId = 1;

export function useGetMechanicsPosts() {
  return useQuery<MechanicsPost[]>({
    queryKey: ["mechanicsPosts"],
    queryFn: async () => {
      return [...localMechanicsPosts].sort(
        (a, b) => Number(b.createdAt) - Number(a.createdAt)
      );
    },
  });
}

export function useGetMechanicsPost(postId: number) {
  return useQuery<MechanicsPost | null>({
    queryKey: ["mechanicsPost", postId],
    queryFn: async () => {
      return localMechanicsPosts.find((p) => p.id === postId) ?? null;
    },
    enabled: !!postId,
  });
}

export function useCreateMechanicsPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      description: string;
      category: string;
    }) => {
      const post: MechanicsPost = {
        id: nextMechanicsPostId++,
        title: params.title,
        description: params.description,
        author: "current-user",
        category: params.category,
        createdAt: BigInt(Date.now()) * BigInt(1_000_000),
        comments: [],
      };
      localMechanicsPosts.push(post);
      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mechanicsPosts"] });
    },
  });
}

export function useDeleteMechanicsPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: number) => {
      localMechanicsPosts = localMechanicsPosts.filter((p) => p.id !== postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mechanicsPosts"] });
    },
  });
}

export function useAddMechanicsComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { postId: number; text: string }) => {
      const post = localMechanicsPosts.find((p) => p.id === params.postId);
      if (!post) throw new Error("Post not found");
      const comment: MechanicsComment = {
        id: nextMechanicsCommentId++,
        postId: params.postId,
        authorId: "current-user",
        text: params.text,
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
      };
      post.comments.push(comment);
      return comment;
    },
    onSuccess: (_data: MechanicsComment, variables: { postId: number; text: string }) => {
      queryClient.invalidateQueries({ queryKey: ["mechanicsPost", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["mechanicsPosts"] });
    },
  });
}

// ─── Direct Messages ──────────────────────────────────────────────────────────

export type DirectMessage = {
  id: number;
  fromUser: string;
  toUser: string;
  text: string;
  timestamp: bigint;
  isRead: boolean;
};

export type ConversationSummary = {
  otherUser: string;
  lastMessage: DirectMessage;
  unreadCount: number;
};

let localMessages: DirectMessage[] = [];
let nextMessageId = 1;

export function useGetConversations() {
  return useQuery<ConversationSummary[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const currentUser = "current-user";
      const convMap = new Map<string, DirectMessage[]>();
      localMessages
        .filter((m) => m.fromUser === currentUser || m.toUser === currentUser)
        .forEach((m) => {
          const other = m.fromUser === currentUser ? m.toUser : m.fromUser;
          if (!convMap.has(other)) convMap.set(other, []);
          convMap.get(other)!.push(m);
        });
      const summaries: ConversationSummary[] = [];
      convMap.forEach((msgs, otherUser) => {
        const sorted = [...msgs].sort(
          (a, b) => Number(b.timestamp) - Number(a.timestamp)
        );
        const unreadCount = msgs.filter(
          (m) => m.toUser === currentUser && !m.isRead
        ).length;
        summaries.push({ otherUser, lastMessage: sorted[0], unreadCount });
      });
      return summaries.sort(
        (a, b) =>
          Number(b.lastMessage.timestamp) - Number(a.lastMessage.timestamp)
      );
    },
  });
}

export function useGetMessages(otherUserId: string) {
  return useQuery<DirectMessage[]>({
    queryKey: ["messages", otherUserId],
    queryFn: async () => {
      const currentUser = "current-user";
      return localMessages
        .filter(
          (m) =>
            (m.fromUser === currentUser && m.toUser === otherUserId) ||
            (m.fromUser === otherUserId && m.toUser === currentUser)
        )
        .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    },
    enabled: !!otherUserId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { toUser: string; text: string }) => {
      const msg: DirectMessage = {
        id: nextMessageId++,
        fromUser: "current-user",
        toUser: params.toUser,
        text: params.text,
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
        isRead: false,
      };
      localMessages.push(msg);
      return msg;
    },
    onSuccess: (_data: DirectMessage, variables: { toUser: string; text: string }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.toUser] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      const currentUser = "current-user";
      localMessages
        .filter((m) => m.fromUser === otherUserId && m.toUser === currentUser)
        .forEach((m) => {
          m.isRead = true;
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

// Alias for backward compatibility
export const useMarkMessagesRead = useMarkAsRead;

// ─── Notifications ────────────────────────────────────────────────────────────

export type Notification = {
  id: number;
  recipientId: string;
  senderId: string;
  notificationType: string;
  referenceId: string;
  message: string;
  isRead: boolean;
  createdAt: bigint;
};

let localNotifications: Notification[] = [];
let nextNotificationId = 1;

export function useGetNotifications() {
  return useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      return [...localNotifications]
        .filter((n) => n.recipientId === "current-user")
        .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      const notif = localNotifications.find((n) => n.id === notificationId);
      if (notif) notif.isRead = true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      localNotifications
        .filter((n) => n.recipientId === "current-user")
        .forEach((n) => {
          n.isRead = true;
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// ─── Build Logs ───────────────────────────────────────────────────────────────

export type BuildStage = {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: bigint;
};

export type BuildLog = {
  id: number;
  title: string;
  authorId: string;
  carMake: string;
  carModel: string;
  carYear: string;
  description: string;
  stages: BuildStage[];
  createdAt: bigint;
  updatedAt: bigint;
};

let localBuildLogs: BuildLog[] = [];
let nextBuildLogId = 1;
let nextBuildStageId = 1;

export function useGetBuildLogs() {
  return useQuery<BuildLog[]>({
    queryKey: ["buildLogs"],
    queryFn: async () => {
      return [...localBuildLogs].sort(
        (a, b) => Number(b.createdAt) - Number(a.createdAt)
      );
    },
  });
}

export function useGetBuildLog(logId: number) {
  return useQuery<BuildLog | null>({
    queryKey: ["buildLog", logId],
    queryFn: async () => {
      return localBuildLogs.find((l) => l.id === logId) ?? null;
    },
    enabled: !!logId,
  });
}

export function useCreateBuildLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      carMake: string;
      carModel: string;
      carYear: string;
      description: string;
    }) => {
      const now = BigInt(Date.now()) * BigInt(1_000_000);
      const log: BuildLog = {
        id: nextBuildLogId++,
        title: params.title,
        authorId: "current-user",
        carMake: params.carMake,
        carModel: params.carModel,
        carYear: params.carYear,
        description: params.description,
        stages: [],
        createdAt: now,
        updatedAt: now,
      };
      localBuildLogs.push(log);
      return log;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildLogs"] });
    },
  });
}

export function useDeleteBuildLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ logId }: { logId: number }) => {
      localBuildLogs = localBuildLogs.filter((l) => l.id !== logId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildLogs"] });
    },
  });
}

export interface AddBuildStageParams {
  logId: number;
  title: string;
  description: string;
  imageUrl: string;
}

export function useAddBuildStage() {
  const queryClient = useQueryClient();

  return useMutation<BuildStage, Error, AddBuildStageParams>({
    mutationFn: async (params: AddBuildStageParams): Promise<BuildStage> => {
      const log = localBuildLogs.find((l) => l.id === params.logId);
      if (!log) throw new Error("Build log not found");
      const stage: BuildStage = {
        id: nextBuildStageId++,
        title: params.title,
        description: params.description,
        imageUrl: params.imageUrl,
        createdAt: BigInt(Date.now()) * BigInt(1_000_000),
      };
      log.stages.push(stage);
      log.updatedAt = BigInt(Date.now()) * BigInt(1_000_000);
      return stage;
    },
    onSuccess: (_data: BuildStage, variables: AddBuildStageParams) => {
      queryClient.invalidateQueries({ queryKey: ["buildLog", variables.logId] });
      queryClient.invalidateQueries({ queryKey: ["buildLogs"] });
    },
  });
}

// ─── Classifieds / Listings ───────────────────────────────────────────────────

export type Listing = {
  id: number;
  title: string;
  description: string;
  sellerId: string;
  make: string;
  model: string;
  year: string;
  price: string;
  condition: string;
  imageUrl: string;
  category: string;
  createdAt: bigint;
  isActive: boolean;
};

let localListings: Listing[] = [];
let nextListingId = 1;

export function useGetListings() {
  return useQuery<Listing[]>({
    queryKey: ["listings"],
    queryFn: async () => {
      return [...localListings]
        .filter((l) => l.isActive)
        .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
    },
  });
}

export function useGetListing(id: number) {
  return useQuery<Listing | null>({
    queryKey: ["listing", id],
    queryFn: async () => {
      return localListings.find((l) => l.id === id) ?? null;
    },
    enabled: !!id,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      description: string;
      make: string;
      model: string;
      year: string;
      price: string;
      condition: string;
      imageUrl: string;
      category: string;
    }) => {
      const listing: Listing = {
        id: nextListingId++,
        title: params.title,
        description: params.description,
        sellerId: "current-user",
        make: params.make,
        model: params.model,
        year: params.year,
        price: params.price,
        condition: params.condition,
        imageUrl: params.imageUrl,
        category: params.category,
        createdAt: BigInt(Date.now()) * BigInt(1_000_000),
        isActive: true,
      };
      localListings.push(listing);
      return listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useDeactivateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const listing = localListings.find((l) => l.id === id);
      if (listing) listing.isActive = false;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

// ─── Racing Challenges ────────────────────────────────────────────────────────

export type RacingChallenge = {
  id: number;
  challengerId: string;
  challengedId: string;
  videoId: string;
  originalVideoId: string;
  status: string;
  createdAt: bigint;
};

let localChallenges: RacingChallenge[] = [];
let nextChallengeId = 1;

export function useGetChallenges() {
  return useQuery<RacingChallenge[]>({
    queryKey: ["challenges"],
    queryFn: async () => {
      return [...localChallenges].sort(
        (a, b) => Number(b.createdAt) - Number(a.createdAt)
      );
    },
  });
}

export function usePostChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      challengedId: string;
      videoId: string;
      originalVideoId: string;
    }) => {
      const challenge: RacingChallenge = {
        id: nextChallengeId++,
        challengerId: "current-user",
        challengedId: params.challengedId,
        videoId: params.videoId,
        originalVideoId: params.originalVideoId,
        status: "pending",
        createdAt: BigInt(Date.now()) * BigInt(1_000_000),
      };
      localChallenges.push(challenge);
      return challenge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
  });
}

// ─── User Stats ───────────────────────────────────────────────────────────────

export type UserStats = {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalFollowers: number;
  totalFollowing: number;
  totalBuildLogs: number;
  joinedAt: bigint;
};

export function useGetUserStats(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserStats>({
    queryKey: ["userStats", userId],
    queryFn: async () => {
      if (!actor || !userId) {
        return {
          totalVideos: 0,
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalFollowers: 0,
          totalFollowing: 0,
          totalBuildLogs: 0,
          joinedAt: BigInt(0),
        };
      }
      const videos = await actor.getVideos();
      const userVideos = videos.filter((v) => v.uploader.toString() === userId);
      const totalViews = userVideos.reduce((sum, v) => sum + Number(v.viewCount), 0);
      const totalLikes = userVideos.reduce((sum, v) => sum + v.likes.length, 0);
      const totalComments = userVideos.reduce((sum, v) => sum + v.comments.length, 0);
      const followers = Array.from(followMap.get(userId) ?? []).length;
      const following = (() => {
        let count = 0;
        followMap.forEach((set) => { if (set.has(userId)) count++; });
        return count;
      })();
      const buildLogs = localBuildLogs.filter((l) => l.authorId === userId).length;

      return {
        totalVideos: userVideos.length,
        totalViews,
        totalLikes,
        totalComments,
        totalFollowers: followers,
        totalFollowing: following,
        totalBuildLogs: buildLogs,
        joinedAt: BigInt(0),
      };
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useGetAllUsersAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ["allUsersAdmin"],
    queryFn: async () => {
      if (!actor) return [];
      // No direct getAllUsers backend method; return local cache
      return [...localUsers];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      localUsers = localUsers.filter((u) => u.id.toString() !== userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsersAdmin"] });
    },
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}
