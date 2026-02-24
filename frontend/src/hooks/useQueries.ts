import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { Principal } from '@dfinity/principal';
import { Badge, ReactionType, Video, UserProfile, BuildLog, Listing, RacingChallenge, Notification, UserStats, ExternalBlob } from '../backend';

// ===== USER PROFILE =====

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
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

export function useGetUserProfile(userId: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      const principal = Principal.fromText(userId);
      return actor.getUserProfile(principal);
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
      return actor.getAllUsers();
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
      avatarUrl: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createUser(username, bio, avatar, avatarUrl);
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
      return actor.updateProfile(username, bio, avatar, avatarUrl);
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
    mutationFn: async (avatarUrl: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateAvatar(avatarUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

// ===== VIDEOS =====

export function useGetAllVideos() {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['videos'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVideos();
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
      return actor.getVideosByCategory(category);
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
      return actor.getVideosByHashtag(hashtag);
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
      return actor.getTrendingVideos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useToggleLike() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.toggleLike(videoId);
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
    mutationFn: async (videoId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
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
    }: {
      title: string;
      description: string;
      hashtags: string[];
      category: string;
      thumbnailBlob: ExternalBlob;
      videoBlob: ExternalBlob;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadVideo(title, description, hashtags, category, thumbnailBlob, videoBlob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

// ===== REACTIONS =====

export function useAddReaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, reaction }: { videoId: string; reaction: ReactionType }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addReaction(videoId, reaction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['reactionCounts'] });
    },
  });
}

export function useRemoveReaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeReaction(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['reactionCounts'] });
    },
  });
}

export function useGetReactionCounts(videoId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[ReactionType, bigint]>>({
    queryKey: ['reactionCounts', videoId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReactionCounts(videoId);
    },
    enabled: !!actor && !isFetching && !!videoId,
  });
}

// ===== COMMENTS =====

export function useGetComments(videoId: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['comments', videoId],
    queryFn: async () => {
      if (!actor) return [];
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
      return actor.addComment(videoId, text);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.videoId] });
    },
  });
}

// ===== FOLLOW =====

export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error('Actor not available');
      const principal = Principal.fromText(userId);
      return actor.followUser(principal);
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
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error('Actor not available');
      const principal = Principal.fromText(userId);
      return actor.unfollowUser(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ===== CAR MEETS =====

export function useGetAllCarMeets() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['carMeets'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCarMeets();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCarMeetById(meetId: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['carMeet', meetId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCarMeetById(meetId);
    },
    enabled: !!actor && !isFetching && !!meetId,
  });
}

export function useGetCarMeetDetails(meetId: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['carMeetDetails', meetId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCarMeetDetails(meetId);
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
      return actor.createCarMeet(title, location, date, description, category);
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
    mutationFn: async (meetId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.joinCarMeet(meetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carMeets'] });
      queryClient.invalidateQueries({ queryKey: ['carMeet'] });
      queryClient.invalidateQueries({ queryKey: ['carMeetDetails'] });
    },
  });
}

export function useLeaveCarMeet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meetId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.leaveCarMeet(meetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carMeets'] });
      queryClient.invalidateQueries({ queryKey: ['carMeet'] });
      queryClient.invalidateQueries({ queryKey: ['carMeetDetails'] });
    },
  });
}

// ===== MECHANICS =====

export function useGetAllMechanicsPosts() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['mechanicsPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMechanicsPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMechanicsPostById(postId: number | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['mechanicsPost', postId],
    queryFn: async () => {
      if (!actor || postId === undefined) return null;
      return actor.getMechanicsPostById(BigInt(postId));
    },
    enabled: !!actor && !isFetching && postId !== undefined,
  });
}

export function useCreateMechanicsPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, description, category }: { title: string; description: string; category: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createMechanicsPost(title, description, category);
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
      return actor.addMechanicsComment(BigInt(postId), text);
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
    mutationFn: async (postId: number) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMechanicsPost(BigInt(postId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanicsPosts'] });
    },
  });
}

// ===== MESSAGES =====

export function useGetInbox() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['inbox'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInbox();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useGetConversation(otherUserId: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['conversation', otherUserId],
    queryFn: async () => {
      if (!actor) return [];
      const principal = Principal.fromText(otherUserId);
      return actor.getConversation(principal);
    },
    enabled: !!actor && !isFetching && !!otherUserId,
    refetchInterval: 5000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ toUser, text }: { toUser: string; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      const principal = Principal.fromText(toUser);
      return actor.sendMessage(principal, text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
    },
  });
}

