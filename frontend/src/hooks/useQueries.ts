import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';

// ExternalBlob shim - import from the correct location
export class ExternalBlob {
  private _bytes?: Uint8Array;
  private _url?: string;
  private _onProgress?: (pct: number) => void;

  private constructor() {}

  static fromBytes(bytes: Uint8Array): ExternalBlob {
    const b = new ExternalBlob();
    b._bytes = bytes;
    return b;
  }

  static fromURL(url: string): ExternalBlob {
    const b = new ExternalBlob();
    b._url = url;
    return b;
  }

  withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob {
    const b = new ExternalBlob();
    b._bytes = this._bytes;
    b._url = this._url;
    b._onProgress = onProgress;
    return b;
  }

  getDirectURL(): string {
    return this._url || '';
  }

  async getBytes(): Promise<Uint8Array> {
    if (this._bytes) return this._bytes;
    if (this._url) {
      const res = await fetch(this._url);
      const buf = await res.arrayBuffer();
      return new Uint8Array(buf);
    }
    return new Uint8Array();
  }
}

// ─── Local type definitions ───────────────────────────────────────────────────

export type Badge =
  | { driftKing: null }
  | { mechanicPro: null }
  | { dragRacer: null }
  | { communityHelper: null }
  | { verified: null }
  | { buildMaster: null }
  | { racingLegend: null };

export type ReactionType =
  | { like: null }
  | { fire: null }
  | { hype: null }
  | { respect: null }
  | { wild: null };

export type Variant_video_photo = { video: null } | { photo: null };

export type UserProfile = {
  id: any;
  username: string;
  bio: string;
  avatar: any;
  avatarUrl: string;
  verified: boolean;
  badges: Badge[];
  savedVideos: number[];
  joinedAt: bigint;
};

export type Video = {
  id: string;
  title: string;
  description: string;
  uploader: any;
  likes: any[];
  comments: Comment[];
  hashtags: string[];
  category: string;
  timestamp: bigint;
  thumbnail: any;
  mediaUrl: any;
  reactions: [any, any][];
  viewCount: bigint;
  mediaType: Variant_video_photo;
};

export type Comment = {
  id: bigint;
  videoId: string;
  authorId: any;
  text: string;
  timestamp: bigint;
  authorName: string;
};

export type CarMeet = {
  id: string;
  title: string;
  location: string;
  date: bigint;
  description: string;
  organizer: any;
  attendees: any[];
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

export type MechanicsPost = {
  id: bigint;
  title: string;
  description: string;
  author: any;
  category: string;
  createdAt: bigint;
  comments: MechanicsComment[];
};

export type MechanicsComment = {
  id: bigint;
  postId: bigint;
  authorId: any;
  text: string;
  timestamp: bigint;
};

export type DirectMessage = {
  id: bigint;
  fromUser: any;
  toUser: any;
  text: string;
  timestamp: bigint;
  isRead: boolean;
};

export type ConversationSummary = {
  otherUser: any;
  lastMessage: DirectMessage;
  unreadCount: bigint;
};

export type Notification = {
  id: bigint;
  recipientId: any;
  senderId: any;
  notificationType: string;
  referenceId: string;
  message: string;
  isRead: boolean;
  createdAt: bigint;
};

export type BuildLog = {
  id: bigint;
  title: string;
  authorId: any;
  carMake: string;
  carModel: string;
  carYear: string;
  description: string;
  stages: BuildStage[];
  createdAt: bigint;
  updatedAt: bigint;
};

export type BuildStage = {
  id: bigint;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: bigint;
};

export type Listing = {
  id: bigint;
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
};

export type RacingChallenge = {
  id: bigint;
  challengerId: any;
  challengedId: any;
  videoId: bigint;
  originalVideoId: bigint;
  status: string;
  createdAt: bigint;
};

export type UserStats = {
  totalVideos: bigint;
  totalViews: bigint;
  totalLikes: bigint;
  totalComments: bigint;
  totalFollowers: bigint;
  totalFollowing: bigint;
  totalBuildLogs: bigint;
  joinedAt: bigint;
};

// ─── User Profile Hooks ───────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity, isInitializing } = useInternetIdentity();

  const isAuthenticated = !!identity;

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const result = await (actor as any).getCallerUserProfile();
      if (result === null || result === undefined) return null;
      if (Array.isArray(result) && result.length === 0) return null;
      if (Array.isArray(result) && result.length > 0) return result[0] as UserProfile;
      return result as UserProfile;
    },
    enabled: !!actor && !actorFetching && !isInitializing && isAuthenticated,
    retry: false,
    staleTime: 30000,
  });

  return {
    ...query,
    isLoading: actorFetching || isInitializing || query.isLoading,
    isFetched: !!actor && !actorFetching && !isInitializing && isAuthenticated && query.isFetched,
  };
}

