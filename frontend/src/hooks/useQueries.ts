import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";
import type { UserProfile, ProfileResult } from "../backend";

// Re-export types so other files can import them from useQueries
export type { UserProfile } from "../backend";

// Helper to extract UserProfile from ProfileResult
function extractProfile(result: ProfileResult): UserProfile | null {
  if (result.__kind__ === "ok") return result.ok;
  return null;
}

// Local type definitions for backend data shapes
export interface Video {
  id: string;
  title: string;
  description: string;
  uploader: any;
  likes: any[];
  comments: any[];
  hashtags: string[];
  category: string;
  timestamp: bigint;
  thumbnail: any;
  mediaUrl: any;
  reactions: [any, any][];
  viewCount: number;
  mediaType: { __kind__: "video" } | { __kind__: "photo" };
}

export interface Comment {
  id: number;
  videoId: string;
  authorId: any;
  text: string;
  timestamp: bigint;
  authorName: string;
}

export interface CarMeet {
  id: string;
  title: string;
  location: string;
  date: bigint;
  description: string;
  organizer: any;
  attendees: any[];
  category: string;
  createdAt: bigint;
}

export interface MechanicsPost {
  id: number;
  title: string;
  description: string;
  author: any;
  category: string;
  createdAt: bigint;
  comments: MechanicsComment[];
}

export interface MechanicsComment {
  id: number;
  postId: number;
  authorId: any;
  text: string;
  timestamp: bigint;
}

export interface DirectMessage {
  id: number;
  fromUser: any;
  toUser: any;
  text: string;
  timestamp: bigint;
  isRead: boolean;
}

export interface ConversationSummary {
  otherUser: any;
  lastMessage: DirectMessage;
  unreadCount: number;
}

export interface Notification {
  id: number;
  recipientId: any;
  senderId: any;
  notificationType: string;
  referenceId: string;
  message: string;
  isRead: boolean;
  createdAt: bigint;
}

export interface BuildLog {
  id: number;
  title: string;
  authorId: any;
  carMake: string;
  carModel: string;
  carYear: string;
  description: string;
  stages: BuildStage[];
  createdAt: bigint;
  updatedAt: bigint;
}

export interface BuildStage {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: bigint;
}

export interface Listing {
  id: number;
  title: string;
  description: string;
  sellerId: any;
  make: string;
  model: string;
  year: string;
  price: string;
  condition: string;
  imageUrl: string;
  category: string;
  createdAt: bigint;
  isActive: boolean;
}

export type ReactionType =
  | { __kind__: "like" }
  | { __kind__: "fire" }
  | { __kind__: "hype" }
  | { __kind__: "respect" }
  | { __kind__: "wild" };

// ─── Profile Hooks ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.getCallerUserProfile();
      return extractProfile(result);
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
  const { identity } = useInternetIdentity();

  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      // If viewing own profile, use getCallerUserProfile to avoid admin restriction
      if (identity && identity.getPrincipal().toString() === userId) {
        const result = await actor.getCallerUserProfile();
        return extractProfile(result);
      }
      try {
        const { Principal } = await import("@dfinity/principal");
        const result = await actor.getUserProfile(Principal.fromText(userId));
        return extractProfile(result);
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
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      if (identity) {
        queryClient.invalidateQueries({
          queryKey: ["userProfile", identity.getPrincipal().toString()],
        });
      }
    },
  });
}

// ─── Video Hooks ──────────────────────────────────────────────────────────────

export function useGetAllVideos() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["allVideos"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllVideos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetVideosByUser(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["videosByUser", userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      try {
        const { Principal } = await import("@dfinity/principal");
        return (actor as any).getVideosByUser(Principal.fromText(userId));
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useGetVideosByCategory(category: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["videosByCategory", category],
    queryFn: async () => {
      if (!actor || !category) return [];
      return (actor as any).getVideosByCategory(category);
    },
    enabled: !!actor && !isFetching && !!category,
  });
}

export function useGetVideosByHashtag(hashtag: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["videosByHashtag", hashtag],
    queryFn: async () => {
      if (!actor || !hashtag) return [];
      return (actor as any).getVideosByHashtag(hashtag);
    },
    enabled: !!actor && !isFetching && !!hashtag,
  });
}

