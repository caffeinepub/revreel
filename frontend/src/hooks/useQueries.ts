import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";
import { Principal } from "@dfinity/principal";

// ─── ExternalBlob shim (re-exported for components that import it from here) ──

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
    return this._url || "";
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

export type Variant_video_photo = { video: null } | { photo: null };

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

export interface UserProfile {
  id: { toString(): string };
  username: string;
  bio: string;
  avatar: ExternalBlob;
  avatarUrl: string;
  verified: boolean;
  badges: Badge[];
  savedVideos: bigint[];
  joinedAt: bigint;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  uploader: { toString(): string };
  likes: { toString(): string }[];
  hashtags: string[];
  category: string;
  timestamp: bigint;
  thumbnail: ExternalBlob;
  mediaUrl: ExternalBlob;
  reactions: [{ toString(): string }, ReactionType][];
  viewCount: bigint;
  mediaType: { video: null } | { photo: null };
}

export interface Comment {
  id: bigint;
  videoId: string;
  authorId: { toString(): string };
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
  organizer: { toString(): string };
  attendees: { toString(): string }[];
  category: string;
  createdAt: bigint;
}

export interface CarMeetDetails {
  id: string;
  title: string;
  location: string;
  date: bigint;
  description: string;
  organizer: UserProfile | null;
  attendees: UserProfile[];
  category: string;
  createdAt: bigint;
}

export interface MechanicsComment {
  id: bigint;
  postId: bigint;
  authorId: { toString(): string };
  text: string;
  timestamp: bigint;
}

export interface MechanicsPost {
  id: bigint;
  title: string;
  description: string;
  author: { toString(): string };
  category: string;
  createdAt: bigint;
  comments: MechanicsComment[];
}

export interface DirectMessage {
  id: bigint;
  fromUser: { toString(): string };
  toUser: { toString(): string };
  text: string;
  timestamp: bigint;
  isRead: boolean;
}

export interface ConversationSummary {
  otherUser: { toString(): string };
  lastMessage: DirectMessage;
  unreadCount: bigint;
}

export interface Notification {
  id: bigint;
  recipientId: { toString(): string };
  senderId: { toString(): string };
  notificationType: string;
  referenceId: string;
  message: string;
  isRead: boolean;
  createdAt: bigint;
}

export interface BuildStage {
  id: bigint;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: bigint;
}

export interface BuildLog {
  id: bigint;
  title: string;
  authorId: { toString(): string };
  carMake: string;
  carModel: string;
  carYear: string;
  description: string;
  stages: BuildStage[];
  createdAt: bigint;
  updatedAt: bigint;
}

export interface Listing {
  id: bigint;
  title: string;
  description: string;
  sellerId: { toString(): string };
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

export interface RacingChallenge {
  id: bigint;
  challengerId: { toString(): string };
  challengedId: { toString(): string };
  videoId: bigint;
  originalVideoId: bigint;
  status: string;
  createdAt: bigint;
}

export interface UserStats {
  totalVideos: bigint;
  totalViews: bigint;
  totalLikes: bigint;
  totalComments: bigint;
  totalFollowers: bigint;
  totalFollowing: bigint;
  totalBuildLogs: bigint;
  joinedAt: bigint;
}

// ─── Actor helper ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAppActor(actor: unknown): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return actor as any;
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity, isInitializing } = useInternetIdentity();

  const principalStr = identity?.getPrincipal().toString() ?? "anonymous";
  const isAuthenticated = !!identity;

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile", principalStr],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      if (!isAuthenticated) return null;
      return getAppActor(actor).getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && !isInitializing && isAuthenticated,
    retry: false,
    staleTime: 0,
  });

  return {
    ...query,
    isLoading: actorFetching || isInitializing || query.isLoading,
    isFetched: isAuthenticated && !actorFetching && !isInitializing && query.isFetched,
  };
}

// Alias
export const useGetCurrentUserProfile = useGetCallerUserProfile;

