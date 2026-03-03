import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { Principal } from '@dfinity/principal';
import {
  UserProfile,
  Video,
  Comment,
  ConversationSummary,
  DirectMessage,
  ProfileResult,
  Result,
  ExternalBlob,
  Variant_video_photo,
  Badge,
} from '../backend';

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const result: ProfileResult = await actor.getCallerUserProfile();
      if (result.__kind__ === 'ok') return result.ok;
      if (result.__kind__ === 'notFound') return null;
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
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      const result: ProfileResult = await actor.getUserProfile(Principal.fromText(userId));
      if (result.__kind__ === 'ok') return result.ok;
      return null;
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);
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
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Videos ──────────────────────────────────────────────────────────────────

export function useGetVideos() {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['videos'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getVideos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserReels(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['userReels', userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return actor.getUserReels(Principal.fromText(userId));
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useCreateVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      description: string;
      category: string;
      hashtags: string[];
      video: ExternalBlob;
      thumbnail: ExternalBlob;
      mediaType: Variant_video_photo;
      onMediaProgress?: (pct: number) => void;
      onThumbnailProgress?: (pct: number) => void;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const videoBlob = params.onMediaProgress
        ? params.video.withUploadProgress(params.onMediaProgress)
        : params.video;
      const thumbBlob = params.onThumbnailProgress
        ? params.thumbnail.withUploadProgress(params.onThumbnailProgress)
        : params.thumbnail;
      const result: Result = await actor.createVideo(
        params.title,
        params.description,
        params.category,
        params.hashtags,
        videoBlob,
        thumbBlob,
        params.mediaType,
      );
      if (result.__kind__ === 'unauthorized') throw new Error(result.unauthorized);
      if (result.__kind__ === 'internalError') throw new Error(result.internalError);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['userReels'] });
    },
  });
}

// Alias for Upload page
export const useUploadVideo = useCreateVideo;

export function useDeleteReel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reelId: string) => {
      if (!actor) throw new Error('Actor not available');
      const result: Result = await actor.deleteReel(reelId);
      if (result.__kind__ === 'unauthorized') throw new Error(result.unauthorized);
      if (result.__kind__ === 'notFound') throw new Error(result.notFound);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userReels'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

export function useToggleLike() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!actor) throw new Error('Actor not available');
      const result: Result = await actor.toggleLike(videoId);
      if (result.__kind__ === 'unauthorized') throw new Error(result.unauthorized);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export function useGetComments(videoId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['comments', videoId],
    queryFn: async () => {
      if (!actor || !videoId) return [];
      return actor.getComments(videoId);
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
      const result: Result = await actor.addComment(videoId, text);
      if (result.__kind__ === 'unauthorized') throw new Error(result.unauthorized);
      return result;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.videoId] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

// ─── Messaging ────────────────────────────────────────────────────────────────

export function useGetInbox() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<ConversationSummary[]>({
    queryKey: ['inbox'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInbox();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// Alias used by older Inbox page
export const useGetConversations = useGetInbox;

export function useGetMessages(userId: string) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<DirectMessage[]>({
    queryKey: ['messages', userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return actor.getConversation(Principal.fromText(userId));
    },
    enabled: !!actor && !isFetching && !!identity && !!userId,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipientId, text }: { recipientId: Principal; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.sendMessage(recipientId, text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
}

export function useMarkMessagesRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (senderId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      await actor.markMessagesRead(senderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useDeleteConversation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (otherUserId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteConversation(otherUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
}

// ─── Follow / Followers (local state only — no backend support) ───────────────

const followState: Record<string, Set<string>> = {};

export function useGetFollowers(userId: string) {
  return useQuery<string[]>({
    queryKey: ['followers', userId],
    queryFn: () => {
      return Array.from(followState[userId] ?? []);
    },
  });
}

export function useGetFollowing(userId: string) {
  return useQuery<string[]>({
    queryKey: ['following', userId],
    queryFn: () => {
      const following: string[] = [];
      for (const [uid, followers] of Object.entries(followState)) {
        if (followers.has(userId)) following.push(uid);
      }
      return following;
    },
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, followerId }: { userId: string; followerId: string }) => {
      if (!followState[userId]) followState[userId] = new Set();
      followState[userId].add(followerId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['followers', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['following', variables.followerId] });
    },
  });
}

export function useUnfollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, followerId }: { userId: string; followerId: string }) => {
      followState[userId]?.delete(followerId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['followers', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['following', variables.followerId] });
    },
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

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

export function useGetAllUsers() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<UserProfile[]>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return [];
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_userId: string) => {
      throw new Error('Delete user not supported');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

// ─── Car Meets (local state only) ─────────────────────────────────────────────

export interface CarMeet {
  id: string;
  title: string;
  location: string;
  date: number;
  description: string;
  organizer: string;
  attendees: string[];
  category: string;
  createdAt: number;
}

const carMeetsStore: Map<string, CarMeet> = new Map();
let carMeetIdCounter = 1;

export function useGetCarMeets() {
  return useQuery<CarMeet[]>({
    queryKey: ['carMeets'],
    queryFn: () => Array.from(carMeetsStore.values()),
  });
}

export function useGetCarMeetDetails(meetId: string) {
  return useQuery<CarMeet | null>({
    queryKey: ['carMeet', meetId],
    queryFn: () => carMeetsStore.get(meetId) ?? null,
    enabled: !!meetId,
  });
}

export function useCreateCarMeet() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: Omit<CarMeet, 'id' | 'organizer' | 'createdAt' | 'attendees'>) => {
      const id = String(carMeetIdCounter++);
      const meet: CarMeet = {
        ...params,
        id,
        organizer: identity?.getPrincipal().toString() ?? 'anonymous',
        attendees: [],
        createdAt: Date.now(),
      };
      carMeetsStore.set(id, meet);
      return meet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carMeets'] });
    },
  });
}

export function useJoinMeet() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meetId: string) => {
      const meet = carMeetsStore.get(meetId);
      if (!meet) throw new Error('Meet not found');
      const userId = identity?.getPrincipal().toString() ?? '';
      if (!meet.attendees.includes(userId)) {
        meet.attendees = [...meet.attendees, userId];
        carMeetsStore.set(meetId, meet);
      }
    },
    onSuccess: (_data, meetId) => {
      queryClient.invalidateQueries({ queryKey: ['carMeet', meetId] });
      queryClient.invalidateQueries({ queryKey: ['carMeets'] });
    },
  });
}

