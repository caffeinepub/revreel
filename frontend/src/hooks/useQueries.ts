import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { Principal } from '@dfinity/principal';
import {
  type Video,
  type Comment,
  type UserId,
  ExternalBlob,
  ReactionType,
  Variant_video_photo,
} from '../backend';

// ── Local type definitions for types not in generated backend.d.ts ──────────

export type UserProfile = {
  id: UserId;
  username: string;
  bio: string;
  avatar: ExternalBlob;
  avatarUrl: string;
  verified: boolean;
  badges: Badge[];
  savedVideos: number[];
  joinedAt: number;
};

export type Badge =
  | 'driftKing'
  | 'mechanicPro'
  | 'dragRacer'
  | 'communityHelper'
  | 'verified'
  | 'buildMaster'
  | 'racingLegend';

export type CarMeet = {
  id: string;
  title: string;
  location: string;
  date: bigint;
  description: string;
  organizer: UserId;
  attendees: UserId[];
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

export type MechanicsComment = {
  id: bigint;
  postId: number;
  authorId: UserId;
  text: string;
  timestamp: bigint;
};

export type MechanicsPost = {
  id: number;
  title: string;
  description: string;
  author: UserId;
  category: string;
  createdAt: bigint;
  comments: MechanicsComment[];
};

export type DirectMessage = {
  id: bigint;
  fromUser: UserId;
  toUser: UserId;
  text: string;
  timestamp: bigint;
  isRead: boolean;
};

export type ConversationSummary = {
  otherUser: UserId;
  lastMessage: DirectMessage;
  unreadCount: number;
};

export type Notification = {
  id: number;
  recipientId: UserId;
  senderId: UserId;
  notificationType: string;
  referenceId: string;
  message: string;
  isRead: boolean;
  createdAt: number;
};

export type BuildStage = {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: number;
};

export type BuildLog = {
  id: number;
  title: string;
  authorId: UserId;
  carMake: string;
  carModel: string;
  carYear: string;
  description: string;
  stages: BuildStage[];
  createdAt: number;
  updatedAt: number;
};

export type Listing = {
  id: number;
  title: string;
  description: string;
  sellerId: UserId;
  make: string;
  model: string;
  year: string;
  price: string;
  condition: string;
  imageUrl: string;
  category: string;
  createdAt: number;
  isActive: boolean;
};

export type RacingChallenge = {
  id: number;
  challengerId: UserId;
  challengedId: UserId;
  videoId: number;
  originalVideoId: number;
  status: string;
  createdAt: number;
};

export type UserStats = {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalFollowers: number;
  totalFollowing: number;
  totalBuildLogs: number;
  joinedAt: number;
};

// ── Re-export backend types ──────────────────────────────────────────────────
export type { Video, Comment, ReactionType };
export { Variant_video_photo };

// ── Helpers ──────────────────────────────────────────────────────────────────

// Cast actor to any for methods not in the minimal generated interface
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function a(actor: unknown): any {
  return actor as any;
}

// ── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity, isInitializing } = useInternetIdentity();

  const isAuthenticated = !!identity;

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await a(actor).getCallerUserProfile();
      } catch (err: unknown) {
        if (isAuthenticated) return null;
        throw err;
      }
    },
    enabled: !!actor && !actorFetching && isAuthenticated && !isInitializing,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || isInitializing || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserProfile(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!actor) return null;
      return a(actor).getUserProfile(Principal.fromText(userId));
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useGetAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return a(actor).getAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      username,
      bio,
      avatar,
      avatarUrl,
    }: {
      username: string;
      bio: string;
      avatar: ExternalBlob;
      avatarUrl?: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).createUser(username, bio, avatar, avatarUrl || '');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useUpdateProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      username,
      bio,
      avatar,
      avatarUrl,
    }: {
      username: string;
      bio: string;
      avatar: ExternalBlob;
      avatarUrl?: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).updateProfile(username, bio, avatar, avatarUrl || '');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useUpdateAvatar() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ avatarUrl }: { avatarUrl: string }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).updateAvatar(avatarUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetUserBadges(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Badge[]>({
    queryKey: ['userBadges', userId],
    queryFn: async () => {
      if (!actor) return [];
      return a(actor).getUserBadges(Principal.fromText(userId));
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

// ── Videos ───────────────────────────────────────────────────────────────────

export function useGetAllVideos() {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['videos'],
    queryFn: async () => {
      if (!actor) return [];
      return a(actor).getAllVideos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetVideosByCategory(category: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['videos', 'category', category],
    queryFn: async () => {
      if (!actor) return [];
      return a(actor).getVideosByCategory(category);
    },
    enabled: !!actor && !isFetching && !!category,
  });
}

export function useGetVideosByHashtag(hashtag: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['videos', 'hashtag', hashtag],
    queryFn: async () => {
      if (!actor) return [];
      return a(actor).getVideosByHashtag(hashtag);
    },
    enabled: !!actor && !isFetching && !!hashtag,
  });
}

export function useGetTrendingVideos() {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['videos', 'trending'],
    queryFn: async () => {
      if (!actor) return [];
      return a(actor).getTrendingVideos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSavedVideos() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Video[]>({
    queryKey: ['savedVideos'],
    queryFn: async () => {
      if (!actor) return [];
      return a(actor).getSavedVideos();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useUploadVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      hashtags,
      category,
      thumbnailBlob,
      videoBlob,
      mediaType,
    }: {
      title: string;
      description: string;
      hashtags: string[];
      category: string;
      thumbnailBlob: ExternalBlob;
      videoBlob: ExternalBlob;
      mediaType: Variant_video_photo;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadVideo(title, description, hashtags, category, thumbnailBlob, videoBlob, mediaType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

export function useDeleteVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).deleteVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

export function useToggleLike() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).toggleLike(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

export function useSaveVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).saveVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedVideos'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useUnsaveVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).unsaveVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedVideos'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useAddReaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, reaction }: { videoId: string; reaction: ReactionType }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).addReaction(videoId, reaction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

export function useRemoveReaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).removeReaction(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

export function useIncrementViewCount() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).incrementViewCount(videoId);
    },
  });
}

// ── Comments ─────────────────────────────────────────────────────────────────

export function useGetComments(videoId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['comments', videoId],
    queryFn: async () => {
      if (!actor) return [];
      return a(actor).getComments(videoId);
    },
    enabled: !!actor && !isFetching && !!videoId,
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, text }: { videoId: string; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).addComment(videoId, text);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.videoId] });
    },
  });
}