export function useGetUserProfile(userId: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const callerPrincipal = identity?.getPrincipal().toString() ?? null;

  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      // If viewing own profile, use getCallerUserProfile to avoid permission issues
      if (callerPrincipal && userId === callerPrincipal) {
        return getAppActor(actor).getCallerUserProfile();
      }
      try {
        const principal = Principal.fromText(userId);
        return getAppActor(actor).getUserProfile(principal);
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
  const { identity } = useInternetIdentity();
  const principalStr = identity?.getPrincipal().toString() ?? "anonymous";

  return useMutation({
    mutationFn: async (profile: {
      username: string;
      bio: string;
      avatar: ExternalBlob;
      avatarUrl: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).saveCallerUserProfile({
        username: profile.username,
        bio: profile.bio,
        avatar: profile.avatar,
        avatarUrl: profile.avatarUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["currentUserProfile", principalStr],
      });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useUpdateProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  const principalStr = identity?.getPrincipal().toString() ?? "anonymous";

  return useMutation({
    mutationFn: async (profile: {
      username: string;
      bio: string;
      avatar: ExternalBlob;
      avatarUrl: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).saveCallerUserProfile({
        username: profile.username,
        bio: profile.bio,
        avatar: profile.avatar,
        avatarUrl: profile.avatarUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["currentUserProfile", principalStr],
      });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useUpdateAvatar() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  const principalStr = identity?.getPrincipal().toString() ?? "anonymous";

  return useMutation({
    mutationFn: async ({ avatarUrl }: { avatarUrl: string }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).saveCallerUserProfile({ avatarUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["currentUserProfile", principalStr],
      });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetUserBadges(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Badge[]>({
    queryKey: ["userBadges", userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return getAppActor(actor).getUserBadges(userId) ?? [];
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useGetUserStats(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserStats | null>({
    queryKey: ["userStats", userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      try {
        const principal = Principal.fromText(userId);
        return getAppActor(actor).getUserStats(principal) ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

// ─── Videos ───────────────────────────────────────────────────────────────────

export function useGetAllVideos() {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ["videos"],
    queryFn: async () => {
      if (!actor) return [];
      return getAppActor(actor).getAllVideos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetVideosByUser(userId: string) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const callerPrincipal = identity?.getPrincipal().toString() ?? null;
  // If empty string passed, use caller's own videos
  const effectiveUserId = userId || callerPrincipal || "";

  return useQuery<Video[]>({
    queryKey: ["videosByUser", effectiveUserId],
    queryFn: async () => {
      if (!actor) return [];
      const all: Video[] = await getAppActor(actor).getAllVideos();
      return all.filter(
        (v) => v.uploader?.toString() === effectiveUserId
      );
    },
    enabled: !!actor && !isFetching && !!effectiveUserId,
  });
}

// Alias
export const useGetUserVideos = useGetVideosByUser;

export function useGetTrendingVideos() {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ["trendingVideos"],
    queryFn: async () => {
      if (!actor) return [];
      const all: Video[] = await getAppActor(actor).getAllVideos();
      return [...all]
        .sort((a, b) => Number(b.viewCount) - Number(a.viewCount))
        .slice(0, 20);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetVideosByCategory(category: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ["videosByCategory", category],
    queryFn: async () => {
      if (!actor) return [];
      const all: Video[] = await getAppActor(actor).getAllVideos();
      return all.filter((v) => v.category === category);
    },
    enabled: !!actor && !isFetching && !!category,
  });
}

export function useGetVideosByHashtag(hashtag: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ["videosByHashtag", hashtag],
    queryFn: async () => {
      if (!actor) return [];
      const all: Video[] = await getAppActor(actor).getAllVideos();
      return all.filter((v) => v.hashtags.includes(hashtag));
    },
    enabled: !!actor && !isFetching && !!hashtag,
  });
}

export function useGetSavedVideos() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Video[]>({
    queryKey: ["savedVideos"],
    queryFn: async () => {
      if (!actor || !identity) return [];
      const profile: UserProfile | null = await getAppActor(actor).getCallerUserProfile();
      if (!profile) return [];
      const savedIds = profile.savedVideos.map((id) => id.toString());
      const all: Video[] = await getAppActor(actor).getAllVideos();
      return all.filter((v) => savedIds.includes(v.id));
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useUploadVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      description: string;
      hashtags: string[];
      category: string;
      thumbnail: ExternalBlob;
      mediaUrl: ExternalBlob;
      mediaType: Variant_video_photo;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).uploadVideo(
        params.title,
        params.description,
        params.hashtags,
        params.category,
        params.thumbnail,
        params.mediaUrl,
        params.mediaType
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["videosByUser"] });
      queryClient.invalidateQueries({ queryKey: ["trendingVideos"] });
    },
  });
}

export function useDeleteVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).deleteVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["videosByUser"] });
      queryClient.invalidateQueries({ queryKey: ["trendingVideos"] });
    },
  });
}

export function useToggleLike() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).likeVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["trendingVideos"] });
    },
  });
}

// Alias
export const useLikeVideo = useToggleLike;

export function useAddReaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      videoId,
      reaction,
    }: {
      videoId: string;
      reaction: ReactionType;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).reactToVideo(videoId, reaction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

// Alias
export const useReactToVideo = useAddReaction;

export function useSaveVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).saveVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["savedVideos"] });
    },
  });
}