// Alias for backward compatibility
export const useJoinCarMeet = useJoinMeet;

export function useLeaveMeet() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meetId: string) => {
      const meet = carMeetsStore.get(meetId);
      if (!meet) throw new Error('Meet not found');
      const userId = identity?.getPrincipal().toString() ?? '';
      meet.attendees = meet.attendees.filter((a) => a !== userId);
      carMeetsStore.set(meetId, meet);
    },
    onSuccess: (_data, meetId) => {
      queryClient.invalidateQueries({ queryKey: ['carMeet', meetId] });
      queryClient.invalidateQueries({ queryKey: ['carMeets'] });
    },
  });
}

// Alias for backward compatibility
export const useLeaveCarMeet = useLeaveMeet;

// ─── Mechanics Help (local state only) ────────────────────────────────────────

export interface MechanicsComment {
  id: number;
  postId: number;
  authorId: string;
  text: string;
  timestamp: number;
}

export interface MechanicsPost {
  id: number;
  title: string;
  description: string;
  author: string;
  category: string;
  createdAt: number;
  comments: MechanicsComment[];
}

const mechanicsPostsStore: Map<number, MechanicsPost> = new Map();
let mechanicsPostIdCounter = 1;
let mechanicsCommentIdCounter = 1;

export function useGetMechanicsPosts() {
  return useQuery<MechanicsPost[]>({
    queryKey: ['mechanicsPosts'],
    queryFn: () => Array.from(mechanicsPostsStore.values()),
  });
}

export function useGetMechanicsPostDetails(postId: number) {
  return useQuery<MechanicsPost | null>({
    queryKey: ['mechanicsPost', postId],
    queryFn: () => mechanicsPostsStore.get(postId) ?? null,
    enabled: !!postId,
  });
}

// Alias for backward compatibility
export const useGetMechanicsPost = useGetMechanicsPostDetails;

