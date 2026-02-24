import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import Layout from "./components/Layout";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Discover from "./pages/Discover";
import Upload from "./pages/Upload";
import Leaderboard from "./pages/Leaderboard";
import CarMeets from "./pages/CarMeets";
import CarMeetDetails from "./pages/CarMeetDetails";
import MechanicsHelp from "./pages/MechanicsHelp";
import MechanicsPostDetails from "./pages/MechanicsPostDetails";
import Inbox from "./pages/Inbox";
import Conversation from "./pages/Conversation";
import AdminPanel from "./pages/AdminPanel";
import LandingPage from "./pages/LandingPage";
import FilteredFeed from "./pages/FilteredFeed";
import Notifications from "./pages/Notifications";
import BuildLogs from "./pages/BuildLogs";
import BuildLogDetails from "./pages/BuildLogDetails";
import Classifieds from "./pages/Classifieds";
import ListingDetails from "./pages/ListingDetails";
import About from "./pages/About";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// Root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Landing page route (public)
const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

// App layout route
const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app-layout",
  component: Layout,
});

// Feed route
const feedRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/feed",
  component: Feed,
});

// Profile route
const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/profile/$userId",
  component: Profile,
});

// Discover route
const discoverRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/discover",
  component: Discover,
});

// Upload route
const uploadRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/upload",
  component: Upload,
});

// Leaderboard route
const leaderboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/leaderboard",
  component: Leaderboard,
});

// Car Meets route
const carMeetsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/meets",
  component: CarMeets,
});

// Car Meet Details route
const carMeetDetailsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/meets/$meetId",
  component: CarMeetDetails,
});

// Mechanics Help route
const mechanicsHelpRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/mechanics",
  component: MechanicsHelp,
});

// Mechanics Post Details route
const mechanicsPostDetailsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/mechanics/$postId",
  component: MechanicsPostDetails,
});

// Inbox route
const inboxRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/inbox",
  component: Inbox,
});

// Conversation route
const conversationRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/messages/$userId",
  component: Conversation,
});

// Admin Panel route
const adminPanelRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/admin",
  component: AdminPanel,
});

// Filtered Feed route
const filteredFeedRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/feed/filter",
  component: FilteredFeed,
});

// Notifications route
const notificationsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/notifications",
  component: Notifications,
});

// Build Logs list route
const buildLogsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/builds",
  component: BuildLogs,
});

// Build Log Details route
const buildLogDetailsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/builds/$buildId",
  component: BuildLogDetails,
});

// Classifieds (Marketplace) list route
const classifiedsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/classifieds",
  component: Classifieds,
});

// Listing Details route
const listingDetailsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/classifieds/$listingId",
  component: ListingDetails,
});

// About route
const aboutRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/about",
  component: About,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  appLayoutRoute.addChildren([
    feedRoute,
    profileRoute,
    discoverRoute,
    uploadRoute,
    leaderboardRoute,
    carMeetsRoute,
    carMeetDetailsRoute,
    mechanicsHelpRoute,
    mechanicsPostDetailsRoute,
    inboxRoute,
    conversationRoute,
    adminPanelRoute,
    filteredFeedRoute,
    notificationsRoute,
    buildLogsRoute,
    buildLogDetailsRoute,
    classifiedsRoute,
    listingDetailsRoute,
    aboutRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