export function useUnsaveVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).unsaveVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["savedVideos"] });
    },
  });
}

export function useIncrementViewCount() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).incrementView(videoId);
    },
  });
}

// Alias
export const useIncrementView = useIncrementViewCount;

// ─── Comments ─────────────────────────────────────────────────────────────────

export function useGetComments(videoId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ["comments", videoId],
    queryFn: async () => {
      if (!actor || !videoId) return [];
      return getAppActor(actor).getComments(videoId);
    },
    enabled: !!actor && !isFetching && !!videoId,
  });
}

export function useAddComment() {
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
      return getAppActor(actor).postComment(videoId, text);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.videoId],
      });
    },
  });
}

// Alias
export const usePostComment = useAddComment;

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      videoId,
      commentId,
    }: {
      videoId: string;
      commentId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).deleteComment(videoId, commentId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.videoId],
      });
    },
  });
}

// ─── Follow ───────────────────────────────────────────────────────────────────

export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!actor) throw new Error("Actor not available");
      try {
        const principal = Principal.fromText(userId);
        return getAppActor(actor).followUser(principal);
      } catch {
        return getAppActor(actor).followUser(userId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
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
      try {
        const principal = Principal.fromText(userId);
        return getAppActor(actor).unfollowUser(principal);
      } catch {
        return getAppActor(actor).unfollowUser(userId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    },
  });
}

export function useGetFollowers(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ["followers", userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return getAppActor(actor).getFollowers(userId) ?? [];
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useGetFollowing(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ["following", userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return getAppActor(actor).getFollowing(userId) ?? [];
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

// ─── Car Meets ────────────────────────────────────────────────────────────────

export function useGetCarMeets() {
  const { actor, isFetching } = useActor();

  return useQuery<CarMeet[]>({
    queryKey: ["carMeets"],
    queryFn: async () => {
      if (!actor) return [];
      return getAppActor(actor).getCarMeets();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias
export const useGetAllCarMeets = useGetCarMeets;

export function useGetCarMeetDetails(meetId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<CarMeetDetails | null>({
    queryKey: ["carMeet", meetId],
    queryFn: async () => {
      if (!actor || !meetId) return null;
      return getAppActor(actor).getCarMeetDetails(meetId);
    },
    enabled: !!actor && !isFetching && !!meetId,
  });
}

export function useCreateCarMeet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      location: string;
      date: bigint;
      description: string;
      category: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).createCarMeet(
        params.title,
        params.location,
        params.date,
        params.description,
        params.category
      );
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
      return getAppActor(actor).joinCarMeet(meetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carMeets"] });
      queryClient.invalidateQueries({ queryKey: ["carMeet"] });
    },
  });
}

export function useLeaveCarMeet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ meetId }: { meetId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).leaveCarMeet(meetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carMeets"] });
      queryClient.invalidateQueries({ queryKey: ["carMeet"] });
    },
  });
}

// ─── Mechanics ────────────────────────────────────────────────────────────────

export function useGetMechanicsPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<MechanicsPost[]>({
    queryKey: ["mechanicsPosts"],
    queryFn: async () => {
      if (!actor) return [];
      return getAppActor(actor).getMechanicsPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias
export const useGetAllMechanicsPosts = useGetMechanicsPosts;

export function useGetMechanicsPost(postId: number) {
  const { actor, isFetching } = useActor();

  return useQuery<MechanicsPost | null>({
    queryKey: ["mechanicsPost", postId],
    queryFn: async () => {
      if (!actor) return null;
      return getAppActor(actor).getMechanicsPost(postId);
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
    mutationFn: async (params: {
      title: string;
      description: string;
      category: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).createMechanicsPost(
        params.title,
        params.description,
        params.category
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mechanicsPosts"] });
    },
  });
}

export function useAddMechanicsComment() {
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
      return getAppActor(actor).addMechanicsComment(postId, text);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["mechanicsPost", variables.postId],
      });
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
      return getAppActor(actor).deleteMechanicsPost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mechanicsPosts"] });
    },
  });
}

// ─── Messaging ────────────────────────────────────────────────────────────────