export function useCreateMechanicsPost() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { title: string; description: string; category: string }) => {
      const id = mechanicsPostIdCounter++;
      const post: MechanicsPost = {
        ...params,
        id,
        author: identity?.getPrincipal().toString() ?? 'anonymous',
        createdAt: Date.now(),
        comments: [],
      };
      mechanicsPostsStore.set(id, post);
      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanicsPosts'] });
    },
  });
}

export function useAddMechanicsComment() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, text }: { postId: number; text: string }) => {
      const post = mechanicsPostsStore.get(postId);
      if (!post) throw new Error('Post not found');
      const comment: MechanicsComment = {
        id: mechanicsCommentIdCounter++,
        postId,
        authorId: identity?.getPrincipal().toString() ?? 'anonymous',
        text,
        timestamp: Date.now(),
      };
      post.comments = [...post.comments, comment];
      mechanicsPostsStore.set(postId, post);
      return comment;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mechanicsPost', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['mechanicsPosts'] });
    },
  });
}

export function useDeleteMechanicsPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: number) => {
      mechanicsPostsStore.delete(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanicsPosts'] });
    },
  });
}

// ─── Build Logs (local state only) ────────────────────────────────────────────

export interface BuildStage {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: number;
}

export interface BuildLog {
  id: number;
  title: string;
  authorId: string;
  carMake: string;
  carModel: string;
  carYear: string;
  description: string;
  stages: BuildStage[];
  createdAt: number;
  updatedAt: number;
}

const buildLogsStore: Map<number, BuildLog> = new Map();
let buildLogIdCounter = 1;
let buildStageIdCounter = 1;

export function useGetBuildLogs() {
  return useQuery<BuildLog[]>({
    queryKey: ['buildLogs'],
    queryFn: () => Array.from(buildLogsStore.values()),
  });
}

export function useGetBuildLogDetails(logId: number) {
  return useQuery<BuildLog | null>({
    queryKey: ['buildLog', logId],
    queryFn: () => buildLogsStore.get(logId) ?? null,
    enabled: !!logId,
  });
}

// Alias for backward compatibility
export const useGetBuildLog = useGetBuildLogDetails;

export function useCreateBuildLog() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      carMake: string;
      carModel: string;
      carYear: string;
      description: string;
    }) => {
      const id = buildLogIdCounter++;
      const log: BuildLog = {
        ...params,
        id,
        authorId: identity?.getPrincipal().toString() ?? 'anonymous',
        stages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      buildLogsStore.set(id, log);
      return log;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildLogs'] });
    },
  });
}

export function useAddBuildStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      logId: number;
      title: string;
      description: string;
      imageUrl: string;
    }) => {
      const log = buildLogsStore.get(params.logId);
      if (!log) throw new Error('Build log not found');
      const stage: BuildStage = {
        id: buildStageIdCounter++,
        title: params.title,
        description: params.description,
        imageUrl: params.imageUrl,
        createdAt: Date.now(),
      };
      log.stages = [...log.stages, stage];
      log.updatedAt = Date.now();
      buildLogsStore.set(params.logId, log);
      return stage;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['buildLog', variables.logId] });
      queryClient.invalidateQueries({ queryKey: ['buildLogs'] });
    },
  });
}

export function useDeleteBuildLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ logId }: { logId: number }) => {
      buildLogsStore.delete(logId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildLogs'] });
    },
  });
}

// ─── Classifieds (local state only) ───────────────────────────────────────────

export interface Listing {
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
  createdAt: number;
  isActive: boolean;
}

const listingsStore: Map<number, Listing> = new Map();
let listingIdCounter = 1;

export function useGetListings() {
  return useQuery<Listing[]>({
    queryKey: ['listings'],
    queryFn: () => Array.from(listingsStore.values()).filter((l) => l.isActive),
  });
}

export function useGetListingDetails(id: number) {
  return useQuery<Listing | null>({
    queryKey: ['listing', id],
    queryFn: () => listingsStore.get(id) ?? null,
    enabled: !!id,
  });
}

// Alias for backward compatibility
export const useGetListing = useGetListingDetails;

