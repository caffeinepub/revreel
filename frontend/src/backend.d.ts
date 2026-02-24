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
    viewCount: bigint;
    timestamp: Time;
    category: Category;
    uploader: UserId;
    comments: Array<Comment>;
    videoUrl: ExternalBlob;
    reactions: Array<[UserId, ReactionType]>;
}
export type Location = string;
export interface UserStats {
    totalViews: bigint;
    joinedAt: bigint;
    totalLikes: bigint;
    totalFollowers: bigint;
    totalFollowing: bigint;
    totalVideos: bigint;
    totalBuildLogs: bigint;
    totalComments: bigint;
}
export type Time = bigint;
export interface BuildLog {
    id: bigint;
    stages: Array<BuildStage>;
    title: string;
    carModel: string;
    authorId: UserId;
    createdAt: bigint;
    description: string;
    updatedAt: bigint;
    carMake: string;
    carYear: string;
}
export interface MechanicsComment {
    id: CommentId;
    authorId: UserId;
    text: string;
    timestamp: Time;
    postId: bigint;
}
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
export interface RacingChallenge {
    id: bigint;
    status: string;
    createdAt: bigint;
    originalVideoId: bigint;
    challengedId: UserId;
    challengerId: UserId;
    videoId: bigint;
}
export type Hashtag = string;
export type VideoId = string;
export interface ConversationSummary {
    lastMessage: DirectMessage;
    otherUser: UserId;
    unreadCount: bigint;
}
export type Category = string;
export interface DirectMessage {
    id: MessageId;
    text: string;
    isRead: boolean;
    toUser: UserId;
    timestamp: Time;
    fromUser: UserId;
}
export type CarMeetId = string;
export type MeetCategory = string;
export type CommentId = bigint;
export interface Comment {
    id: CommentId;
    authorId: UserId;
    text: string;
    timestamp: Time;
    videoId: VideoId;
}
export interface Listing {
    id: bigint;
    model: string;
    title: string;
    make: string;
    createdAt: bigint;
    year: string;
    description: string;
    isActive: boolean;
    imageUrl: string;
    category: string;
    sellerId: UserId;
    price: string;
    condition: string;
}
export interface BuildStage {
    id: bigint;
    title: string;
    createdAt: bigint;
    description: string;
    imageUrl: string;
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
export type Result = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: string;
};
export type MessageId = bigint;
export interface Notification {
    id: bigint;
    notificationType: string;
    createdAt: bigint;
    referenceId: string;
    isRead: boolean;
    message: string;
    recipientId: UserId;
    senderId: UserId;
}
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
export interface backendInterface {
    addBuildStage(buildLogId: bigint, stageTitle: string, stageDescription: string, imageUrl: string): Promise<Result>;
    addComment(videoId: VideoId, text: string): Promise<void>;
    addMechanicsComment(postId: bigint, text: string): Promise<MechanicsComment>;
    addReaction(videoId: VideoId, reaction: ReactionType): Promise<Result>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    awardBadge(targetPrincipal: Principal, badge: Badge): Promise<Result>;
    closeChallenge(id: bigint): Promise<Result>;
    createBuildLog(title: string, carMake: string, carModel: string, carYear: string, description: string): Promise<Result>;
    createCarMeet(title: string, location: Location, date: Time, description: string, category: MeetCategory): Promise<CarMeet>;
    createListing(title: string, description: string, make: string, model: string, year: string, price: string, condition: string, imageUrl: string, category: string): Promise<Result>;
    createMechanicsPost(title: string, description: string, category: string): Promise<MechanicsPost>;
    createUser(username: string, bio: string, avatar: ExternalBlob, avatarUrl: string): Promise<UserProfile>;
    deactivateListing(id: bigint): Promise<Result>;
    deleteBuildLog(id: bigint): Promise<Result>;
    deleteMechanicsPost(postId: bigint): Promise<void>;
    deleteMessage(otherUser: UserId, messageId: MessageId): Promise<void>;
    deleteUser(userId: UserId): Promise<void>;
    deleteVideo(videoId: VideoId): Promise<void>;
    followUser(followee: UserId): Promise<void>;
    getAllActiveListings(): Promise<Array<Listing>>;
    getAllBuildLogs(): Promise<Array<BuildLog>>;
    getAllCarMeets(): Promise<Array<CarMeet>>;
    getAllMechanicsPosts(): Promise<Array<MechanicsPost>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getAllVideos(): Promise<Array<Video>>;
    getBuildLogById(id: bigint): Promise<BuildLog | null>;
    getBuildLogsByUser(principal: Principal): Promise<Array<BuildLog>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCarMeetById(meetId: CarMeetId): Promise<CarMeet | null>;
    getCarMeetDetails(meetId: CarMeetId): Promise<CarMeetDetails | null>;
    getCarMeetsByCategory(category: MeetCategory): Promise<Array<CarMeet>>;
    getCarMeetsByOrganizer(organizer: UserId): Promise<Array<CarMeet>>;
    getChallengesForUser(principal: Principal): Promise<Array<RacingChallenge>>;
    getChallengesForVideo(videoId: bigint): Promise<Array<RacingChallenge>>;
    getComments(videoId: VideoId): Promise<Array<Comment>>;
    getConversation(otherUser: UserId): Promise<Array<DirectMessage>>;
    getInbox(): Promise<Array<ConversationSummary>>;
    getListingById(id: bigint): Promise<Listing | null>;
    getListingsBySeller(principal: Principal): Promise<Array<Listing>>;
    getMechanicsPostById(postId: bigint): Promise<MechanicsPost | null>;
    getNotifications(): Promise<Array<Notification>>;
    getOwnProfile(): Promise<UserProfile>;
    getProfile(userId: UserId): Promise<UserProfile>;
    getReactionCounts(videoId: VideoId): Promise<Array<[ReactionType, bigint]>>;
    getSavedVideos(): Promise<Array<Video>>;
    getTrendingVideos(): Promise<Array<Video>>;
    getUnreadNotificationCount(): Promise<bigint>;
    getUserBadges(principal: Principal): Promise<Array<Badge>>;
    getUserProfile(userId: UserId): Promise<UserProfile | null>;
    getUserStats(principal: Principal): Promise<UserStats>;
    getVideo(videoId: VideoId): Promise<Video>;
    getVideoById(videoId: VideoId): Promise<Video | null>;
    getVideosByCategory(category: Category): Promise<Array<Video>>;
    getVideosByHashtag(hashtag: Hashtag): Promise<Array<Video>>;
    incrementViewCount(videoId: VideoId): Promise<void>;
    isAdmin(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    joinCarMeet(meetId: CarMeetId): Promise<CarMeet>;
    leaveCarMeet(meetId: CarMeetId): Promise<CarMeet>;
    markAllNotificationsRead(): Promise<Result>;
    markAsRead(otherUser: UserId, messageId: MessageId): Promise<void>;
    markNotificationRead(notifId: bigint): Promise<Result>;
    postChallenge(originalVideoId: bigint, responseVideoId: bigint, challengedPrincipal: Principal): Promise<Result>;
    removeReaction(videoId: VideoId): Promise<Result>;
    saveCallerUserProfile(username: string, bio: string, avatar: ExternalBlob, avatarUrl: string): Promise<void>;
    saveVideo(videoId: bigint): Promise<Result>;
    sendMessage(toUser: UserId, text: string): Promise<MessageId>;
    setVerified(targetPrincipal: Principal, verified: boolean): Promise<Result>;
    toggleLike(videoId: VideoId): Promise<Video>;
    unfollowUser(followee: UserId): Promise<void>;
    unsaveVideo(videoId: bigint): Promise<Result>;
    updateAvatar(avatarUrl: string): Promise<UserProfile>;
    updateProfile(username: string, bio: string, avatar: ExternalBlob, avatarUrl: string): Promise<UserProfile>;
    uploadVideo(title: string, description: string, hashtags: Array<Hashtag>, category: Category, thumbnail: ExternalBlob, videoUrl: ExternalBlob): Promise<Video>;
}
