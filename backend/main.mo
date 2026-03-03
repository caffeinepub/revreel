import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Set "mo:core/Set";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
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
  type VideoMap = Map.Map<VideoId, Video>;
  type CommentMap = Map.Map<CommentId, Comment>;

  // Mixins
  include MixinStorage();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let hardcodedAdmin = Principal.fromText("2keph-5zs2e-fhhy2-nidwx-pbnpp-yo7mc-yt3ce-qnwjp-23mpl-ikczg-iae");

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
    reactions : [Reaction];
    viewCount : Nat;
    mediaType : { #video; #photo };
  };

  public type Reaction = {
    user : UserId;
    reactionType : ReactionType;
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

  public type ProfileResult = {
    #ok : UserProfile;
    #unauthorized : Text;
    #notFound : Text;
  };

  /// Generic result type for common success/error handling patterns.
  public type Result = {
    #ok : Text;
    #notFound : Text;
    #unauthorized : Text;
    #internalError : Text;
  };

  public type UploadResponse = {
    #ok : { blob : Storage.ExternalBlob };
    #error : Text;
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
  let comments = Map.empty<VideoId, CommentMap>();
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
  var nextVideoId : Nat = 0;

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

  /// Get the caller's own profile. Returns \`#unauthorized\` if the caller is not a registered user,
  /// and \`#notFound\` if the profile does not exist.
  public query ({ caller }) func getCallerUserProfile() : async ProfileResult {
    if (not checkIsUser(caller)) {
      return #unauthorized("Only registered users can get their profile");
    };
    switch (users.get(caller)) {
      case (null) { #notFound("Profile not found") };
      case (?user) { #ok(user.profile) };
    };
  };

  /// Save (create or update) the caller's own profile. Only registered users can save profiles.
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
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

  /// Get any user's public profile by principal.
  /// Any caller (including guests) can view public profiles, which is required for
  /// social features such as leaderboards, car meets, challenges, and follower lists.
  public query ({ caller }) func getUserProfile(user : Principal) : async ProfileResult {
    switch (users.get(user)) {
      case (null) { #notFound("Profile not found") };
      case (?u) { #ok(u.profile) };
    };
  };

  /// Upload a blob (photo or video) and return its canister path.
  /// Only registered users are allowed to upload blobs.
  public shared ({ caller }) func uploadBlob(blob : Storage.ExternalBlob) : async UploadResponse {
    if (not checkIsUser(caller)) {
      return #error("Unauthorized: Only registered users can upload content");
    };
    #ok { blob };
  };

  /// Create a video post. Only registered users can upload content.
  public shared ({ caller }) func createVideo(
    title : Text,
    description : Text,
    category : Text,
    hashtags : [Hashtag],
    video : Storage.ExternalBlob,
    thumbnail : Storage.ExternalBlob,
    mediaType : { #video; #photo }
  ) : async Result {
    if (not checkIsUser(caller)) {
      return #unauthorized("Unauthorized: Only users can upload content");
    };
    // Assign unique video ID (incremental)
    let id = nextVideoId.toText();
    nextVideoId += 1;

    let videoRecord : Video = {
      id;
      title;
      description;
      uploader = caller;
      likes = [];
      comments = [];
      hashtags;
      category;
      timestamp = Time.now();
      thumbnail;
      mediaUrl = video;
      reactions = [];
      viewCount = 0;
      mediaType;
    };

    videos.add(id, videoRecord);
    #ok(id);
  };

  /// Get all videos. Accessible to any caller including guests (public feed).
  public query ({ caller }) func getVideos() : async [Video] {
    videos.values().toArray();
  };

  /// Delete a reel (video or photo) by its owner or an admin.
  /// Only the owner or an admin can delete a reel.
  public shared ({ caller }) func deleteReel(reelId : Text) : async Result {
    if (not checkIsUser(caller) and not checkIsAdmin(caller)) {
      return #unauthorized("Unauthorized: Only registered users can delete reels");
    };
    switch (videos.get(reelId)) {
      case (null) { #notFound("Reel not found") };
      case (?video) {
        if (video.uploader != caller and not checkIsAdmin(caller)) {
          return #unauthorized("Not authorized to delete this reel");
        };
        videos.remove(reelId);
        #ok("Reel deleted");
      };
    };
  };

  /// Get all reels (videos/photos) for a specific user.
  /// Accessible to any caller including guests (public profile viewing).
  public query ({ caller }) func getUserReels(userId : UserId) : async [Video] {
    videos.values().filter(
      func(video) { video.uploader == userId }
    ).toArray();
  };

  /// Add a comment to a video. Only registered users can comment.
  public shared ({ caller }) func addComment(videoId : VideoId, text : Text) : async Result {
    if (not checkIsUser(caller)) {
      return #unauthorized("Unauthorized: Only registered users can add comments");
    };

    switch (videos.get(videoId)) {
      case (null) { #notFound("Video not found") };
      case (?video) {
        let commentId = nextCommentId;
        nextCommentId += 1;
        let authorName = switch (users.get(caller)) {
          case (?u) { u.profile.username };
          case (null) { "Anonymous" };
        };
        let newComment : Comment = {
          id = commentId;
          videoId;
          authorId = caller;
          text;
          timestamp = Time.now();
          authorName;
        };

        let videoComments = switch (comments.get(videoId)) {
          case (null) {
            let newComments = Map.empty<CommentId, Comment>();
            newComments.add(commentId, newComment);
            newComments;
          };
          case (?existingComments) {
            existingComments.add(commentId, newComment);
            existingComments;
          };
        };

        comments.add(videoId, videoComments);

        let allComments = videoComments.values().toArray();
        let updatedVideo : Video = { video with comments = allComments };
        videos.add(videoId, updatedVideo);

        #ok("Comment added");
      };
    };
  };

  /// Get comments for a video. Accessible to any caller including guests.
  public query ({ caller }) func getComments(videoId : VideoId) : async [Comment] {
    switch (comments.get(videoId)) {
      case (null) { [] };
      case (?videoComments) {
        videoComments.values().toArray();
      };
    };
  };

  /// Like/unlike video with toggle endpoint. Only registered users can like/unlike.
  public shared ({ caller }) func toggleLike(videoId : VideoId) : async Result {
    if (not checkIsUser(caller)) {
      return #unauthorized("Unauthorized: Only registered users can like/unlike videos");
    };

    switch (videos.get(videoId)) {
      case (null) { #notFound("Video not found") };
      case (?video) {
        let hasLiked = video.likes.any(func(l) { l == caller });
        let newLikes = if (hasLiked) {
          video.likes.filter(func(l) { l != caller });
        } else {
          video.likes.concat([caller]);
        };
        let updatedVideo : Video = { video with likes = newLikes };
        videos.add(videoId, updatedVideo);
        #ok("Like state toggled");
      };
    };
  };

  /// Get the inbox (conversation summaries) for the caller.
  /// Only registered users can access their inbox.
  public query ({ caller }) func getInbox() : async [ConversationSummary] {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can get their inbox");
    };
    switch (messages.get(caller)) {
      case (null) { [] };
      case (?userMessages) {
        userMessages.toArray().map(
          func((otherUser, _conversation)) {
            getConversationSummaryInternal(caller, otherUser)
          }
        );
      };
    };
  };

  /// Get the conversation between the caller and a recipient.
  /// Only registered users can access their conversations.
  /// Only the caller's own conversation is accessible (ownership enforced by using caller as key).
  public query ({ caller }) func getConversation(recipient : Principal) : async [DirectMessage] {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can get their conversations");
    };

    switch (messages.get(caller)) {
      case (null) { [] };
      case (?userMessages) {
        switch (userMessages.get(recipient)) {
          case (null) { [] };
          case (?conversation) {
            conversation.values().toArray();
          };
        };
      };
    };
  };

  func getConversationSummaryInternal(user : Principal, otherUser : Principal) : ConversationSummary {
    var lastMessage : DirectMessage = {
      id = 0;
      fromUser = user;
      toUser = otherUser;
      text = "";
      timestamp = 0;
      isRead = true;
    };
    var unreadCount : Nat = 0;
    switch (messages.get(user)) {
      case (?userMessages) {
        switch (userMessages.get(otherUser)) {
          case (?conversation) {
            conversation.values().forEach(func(message) {
              if (message.timestamp > lastMessage.timestamp) {
                lastMessage := message;
              };
              if (not message.isRead and message.toUser == user) { unreadCount += 1 };
            });
          };
          case (null) {};
        };
      };
      case (null) {};
    };
    {
      otherUser;
      lastMessage;
      unreadCount;
    };
  };

  /// Send a direct message to a recipient.
  /// Only registered users can send messages.
  public shared ({ caller }) func sendMessage(recipient : Principal, text : Text) : async () {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can send messages");
    };

    let messageId = nextMessageId;
    nextMessageId += 1;

    let message : DirectMessage = {
      id = messageId;
      fromUser = caller;
      toUser = recipient;
      text;
      timestamp = Time.now();
      isRead = false;
    };

    // Store message in recipient's inbox (keyed by sender = caller)
    let receiverMessages = switch (messages.get(recipient)) {
      case (null) {
        let newUserMessages = Map.empty<UserId, Map.Map<MessageId, DirectMessage>>();
        newUserMessages;
      };
      case (?userMessages) { userMessages };
    };

    switch (receiverMessages.get(caller)) {
      case (null) {
        let newConversation = Map.empty<MessageId, DirectMessage>();
        newConversation.add(messageId, message);
        receiverMessages.add(caller, newConversation);
      };
      case (?existingConversation) {
        existingConversation.add(messageId, message);
      };
    };

    messages.add(recipient, receiverMessages);

    // Store message in sender's outbox (keyed by recipient)
    let senderMessages = switch (messages.get(caller)) {
      case (null) {
        let newUserMessages = Map.empty<UserId, Map.Map<MessageId, DirectMessage>>();
        newUserMessages;
      };
      case (?userMessages) { userMessages };
    };

    switch (senderMessages.get(recipient)) {
      case (null) {
        let newConversation = Map.empty<MessageId, DirectMessage>();
        newConversation.add(messageId, message);
        senderMessages.add(recipient, newConversation);
      };
      case (?existingConversation) {
        existingConversation.add(messageId, message);
      };
    };
    messages.add(caller, senderMessages);
  };

  /// Mark all messages from a sender as read for the caller.
  /// Only registered users can mark messages as read.
  /// Only the caller's own messages can be marked as read (ownership enforced by using caller as key).
  public shared ({ caller }) func markMessagesRead(sender : Principal) : async () {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can mark messages as read");
    };

    switch (messages.get(caller)) {
      case (null) { () };
      case (?userMessages) {
        switch (userMessages.get(sender)) {
          case (null) { () };
          case (?conversation) {
            let unreadMessageIds = conversation.toArray().filter(
              func((_, m)) { not m.isRead }
            ).map(
              func((id, _)) { id }
            );
            for (id in unreadMessageIds.values()) {
              switch (conversation.get(id)) {
                case (null) {};
                case (?msg) {
                  let updatedMessage = { msg with isRead = true };
                  conversation.add(id, updatedMessage);
                };
              };
            };
          };
        };
      };
    };
  };

  /// Get the unread message count for a conversation with another user.
  /// Only registered users can query their own unread message counts.
  public query ({ caller }) func getUnreadMessagesCount(otherUser : Principal) : async Nat {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can get unread message counts");
    };
    switch (messages.get(caller)) {
      case (null) { 0 };
      case (?userMessages) {
        switch (userMessages.get(otherUser)) {
          case (null) { 0 };
          case (?conversation) {
            conversation.values().filter(
              func(m) { not m.isRead and m.toUser == caller }
            ).size();
          };
        };
      };
    };
  };

  /// Delete a conversation with another user.
  /// Only registered users can delete their own conversations.
  /// Only the caller's own conversation copy is deleted (ownership enforced by using caller as key).
  public shared ({ caller }) func deleteConversation(otherUser : Principal) : async () {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can delete conversations");
    };

    switch (messages.get(caller)) {
      case (null) {};
      case (?userMessages) {
        switch (userMessages.get(otherUser)) {
          case (null) {};
          case (?_) {
            userMessages.remove(otherUser);
          };
        };
      };
    };
  };

};
