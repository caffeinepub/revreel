import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Set "mo:core/Set";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";

actor {
  type UserId = Principal;
  type VideoId = Text;
  type CommentId = Nat;
  type Hashtag = Text;
  type Category = Text;
  type CarMeetId = Text;
  type MeetCategory = Text;
  type Location = Text;

  // Mixins
  include MixinStorage();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let hardcodedAdmin = Principal.fromText("2keph-5zs2f-rhhy2-nidwx-pbnpp-yo7mc-yt3ce-qnwjp-23mpl-ikczg-iae");

  func checkIsAdmin(caller : Principal) : Bool {
    if (caller == hardcodedAdmin) { return true };
    AccessControl.isAdmin(accessControlState, caller);
  };

  func checkIsUser(caller : Principal) : Bool {
    if (caller == hardcodedAdmin) { return true };
    AccessControl.hasPermission(accessControlState, caller, #user);
  };

  public type Badge = {
    #driftKing;
    #mechanicPro;
    #dragRacer;
    #communityHelper;
    #verified;
    #buildMaster;
    #racingLegend;
  };

  public type ReactionType = {
    #like;
    #fire;
    #hype;
    #respect;
    #wild;
  };

  public type UserProfile = {
    id : UserId;
    username : Text;
    bio : Text;
    avatar : Storage.ExternalBlob;
    avatarUrl : Text;
    verified : Bool;
    badges : [Badge];
    savedVideos : [Nat];
    joinedAt : Int;
  };

  public type Video = {
    id : VideoId;
    title : Text;
    description : Text;
    uploader : UserId;
    likes : [UserId];
    comments : [Comment];
    hashtags : [Hashtag];
    category : Category;
    timestamp : Time.Time;
    thumbnail : Storage.ExternalBlob;
    mediaUrl : Storage.ExternalBlob;
    reactions : [(UserId, ReactionType)];
    viewCount : Nat;
    mediaType : { #video; #photo };
  };

  type InternalUser = {
    profile : UserProfile;
    followers : Set.Set<UserId>;
    following : Set.Set<UserId>;
  };

  public type Comment = {
    id : CommentId;
    videoId : VideoId;
    authorId : UserId;
    text : Text;
    timestamp : Time.Time;
    authorName : Text;
  };

  public type CarMeet = {
    id : CarMeetId;
    title : Text;
    location : Location;
    date : Time.Time;
    description : Text;
    organizer : UserId;
    attendees : [UserId];
    category : MeetCategory;
    createdAt : Time.Time;
  };

  public type CarMeetDetails = {
    id : CarMeetId;
    title : Text;
    location : Location;
    date : Time.Time;
    description : Text;
    organizer : ?UserProfile;
    attendees : [UserProfile];
    category : MeetCategory;
    createdAt : Time.Time;
  };

  public type MechanicsComment = {
    id : CommentId;
    postId : Nat;
    authorId : UserId;
    text : Text;
    timestamp : Time.Time;
  };

  public type MechanicsPost = {
    id : Nat;
    title : Text;
    description : Text;
    author : UserId;
    category : Text;
    createdAt : Time.Time;
    comments : [MechanicsComment];
  };

  type MessageId = Nat;
  public type DirectMessage = {
    id : MessageId;
    fromUser : UserId;
    toUser : UserId;
    text : Text;
    timestamp : Time.Time;
    isRead : Bool;
  };

  public type ConversationSummary = {
    otherUser : UserId;
    lastMessage : DirectMessage;
    unreadCount : Nat;
  };

  public type Notification = {
    id : Nat;
    recipientId : UserId;
    senderId : UserId;
    notificationType : Text;
    referenceId : Text;
    message : Text;
    isRead : Bool;
    createdAt : Int;
  };

  public type BuildStage = {
    id : Nat;
    title : Text;
    description : Text;
    imageUrl : Text;
    createdAt : Int;
  };

  public type BuildLog = {
    id : Nat;
    title : Text;
    authorId : UserId;
    carMake : Text;
    carModel : Text;
    carYear : Text;
    description : Text;
    stages : [BuildStage];
    createdAt : Int;
    updatedAt : Int;
  };

  public type Listing = {
    id : Nat;
    title : Text;
    description : Text;
    sellerId : UserId;
    make : Text;
    model : Text;
    year : Text;
    price : Text;
    condition : Text;
    imageUrl : Text;
    category : Text;
    createdAt : Int;
    isActive : Bool;
  };

  public type RacingChallenge = {
    id : Nat;
    challengerId : UserId;
    challengedId : UserId;
    videoId : Nat;
    originalVideoId : Nat;
    status : Text;
    createdAt : Int;
  };

  public type UserStats = {
    totalVideos : Nat;
    totalViews : Nat;
    totalLikes : Nat;
    totalComments : Nat;
    totalFollowers : Nat;
    totalFollowing : Nat;
    totalBuildLogs : Nat;
    joinedAt : Int;
  };

  public type Result = {
    #ok : Text;
    #err : Text;
  };

  module Video {
    public func compare(video1 : Video, video2 : Video) : Order.Order {
      Int.compare(video2.timestamp, video1.timestamp);
    };
  };

  module CarMeet {
    public func compare(meet1 : CarMeet, meet2 : CarMeet) : Order.Order {
      Int.compare(meet2.date, meet1.date);
    };
  };

  module DirectMessage {
    public func compare(a : DirectMessage, b : DirectMessage) : Order.Order {
      Int.compare(b.timestamp, a.timestamp);
    };
  };

  let videos = Map.empty<VideoId, Video>();
  let users = Map.empty<UserId, InternalUser>();
  let comments = Map.empty<VideoId, Map.Map<CommentId, Comment>>();
  let carMeets = Map.empty<CarMeetId, CarMeet>();
  let mechanicsPosts = Map.empty<Nat, MechanicsPost>();
  let messages = Map.empty<UserId, Map.Map<UserId, Map.Map<MessageId, DirectMessage>>>();
  let notifications = Map.empty<Nat, Notification>();
  let buildLogs = Map.empty<Nat, BuildLog>();
  let listings = Map.empty<Nat, Listing>();
  let racingChallenges = Map.empty<Nat, RacingChallenge>();

  var nextPostId : Nat = 0;
  var nextCommentId : Nat = 0;
  var nextMessageId : Nat = 0;
  var nextNotificationId : Nat = 0;
  var nextBuildLogId : Nat = 0;
  var nextBuildStageId : Nat = 0;
  var nextListingId : Nat = 0;
  var nextChallengeId : Nat = 0;

  func createNotificationInternal(
    recipientId : UserId,
    senderId : UserId,
    notificationType : Text,
    referenceId : Text,
    message : Text,
  ) {
    if (recipientId == senderId) { return };
    let notifId = nextNotificationId;
    nextNotificationId += 1;
    let notif : Notification = {
      id = notifId;
      recipientId;
      senderId;
      notificationType;
      referenceId;
      message;
      isRead = false;
      createdAt = Time.now();
    };
    notifications.add(notifId, notif);
  };

  func checkAndAwardMechanicsBadges(userId : UserId) {
    switch (users.get(userId)) {
      case (null) { return };
      case (?user) {
        let postCount = mechanicsPosts.values().filter(func(p) { p.author == userId }).size();
        var commentCount = 0;
        mechanicsPosts.values().forEach(func(p) {
          commentCount += p.comments.filter(func(c) { c.authorId == userId }).size();
        });
        var newBadges = user.profile.badges;
        if (postCount >= 5 and not newBadges.any(func(b) { b == #communityHelper })) {
          newBadges := newBadges.concat([#communityHelper]);
        };
        if (commentCount >= 10 and not newBadges.any(func(b) { b == #mechanicPro })) {
          newBadges := newBadges.concat([#mechanicPro]);
        };
        if (newBadges.size() != user.profile.badges.size()) {
          let updatedProfile : UserProfile = { user.profile with badges = newBadges };
          let updatedUser : InternalUser = { user with profile = updatedProfile };
          users.add(userId, updatedUser);
        };
      };
    };
  };

  // Get the caller's own profile. Requires the caller to be a registered user.
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    users.get(caller).map(func(u) { u.profile });
  };

  // Save (create or update) the caller's own profile. Requires the caller to be a registered user.
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can save their profile");
    };
    // Ensure the profile id matches the caller
    let profileWithCorrectId : UserProfile = { profile with id = caller };
    switch (users.get(caller)) {
      case (null) {
        // New user: create with empty followers/following
        let newUser : InternalUser = {
          profile = profileWithCorrectId;
          followers = Set.empty<UserId>();
          following = Set.empty<UserId>();
        };
        users.add(caller, newUser);
      };
      case (?existingUser) {
        // Existing user: preserve followers/following, update profile
        let updatedUser : InternalUser = {
          existingUser with profile = profileWithCorrectId
        };
        users.add(caller, updatedUser);
      };
    };
  };

  // Get any user's profile by principal. Caller must be the same user or an admin.
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not checkIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    users.get(user).map(func(u) { u.profile });
  };
};