export function useGetTrendingVideos() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["trendingVideos"],
    queryFn: async () => {
      if (!actor) return [];
      // Trending = all videos sorted by views + likes
      const all = await (actor as any).getAllVideos();
      return [...(all as any[])].sort(
        (a, b) =>
          (b.viewCount + b.likes.length) - (a.viewCount + a.likes.length)
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSavedVideos() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["savedVideos"],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getCallerUserProfile();
      const profile = extractProfile(result);
      if (!profile) return [];
      const savedIds = profile.savedVideos.map((id) => id.toString());
      const allVideos = await (actor as any).getAllVideos();
      return (allVideos as any[]).filter((v: any) =>
        savedIds.includes(v.id.toString())
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (videoData: any) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).createVideo(videoData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allVideos"] });
      if (identity) {
        queryClient.invalidateQueries({
          queryKey: ["videosByUser", identity.getPrincipal().toString()],
        });
      }
    },
  });
}

// Alias for Upload page
export const useUploadVideo = useCreateVideo;

export function useDeleteVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).deleteVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allVideos"] });
      if (identity) {
        queryClient.invalidateQueries({
          queryKey: ["videosByUser", identity.getPrincipal().toString()],
        });
      }
    },
  });
}

export function useLikeVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).likeVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allVideos"] });
    },
  });
}

export function useUnlikeVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).unlikeVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allVideos"] });
    },
  });
}

// useToggleLike: convenience hook that likes or unlikes based on current state
export function useToggleLike() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      videoId,
      isLiked,
    }: {
      videoId: string;
      isLiked: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      if (isLiked) {
        return (actor as any).unlikeVideo(videoId);
      } else {
        return (actor as any).likeVideo(videoId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allVideos"] });
    },
  });
}

export function useSaveVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).saveVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedVideos"] });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useUnsaveVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).unsaveVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedVideos"] });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useReactToVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      videoId,
      reaction,
    }: {
      videoId: string;
      reaction: any;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).reactToVideo(videoId, reaction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allVideos"] });
    },
  });
}

// Alias for VideoCard
export const useAddReaction = useReactToVideo;

export function useIncrementViewCount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).incrementViewCount(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allVideos"] });
    },
  });
}

// ─── Comment Hooks ────────────────────────────────────────────────────────────

export function useGetComments(videoId: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["comments", videoId],
    queryFn: async () => {
      if (!actor || !videoId) return [];
      return (actor as any).getComments(videoId);
    },
    enabled: !!actor && !isFetching && !!videoId,
  });
}

export function usePostComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      videoId,
      text,
    }: {
      videoId: string;
      text: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).postComment(videoId, text);
    },
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.videoId],
      });
      queryClient.invalidateQueries({ queryKey: ["allVideos"] });
    },
  });
}

// Alias for CommentsPanel
export const useAddComment = usePostComment;

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      videoId,
      commentId,
    }: {
      videoId: string;
      commentId: number;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).deleteComment(videoId, commentId);
    },
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.videoId],
      });
    },
  });
}

// ─── Follow Hooks ─────────────────────────────────────────────────────────────

export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@dfinity/principal");
      return (actor as any).followUser(Principal.fromText(userId));
    },
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({
        queryKey: ["userProfile", variables.userId],
      });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["followers", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@dfinity/principal");
      return (actor as any).unfollowUser(Principal.fromText(userId));
    },
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({
        queryKey: ["userProfile", variables.userId],
      });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["followers", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    },
  });
}

export function useGetFollowers(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["followers", userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      try {
        const { Principal } = await import("@dfinity/principal");
        return (actor as any).getFollowers(Principal.fromText(userId));
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useGetFollowing(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["following", userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      try {
        const { Principal } = await import("@dfinity/principal");
        return (actor as any).getFollowing(Principal.fromText(userId));
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

// ─── Car Meet Hooks ───────────────────────────────────────────────────────────

export function useGetCarMeets() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["carMeets"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getCarMeets();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias
export const useGetAllCarMeets = useGetCarMeets;

export function useGetCarMeetDetails(meetId: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["carMeetDetails", meetId],
    queryFn: async () => {
      if (!actor || !meetId) return null;
      return (actor as any).getCarMeetDetails(meetId);
    },
    enabled: !!actor && !isFetching && !!meetId,
  });
}

export function useCreateCarMeet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meetData: any) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).createCarMeet(meetData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carMeets"] });
    },
  });
}

export function useJoinCarMeet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ meetId }: { meetId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).joinCarMeet(meetId);
    },
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["carMeets"] });
      queryClient.invalidateQueries({
        queryKey: ["carMeetDetails", variables.meetId],
      });
    },
  });
}

export function useLeaveCarMeet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ meetId }: { meetId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).leaveCarMeet(meetId);
    },
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["carMeets"] });
      queryClient.invalidateQueries({
        queryKey: ["carMeetDetails", variables.meetId],
      });
    },
  });
}

// ─── Mechanics Hooks ──────────────────────────────────────────────────────────

