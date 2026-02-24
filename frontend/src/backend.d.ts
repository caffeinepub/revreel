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
export type UserId = Principal;
export type Hashtag = string;
export type VideoId = string;
export type Category = string;
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
    getCallerUserRole(): Promise<UserRole>;
    isCallerAdmin(): Promise<boolean>;
    uploadVideo(title: string, description: string, hashtags: Array<Hashtag>, category: Category, thumbnail: ExternalBlob, mediaUrl: ExternalBlob, mediaType: Variant_video_photo): Promise<Video>;
}