export function useGetConversations() {
  const { actor, isFetching } = useActor();

  return useQuery<ConversationSummary[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      if (!actor) return [];
      return getAppActor(actor).getConversations();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias
export const useGetInbox = useGetConversations;

export function useGetMessages(otherUser: string) {
  const { actor, isFetching } = useActor();

  return useQuery<DirectMessage[]>({
    queryKey: ["messages", otherUser],
    queryFn: async () => {
      if (!actor || !otherUser) return [];
      return getAppActor(actor).getMessages(otherUser);
    },
    enabled: !!actor && !isFetching && !!otherUser,
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
      return getAppActor(actor).sendMessage(toUser, text);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.toUser],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMarkAsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ otherUser }: { otherUser: string }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).markMessagesRead(otherUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// Alias
export const useMarkMessagesRead = useMarkAsRead;

export function useDeleteMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      otherUser,
      messageId,
    }: {
      otherUser: string;
      messageId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).deleteMessage(otherUser, messageId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.otherUser],
      });
    },
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useGetNotifications() {
  const { actor, isFetching } = useActor();

  return useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!actor) return [];
      return getAppActor(actor).getNotifications();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMarkNotificationRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notificationId }: { notificationId: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).markNotificationRead(notificationId);
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
      return getAppActor(actor).markAllNotificationsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// ─── Build Logs ───────────────────────────────────────────────────────────────

export function useGetAllBuildLogs() {
  const { actor, isFetching } = useActor();

  return useQuery<BuildLog[]>({
    queryKey: ["buildLogs"],
    queryFn: async () => {
      if (!actor) return [];
      return getAppActor(actor).getBuildLogs();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias
export const useGetBuildLogs = useGetAllBuildLogs;

export function useGetBuildLogById(buildId: number) {
  const { actor, isFetching } = useActor();

  return useQuery<BuildLog | null>({
    queryKey: ["buildLog", buildId],
    queryFn: async () => {
      if (!actor) return null;
      return getAppActor(actor).getBuildLog(buildId);
    },
    enabled: !!actor && !isFetching && buildId !== undefined && !isNaN(buildId),
  });
}

// Alias
export const useGetBuildLog = useGetBuildLogById;

export function useCreateBuildLog() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      carMake: string;
      carModel: string;
      carYear: string;
      description: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).createBuildLog(
        params.title,
        params.carMake,
        params.carModel,
        params.carYear,
        params.description
      );
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
    mutationFn: async (params: {
      buildId: number;
      title: string;
      description: string;
      imageUrl: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).addBuildStage(
        params.buildId,
        params.title,
        params.description,
        params.imageUrl
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["buildLog", variables.buildId],
      });
      queryClient.invalidateQueries({ queryKey: ["buildLogs"] });
    },
  });
}

export function useDeleteBuildLog() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ buildId }: { buildId: number }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).deleteBuildLog(buildId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildLogs"] });
    },
  });
}

// ─── Classifieds ──────────────────────────────────────────────────────────────

export function useGetAllActiveListings() {
  const { actor, isFetching } = useActor();

  return useQuery<Listing[]>({
    queryKey: ["listings"],
    queryFn: async () => {
      if (!actor) return [];
      return getAppActor(actor).getListings();
    },
    enabled: !!actor && !isFetching,
  });
}

// Aliases
export const useGetListings = useGetAllActiveListings;

export function useGetListingById(listingId: number) {
  const { actor, isFetching } = useActor();

  return useQuery<Listing | null>({
    queryKey: ["listing", listingId],
    queryFn: async () => {
      if (!actor) return null;
      return getAppActor(actor).getListing(listingId);
    },
    enabled: !!actor && !isFetching && listingId !== undefined && !isNaN(listingId) && listingId > 0,
  });
}

// Alias
export const useGetListing = useGetListingById;

export function useCreateListing() {
  const { actor } = useActor();
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
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).createListing(
        params.title,
        params.description,
        params.make,
        params.model,
        params.year,
        params.price,
        params.condition,
        params.imageUrl,
        params.category
      );
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
    mutationFn: async ({ id }: { id: bigint | number }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).deactivateListing(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listing"] });
    },
  });
}

// ─── Challenges ───────────────────────────────────────────────────────────────

export function usePostChallenge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      challengedId: string;
      videoId: string;
      originalVideoId: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return getAppActor(actor).postChallenge(
        params.challengedId,
        params.videoId,
        params.originalVideoId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
  });
}

export function useGetChallenges() {
  const { actor, isFetching } = useActor();

  return useQuery<RacingChallenge[]>({
    queryKey: ["challenges"],
    queryFn: async () => {
      if (!actor) return [];
      return getAppActor(actor).getChallenges();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useGetAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return getAppActor(actor).getAllUsers();
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
      return getAppActor(actor).deleteUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}