export function useMarkAsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ otherUser, messageId }: { otherUser: string; messageId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      const principal = Principal.fromText(otherUser);
      return actor.markAsRead(principal, messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
    },
  });
}

export function useDeleteMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ otherUser, messageId }: { otherUser: string; messageId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      const principal = Principal.fromText(otherUser);
      return actor.deleteMessage(principal, messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
    },
  });
}

// ===== ADMIN =====

export function useIsAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDeleteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error('Actor not available');
      const principal = Principal.fromText(userId);
      return actor.deleteUser(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

// ===== NOTIFICATIONS =====

export function useGetNotifications() {
  const { actor, isFetching } = useActor();

  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNotifications();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
  });
}

export function useGetUnreadNotificationCount() {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['unreadNotificationCount'],
    queryFn: async () => {
      if (!actor) return 0;
      const count = await actor.getUnreadNotificationCount();
      return Number(count);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
  });
}

export function useMarkNotificationRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notifId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markNotificationRead(notifId);
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
      return actor.markAllNotificationsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    },
  });
}

// ===== BUILD LOGS =====

export function useGetAllBuildLogs() {
  const { actor, isFetching } = useActor();

  return useQuery<BuildLog[]>({
    queryKey: ['buildLogs'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllBuildLogs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetBuildLogById(id: number | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<BuildLog | null>({
    queryKey: ['buildLog', id],
    queryFn: async () => {
      if (!actor || id === undefined) return null;
      return actor.getBuildLogById(BigInt(id));
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useGetBuildLogsByUser(principal: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<BuildLog[]>({
    queryKey: ['buildLogs', 'user', principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      return actor.getBuildLogsByUser(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
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
      return actor.createBuildLog(title, carMake, carModel, carYear, description);
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
      return actor.addBuildStage(BigInt(buildLogId), stageTitle, stageDescription, imageUrl);
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
    mutationFn: async (id: number) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteBuildLog(BigInt(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildLogs'] });
    },
  });
}

// ===== CLASSIFIEDS =====

export function useGetAllActiveListings() {
  const { actor, isFetching } = useActor();

  return useQuery<Listing[]>({
    queryKey: ['listings'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllActiveListings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetListingById(id: number | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Listing | null>({
    queryKey: ['listing', id],
    queryFn: async () => {
      if (!actor || id === undefined) return null;
      return actor.getListingById(BigInt(id));
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useGetListingsBySeller(principal: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Listing[]>({
    queryKey: ['listings', 'seller', principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      return actor.getListingsBySeller(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
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
      return actor.createListing(title, description, make, model, year, price, condition, imageUrl, category);
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
    mutationFn: async (id: number) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deactivateListing(BigInt(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

// ===== RACING CHALLENGES =====

export function useGetChallengesForVideo(videoId: number | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<RacingChallenge[]>({
    queryKey: ['challenges', 'video', videoId],
    queryFn: async () => {
      if (!actor || videoId === undefined) return [];
      return actor.getChallengesForVideo(BigInt(videoId));
    },
    enabled: !!actor && !isFetching && videoId !== undefined,
  });
}

export function useGetChallengesForUser(principal: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<RacingChallenge[]>({
    queryKey: ['challenges', 'user', principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      return actor.getChallengesForUser(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
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
      originalVideoId: number;
      responseVideoId: number;
      challengedPrincipal: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.postChallenge(
        BigInt(originalVideoId),
        BigInt(responseVideoId),
        Principal.fromText(challengedPrincipal)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
}

export function useCloseChallenge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      if (!actor) throw new Error('Actor not available');
      return actor.closeChallenge(BigInt(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
}

// ===== SAVED VIDEOS =====

export function useGetSavedVideos() {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['savedVideos'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSavedVideos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: number) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveVideo(BigInt(videoId));
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
    mutationFn: async (videoId: number) => {
      if (!actor) throw new Error('Actor not available');
      return actor.unsaveVideo(BigInt(videoId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedVideos'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ===== BADGES =====

export function useGetUserBadges(principal: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Badge[]>({
    queryKey: ['badges', principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      return actor.getUserBadges(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useAwardBadge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetPrincipal, badge }: { targetPrincipal: string; badge: Badge }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.awardBadge(Principal.fromText(targetPrincipal), badge);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

// ===== VERIFIED STATUS =====

export function useSetVerified() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetPrincipal, verified }: { targetPrincipal: string; verified: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setVerified(Principal.fromText(targetPrincipal), verified);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

// ===== STATS =====

export function useGetUserStats(principal: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<UserStats | null>({
    queryKey: ['userStats', principal],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserStats(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useIncrementViewCount() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.incrementViewCount(videoId);
    },
  });
}