// ── Follow ───────────────────────────────────────────────────────────────────

export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).followUser(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).unfollowUser(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetUserStats(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserStats | null>({
    queryKey: ['userStats', userId],
    queryFn: async () => {
      if (!actor) return null;
      return a(actor).getUserStats(Principal.fromText(userId));
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

// ── Car Meets ────────────────────────────────────────────────────────────────

export function useGetAllCarMeets() {
  const { actor, isFetching } = useActor();

  return useQuery<CarMeet[]>({
    queryKey: ['carMeets'],
    queryFn: async () => {
      if (!actor) return [];
      return a(actor).getAllCarMeets();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCarMeetDetails(meetId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<CarMeetDetails | null>({
    queryKey: ['carMeetDetails', meetId],
    queryFn: async () => {
      if (!actor) return null;
      return a(actor).getCarMeetDetails(meetId);
    },
    enabled: !!actor && !isFetching && !!meetId,
  });
}

export function useCreateCarMeet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      location,
      date,
      description,
      category,
    }: {
      title: string;
      location: string;
      date: bigint;
      description: string;
      category: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).createCarMeet(title, location, date, description, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carMeets'] });
    },
  });
}

export function useJoinCarMeet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ meetId }: { meetId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).joinCarMeet(meetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carMeets'] });
      queryClient.invalidateQueries({ queryKey: ['carMeetDetails'] });
    },
  });
}

export function useLeaveCarMeet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ meetId }: { meetId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).leaveCarMeet(meetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carMeets'] });
      queryClient.invalidateQueries({ queryKey: ['carMeetDetails'] });
    },
  });
}

// ── Mechanics Help ───────────────────────────────────────────────────────────

export function useGetAllMechanicsPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<MechanicsPost[]>({
    queryKey: ['mechanicsPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return a(actor).getAllMechanicsPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMechanicsPostById(postId: number) {
  const { actor, isFetching } = useActor();

  return useQuery<MechanicsPost | null>({
    queryKey: ['mechanicsPost', postId],
    queryFn: async () => {
      if (!actor) return null;
      return a(actor).getMechanicsPostById(postId);
    },
    enabled: !!actor && !isFetching && postId !== undefined,
  });
}

export function useCreateMechanicsPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      category,
    }: {
      title: string;
      description: string;
      category: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).createMechanicsPost(title, description, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanicsPosts'] });
    },
  });
}

export function useAddMechanicsComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, text }: { postId: number; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).addMechanicsComment(postId, text);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mechanicsPost', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['mechanicsPosts'] });
    },
  });
}

export function useDeleteMechanicsPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }: { postId: number }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).deleteMechanicsPost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanicsPosts'] });
    },
  });
}

// ── Messages ─────────────────────────────────────────────────────────────────

export function useGetInbox() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<ConversationSummary[]>({
    queryKey: ['inbox'],
    queryFn: async () => {
      if (!actor) return [];
      return a(actor).getInbox();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetConversation(otherUserId: string) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<DirectMessage[]>({
    queryKey: ['conversation', otherUserId],
    queryFn: async () => {
      if (!actor) return [];
      return a(actor).getConversation(Principal.fromText(otherUserId));
    },
    enabled: !!actor && !isFetching && !!identity && !!otherUserId,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ otherUser, text }: { otherUser: string; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).sendMessage(Principal.fromText(otherUser), text);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.otherUser] });
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
}

