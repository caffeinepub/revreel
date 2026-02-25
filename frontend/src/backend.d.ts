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
    reactions: Array<[UserId, ReactionType]>;
}
export type CommentId = bigint;
export type Time = bigint;
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
export type Hashtag = string;
export type VideoId = string;
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
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createVideo(title: string, description: string, category: string, hashtags: Array<Hashtag>, video: ExternalBlob, thumbnail: ExternalBlob, mediaType: Variant_video_photo): Promise<Result>;
    /**
     * / Delete a post (video or photo). Only the owner of the post or an admin can delete it.
     */
    deletePost(postId: string): Promise<Result>;
    /**
     * / Get the caller's own profile. Returns `#unauthorized` if the caller is not a registered user,
     * / and `#notFound` if the profile does not exist.
     */
    getCallerUserProfile(): Promise<ProfileResult>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Get any user's profile by principal. Returns `#unauthorized` if the caller is not the user or an admin,
     * / and `#notFound` if the profile does not exist.
     */
    getUserProfile(user: Principal): Promise<ProfileResult>;
    getVideos(): Promise<Array<Video>>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / Save (create or update) the caller's own profile. Only registered users can save profiles.
     */
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    /**
     * / Upload a blob (photo or video) and return its canister path.
     * / Only registered users are allowed to upload blobs.
     */
    uploadBlob(blob: ExternalBlob): Promise<UploadResponse>;
}
