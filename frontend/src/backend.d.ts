import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Video {
    id: VideoId;
    title: string;
    thumbnail: ExternalBlob;
    hashtags: Array<Hashtag>;
    description: string;
    mediaUrl: ExternalBlob;
    likes: Array<UserId>;
    viewCount: bigint;
    timestamp: Time;
    mediaType: Variant_video_photo;
    category: Category;
    uploader: UserId;
    comments: Array<Comment>;
    reactions: Array<Reaction>;
}
export interface Reaction {
    user: UserId;
    reactionType: ReactionType;
}
export type Time = bigint;
export interface DirectMessage {
    id: MessageId;
    text: string;
    isRead: boolean;
    toUser: UserId;
    timestamp: Time;
    fromUser: UserId;
}
export type CommentId = bigint;
export interface Comment {
    id: CommentId;
    authorId: UserId;
    text: string;
    authorName: string;
    timestamp: Time;
    videoId: VideoId;
}
export type Category = string;
export type UserId = Principal;
export type ProfileResult = {
    __kind__: "ok";
    ok: UserProfile;
} | {
    __kind__: "notFound";
    notFound: string;
} | {
    __kind__: "unauthorized";
    unauthorized: string;
};
export type Result = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "notFound";
    notFound: string;
} | {
    __kind__: "internalError";
    internalError: string;
} | {
    __kind__: "unauthorized";
    unauthorized: string;
};
export type MessageId = bigint;
export type Hashtag = string;
export type VideoId = string;
export interface ConversationSummary {
    lastMessage: DirectMessage;
    otherUser: UserId;
    unreadCount: bigint;
}
export interface UserProfile {
    id: UserId;
    bio: string;
    verified: boolean;
    username: string;
    badges: Array<Badge>;
    joinedAt: bigint;
    avatarUrl: string;
    savedVideos: Array<bigint>;
    avatar: ExternalBlob;
}
export type UploadResponse = {
    __kind__: "ok";
    ok: {
        blob: ExternalBlob;
    };
} | {
    __kind__: "error";
    error: string;
};
export enum Badge {
    buildMaster = "buildMaster",
    verified = "verified",
    racingLegend = "racingLegend",
    dragRacer = "dragRacer",
    communityHelper = "communityHelper",
    driftKing = "driftKing",
    mechanicPro = "mechanicPro"
}
export enum ReactionType {
    fire = "fire",
    hype = "hype",
    like = "like",
    wild = "wild",
    respect = "respect"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_video_photo {
    video = "video",
    photo = "photo"
}
export interface backendInterface {
    /**
     * / Add a comment to a video. Only registered users can comment.
     */
    addComment(videoId: VideoId, text: string): Promise<Result>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Create a video post. Only registered users can upload content.
     */
    createVideo(title: string, description: string, category: string, hashtags: Array<Hashtag>, video: ExternalBlob, thumbnail: ExternalBlob, mediaType: Variant_video_photo): Promise<Result>;
    /**
     * / Delete a conversation with another user.
     * / Only registered users can delete their own conversations.
     * / Only the caller's own conversation copy is deleted (ownership enforced by using caller as key).
     */
    deleteConversation(otherUser: Principal): Promise<void>;
    /**
     * / Delete a reel (video or photo) by its owner or an admin.
     * / Only the owner or an admin can delete a reel.
     */
    deleteReel(reelId: string): Promise<Result>;
    /**
     * / Get the caller's own profile. Returns \`#unauthorized\` if the caller is not a registered user,
     * / and \`#notFound\` if the profile does not exist.
     */
    getCallerUserProfile(): Promise<ProfileResult>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Get comments for a video. Accessible to any caller including guests.
     */
    getComments(videoId: VideoId): Promise<Array<Comment>>;
    /**
     * / Get the conversation between the caller and a recipient.
     * / Only registered users can access their conversations.
     * / Only the caller's own conversation is accessible (ownership enforced by using caller as key).
     */
    getConversation(recipient: Principal): Promise<Array<DirectMessage>>;
    /**
     * / Get the inbox (conversation summaries) for the caller.
     * / Only registered users can access their inbox.
     */
    getInbox(): Promise<Array<ConversationSummary>>;
    /**
     * / Get the unread message count for a conversation with another user.
     * / Only registered users can query their own unread message counts.
     */
    getUnreadMessagesCount(otherUser: Principal): Promise<bigint>;
    /**
     * / Get any user's public profile by principal.
     * / Any caller (including guests) can view public profiles, which is required for
     * / social features such as leaderboards, car meets, challenges, and follower lists.
     */
    getUserProfile(user: Principal): Promise<ProfileResult>;
    /**
     * / Get all reels (videos/photos) for a specific user.
     * / Accessible to any caller including guests (public profile viewing).
     */
    getUserReels(userId: UserId): Promise<Array<Video>>;
    /**
     * / Get all videos. Accessible to any caller including guests (public feed).
     */
    getVideos(): Promise<Array<Video>>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / Mark all messages from a sender as read for the caller.
     * / Only registered users can mark messages as read.
     * / Only the caller's own messages can be marked as read (ownership enforced by using caller as key).
     */
    markMessagesRead(sender: Principal): Promise<void>;
    /**
     * / Save (create or update) the caller's own profile. Only registered users can save profiles.
     */
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    /**
     * / Send a direct message to a recipient.
     * / Only registered users can send messages.
     */
    sendMessage(recipient: Principal, text: string): Promise<void>;
    /**
     * / Like/unlike video with toggle endpoint. Only registered users can like/unlike.
     */
    toggleLike(videoId: VideoId): Promise<Result>;
    /**
     * / Upload a blob (photo or video) and return its canister path.
     * / Only registered users are allowed to upload blobs.
     */
    uploadBlob(blob: ExternalBlob): Promise<UploadResponse>;
}
