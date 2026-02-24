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
    likes: Array<UserId>;
    timestamp: Time;
    category: Category;
    uploader: UserId;
    comments: Array<Comment>;
    videoUrl: ExternalBlob;
}
export type MeetCategory = string;
export type Location = string;
export type Time = bigint;
export interface DirectMessage {
    id: MessageId;
    text: string;
    isRead: boolean;
    toUser: UserId;
    timestamp: Time;
    fromUser: UserId;
}
export interface MechanicsComment {
    id: CommentId;
    authorId: UserId;
    text: string;
    timestamp: Time;
    postId: bigint;
}
export type CommentId = bigint;
export interface Comment {
    id: CommentId;
    authorId: UserId;
    text: string;
    timestamp: Time;
    videoId: VideoId;
}
export type Category = string;
export type CarMeetId = string;
export interface CarMeet {
    id: CarMeetId;
    organizer: UserId;
    title: string;
    date: Time;
    createdAt: Time;
    description: string;
    attendees: Array<UserId>;
    category: MeetCategory;
    location: Location;
}
export interface MechanicsPost {
    id: bigint;
    title: string;
    createdAt: Time;
    description: string;
    author: UserId;
    category: string;
    comments: Array<MechanicsComment>;
}
export type UserId = Principal;
export type MessageId = bigint;
export type Hashtag = string;
export type VideoId = string;
export interface CarMeetDetails {
    id: CarMeetId;
    organizer?: UserProfile;
    title: string;
    date: Time;
    createdAt: Time;
    description: string;
    attendees: Array<UserProfile>;
    category: MeetCategory;
    location: Location;
}
export interface ConversationSummary {
    lastMessage: DirectMessage;
    otherUser: UserId;
    unreadCount: bigint;
}
export interface UserProfile {
    id: UserId;
    bio: string;
    username: string;
    avatarUrl: string;
    avatar: ExternalBlob;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    /**
     * / Add a comment to a video. Requires #user role.
     */
    addComment(videoId: VideoId, text: string): Promise<void>;
    /**
     * / Add a comment to a mechanics post. Requires #user role.
     */
    addMechanicsComment(postId: bigint, text: string): Promise<MechanicsComment>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Create a new car meet/event. Requires #user role.
     */
    createCarMeet(title: string, location: Location, date: Time, description: string, category: MeetCategory): Promise<CarMeet>;
    /**
     * / Create a new mechanics post. Requires #user role.
     */
    createMechanicsPost(title: string, description: string, category: string): Promise<MechanicsPost>;
    /**
     * / Create a new user account. Open to all callers (guests register here).
     */
    createUser(username: string, bio: string, avatar: ExternalBlob, avatarUrl: string): Promise<UserProfile>;
    /**
     * / Delete a mechanics post. Only the author or an admin can delete.
     * / Requires #user role.
     */
    deleteMechanicsPost(postId: bigint): Promise<void>;
    /**
     * / Delete a message. Requires #user role.
     * / Only the sender of the message may delete it.
     */
    deleteMessage(otherUser: UserId, messageId: MessageId): Promise<void>;
    /**
     * / Delete a user account. Admin-only.
     */
    deleteUser(userId: UserId): Promise<void>;
    /**
     * / Delete a video and all associated comments and likes.
     * / Requires #user role. Only the uploader or an admin can delete.
     */
    deleteVideo(videoId: VideoId): Promise<void>;
    /**
     * / Follow another user. Requires #user role.
     */
    followUser(followee: UserId): Promise<void>;
    /**
     * / Get all car meets (sorted by date). Public.
     */
    getAllCarMeets(): Promise<Array<CarMeet>>;
    /**
     * / Get all mechanics posts. Public — no auth check needed.
     */
    getAllMechanicsPosts(): Promise<Array<MechanicsPost>>;
    /**
     * / Get all videos. Public — no auth check needed.
     */
    getAllVideos(): Promise<Array<Video>>;
    /**
     * / Get the caller's own profile. Requires #user role.
     */
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Get a car meet by ID. Public.
     */
    getCarMeetById(meetId: CarMeetId): Promise<CarMeet | null>;
    /**
     * / Get detailed information on a car meet, including attendees' usernames and organizer. Public.
     */
    getCarMeetDetails(meetId: CarMeetId): Promise<CarMeetDetails | null>;
    /**
     * / Get car meets by category. Public.
     */
    getCarMeetsByCategory(category: MeetCategory): Promise<Array<CarMeet>>;
    /**
     * / Get car meets by organizer. Public.
     */
    getCarMeetsByOrganizer(organizer: UserId): Promise<Array<CarMeet>>;
    /**
     * / Get comments for a video. Public — no auth check needed.
     */
    getComments(videoId: VideoId): Promise<Array<Comment>>;
    /**
     * / Get all messages between the caller and another user, sorted by timestamp ascending.
     * / Requires #user role — only authenticated users can read their own conversations.
     */
    getConversation(otherUser: UserId): Promise<Array<DirectMessage>>;
    /**
     * / Get the inbox for the caller: most recent message per conversation partner,
     * / sorted by latest timestamp descending.
     * / Requires #user role — only authenticated users can read their own inbox.
     */
    getInbox(): Promise<Array<ConversationSummary>>;
    /**
     * / Get a mechanics post by ID. Public — no auth check needed.
     */
    getMechanicsPostById(postId: bigint): Promise<MechanicsPost | null>;
    /**
     * / Get the caller's own profile. Requires #user role.
     */
    getOwnProfile(): Promise<UserProfile>;
    /**
     * / Get any user's profile by principal. Public — no auth check needed.
     */
    getProfile(userId: UserId): Promise<UserProfile>;
    /**
     * / Get trending videos (top 10 by likes). Public — no auth check needed.
     */
    getTrendingVideos(): Promise<Array<Video>>;
    /**
     * / Get any user's profile by principal. Public — no auth check needed.
     */
    getUserProfile(userId: UserId): Promise<UserProfile | null>;
    /**
     * / Get a single video by ID. Public — no auth check needed.
     */
    getVideo(videoId: VideoId): Promise<Video>;
    /**
     * / Get videos filtered by category. Public — no auth check needed.
     */
    getVideosByCategory(category: Category): Promise<Array<Video>>;
    /**
     * / Get videos filtered by hashtag. Public — no auth check needed.
     */
    getVideosByHashtag(hashtag: Hashtag): Promise<Array<Video>>;
    /**
     * / Check if the caller is an admin. Public — no auth check needed (returns bool).
     */
    isAdmin(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / Join a car meet. Requires #user role.
     */
    joinCarMeet(meetId: CarMeetId): Promise<CarMeet>;
    /**
     * / Leave a car meet. Requires #user role.
     */
    leaveCarMeet(meetId: CarMeetId): Promise<CarMeet>;
    /**
     * / Mark a specific message as read. Requires #user role.
     * / Only the recipient of the message may mark it as read.
     */
    markAsRead(otherUser: UserId, messageId: MessageId): Promise<void>;
    /**
     * / Save (create or update) the caller's profile. Requires #user role.
     */
    saveCallerUserProfile(username: string, bio: string, avatar: ExternalBlob, avatarUrl: string): Promise<void>;
    /**
     * / Send a direct message to another user. Requires #user role.
     */
    sendMessage(toUser: UserId, text: string): Promise<MessageId>;
    /**
     * / Toggle like on a video. Requires #user role.
     */
    toggleLike(videoId: VideoId): Promise<Video>;
    /**
     * / Unfollow another user. Requires #user role.
     */
    unfollowUser(followee: UserId): Promise<void>;
    updateAvatar(avatarUrl: string): Promise<UserProfile>;
    /**
     * / Update the caller's profile. Requires #user role.
     */
    updateProfile(username: string, bio: string, avatar: ExternalBlob, avatarUrl: string): Promise<UserProfile>;
    /**
     * / Upload a new video. Requires #user role.
     */
    uploadVideo(title: string, description: string, hashtags: Array<Hashtag>, category: Category, thumbnail: ExternalBlob, videoUrl: ExternalBlob): Promise<Video>;
}