export function useMarkAsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ otherUser, messageId }: { otherUser: string; messageId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).markAsRead(Principal.fromText(otherUser), messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
}

export function useDeleteMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ otherUser, messageId }: { otherUser: string; messageId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).deleteMessage(Principal.fromText(otherUser), messageId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.otherUser] });
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
}

export function useGetUnreadMessageCount() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<number>({
    queryKey: ['unreadMessageCount'],
    queryFn: async () => {
      if (!actor) return 0;
      const inbox: ConversationSummary[] = await a(actor).getInbox();
      return inbox.reduce((sum, conv) => sum + conv.unreadCount, 0);
    },
    enabled: !!actor && !isFetching && !!identity,
    refetchInterval: 30000,
  });
}

// ── Notifications ────────────────────────────────────────────────────────────

export function useGetNotifications() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!actor) return [];
      return a(actor).getNotifications();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetUnreadNotificationCount() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<number>({
    queryKey: ['unreadNotificationCount'],
    queryFn: async () => {
      if (!actor) return 0;
      return a(actor).getUnreadNotificationCount();
    },
    enabled: !!actor && !isFetching && !!identity,
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notifId }: { notifId: number }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).markNotificationRead(notifId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).markAllNotificationsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    },
  });
}

// ── Build Logs ───────────────────────────────────────────────────────────────

export function useGetAllBuildLogs() {
  const { actor, isFetching } = useActor();

  return useQuery<BuildLog[]>({
    queryKey: ['buildLogs'],
    queryFn: async () => {
      if (!actor) return [];
      return a(actor).getAllBuildLogs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetBuildLogById(id: number) {
  const { actor, isFetching } = useActor();

  return useQuery<BuildLog | null>({
    queryKey: ['buildLog', id],
    queryFn: async () => {
      if (!actor) return null;
      return a(actor).getBuildLogById(id);
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useGetBuildLogsByUser(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<BuildLog[]>({
    queryKey: ['buildLogs', 'user', userId],
    queryFn: async () => {
      if (!actor) return [];
      return a(actor).getBuildLogsByUser(Principal.fromText(userId));
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useCreateBuildLog() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      carMake,
      carModel,
      carYear,
      description,
    }: {
      title: string;
      carMake: string;
      carModel: string;
      carYear: string;
      description: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).createBuildLog(title, carMake, carModel, carYear, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildLogs'] });
    },
  });
}

export function useAddBuildStage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      buildLogId,
      stageTitle,
      stageDescription,
      imageUrl,
    }: {
      buildLogId: number;
      stageTitle: string;
      stageDescription: string;
      imageUrl: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).addBuildStage(buildLogId, stageTitle, stageDescription, imageUrl);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['buildLog', variables.buildLogId] });
      queryClient.invalidateQueries({ queryKey: ['buildLogs'] });
    },
  });
}

export function useDeleteBuildLog() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).deleteBuildLog(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildLogs'] });
    },
  });
}

// ── Classifieds ──────────────────────────────────────────────────────────────

export function useGetAllActiveListings() {
  const { actor, isFetching } = useActor();

  return useQuery<Listing[]>({
    queryKey: ['listings'],
    queryFn: async () => {
      if (!actor) return [];
      return a(actor).getAllActiveListings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetListingById(id: number) {
  const { actor, isFetching } = useActor();

  return useQuery<Listing | null>({
    queryKey: ['listing', id],
    queryFn: async () => {
      if (!actor) return null;
      return a(actor).getListingById(id);
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useCreateListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      make,
      model,
      year,
      price,
      condition,
      imageUrl,
      category,
    }: {
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
      if (!actor) throw new Error('Actor not available');
      return a(actor).createListing(title, description, make, model, year, price, condition, imageUrl, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useDeactivateListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).deactivateListing(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

// ── Racing Challenges ────────────────────────────────────────────────────────

export function useGetChallengesForVideo(videoId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<RacingChallenge[]>({
    queryKey: ['challenges', videoId],
    queryFn: async () => {
      if (!actor) return [];
      return a(actor).getChallengesForVideo(videoId);
    },
    enabled: !!actor && !isFetching && !!videoId,
  });
}

export function usePostChallenge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      originalVideoId,
      responseVideoId,
      challengedPrincipal,
    }: {
      originalVideoId: string;
      responseVideoId: string;
      challengedPrincipal: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).postChallenge(originalVideoId, responseVideoId, Principal.fromText(challengedPrincipal));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
}

// ── Admin ────────────────────────────────────────────────────────────────────

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useDeleteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).deleteUser(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return a(actor).saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}