export function useCreateListing() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: Omit<Listing, 'id' | 'sellerId' | 'createdAt' | 'isActive'>) => {
      const id = listingIdCounter++;
      const listing: Listing = {
        ...params,
        id,
        sellerId: identity?.getPrincipal().toString() ?? 'anonymous',
        createdAt: Date.now(),
        isActive: true,
      };
      listingsStore.set(id, listing);
      return listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useDeactivateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const listing = listingsStore.get(id);
      if (!listing) throw new Error('Listing not found');
      listing.isActive = false;
      listingsStore.set(id, listing);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

// ─── Notifications (local state only) ─────────────────────────────────────────

export interface Notification {
  id: number;
  recipientId: string;
  senderId: string;
  notificationType: string;
  referenceId: string;
  message: string;
  isRead: boolean;
  createdAt: number;
}

const notificationsStore: Map<number, Notification> = new Map();
let notificationIdCounter = 1;

export function useGetNotifications() {
  const { identity } = useInternetIdentity();

  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => {
      const userId = identity?.getPrincipal().toString() ?? '';
      return Array.from(notificationsStore.values()).filter(
        (n) => n.recipientId === userId,
      );
    },
    enabled: !!identity,
  });
}

export function useMarkAllNotificationsRead() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const userId = identity?.getPrincipal().toString() ?? '';
      notificationsStore.forEach((notif, id) => {
        if (notif.recipientId === userId) {
          notificationsStore.set(id, { ...notif, isRead: true });
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notifId: number) => {
      const notif = notificationsStore.get(notifId);
      if (notif) {
        notificationsStore.set(notifId, { ...notif, isRead: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ─── Racing Challenges (local state only) ─────────────────────────────────────

export interface RacingChallenge {
  id: number;
  challengerId: string;
  challengedId: string;
  videoId: string;
  originalVideoId: string;
  status: string;
  createdAt: number;
}

const challengesStore: Map<number, RacingChallenge> = new Map();
let challengeIdCounter = 1;

export function useGetChallenges() {
  const { identity } = useInternetIdentity();

  return useQuery<RacingChallenge[]>({
    queryKey: ['challenges'],
    queryFn: () => {
      const userId = identity?.getPrincipal().toString() ?? '';
      return Array.from(challengesStore.values()).filter(
        (c) => c.challengerId === userId || c.challengedId === userId,
      );
    },
    enabled: !!identity,
  });
}

export function usePostChallenge() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      challengedId: string;
      videoId: string;
      originalVideoId: string;
    }) => {
      const id = challengeIdCounter++;
      const challenge: RacingChallenge = {
        id,
        challengerId: identity?.getPrincipal().toString() ?? 'anonymous',
        challengedId: params.challengedId,
        videoId: params.videoId,
        originalVideoId: params.originalVideoId,
        status: 'pending',
        createdAt: Date.now(),
      };
      challengesStore.set(id, challenge);
      return challenge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export function useGetLeaderboard() {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      if (!actor) return [];
      const videos = await actor.getVideos();
      return [...videos].sort((a, b) => Number(b.viewCount) - Number(a.viewCount)).slice(0, 10);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Upload Blob ──────────────────────────────────────────────────────────────

export function useUploadBlob() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (blob: ExternalBlob) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.uploadBlob(blob);
      if (result.__kind__ === 'error') throw new Error(result.error);
      return result.ok.blob;
    },
  });
}

// ─── User Stats ───────────────────────────────────────────────────────────────

export function useGetUserStats(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['userStats', userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      const [reels, profile] = await Promise.all([
        actor.getUserReels(Principal.fromText(userId)),
        actor.getUserProfile(Principal.fromText(userId)),
      ]);
      const totalViews = reels.reduce((sum, v) => sum + Number(v.viewCount), 0);
      const totalLikes = reels.reduce((sum, v) => sum + v.likes.length, 0);
      const totalComments = reels.reduce((sum, v) => sum + v.comments.length, 0);
      return {
        totalVideos: reels.length,
        totalViews,
        totalLikes,
        totalComments,
        profile: profile.__kind__ === 'ok' ? profile.ok : null,
      };
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

export function badgeLabel(badge: Badge): string {
  const labels: Record<Badge, string> = {
    [Badge.driftKing]: 'Drift King',
    [Badge.mechanicPro]: 'Mechanic Pro',
    [Badge.dragRacer]: 'Drag Racer',
    [Badge.communityHelper]: 'Community Helper',
    [Badge.verified]: 'Verified',
    [Badge.buildMaster]: 'Build Master',
    [Badge.racingLegend]: 'Racing Legend',
  };
  return labels[badge] ?? String(badge);
}