export function useCreateUser() {
  const { actor, isFetching: actorFetching } = useActor();
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
      avatarUrl: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      if (actorFetching) throw new Error('Actor is initializing, please try again');
      const result = await (actor as any).saveCallerUserProfile({
        username,
        bio,
        avatar,
        avatarUrl,
        verified: false,
        badges: [],
        savedVideos: [],
      });
      return result;
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
      avatarUrl: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).saveCallerUserProfile({
        username,
        bio,
        avatar,
        avatarUrl,
        verified: false,
        badges: [],
        savedVideos: [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

export function useUpdateAvatar() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ avatarUrl }: { avatarUrl: string }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).updateAvatar({ avatarUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetUserProfile(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!actor) return null;
      if (!userId) return null;
      const result = await (actor as any).getUserProfile(userId);
      if (result === null || result === undefined) return null;
      if (Array.isArray(result) && result.length === 0) return null;
      if (Array.isArray(result) && result.length > 0) return result[0] as UserProfile;
      return result as UserProfile;
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
      return (actor as any).getAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).followUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).unfollowUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });
}

export function useGetFollowers(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ['followers', userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return (actor as any).getFollowers(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useGetFollowing(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ['following', userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return (actor as any).getFollowing(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useDeleteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).deleteUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await (actor as any).isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// ─── Video Hooks ──────────────────────────────────────────────────────────────

export function useGetAllVideos() {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['videos'],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllVideos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTrendingVideos() {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['trendingVideos'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const result = await (actor as any).getTrendingVideos();
        return result || [];
      } catch {
        // Fallback: return all videos sorted by likes
        const all = await (actor as any).getAllVideos();
        return (all || []).sort((a: Video, b: Video) => b.likes.length - a.likes.length).slice(0, 10);
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetVideosByUser(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['videosByUser', userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return (actor as any).getVideosByUser(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useGetVideosByCategory(category: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['videosByCategory', category],
    queryFn: async () => {
      if (!actor || !category) return [];
      return (actor as any).getVideosByCategory(category);
    },
    enabled: !!actor && !isFetching && !!category,
  });
}

export function useGetVideosByHashtag(hashtag: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['videosByHashtag', hashtag],
    queryFn: async () => {
      if (!actor || !hashtag) return [];
      return (actor as any).getVideosByHashtag(hashtag);
    },
    enabled: !!actor && !isFetching && !!hashtag,
  });
}

export function useGetSavedVideos() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Video[]>({
    queryKey: ['savedVideos'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const result = await (actor as any).getSavedVideos();
        return result || [];
      } catch {
        return [];
      }
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
      thumbnail,
      mediaUrl,
      mediaType,
    }: {
      title: string;
      description: string;
      hashtags: string[];
      category: string;
      thumbnail: ExternalBlob;
      mediaUrl: ExternalBlob;
      mediaType: Variant_video_photo;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).uploadVideo({
        title,
        description,
        hashtags,
        category,
        thumbnail,
        mediaUrl,
        mediaType,
      });
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
      return (actor as any).deleteVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['videosByUser'] });
    },
  });
}

export function useLikeVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).likeVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

// Alias for useLikeVideo (toggle behavior)
export const useToggleLike = useLikeVideo;

export function useReactToVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, reaction }: { videoId: string; reaction: ReactionType }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).reactToVideo(videoId, reaction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

// Aliases for reaction hooks
export const useAddReaction = useReactToVideo;
export const useRemoveReaction = useReactToVideo;

export function useSaveVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).saveVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['savedVideos'] });
    },
  });
}

// Alias for unsave (same toggle endpoint)
export const useUnsaveVideo = useSaveVideo;

export function useIncrementView() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).incrementView(videoId);
    },
  });
}

// Alias
export const useIncrementViewCount = useIncrementView;

export function useGetUserBadges(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Badge[]>({
    queryKey: ['userBadges', userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      try {
        const result = await (actor as any).getUserBadges(userId);
        return result || [];
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

// ─── Comment Hooks ────────────────────────────────────────────────────────────

export function useGetComments(videoId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['comments', videoId],
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
    mutationFn: async ({ videoId, text }: { videoId: string; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).postComment(videoId, text);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.videoId] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

// Alias
export const useAddComment = usePostComment;

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, commentId }: { videoId: string; commentId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).deleteComment(videoId, commentId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.videoId] });
    },
  });
}

// ─── Car Meet Hooks ───────────────────────────────────────────────────────────

