import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { type Video, type UserProfile, type Comment, type CarMeet, type CarMeetDetails, type MechanicsPost, type MechanicsComment, type DirectMessage, type ConversationSummary, ExternalBlob } from '../backend';
import { type Principal } from '@dfinity/principal';

// ─── Videos ───────────────────────────────────────────────────────────────────

export function useGetAllVideos() {
  const { actor, isFetching } = useActor();
  return useQuery<Video[]>({
    queryKey: ['videos', 'all'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVideos();
    },
    enabled: !!actor && !isFetching,
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

export function useGetVideo(videoId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Video>({
    queryKey: ['video', videoId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getVideo(videoId);
    },
    enabled: !!actor && !isFetching && !!videoId,
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
      videoUrl,
    }: {
      title: string;
      description: string;
      hashtags: string[];
      category: string;
      thumbnail: ExternalBlob;
      videoUrl: ExternalBlob;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadVideo(title, description, hashtags, category, thumbnail, videoUrl);
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

// ─── Comments ─────────────────────────────────────────────────────────────────

export function useGetComments(videoId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Comment[]>({
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

// ─── User Profiles ────────────────────────────────────────────────────────────

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

export function useGetUserProfile(userId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      try {
        const { Principal } = await import('@dfinity/principal');
        return actor.getUserProfile(Principal.fromText(userId));
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useSaveCallerUserProfile() {
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
      return actor.saveCallerUserProfile(username, bio, avatar, avatarUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
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

// ─── Follow / Unfollow ────────────────────────────────────────────────────────

export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      return actor.followUser(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      return actor.unfollowUser(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

// ─── Car Meets ────────────────────────────────────────────────────────────────

export function useGetAllCarMeets() {
  const { actor, isFetching } = useActor();
  return useQuery<CarMeet[]>({
    queryKey: ['carMeets', 'all'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCarMeets();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCarMeetDetails(meetId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<CarMeetDetails | null>({
    queryKey: ['carMeetDetails', meetId],
    queryFn: async () => {
      if (!actor || !meetId) return null;
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
    onSuccess: (_data, meetId) => {
      queryClient.invalidateQueries({ queryKey: ['carMeets'] });
      queryClient.invalidateQueries({ queryKey: ['carMeetDetails', meetId] });
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
    onSuccess: (_data, meetId) => {
      queryClient.invalidateQueries({ queryKey: ['carMeets'] });
      queryClient.invalidateQueries({ queryKey: ['carMeetDetails', meetId] });
    },
  });
}

// ─── Mechanics Posts ──────────────────────────────────────────────────────────

export function useGetAllMechanicsPosts() {
  const { actor, isFetching } = useActor();
  return useQuery<MechanicsPost[]>({
    queryKey: ['mechanicsPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMechanicsPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMechanicsPostById(postId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<MechanicsPost | null>({
    queryKey: ['mechanicsPost', postId?.toString()],
    queryFn: async () => {
      if (!actor || postId === null) return null;
      return actor.getMechanicsPostById(postId);
    },
    enabled: !!actor && !isFetching && postId !== null,
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
    mutationFn: async ({ postId, text }: { postId: bigint; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addMechanicsComment(postId, text);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mechanicsPosts'] });
      queryClient.invalidateQueries({ queryKey: ['mechanicsPost', variables.postId.toString()] });
    },
  });
}

export function useDeleteMechanicsPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMechanicsPost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanicsPosts'] });
    },
  });
}

// ─── Direct Messaging ─────────────────────────────────────────────────────────

export function useGetInbox() {
  const { actor, isFetching } = useActor();
  return useQuery<ConversationSummary[]>({
    queryKey: ['inbox'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInbox();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
  });
}

export function useGetConversation(otherUserId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<DirectMessage[]>({
    queryKey: ['conversation', otherUserId],
    queryFn: async () => {
      if (!actor || !otherUserId) return [];
      const { Principal } = await import('@dfinity/principal');
      return actor.getConversation(Principal.fromText(otherUserId));
    },
    enabled: !!actor && !isFetching && !!otherUserId,
    refetchInterval: 10000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ toUserId, text }: { toUserId: string; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      return actor.sendMessage(Principal.fromText(toUserId), text);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.toUserId] });
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
}

export function useMarkAsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ otherUserId, messageId }: { otherUserId: string; messageId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      return actor.markAsRead(Principal.fromText(otherUserId), messageId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.otherUserId] });
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
}

export function useDeleteMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ otherUserId, messageId }: { otherUserId: string; messageId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      return actor.deleteMessage(Principal.fromText(otherUserId), messageId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.otherUserId] });
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

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
      const { Principal } = await import('@dfinity/principal');
      return actor.deleteUser(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
