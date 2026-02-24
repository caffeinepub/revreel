import Map "mo:core/Map";
import Int "mo:core/Int";
import Set "mo:core/Set";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  // Mixins
  include MixinStorage();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Type Definitions
  type UserId = Principal;
  type VideoId = Text;
  type CommentId = Nat;
  type Hashtag = Text;
  type Category = Text; // "drifting", "drag", "jdm", "muscle", "supercar", "offroad", "daily"
  type CarMeetId = Text;
  type MeetCategory = Text; // "jdm", "muscle", "drift", "all"
  type Location = Text;

  // User Profile
  public type UserProfile = {
    id : UserId;
    username : Text;
    bio : Text;
    avatar : Storage.ExternalBlob;
    avatarUrl : Text; // New avatarUrl field
  };

  /// Immutable Video Model
  public type Video = {
    id : VideoId;
    title : Text;
    description : Text;
    uploader : UserId;
    likes : [UserId]; // Immutable array for persistence
    comments : [Comment];
    hashtags : [Hashtag];
    category : Category;
    timestamp : Time.Time;
    thumbnail : Storage.ExternalBlob;
    videoUrl : Storage.ExternalBlob;
  };

  // Internal User with followers & following
  type InternalUser = {
    profile : UserProfile;
    followers : Set.Set<UserId>;
    following : Set.Set<UserId>;
  };

  // Comment Model
  public type Comment = {
    id : CommentId;
    videoId : VideoId;
    authorId : UserId;
    text : Text;
    timestamp : Time.Time;
  };

  // Car Meet/Event Model
  public type CarMeet = {
    id : CarMeetId;
    title : Text;
    location : Location;
    date : Time.Time; // Event date
    description : Text;
    organizer : UserId;
    attendees : [UserId];
    category : MeetCategory;
    createdAt : Time.Time;
  };

  // Car Meet Details Model
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

  // Mechanics Posts
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
    category : Text; // Engine, Brakes, Suspension, Electrical, Bodywork, Transmission, Other
    createdAt : Time.Time;
    comments : [MechanicsComment];
  };

  // Direct Messaging Types
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
      Int.compare(b.timestamp, a.timestamp); // Newest first
    };
  };

  // State
  let videos = Map.empty<VideoId, Video>();
  let users = Map.empty<UserId, InternalUser>();
  let comments = Map.empty<VideoId, Map.Map<CommentId, Comment>>();
  let carMeets = Map.empty<CarMeetId, CarMeet>();
  let mechanicsPosts = Map.empty<Nat, MechanicsPost>();
  let messages = Map.empty<UserId, Map.Map<UserId, Map.Map<MessageId, DirectMessage>>>();

  var nextPostId : Nat = 0;
  var nextCommentId : Nat = 0;
  var nextMessageId : Nat = 0;

  // -----------------------------------------------------------------------
  // Admin Functions
  // -----------------------------------------------------------------------

  /// Check if the caller is an admin. Public — no auth check needed (returns bool).
  public query ({ caller }) func isAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  /// Delete a user account. Admin-only.
  public shared ({ caller }) func deleteUser(userId : UserId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can delete users");
    };
    if (not users.containsKey(userId)) {
      Runtime.trap("User not found");
    };
    users.remove(userId);
  };

  // -----------------------------------------------------------------------
  // Required profile interface: getCallerUserProfile, saveCallerUserProfile,
  // getUserProfile
  // -----------------------------------------------------------------------

  /// Get the caller's own profile. Requires #user role.
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    switch (users.get(caller)) {
      case (?user) { ?user.profile };
      case (null) { null };
    };
  };

  /// Save (create or update) the caller's profile. Requires #user role.
  public shared ({ caller }) func saveCallerUserProfile(username : Text, bio : Text, avatar : Storage.ExternalBlob, avatarUrl : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save their profile");
    };
    let newProfile : UserProfile = {
      id = caller;
      username;
      bio;
      avatar;
      avatarUrl;
    };
    switch (users.get(caller)) {
      case (null) {
        // Create new internal user
        let internalUser : InternalUser = {
          profile = newProfile;
          followers = Set.empty<UserId>();
          following = Set.empty<UserId>();
        };
        users.add(caller, internalUser);
      };
      case (?user) {
        // Update existing user profile
        let updatedUser : InternalUser = { user with profile = newProfile };
        users.add(caller, updatedUser);
      };
    };
  };

  /// Get any user's profile by principal. Public — no auth check needed.
  public query ({ caller }) func getUserProfile(userId : UserId) : async ?UserProfile {
    switch (users.get(userId)) {
      case (?user) { ?user.profile };
      case (null) { null };
    };
  };

  // -----------------------------------------------------------------------
  // Avatar Management
  // -----------------------------------------------------------------------

  public shared ({ caller }) func updateAvatar(avatarUrl : Text) : async UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update avatars");
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

  // -----------------------------------------------------------------------
  // User Management
  // -----------------------------------------------------------------------

  /// Create a new user account. Open to all callers (guests register here).
  public shared ({ caller }) func createUser(username : Text, bio : Text, avatar : Storage.ExternalBlob, avatarUrl : Text) : async UserProfile {
    // Ensure the user doesn't already exist
    if (users.containsKey(caller)) { Runtime.trap("User already exists - _id_" # caller.toText()) };

    // Create new profile and user
    let newProfile : UserProfile = {
      id = caller;
      username;
      bio;
      avatar;
      avatarUrl;
    };

    let internalUser : InternalUser = {
      profile = newProfile;
      followers = Set.empty<UserId>();
      following = Set.empty<UserId>();
    };

    users.add(caller, internalUser);
    newProfile;
  };

  /// Get the caller's own profile. Requires #user role.
  public query ({ caller }) func getOwnProfile() : async UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get their own profile");
    };
    switch (users.get(caller)) {
      case (?user) { user.profile };
      case (null) { Runtime.trap("User not found") };
    };
  };

  /// Get any user's profile by principal. Public — no auth check needed.
  public query ({ caller }) func getProfile(userId : UserId) : async UserProfile {
    switch (users.get(userId)) {
      case (?user) { user.profile };
      case (null) { Runtime.trap("User not found") };
    };
  };

  /// Update the caller's profile. Requires #user role.
  public shared ({ caller }) func updateProfile(username : Text, bio : Text, avatar : Storage.ExternalBlob, avatarUrl : Text) : async UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update their profile");
    };
    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        let updatedProfile : UserProfile = {
          id = caller;
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

  // -----------------------------------------------------------------------
  // Video CRUD Operations
  // -----------------------------------------------------------------------

  /// Upload a new video. Requires #user role.
  public shared ({ caller }) func uploadVideo(
    title : Text,
    description : Text,
    hashtags : [Hashtag],
    category : Category,
    thumbnail : Storage.ExternalBlob,
    videoUrl : Storage.ExternalBlob,
  ) : async Video {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
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
    };

    videos.add(videoId, newVideo);
    newVideo;
  };

  /// Delete a video and all associated comments and likes.
  /// Requires #user role. Only the uploader or an admin can delete.
  public shared ({ caller }) func deleteVideo(videoId : VideoId) : async () {
    // First verify the caller is an authenticated user
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can delete videos");
    };

    switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) {
        // Verify the caller is the uploader or an admin
        if (caller != video.uploader and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the video owner can delete this video");
        };

        // Remove video
        videos.remove(videoId);

        // Remove associated comments
        comments.remove(videoId);
      };
    };
  };

  /// Get a single video by ID. Public — no auth check needed.
  public query ({ caller }) func getVideo(videoId : VideoId) : async Video {
    switch (videos.get(videoId)) {
      case (?video) { video };
      case (null) { Runtime.trap("Video not found") };
    };
  };

  /// Get all videos. Public — no auth check needed.
  public query ({ caller }) func getAllVideos() : async [Video] {
    let allVideos = videos.values().toArray();
    allVideos.sort();
  };

  /// Get videos filtered by category. Public — no auth check needed.
  public query ({ caller }) func getVideosByCategory(category : Category) : async [Video] {
    let filtered = videos.values().filter(
      func(video) {
        video.category == category;
      }
    ).toArray();
    filtered.sort();
  };

  /// Get videos filtered by hashtag. Public — no auth check needed.
  public query ({ caller }) func getVideosByHashtag(hashtag : Hashtag) : async [Video] {
    let filtered = videos.values().filter(
      func(video) {
        video.hashtags.any(func(h) { h == hashtag });
      }
    ).toArray();
    filtered.sort();
  };

  // -----------------------------------------------------------------------
  // Like/Unlike Video
  // -----------------------------------------------------------------------

  /// Toggle like on a video. Requires #user role.
  public shared ({ caller }) func toggleLike(videoId : VideoId) : async Video {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can like videos");
    };

    switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) {
        let updatedLikes = if (video.likes.any(func(like) { like == caller })) {
          video.likes.filter(func(like) { like != caller });
        } else {
          video.likes.concat([caller]);
        };

        let updatedVideo : Video = { video with likes = updatedLikes };
        videos.add(videoId, updatedVideo);
        updatedVideo;
      };
    };
  };

  // -----------------------------------------------------------------------
  // Comments
  // -----------------------------------------------------------------------

  /// Add a comment to a video. Requires #user role.
  public shared ({ caller }) func addComment(videoId : VideoId, text : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can comment");
    };

    // Validate video exists before proceeding
    if (not videos.containsKey(videoId)) {
      Runtime.trap("Video not found: " # videoId);
    };

    let commentId = Time.now().toNat();
    let newComment : Comment = {
      id = commentId;
      videoId;
      authorId = caller;
      text;
      timestamp = Time.now();
    };

    // Store comment in comments map
    let existingComments = switch (comments.get(videoId)) {
      case (?existing) { existing };
      case (null) { Map.empty<CommentId, Comment>() };
    };

    existingComments.add(commentId, newComment);
    comments.add(videoId, existingComments);
  };

  /// Get comments for a video. Public — no auth check needed.
  public query ({ caller }) func getComments(videoId : VideoId) : async [Comment] {
    switch (comments.get(videoId)) {
      case (null) { [] };
      case (?commentMap) { commentMap.values().toArray() };
    };
  };

  // -----------------------------------------------------------------------
  // Follow/Unfollow Operations
  // -----------------------------------------------------------------------

  /// Follow another user. Requires #user role.
  public shared ({ caller }) func followUser(followee : UserId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can follow others");
    };

    if (followee == caller) {
      Runtime.trap("Cannot follow yourself");
    };

    let followerUserOpt = users.get(caller);
    let followeeUserOpt = users.get(followee);

    switch (followerUserOpt, followeeUserOpt) {
      case (null, _) { Runtime.trap("Follower not found") };
      case (_, null) { Runtime.trap("Followee not found") };
      case (?followerUser, ?followeeUser) {
        // Update follower's following list
        let updatedFollowerFollowing = Set.empty<UserId>();
        followerUser.following.values().forEach(func(followingUser) { updatedFollowerFollowing.add(followingUser) });
        updatedFollowerFollowing.add(followee);
        let updatedFollowerUser : InternalUser = { followerUser with following = updatedFollowerFollowing };

        // Update followee's followers list
        let updatedFolloweeFollowers = Set.empty<UserId>();
        followeeUser.followers.values().forEach(func(follower) { updatedFolloweeFollowers.add(follower) });
        updatedFolloweeFollowers.add(caller);
        let updatedFolloweeUser : InternalUser = { followeeUser with followers = updatedFolloweeFollowers };

        // Update state
        users.add(caller, updatedFollowerUser);
        users.add(followee, updatedFolloweeUser);
      };
    };
  };

  /// Unfollow another user. Requires #user role.
  public shared ({ caller }) func unfollowUser(followee : UserId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can unfollow others");
    };

    switch (users.get(caller), users.get(followee)) {
      case (null, _) { Runtime.trap("Follower not found") };
      case (_, null) { Runtime.trap("Followee not found") };
      case (?followerUser, ?followeeUser) {
        // Update follower's following list
        let updatedFollowerFollowing = Set.empty<UserId>();
        followerUser.following.values().forEach(func(followingUser) { updatedFollowerFollowing.add(followingUser) });
        updatedFollowerFollowing.remove(followee);
        let updatedFollowerUser : InternalUser = { followerUser with following = updatedFollowerFollowing };

        // Update followee's followers list
        let updatedFolloweeFollowers = Set.empty<UserId>();
        followeeUser.followers.values().forEach(func(follower) { updatedFolloweeFollowers.add(follower) });
        updatedFolloweeFollowers.remove(caller);
        let updatedFolloweeUser : InternalUser = { followeeUser with followers = updatedFolloweeFollowers };

        // Update state
        users.add(caller, updatedFollowerUser);
        users.add(followee, updatedFolloweeUser);
      };
    };
  };

  // -----------------------------------------------------------------------
  // Trending & Leaderboard
  // -----------------------------------------------------------------------

  /// Get trending videos (top 10 by likes). Public — no auth check needed.
  public query ({ caller }) func getTrendingVideos() : async [Video] {
    let allVideos = videos.values().toArray();

    // Sort videos by number of likes in descending order
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

    // Limit to top 10 trending videos
    if (sortedVideos.size() <= 10) {
      sortedVideos;
    } else {
      sortedVideos.sliceToArray(0, 10);
    };
  };

  // -----------------------------------------------------------------------
  // Meet/Cars/Events Functions
  // -----------------------------------------------------------------------

  /// Create a new car meet/event. Requires #user role.
  public shared ({ caller }) func createCarMeet(
    title : Text,
    location : Location,
    date : Time.Time,
    description : Text,
    category : MeetCategory,
  ) : async CarMeet {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
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
      attendees = [caller]; // Add creator as first attendee
      category;
      createdAt = Time.now();
    };

    carMeets.add(meetId, newMeet);
    newMeet;
  };

  /// Join a car meet. Requires #user role.
  public shared ({ caller }) func joinCarMeet(meetId : CarMeetId) : async CarMeet {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
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

  /// Leave a car meet. Requires #user role.
  public shared ({ caller }) func leaveCarMeet(meetId : CarMeetId) : async CarMeet {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
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

  /// Get all car meets (sorted by date). Public.
  public query ({ caller }) func getAllCarMeets() : async [CarMeet] {
    let allMeets = carMeets.values().toArray();
    allMeets.sort();
  };

  /// Get a car meet by ID. Public.
  public query ({ caller }) func getCarMeetById(meetId : CarMeetId) : async ?CarMeet {
    carMeets.get(meetId);
  };

  /// Get car meets by organizer. Public.
  public query ({ caller }) func getCarMeetsByOrganizer(organizer : UserId) : async [CarMeet] {
    let filtered = carMeets.values().filter(
      func(meet) {
        meet.organizer == organizer;
      }
    ).toArray();
    filtered.sort();
  };

  /// Get car meets by category. Public.
  public query ({ caller }) func getCarMeetsByCategory(category : MeetCategory) : async [CarMeet] {
    let filtered = carMeets.values().filter(
      func(meet) {
        meet.category == category;
      }
    ).toArray();
    filtered.sort();
  };

  /// Get detailed information on a car meet, including attendees' usernames and organizer. Public.
  public query ({ caller }) func getCarMeetDetails(meetId : CarMeetId) : async ?CarMeetDetails {
    switch (carMeets.get(meetId)) {
      case (null) { null };
      case (?carMeet) {
        // Find organizer's profile
        let organizerProfile : ?UserProfile = users.get(carMeet.organizer).map(func(user) { user.profile });

        // Map attendees to their profiles
        let attendeeProfiles : [UserProfile] = carMeet.attendees.filterMap(
          func(userId) {
            users.get(userId).map(func(user) { user.profile });
          }
        );

        // Construct detailed meet info including category
        let details : CarMeetDetails = {
          carMeet with
          organizer = organizerProfile;
          attendees = attendeeProfiles;
          category = carMeet.category;
        };

        ?details;
      };
    };
  };

  // -----------------------------------------------------------------------
  // Mechanics Posts
  // -----------------------------------------------------------------------

  /// Create a new mechanics post. Requires #user role.
  public shared ({ caller }) func createMechanicsPost(
    title : Text,
    description : Text,
    category : Text,
  ) : async MechanicsPost {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
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
    newPost;
  };

  /// Add a comment to a mechanics post. Requires #user role.
  public shared ({ caller }) func addMechanicsComment(postId : Nat, text : Text) : async MechanicsComment {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
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
        newComment;
      };
    };
  };

  /// Delete a mechanics post. Only the author or an admin can delete.
  /// Requires #user role.
  public shared ({ caller }) func deleteMechanicsPost(postId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can delete mechanics posts");
    };
    switch (mechanicsPosts.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        if (post.author != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the post author or an admin can delete this post");
        };
        mechanicsPosts.remove(postId);
      };
    };
  };

  /// Get all mechanics posts. Public — no auth check needed.
  public query ({ caller }) func getAllMechanicsPosts() : async [MechanicsPost] {
    mechanicsPosts.values().toArray();
  };

  /// Get a mechanics post by ID. Public — no auth check needed.
  public query ({ caller }) func getMechanicsPostById(postId : Nat) : async ?MechanicsPost {
    mechanicsPosts.get(postId);
  };

  // -----------------------------------------------------------------------
  // Direct Messaging System
  // -----------------------------------------------------------------------

  /// Send a direct message to another user. Requires #user role.
  public shared ({ caller }) func sendMessage(toUser : UserId, text : Text) : async MessageId {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    if (text.size() == 0) {
      Runtime.trap("Text message cannot be empty");
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

    // Store message for sender
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

    // Store message for receiver
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

    messageId;
  };

  /// Get all messages between the caller and another user, sorted by timestamp ascending.
  /// Requires #user role — only authenticated users can read their own conversations.
  public query ({ caller }) func getConversation(otherUser : UserId) : async [DirectMessage] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can read their conversations");
    };
    switch (messages.get(caller)) {
      case (?conversations) {
        switch (conversations.get(otherUser)) {
          case (?msgs) {
            let messageList = msgs.values().toArray();
            messageList.sort();
          };
          case (null) { [] };
        };
      };
      case (null) { [] };
    };
  };

  /// Get the inbox for the caller: most recent message per conversation partner,
  /// sorted by latest timestamp descending.
  /// Requires #user role — only authenticated users can read their own inbox.
  public query ({ caller }) func getInbox() : async [ConversationSummary] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can read their inbox");
    };
    switch (messages.get(caller)) {
      case (null) { [] };
      case (?conversations) {
        let otherUsers = conversations.keys().toArray();
        otherUsers.map(
          func(otherUser) {
            switch (conversations.get(otherUser)) {
              case (null) { Runtime.trap("Corrupted state: No messages for user") };
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

  /// Mark a specific message as read. Requires #user role.
  /// Only the recipient of the message may mark it as read.
  public shared ({ caller }) func markAsRead(otherUser : UserId, messageId : MessageId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can mark messages as read");
    };

    switch (messages.get(caller)) {
      case (null) { Runtime.trap("No conversations found") };
      case (?conversations) {
        switch (conversations.get(otherUser)) {
          case (null) { Runtime.trap("No messages from this user") };
          case (?messagesMap) {
            switch (messagesMap.get(messageId)) {
              case (null) { Runtime.trap("Message not found") };
              case (?message) {
                if (message.toUser != caller) {
                  Runtime.trap("Not allowed to mark others' messages as read");
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

  /// Delete a message. Requires #user role.
  /// Only the sender of the message may delete it.
  public shared ({ caller }) func deleteMessage(otherUser : UserId, messageId : MessageId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete messages");
    };

    switch (messages.get(caller)) {
      case (null) { Runtime.trap("No conversations found") };
      case (?conversations) {
        switch (conversations.get(otherUser)) {
          case (null) { Runtime.trap("No messages from this user") };
          case (?messagesMap) {
            switch (messagesMap.get(messageId)) {
              case (null) { Runtime.trap("Message not found") };
              case (?message) {
                if (message.fromUser != caller) {
                  Runtime.trap("Not allowed to delete messages you did not create");
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
};