export function useGetAllCarMeets() {
  const { actor, isFetching } = useActor();

  return useQuery<CarMeet[]>({
    queryKey: ['carMeets'],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllCarMeets();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCarMeetDetails(meetId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<CarMeetDetails | null>({
    queryKey: ['carMeetDetails', meetId],
    queryFn: async () => {
      if (!actor || !meetId) return null;
      const result = await (actor as any).getCarMeetDetails(meetId);
      if (Array.isArray(result) && result.length === 0) return null;
      if (Array.isArray(result) && result.length > 0) return result[0] as CarMeetDetails;
      return result as CarMeetDetails;
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
      return (actor as any).createCarMeet({ title, location, date, description, category });
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
      return (actor as any).joinCarMeet(meetId);
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
      return (actor as any).leaveCarMeet(meetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carMeets'] });
      queryClient.invalidateQueries({ queryKey: ['carMeetDetails'] });
    },
  });
}

// ─── Mechanics Help Hooks ─────────────────────────────────────────────────────

export function useGetAllMechanicsPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<MechanicsPost[]>({
    queryKey: ['mechanicsPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllMechanicsPosts();
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
      const result = await (actor as any).getMechanicsPostById(postId);
      if (Array.isArray(result) && result.length === 0) return null;
      if (Array.isArray(result) && result.length > 0) return result[0] as MechanicsPost;
      return result as MechanicsPost;
    },
    enabled: !!actor && !isFetching,
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
      return (actor as any).createMechanicsPost({ title, description, category });
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
      return (actor as any).addMechanicsComment(postId, text);
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
      return (actor as any).deleteMechanicsPost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanicsPosts'] });
    },
  });
}

// ─── Messaging Hooks ──────────────────────────────────────────────────────────

export function useGetConversations() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<ConversationSummary[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getConversations();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// Alias
export const useGetInbox = useGetConversations;

export function useGetMessages(otherUser: string) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<DirectMessage[]>({
    queryKey: ['messages', otherUser],
    queryFn: async () => {
      if (!actor || !otherUser) return [];
      return (actor as any).getMessages(otherUser);
    },
    enabled: !!actor && !isFetching && !!otherUser && !!identity,
    refetchInterval: 5000,
  });
}

// Alias
export const useGetConversation = useGetMessages;

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ toUser, text }: { toUser: string; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).sendMessage(toUser, text);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.toUser] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useDeleteMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, otherUser }: { messageId: bigint; otherUser: string }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).deleteMessage(messageId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.otherUser] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkMessagesRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ otherUser }: { otherUser: string }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).markMessagesRead(otherUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Alias
export const useMarkAsRead = useMarkMessagesRead;

// ─── Notification Hooks ───────────────────────────────────────────────────────

export function useGetNotifications() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getNotifications();
    },
    enabled: !!actor && !isFetching && !!identity,
    refetchInterval: 15000,
  });
}

export function useMarkNotificationRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notificationId }: { notificationId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).markNotificationRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await (actor as any).markAllNotificationsRead();
      } catch {
        // fallback: no-op if not implemented
        return null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ─── Build Log Hooks ──────────────────────────────────────────────────────────

export function useGetAllBuildLogs() {
  const { actor, isFetching } = useActor();

  return useQuery<BuildLog[]>({
    queryKey: ['buildLogs'],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllBuildLogs();
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
      const result = await (actor as any).getBuildLogById(id);
      if (Array.isArray(result) && result.length === 0) return null;
      if (Array.isArray(result) && result.length > 0) return result[0] as BuildLog;
      return result as BuildLog;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetBuildLogsByUser(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<BuildLog[]>({
    queryKey: ['buildLogsByUser', userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return (actor as any).getBuildLogsByUser(userId);
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
      return (actor as any).createBuildLog({ title, carMake, carModel, carYear, description });
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
      title,
      description,
      imageUrl,
    }: {
      buildLogId: bigint;
      title: string;
      description: string;
      imageUrl: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).addBuildStage(buildLogId, { title, description, imageUrl });
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
    mutationFn: async ({ id }: { id: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).deleteBuildLog(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildLogs'] });
    },
  });
}

// ─── Classifieds Hooks ────────────────────────────────────────────────────────

export function useGetAllListings() {
  const { actor, isFetching } = useActor();

  return useQuery<Listing[]>({
    queryKey: ['listings'],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllListings();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias
export const useGetAllActiveListings = useGetAllListings;

export function useGetListingById(id: number) {
  const { actor, isFetching } = useActor();

  return useQuery<Listing | null>({
    queryKey: ['listing', id],
    queryFn: async () => {
      if (!actor) return null;
      const result = await (actor as any).getListingById(id);
      if (Array.isArray(result) && result.length === 0) return null;
      if (Array.isArray(result) && result.length > 0) return result[0] as Listing;
      return result as Listing;
    },
    enabled: !!actor && !isFetching,
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
      return (actor as any).createListing({
        title,
        description,
        make,
        model,
        year,
        price,
        condition,
        imageUrl,
        category,
      });
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
    mutationFn: async ({ id }: { id: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).deactivateListing(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

// ─── Racing Challenge Hooks ───────────────────────────────────────────────────

export function useGetChallenges() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<RacingChallenge[]>({
    queryKey: ['challenges'],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getChallenges();
    },
    enabled: !!actor && !isFetching && !!identity,
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
      if (!actor) throw new Error('Actor not available');
      return (actor as any).postChallenge({ challengedId, videoId, originalVideoId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
}

export function useRespondToChallenge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ challengeId, accept }: { challengeId: bigint; accept: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).respondToChallenge(challengeId, accept);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
}

// ─── User Stats Hook ──────────────────────────────────────────────────────────

export function useGetUserStats(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserStats | null>({
    queryKey: ['userStats', userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      const result = await (actor as any).getUserStats(userId);
      if (Array.isArray(result) && result.length === 0) return null;
      if (Array.isArray(result) && result.length > 0) return result[0] as UserStats;
      return result as UserStats;
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}
