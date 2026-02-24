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
    videoUrl : Storage.ExternalBlob;
    reactions : [(UserId, ReactionType)];
    viewCount : Nat;
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

  public query ({ caller }) func isAdmin() : async Bool {
    checkIsAdmin(caller);
  };

  public shared ({ caller }) func deleteUser(userId : UserId) : async () {
    if (not checkIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete users");
    };
    users.remove(userId);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    users.get(caller).map(func(user) { user.profile });
  };

  public shared ({ caller }) func saveCallerUserProfile(username : Text, bio : Text, avatar : Storage.ExternalBlob, avatarUrl : Text) : async () {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let now = Time.now();
    switch (users.get(caller)) {
      case (null) {
        let newProfile : UserProfile = {
          id = caller;
          username;
          bio;
          avatar;
          avatarUrl;
          verified = false;
          badges = [];
          savedVideos = [];
          joinedAt = now;
        };
        let internalUser : InternalUser = {
          profile = newProfile;
          followers = Set.empty<UserId>();
          following = Set.empty<UserId>();
        };
        users.add(caller, internalUser);
      };
      case (?user) {
        let updatedProfile : UserProfile = {
          user.profile with
          username;
          bio;
          avatar;
          avatarUrl;
        };
        let updatedUser : InternalUser = { user with profile = updatedProfile };
        users.add(caller, updatedUser);
      };
    };
  };

  public query ({ caller }) func getUserProfile(userId : UserId) : async ?UserProfile {
    // Anyone can view a user profile
    users.get(userId).map(func(user) { user.profile });
  };

  public shared ({ caller }) func updateAvatar(avatarUrl : Text) : async UserProfile {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can update their avatar");
    };
    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        let updatedProfile : UserProfile = { user.profile with avatarUrl };
        let updatedUser : InternalUser = { user with profile = updatedProfile };
        users.add(caller, updatedUser);
        updatedProfile;
      };
    };
  };

  public shared ({ caller }) func createUser(username : Text, bio : Text, avatar : Storage.ExternalBlob, avatarUrl : Text) : async UserProfile {
    if (users.containsKey(caller)) {
      return switch (users.get(caller)) {
        case (?u) { u.profile };
        case (null) { Runtime.trap("Unexpected error") };
      };
    };
    let now = Time.now();
    let newProfile : UserProfile = {
      id = caller;
      username;
      bio;
      avatar;
      avatarUrl;
      verified = false;
      badges = [];
      savedVideos = [];
      joinedAt = now;
    };
    let internalUser : InternalUser = {
      profile = newProfile;
      followers = Set.empty<UserId>();
      following = Set.empty<UserId>();
    };
    users.add(caller, internalUser);
    newProfile;
  };

  public query ({ caller }) func getOwnProfile() : async UserProfile {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can get their own profile");
    };
    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) { user.profile };
    };
  };

  public query ({ caller }) func getProfile(userId : UserId) : async UserProfile {
    // Anyone can view profiles
    switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) { user.profile };
    };
  };

  public shared ({ caller }) func updateProfile(username : Text, bio : Text, avatar : Storage.ExternalBlob, avatarUrl : Text) : async UserProfile {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can update their profile");
    };
    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        let updatedProfile : UserProfile = {
          user.profile with
          username;
          bio;
          avatar;
          avatarUrl;
        };
        let updatedUser : InternalUser = { user with profile = updatedProfile };
        users.add(caller, updatedUser);
        updatedProfile;
      };
    };
  };

  public shared ({ caller }) func uploadVideo(
    title : Text,
    description : Text,
    hashtags : [Hashtag],
    category : Category,
    thumbnail : Storage.ExternalBlob,
    videoUrl : Storage.ExternalBlob,
  ) : async Video {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can upload videos");
    };
    let videoId = Time.now().toText();
    let newVideo : Video = {
      id = videoId;
      title;
      description;
      uploader = caller;
      likes = [];
      comments = [];
      hashtags;
      category;
      timestamp = Time.now();
      thumbnail;
      videoUrl;
      reactions = [];
      viewCount = 0;
    };
    videos.add(videoId, newVideo);
    newVideo;
  };

  public shared ({ caller }) func deleteVideo(videoId : VideoId) : async () {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can delete videos");
    };
    switch (videos.get(videoId)) {
      case (null) { return };
      case (?video) {
        if (caller != video.uploader and not checkIsAdmin(caller)) {
          Runtime.trap("Unauthorized: Only the uploader or admin can delete this video");
        };
        videos.remove(videoId);
        comments.remove(videoId);
      };
    };
  };

  public query ({ caller }) func getVideo(videoId : VideoId) : async Video {
    // Anyone can view a video
    switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) { video };
    };
  };

  public shared ({ caller }) func incrementViewCount(videoId : VideoId) : async () {
    // Anyone can increment view count (no auth required)
    switch (videos.get(videoId)) {
      case (null) { return };
      case (?video) {
        let updatedVideo : Video = { video with viewCount = video.viewCount + 1 };
        videos.add(videoId, updatedVideo);
      };
    };
  };

  public query ({ caller }) func getVideoById(videoId : VideoId) : async ?Video {
    // Anyone can view a video
    videos.get(videoId);
  };

  public query ({ caller }) func getAllVideos() : async [Video] {
    // Anyone can list videos
    videos.values().toArray().sort();
  };

  public query ({ caller }) func getVideosByCategory(category : Category) : async [Video] {
    // Anyone can list videos by category
    videos.values().filter(
      func(video) {
        video.category == category;
      }
    ).toArray().sort();
  };

  public query ({ caller }) func getVideosByHashtag(hashtag : Hashtag) : async [Video] {
    // Anyone can list videos by hashtag
    videos.values().filter(
      func(video) {
        video.hashtags.any(func(h) { h == hashtag });
      }
    ).toArray().sort();
  };

  public shared ({ caller }) func toggleLike(videoId : VideoId) : async Video {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can like videos");
    };
    switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) {
        let alreadyLiked = video.likes.any(func(like) { like == caller });
        let updatedLikes = if (alreadyLiked) {
          video.likes.filter(func(like) { like != caller });
        } else {
          video.likes.concat([caller]);
        };
        let updatedVideo : Video = { video with likes = updatedLikes };
        videos.add(videoId, updatedVideo);
        if (not alreadyLiked) {
          createNotificationInternal(
            video.uploader,
            caller,
            "like",
            videoId,
            "Someone liked your video",
          );
        };
        updatedVideo;
      };
    };
  };

  public shared ({ caller }) func addReaction(videoId : VideoId, reaction : ReactionType) : async Result {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can react to videos");
    };
    switch (videos.get(videoId)) {
      case (null) { return #err("Video not found") };
      case (?video) {
        let filteredReactions = video.reactions.filter(func(r) { r.0 != caller });
        let updatedReactions = filteredReactions.concat([(caller, reaction)]);
        let updatedVideo : Video = { video with reactions = updatedReactions };
        videos.add(videoId, updatedVideo);
        createNotificationInternal(
          video.uploader,
          caller,
          "reaction",
          videoId,
          "Someone reacted to your video",
        );
        #ok("Reaction added");
      };
    };
  };

  public shared ({ caller }) func removeReaction(videoId : VideoId) : async Result {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can remove reactions");
    };
    switch (videos.get(videoId)) {
      case (null) { return #err("Video not found") };
      case (?video) {
        let updatedReactions = video.reactions.filter(func(r) { r.0 != caller });
        let updatedVideo : Video = { video with reactions = updatedReactions };
        videos.add(videoId, updatedVideo);
        #ok("Reaction removed");
      };
    };
  };

  public query ({ caller }) func getReactionCounts(videoId : VideoId) : async [(ReactionType, Nat)] {
    // Anyone can view reaction counts
    switch (videos.get(videoId)) {
      case (null) { [] };
      case (?video) {
        let likeCount = video.reactions.filter(func(r) { r.1 == #like }).size();
        let fireCount = video.reactions.filter(func(r) { r.1 == #fire }).size();
        let hypeCount = video.reactions.filter(func(r) { r.1 == #hype }).size();
        let respectCount = video.reactions.filter(func(r) { r.1 == #respect }).size();
        let wildCount = video.reactions.filter(func(r) { r.1 == #wild }).size();
        [(#like, likeCount), (#fire, fireCount), (#hype, hypeCount), (#respect, respectCount), (#wild, wildCount)];
      };
    };
  };

  public shared ({ caller }) func addComment(videoId : VideoId, text : Text) : async () {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can comment on videos");
    };
    if (not videos.containsKey(videoId)) {
      return;
    };
    let commentId = nextCommentId;
    nextCommentId += 1;
    let newComment : Comment = {
      id = commentId;
      videoId;
      authorId = caller;
      text;
      timestamp = Time.now();
    };
    let existingComments = switch (comments.get(videoId)) {
      case (?existing) { existing };
      case (null) { Map.empty<CommentId, Comment>() };
    };
    existingComments.add(commentId, newComment);
    comments.add(videoId, existingComments);

    switch (videos.get(videoId)) {
      case (null) {};
      case (?video) {
        createNotificationInternal(
          video.uploader,
          caller,
          "comment",
          videoId,
          "Someone commented on your video",
        );

        let words = text.split(#text " ");
        words.forEach(func(word) {
          if (word.size() > 1 and word.startsWith(#text "@")) {
            let mentionedUsername = word.toArray().sliceToArray(1, word.size()).toText();
            users.entries().forEach(func(entry) {
              let (uid, u) = entry;
              if (u.profile.username == mentionedUsername) {
                createNotificationInternal(
                  uid,
                  caller,
                  "mention",
                  videoId,
                  "You were mentioned in a comment",
                );
              };
            });
          };
        });
      };
    };
  };

  public query ({ caller }) func getComments(videoId : VideoId) : async [Comment] {
    // Anyone can view comments
    switch (comments.get(videoId)) {
      case (null) { [] };
      case (?commentMap) { commentMap.values().toArray() };
    };
  };

  public shared ({ caller }) func followUser(followee : UserId) : async () {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can follow others");
    };
    if (followee == caller) {
      return;
    };
    let followerUserOpt = users.get(caller);
    let followeeUserOpt = users.get(followee);
    switch (followerUserOpt, followeeUserOpt) {
      case (null, _) { return };
      case (_, null) { return };
      case (?followerUser, ?followeeUser) {
        let updatedFollowerFollowing = Set.empty<UserId>();
        followerUser.following.values().forEach(func(followingUser) { updatedFollowerFollowing.add(followingUser) });
        updatedFollowerFollowing.add(followee);
        let updatedFollowerUser : InternalUser = { followerUser with following = updatedFollowerFollowing };
        let updatedFolloweeFollowers = Set.empty<UserId>();
        followeeUser.followers.values().forEach(func(follower) { updatedFolloweeFollowers.add(follower) });
        updatedFolloweeFollowers.add(caller);
        let updatedFolloweeUser : InternalUser = { followeeUser with followers = updatedFolloweeFollowers };
        users.add(caller, updatedFollowerUser);
        users.add(followee, updatedFolloweeUser);
        createNotificationInternal(
          followee,
          caller,
          "follow",
          caller.toText(),
          "Someone started following you",
        );
      };
    };
  };

  public shared ({ caller }) func unfollowUser(followee : UserId) : async () {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can unfollow others");
    };
    switch (users.get(caller), users.get(followee)) {
      case (null, _) { return };
      case (_, null) { return };
      case (?followerUser, ?followeeUser) {
        let updatedFollowerFollowing = Set.empty<UserId>();
        followerUser.following.values().forEach(func(followingUser) { updatedFollowerFollowing.add(followingUser) });
        updatedFollowerFollowing.remove(followee);
        let updatedFollowerUser : InternalUser = { followerUser with following = updatedFollowerFollowing };
        let updatedFolloweeFollowers = Set.empty<UserId>();
        followeeUser.followers.values().forEach(func(follower) { updatedFolloweeFollowers.add(follower) });
        updatedFolloweeFollowers.remove(caller);
        let updatedFolloweeUser : InternalUser = { followeeUser with followers = updatedFolloweeFollowers };
        users.add(caller, updatedFollowerUser);
        users.add(followee, updatedFolloweeUser);
      };
    };
  };

  public query ({ caller }) func getTrendingVideos() : async [Video] {
    // Anyone can view trending videos
    let allVideos = videos.values().toArray();
    let sortedVideos = allVideos.sort(
      func(a, b) {
        if (a.likes.size() < b.likes.size()) {
          #greater;
        } else if (a.likes.size() > b.likes.size()) {
          #less;
        } else {
          #equal;
        };
      }
    );
    if (sortedVideos.size() <= 10) {
      sortedVideos;
    } else {
      sortedVideos.sliceToArray(0, 10);
    };
  };

  public shared ({ caller }) func createCarMeet(
    title : Text,
    location : Location,
    date : Time.Time,
    description : Text,
    category : MeetCategory,
  ) : async CarMeet {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can create car meets");
    };
    let meetId = Time.now().toText();
    let newMeet : CarMeet = {
      id = meetId;
      title;
      location;
      date;
      description;
      organizer = caller;
      attendees = [caller];
      category;
      createdAt = Time.now();
    };
    carMeets.add(meetId, newMeet);
    newMeet;
  };

  public shared ({ caller }) func joinCarMeet(meetId : CarMeetId) : async CarMeet {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can join car meets");
    };
    switch (carMeets.get(meetId)) {
      case (null) { Runtime.trap("Car meet not found") };
      case (?meet) {
        let alreadyAttending = meet.attendees.any(func(a) { a == caller });
        if (alreadyAttending) { return meet };
        let updatedAttendees = meet.attendees.concat([caller]);
        let updatedMeet : CarMeet = { meet with attendees = updatedAttendees };
        carMeets.add(meetId, updatedMeet);
        updatedMeet;
      };
    };
  };

  public shared ({ caller }) func leaveCarMeet(meetId : CarMeetId) : async CarMeet {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can leave car meets");
    };
    switch (carMeets.get(meetId)) {
      case (null) { Runtime.trap("Car meet not found") };
      case (?meet) {
        let stillAttending = meet.attendees.filter(func(a) { a != caller });
        let updatedMeet : CarMeet = { meet with attendees = stillAttending };
        carMeets.add(meetId, updatedMeet);
        updatedMeet;
      };
    };
  };

  public query ({ caller }) func getAllCarMeets() : async [CarMeet] {
    // Anyone can view car meets
    carMeets.values().toArray().sort();
  };

  public query ({ caller }) func getCarMeetById(meetId : CarMeetId) : async ?CarMeet {
    // Anyone can view a car meet
    carMeets.get(meetId);
  };

  public query ({ caller }) func getCarMeetsByOrganizer(organizer : UserId) : async [CarMeet] {
    // Anyone can view car meets by organizer
    carMeets.values().filter(
      func(meet) {
        meet.organizer == organizer;
      }
    ).toArray().sort();
  };

  public query ({ caller }) func getCarMeetsByCategory(category : MeetCategory) : async [CarMeet] {
    // Anyone can view car meets by category
    carMeets.values().filter(
      func(meet) {
        meet.category == category;
      }
    ).toArray().sort();
  };

  public query ({ caller }) func getCarMeetDetails(meetId : CarMeetId) : async ?CarMeetDetails {
    // Anyone can view car meet details
    carMeets.get(meetId).map(
      func(carMeet) {
        let organizerProfile : ?UserProfile = users.get(carMeet.organizer).map(func(user) { user.profile });
        let attendeeProfiles : [UserProfile] = carMeet.attendees.filterMap(
          func(userId) {
            users.get(userId).map(func(user) { user.profile });
          }
        );
        let details : CarMeetDetails = {
          carMeet with
          organizer = organizerProfile;
          attendees = attendeeProfiles;
          category = carMeet.category;
        };
        details;
      }
    );
  };

  public shared ({ caller }) func createMechanicsPost(
    title : Text,
    description : Text,
    category : Text,
  ) : async MechanicsPost {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can create mechanics posts");
    };
    let postId = nextPostId;
    nextPostId += 1;
    let newPost : MechanicsPost = {
      id = postId;
      title;
      description;
      author = caller;
      category;
      createdAt = Time.now();
      comments = [];
    };
    mechanicsPosts.add(postId, newPost);
    checkAndAwardMechanicsBadges(caller);
    newPost;
  };

  public shared ({ caller }) func addMechanicsComment(postId : Nat, text : Text) : async MechanicsComment {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can comment on mechanics posts");
    };
    let commentId = nextCommentId;
    nextCommentId += 1;
    let newComment : MechanicsComment = {
      id = commentId;
      postId;
      authorId = caller;
      text;
      timestamp = Time.now();
    };
    switch (mechanicsPosts.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        let updatedComments = post.comments.concat([newComment]);
        let updatedPost : MechanicsPost = { post with comments = updatedComments };
        mechanicsPosts.add(postId, updatedPost);
        checkAndAwardMechanicsBadges(caller);
        newComment;
      };
    };
  };

  public shared ({ caller }) func deleteMechanicsPost(postId : Nat) : async () {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can delete mechanics posts");
    };
    switch (mechanicsPosts.get(postId)) {
      case (null) { return };
      case (?post) {
        if (post.author != caller and not checkIsAdmin(caller)) {
          Runtime.trap("Unauthorized: Only the author or admin can delete this post");
        };
        mechanicsPosts.remove(postId);
      };
    };
  };

  public query ({ caller }) func getAllMechanicsPosts() : async [MechanicsPost] {
    // Anyone can view mechanics posts
    mechanicsPosts.values().toArray();
  };

  public query ({ caller }) func getMechanicsPostById(postId : Nat) : async ?MechanicsPost {
    // Anyone can view a mechanics post
    mechanicsPosts.get(postId);
  };

  public shared ({ caller }) func sendMessage(toUser : UserId, text : Text) : async MessageId {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    let messageId = nextMessageId;
    nextMessageId += 1;
    let newMessage : DirectMessage = {
      id = messageId;
      fromUser = caller;
      toUser;
      text;
      timestamp = Time.now();
      isRead = false;
    };
    let senderConversations = switch (messages.get(caller)) {
      case (?existing) { existing };
      case (null) { Map.empty<UserId, Map.Map<MessageId, DirectMessage>>() };
    };
    let senderMessages = switch (senderConversations.get(toUser)) {
      case (?existing) { existing };
      case (null) { Map.empty<MessageId, DirectMessage>() };
    };
    senderMessages.add(messageId, newMessage);
    senderConversations.add(toUser, senderMessages);
    messages.add(caller, senderConversations);
    let receiverConversations = switch (messages.get(toUser)) {
      case (?existing) { existing };
      case (null) { Map.empty<UserId, Map.Map<MessageId, DirectMessage>>() };
    };
    let receiverMessages = switch (receiverConversations.get(caller)) {
      case (?existing) { existing };
      case (null) { Map.empty<MessageId, DirectMessage>() };
    };
    receiverMessages.add(messageId, newMessage);
    receiverConversations.add(caller, receiverMessages);
    messages.add(toUser, receiverConversations);
    createNotificationInternal(
      toUser,
      caller,
      "message",
      messageId.toText(),
      "You have a new message",
    );
    messageId;
  };

  public query ({ caller }) func getConversation(otherUser : UserId) : async [DirectMessage] {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can view conversations");
    };
    switch (messages.get(caller)) {
      case (?conversations) {
        switch (conversations.get(otherUser)) {
          case (?msgs) {
            msgs.values().toArray().sort();
          };
          case (null) { [] };
        };
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getInbox() : async [ConversationSummary] {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can view their inbox");
    };
    switch (messages.get(caller)) {
      case (null) { [] };
      case (?conversations) {
        let otherUsers = conversations.keys().toArray();
        otherUsers.map(
          func(otherUser) {
            switch (conversations.get(otherUser)) {
              case (null) {
                {
                  otherUser;
                  lastMessage = {
                    id = 0;
                    fromUser = caller;
                    toUser = otherUser;
                    text = "";
                    timestamp = 0;
                    isRead = false;
                  };
                  unreadCount = 0;
                };
              };
              case (?msgs) {
                let msgArray = msgs.values().toArray();
                let newestFirst = msgArray.sort();
                let lastMsg = switch (newestFirst[0]) { case (first) { first } };
                let unreadCount = msgArray.filter(func(m) { not m.isRead and m.fromUser != caller }).size();
                {
                  otherUser;
                  lastMessage = lastMsg;
                  unreadCount;
                };
              };
            };
          }
        );
      };
    };
  };

  public shared ({ caller }) func markAsRead(otherUser : UserId, messageId : MessageId) : async () {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can mark messages as read");
    };
    switch (messages.get(caller)) {
      case (null) { return };
      case (?conversations) {
        switch (conversations.get(otherUser)) {
          case (null) { return };
          case (?messagesMap) {
            switch (messagesMap.get(messageId)) {
              case (null) { return };
              case (?message) {
                if (message.toUser != caller) {
                  Runtime.trap("Unauthorized: Can only mark your own received messages as read");
                };
                let updatedMessage = { message with isRead = true };
                messagesMap.add(messageId, updatedMessage);
                conversations.add(otherUser, messagesMap);
                messages.add(caller, conversations);
              };
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func deleteMessage(otherUser : UserId, messageId : MessageId) : async () {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can delete messages");
    };
    switch (messages.get(caller)) {
      case (null) { return };
      case (?conversations) {
        switch (conversations.get(otherUser)) {
          case (null) { return };
          case (?messagesMap) {
            switch (messagesMap.get(messageId)) {
              case (null) { return };
              case (?message) {
                if (message.fromUser != caller) {
                  Runtime.trap("Unauthorized: Can only delete your own sent messages");
                };
                messagesMap.remove(messageId);
                conversations.add(otherUser, messagesMap);
                messages.add(caller, conversations);
              };
            };
          };
        };
      };
    };
  };

  // ===== NOTIFICATIONS =====

  public query ({ caller }) func getNotifications() : async [Notification] {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can view their notifications");
    };
    let userNotifs = notifications.values().filter(func(n) { n.recipientId == caller }).toArray();
    userNotifs.sort(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
  };

  public shared ({ caller }) func markNotificationRead(notifId : Nat) : async Result {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can mark notifications as read");
    };
    switch (notifications.get(notifId)) {
      case (null) { #err("Notification not found") };
      case (?notif) {
        if (notif.recipientId != caller) {
          Runtime.trap("Unauthorized: Can only mark your own notifications as read");
        };
        let updated : Notification = { notif with isRead = true };
        notifications.add(notifId, updated);
        #ok("Marked as read");
      };
    };
  };

  public shared ({ caller }) func markAllNotificationsRead() : async Result {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can mark notifications as read");
    };
    notifications.entries().forEach(func(entry) {
      let (nid, notif) = entry;
      if (notif.recipientId == caller and not notif.isRead) {
        let updated : Notification = { notif with isRead = true };
        notifications.add(nid, updated);
      };
    });
    #ok("All notifications marked as read");
  };

  public query ({ caller }) func getUnreadNotificationCount() : async Nat {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can view their notification count");
    };
    notifications.values().filter(func(n) { n.recipientId == caller and not n.isRead }).size();
  };

  // ===== BUILD LOGS =====

  public shared ({ caller }) func createBuildLog(
    title : Text,
    carMake : Text,
    carModel : Text,
    carYear : Text,
    description : Text,
  ) : async Result {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can create build logs");
    };
    let id = nextBuildLogId;
    nextBuildLogId += 1;
    let now = Time.now();
    let newLog : BuildLog = {
      id;
      title;
      authorId = caller;
      carMake;
      carModel;
      carYear;
      description;
      stages = [];
      createdAt = now;
      updatedAt = now;
    };
    buildLogs.add(id, newLog);
    #ok(id.toText());
  };

  public shared ({ caller }) func addBuildStage(
    buildLogId : Nat,
    stageTitle : Text,
    stageDescription : Text,
    imageUrl : Text,
  ) : async Result {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can add build stages");
    };
    switch (buildLogs.get(buildLogId)) {
      case (null) { #err("Build log not found") };
      case (?log) {
        if (log.authorId != caller) {
          Runtime.trap("Unauthorized: Only the author can add stages to this build log");
        };
        let stageId = nextBuildStageId;
        nextBuildStageId += 1;
        let newStage : BuildStage = {
          id = stageId;
          title = stageTitle;
          description = stageDescription;
          imageUrl;
          createdAt = Time.now();
        };
        let updatedLog : BuildLog = {
          log with
          stages = log.stages.concat([newStage]);
          updatedAt = Time.now();
        };
        buildLogs.add(buildLogId, updatedLog);
        #ok(stageId.toText());
      };
    };
  };

  public shared ({ caller }) func deleteBuildLog(id : Nat) : async Result {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can delete build logs");
    };
    switch (buildLogs.get(id)) {
      case (null) { #err("Build log not found") };
      case (?log) {
        if (log.authorId != caller and not checkIsAdmin(caller)) {
          Runtime.trap("Unauthorized: Only the author or admin can delete this build log");
        };
        buildLogs.remove(id);
        #ok("Deleted");
      };
    };
  };

  public query ({ caller }) func getAllBuildLogs() : async [BuildLog] {
    // Anyone can view build logs
    buildLogs.values().toArray();
  };

  public query ({ caller }) func getBuildLogById(id : Nat) : async ?BuildLog {
    // Anyone can view a build log
    buildLogs.get(id);
  };

  public query ({ caller }) func getBuildLogsByUser(principal : Principal) : async [BuildLog] {
    // Anyone can view build logs by user
    buildLogs.values().filter(func(l) { l.authorId == principal }).toArray();
  };

  // ===== LISTINGS =====

  public shared ({ caller }) func createListing(
    title : Text,
    description : Text,
    make : Text,
    model : Text,
    year : Text,
    price : Text,
    condition : Text,
    imageUrl : Text,
    category : Text,
  ) : async Result {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can create listings");
    };
    let id = nextListingId;
    nextListingId += 1;
    let newListing : Listing = {
      id;
      title;
      description;
      sellerId = caller;
      make;
      model;
      year;
      price;
      condition;
      imageUrl;
      category;
      createdAt = Time.now();
      isActive = true;
    };
    listings.add(id, newListing);
    #ok(id.toText());
  };

  public shared ({ caller }) func deactivateListing(id : Nat) : async Result {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can deactivate listings");
    };
    switch (listings.get(id)) {
      case (null) { #err("Listing not found") };
      case (?listing) {
        if (listing.sellerId != caller and not checkIsAdmin(caller)) {
          Runtime.trap("Unauthorized: Only the seller or admin can deactivate this listing");
        };
        let updated : Listing = { listing with isActive = false };
        listings.add(id, updated);
        #ok("Deactivated");
      };
    };
  };

  public query ({ caller }) func getAllActiveListings() : async [Listing] {
    // Anyone can view active listings
    listings.values().filter(func(l) { l.isActive }).toArray();
  };

  public query ({ caller }) func getListingById(id : Nat) : async ?Listing {
    // Anyone can view a listing
    listings.get(id);
  };

  public query ({ caller }) func getListingsBySeller(principal : Principal) : async [Listing] {
    // Anyone can view listings by seller
    listings.values().filter(func(l) { l.sellerId == principal }).toArray();
  };

  // ===== RACING CHALLENGES =====

  public shared ({ caller }) func postChallenge(
    originalVideoId : Nat,
    responseVideoId : Nat,
    challengedPrincipal : Principal,
  ) : async Result {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can post challenges");
    };
    let id = nextChallengeId;
    nextChallengeId += 1;
    let newChallenge : RacingChallenge = {
      id;
      challengerId = caller;
      challengedId = challengedPrincipal;
      videoId = responseVideoId;
      originalVideoId;
      status = "open";
      createdAt = Time.now();
    };
    racingChallenges.add(id, newChallenge);
    createNotificationInternal(
      challengedPrincipal,
      caller,
      "challenge",
      id.toText(),
      "You have been challenged to a race",
    );
    #ok(id.toText());
  };

  public shared ({ caller }) func closeChallenge(id : Nat) : async Result {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can close challenges");
    };
    switch (racingChallenges.get(id)) {
      case (null) { #err("Challenge not found") };
      case (?challenge) {
        if (challenge.challengerId != caller and challenge.challengedId != caller and not checkIsAdmin(caller)) {
          Runtime.trap("Unauthorized: Only the challenger, challenged, or admin can close this challenge");
        };
        let updated : RacingChallenge = { challenge with status = "closed" };
        racingChallenges.add(id, updated);
        #ok("Closed");
      };
    };
  };

  public query ({ caller }) func getChallengesForVideo(videoId : Nat) : async [RacingChallenge] {
    // Anyone can view challenges for a video
    racingChallenges.values().filter(func(c) { c.videoId == videoId or c.originalVideoId == videoId }).toArray();
  };

  public query ({ caller }) func getChallengesForUser(principal : Principal) : async [RacingChallenge] {
    // Anyone can view challenges for a user
    racingChallenges.values().filter(func(c) { c.challengerId == principal or c.challengedId == principal }).toArray();
  };

  // ===== SAVED VIDEOS =====

  public shared ({ caller }) func saveVideo(videoId : Nat) : async Result {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can save videos");
    };
    switch (users.get(caller)) {
      case (null) { #err("User not found") };
      case (?user) {
        if (user.profile.savedVideos.any(func(id) { id == videoId })) {
          return #ok("Already saved");
        };
        let updatedSaved = user.profile.savedVideos.concat([videoId]);
        let updatedProfile : UserProfile = { user.profile with savedVideos = updatedSaved };
        let updatedUser : InternalUser = { user with profile = updatedProfile };
        users.add(caller, updatedUser);
        #ok("Saved");
      };
    };
  };

  public shared ({ caller }) func unsaveVideo(videoId : Nat) : async Result {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can unsave videos");
    };
    switch (users.get(caller)) {
      case (null) { #err("User not found") };
      case (?user) {
        let updatedSaved = user.profile.savedVideos.filter(func(id) { id != videoId });
        let updatedProfile : UserProfile = { user.profile with savedVideos = updatedSaved };
        let updatedUser : InternalUser = { user with profile = updatedProfile };
        users.add(caller, updatedUser);
        #ok("Unsaved");
      };
    };
  };

  public query ({ caller }) func getSavedVideos() : async [Video] {
    if (not checkIsUser(caller)) {
      Runtime.trap("Unauthorized: Only users can view their saved videos");
    };
    switch (users.get(caller)) {
      case (null) { [] };
      case (?user) {
        user.profile.savedVideos.filterMap(func(videoId) {
          videos.get(videoId.toText());
        });
      };
    };
  };

  // ===== BADGES =====

  public shared ({ caller }) func awardBadge(targetPrincipal : Principal, badge : Badge) : async Result {
    if (not checkIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can award badges");
    };
    switch (users.get(targetPrincipal)) {
      case (null) { #err("User not found") };
      case (?user) {
        if (user.profile.badges.any(func(b) { b == badge })) {
          return #ok("Badge already awarded");
        };
        let updatedBadges = user.profile.badges.concat([badge]);
        let updatedProfile : UserProfile = { user.profile with badges = updatedBadges };
        let updatedUser : InternalUser = { user with profile = updatedProfile };
        users.add(targetPrincipal, updatedUser);
        #ok("Badge awarded");
      };
    };
  };

  public query ({ caller }) func getUserBadges(principal : Principal) : async [Badge] {
    // Anyone can view user badges
    switch (users.get(principal)) {
      case (null) { [] };
      case (?user) { user.profile.badges };
    };
  };

  // ===== VERIFIED STATUS =====

  public shared ({ caller }) func setVerified(targetPrincipal : Principal, verified : Bool) : async Result {
    if (not checkIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can set verified status");
    };
    switch (users.get(targetPrincipal)) {
      case (null) { #err("User not found") };
      case (?user) {
        var newBadges = user.profile.badges;
        if (verified and not newBadges.any(func(b) { b == #verified })) {
          newBadges := newBadges.concat([#verified]);
        } else if (not verified) {
          newBadges := newBadges.filter(func(b) { b != #verified });
        };
        let updatedProfile : UserProfile = { user.profile with verified; badges = newBadges };
        let updatedUser : InternalUser = { user with profile = updatedProfile };
        users.add(targetPrincipal, updatedUser);
        #ok("Verified status updated");
      };
    };
  };

  // ===== STATS =====

  public shared ({ caller }) func getUserStats(principal : Principal) : async UserStats {
    // Anyone can view user stats
    let userVideos = videos.values().filter(func(v) { v.uploader == principal }).toArray();
    let totalViews = userVideos.foldLeft(0, func(acc, v) { acc + v.viewCount });
    let totalLikes = userVideos.foldLeft(0, func(acc, v) { acc + v.likes.size() });
    var totalComments = 0;
    comments.values().forEach(func(commentMap) {
      commentMap.values().forEach(func(c) {
        if (c.authorId == principal) { totalComments += 1 };
      });
    });
    let (totalFollowers, totalFollowing, joinedAt) = switch (users.get(principal)) {
      case (null) { (0, 0, 0) };
      case (?user) {
        (user.followers.size(), user.following.size(), user.profile.joinedAt);
      };
    };
    let totalBuildLogs = buildLogs.values().filter(func(l) { l.authorId == principal }).size();
    {
      totalVideos = userVideos.size();
      totalViews;
      totalLikes;
      totalComments;
      totalFollowers;
      totalFollowing;
      totalBuildLogs;
      joinedAt;
    };
  };

  // ===== ADMIN: List all users =====

  public query ({ caller }) func getAllUsers() : async [UserProfile] {
    if (not checkIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can list all users");
    };
    users.values().map(func(u) { u.profile }).toArray();
  };
};
