import {
  RouterProvider,
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Upload from './pages/Upload';
import Discover from './pages/Discover';
import FilteredFeed from './pages/FilteredFeed';
import Leaderboard from './pages/Leaderboard';
import CarMeets from './pages/CarMeets';
import CarMeetDetails from './pages/CarMeetDetails';
import MechanicsHelp from './pages/MechanicsHelp';
import MechanicsPostDetails from './pages/MechanicsPostDetails';
import Inbox from './pages/Inbox';
import Conversation from './pages/Conversation';
import AdminPanel from './pages/AdminPanel';
import Notifications from './pages/Notifications';
import BuildLogs from './pages/BuildLogs';
import BuildLogDetails from './pages/BuildLogDetails';
import Classifieds from './pages/Classifieds';
import ListingDetails from './pages/ListingDetails';

const queryClient = new QueryClient();

// Root route — no shell, renders children directly
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Landing page at '/' — no Layout shell
const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

// Layout wrapper route for all app routes
const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app-layout',
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const feedRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/feed',
  component: Feed,
});

const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/profile/$userId',
  component: Profile,
});

const uploadRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/upload',
  component: Upload,
});

const discoverRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/discover',
  component: Discover,
});

const filteredFeedRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/filter/$type/$value',
  component: FilteredFeed,
});

const leaderboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/leaderboard',
  component: Leaderboard,
});

const carMeetsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/meets',
  component: CarMeets,
});

const carMeetDetailsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/meets/$meetId',
  component: CarMeetDetails,
});

const mechanicsHelpRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/mechanics',
  component: MechanicsHelp,
});

const mechanicsPostDetailsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/mechanics/$postId',
  component: MechanicsPostDetails,
});

const inboxRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/inbox',
  component: Inbox,
});

const conversationRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/messages/$userId',
  component: Conversation,
});

const adminRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin',
  component: AdminPanel,
});

const notificationsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/notifications',
  component: Notifications,
});

const buildLogsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/builds',
  component: BuildLogs,
});

const buildLogDetailsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/builds/$buildId',
  component: BuildLogDetails,
});

const classifiedsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/classifieds',
  component: Classifieds,
});

const listingDetailsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/classifieds/$listingId',
  component: ListingDetails,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  appLayoutRoute.addChildren([
    feedRoute,
    profileRoute,
    uploadRoute,
    discoverRoute,
    filteredFeedRoute,
    leaderboardRoute,
    carMeetsRoute,
    carMeetDetailsRoute,
    mechanicsHelpRoute,
    mechanicsPostDetailsRoute,
    inboxRoute,
    conversationRoute,
    adminRoute,
    notificationsRoute,
    buildLogsRoute,
    buildLogDetailsRoute,
    classifiedsRoute,
    listingDetailsRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster theme="dark" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
