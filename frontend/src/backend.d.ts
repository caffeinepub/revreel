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
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
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
    isCallerAdmin(): Promise<boolean>;
    /**
     * / Save (create or update) the caller's own profile. Only registered users can save profiles.
     */
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
