import {
  RouterProvider,
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Upload from "./pages/Upload";
import Discover from "./pages/Discover";
import FilteredFeed from "./pages/FilteredFeed";
import Leaderboard from "./pages/Leaderboard";
import Inbox from "./pages/Inbox";
import Conversation from "./pages/Conversation";
import Notifications from "./pages/Notifications";
import MechanicsHelp from "./pages/MechanicsHelp";
import MechanicsPostDetails from "./pages/MechanicsPostDetails";
import CarMeets from "./pages/CarMeets";
import CarMeetDetails from "./pages/CarMeetDetails";
import BuildLogs from "./pages/BuildLogs";
import BuildLogDetails from "./pages/BuildLogDetails";
import Classifieds from "./pages/Classifieds";
import ListingDetails from "./pages/ListingDetails";
import AdminPanel from "./pages/AdminPanel";
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

// Landing page (public)
const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

// App layout route
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app-layout",
  component: Layout,
});

// Feed
const feedRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/feed",
  component: Feed,
});

// Profile - uses $userId param
const profileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/profile/$userId",
  component: Profile,
});

// Upload
const uploadRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/upload",
  component: Upload,
});

// Discover
const discoverRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/discover",
  component: Discover,
});

// Filtered feed
const filteredFeedRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/filtered-feed",
  component: FilteredFeed,
  validateSearch: (search: Record<string, unknown>) => ({
    type: (search.type as string) || "",
    value: (search.value as string) || "",
  }),
});

// Leaderboard
const leaderboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/leaderboard",
  component: Leaderboard,
});

// Inbox
const inboxRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/inbox",
  component: Inbox,
});

// Conversation
const conversationRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/messages/$userId",
  component: Conversation,
});

// Notifications
const notificationsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/notifications",
  component: Notifications,
});

// Mechanics Help
const mechanicsHelpRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/mechanics",
  component: MechanicsHelp,
});

// Mechanics Post Details
const mechanicsPostDetailsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/mechanics/$postId",
  component: MechanicsPostDetails,
});

// Car Meets
const carMeetsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/meets",
  component: CarMeets,
});

// Car Meet Details
const carMeetDetailsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/meets/$meetId",
  component: CarMeetDetails,
});

// Build Logs
const buildLogsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/builds",
  component: BuildLogs,
});

// Build Log Details
const buildLogDetailsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/builds/$buildId",
  component: BuildLogDetails,
});

// Classifieds
const classifiedsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/classifieds",
  component: Classifieds,
});

// Listing Details
const listingDetailsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/classifieds/$listingId",
  component: ListingDetails,
});

// Admin Panel
const adminPanelRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/admin",
  component: AdminPanel,
});

// About
const aboutRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/about",
  component: About,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  layoutRoute.addChildren([
    feedRoute,
    profileRoute,
    uploadRoute,
    discoverRoute,
    filteredFeedRoute,
    leaderboardRoute,
    inboxRoute,
    conversationRoute,
    notificationsRoute,
    mechanicsHelpRoute,
    mechanicsPostDetailsRoute,
    carMeetsRoute,
    carMeetDetailsRoute,
    buildLogsRoute,
    buildLogDetailsRoute,
    classifiedsRoute,
    listingDetailsRoute,
    adminPanelRoute,
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
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <RouterProvider router={router} />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