export function useGetMechanicsPosts() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["mechanicsPosts"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getMechanicsPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias
export const useGetAllMechanicsPosts = useGetMechanicsPosts;

export function useGetMechanicsPost(postId: number) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["mechanicsPost", postId],
    queryFn: async () => {
      if (!actor) return null;
      return (actor as any).getMechanicsPost(postId);
    },
    enabled: !!actor && !isFetching && postId !== undefined,
  });
}

// Alias
export const useGetMechanicsPostById = useGetMechanicsPost;

export function useCreateMechanicsPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postData: any) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).createMechanicsPost(postData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mechanicsPosts"] });
    },
  });
}

export function useDeleteMechanicsPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }: { postId: number }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).deleteMechanicsPost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mechanicsPosts"] });
    },
  });
}

export function usePostMechanicsComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      text,
    }: {
      postId: number;
      text: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).postMechanicsComment(postId, text);
    },
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({
        queryKey: ["mechanicsPost", variables.postId],
      });
      queryClient.invalidateQueries({ queryKey: ["mechanicsPosts"] });
    },
  });
}

// Alias
export const useAddMechanicsComment = usePostMechanicsComment;

// ─── Messaging Hooks ──────────────────────────────────────────────────────────

export function useGetConversations() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getConversations();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias
export const useGetInbox = useGetConversations;

export function useGetMessages(otherUserId: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["messages", otherUserId],
    queryFn: async () => {
      if (!actor || !otherUserId) return [];
      try {
        const { Principal } = await import("@dfinity/principal");
        return (actor as any).getMessages(Principal.fromText(otherUserId));
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!otherUserId,
    refetchInterval: 5000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      toUser,
      text,
    }: {
      toUser: string;
      text: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@dfinity/principal");
      return (actor as any).sendMessage(Principal.fromText(toUser), text);
    },
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.toUser],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useDeleteMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      otherUser,
      messageId,
    }: {
      otherUser: string;
      messageId: number;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@dfinity/principal");
      return (actor as any).deleteMessage(
        Principal.fromText(otherUser),
        messageId
      );
    },
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.otherUser],
      });
    },
  });
}

export function useMarkMessagesRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ otherUser }: { otherUser: string }) => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@dfinity/principal");
      return (actor as any).markMessagesRead(Principal.fromText(otherUser));
    },
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.otherUser],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// Alias
export const useMarkAsRead = useMarkMessagesRead;

// ─── Notification Hooks ───────────────────────────────────────────────────────

export function useGetNotifications() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getNotifications();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notificationId }: { notificationId: number }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).markNotificationRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).markAllNotificationsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// ─── Build Log Hooks ──────────────────────────────────────────────────────────

export function useGetBuildLogs() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["buildLogs"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getBuildLogs();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias
export const useGetAllBuildLogs = useGetBuildLogs;

export function useGetBuildLog(id: number) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["buildLog", id],
    queryFn: async () => {
      if (!actor) return null;
      return (actor as any).getBuildLog(id);
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

// Alias
export const useGetBuildLogById = useGetBuildLog;

export function useCreateBuildLog() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).createBuildLog(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildLogs"] });
    },
  });
}

export function useAddBuildStage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      buildLogId,
      stage,
    }: {
      buildLogId: number;
      stage: any;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).addBuildStage(buildLogId, stage);
    },
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({
        queryKey: ["buildLog", variables.buildLogId],
      });
      queryClient.invalidateQueries({ queryKey: ["buildLogs"] });
    },
  });
}

export function useDeleteBuildLog() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).deleteBuildLog(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildLogs"] });
    },
  });
}

// ─── Classifieds Hooks ────────────────────────────────────────────────────────

export function useGetListings() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["listings"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getListings();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias
export const useGetAllActiveListings = useGetListings;

export function useGetListing(id: number) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      if (!actor) return null;
      return (actor as any).getListing(id);
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

// Alias
export const useGetListingById = useGetListing;

export function useCreateListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).createListing(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useDeactivateListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).deactivateListing(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

// ─── Challenge Hooks ──────────────────────────────────────────────────────────

export function useGetChallenges() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getChallenges();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePostChallenge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      challengedId,
      videoId,
      originalVideoId,
    }: {
      challengedId: string;
      videoId: string;
      originalVideoId: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@dfinity/principal");
      return (actor as any).postChallenge(
        Principal.fromText(challengedId),
        videoId,
        originalVideoId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
  });
}

// ─── Admin Hooks ──────────────────────────────────────────────────────────────

export function useGetAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDeleteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@dfinity/principal");
      return (actor as any).deleteUser(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserStats(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["userStats", userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      try {
        const { Principal } = await import("@dfinity/principal");
        return (actor as any).getUserStats(Principal.fromText(userId));
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}
