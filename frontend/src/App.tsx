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
import Discover from './pages/Discover';
import FilteredFeed from './pages/FilteredFeed';
import Upload from './pages/Upload';
import Inbox from './pages/Inbox';
import Conversation from './pages/Conversation';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Notifications from './pages/Notifications';
import MechanicsHelp from './pages/MechanicsHelp';
import MechanicsPostDetails from './pages/MechanicsPostDetails';
import CarMeets from './pages/CarMeets';
import CarMeetDetails from './pages/CarMeetDetails';
import BuildLogs from './pages/BuildLogs';
import BuildLogDetails from './pages/BuildLogDetails';
import Classifieds from './pages/Classifieds';
import ListingDetails from './pages/ListingDetails';
import AdminPanel from './pages/AdminPanel';
import About from './pages/About';
import ProfileSetupModal from './components/ProfileSetupModal';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

// Root route
const rootRoute = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <>
      <Outlet />
      {showProfileSetup && (
        <ProfileSetupModal
          open={true}
          onComplete={() => {
            // Profile setup complete — the query will refetch automatically
          }}
        />
      )}
    </>
  );
}

// Landing page (public)
const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

// App layout route
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: Layout,
});

const feedRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/feed',
  component: Feed,
});

const discoverRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/discover',
  component: Discover,
});

const filteredFeedRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/filtered-feed',
  component: FilteredFeed,
  validateSearch: (search: Record<string, unknown>) => ({
    category: (search.category as string) ?? '',
    hashtag: (search.hashtag as string) ?? '',
  }),
});

const uploadRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/upload',
  component: Upload,
});

const inboxRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/inbox',
  component: Inbox,
});

const conversationRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/conversation/$userId',
  component: Conversation,
});

const profileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/profile/$userId',
  component: Profile,
});

const leaderboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/leaderboard',
  component: Leaderboard,
});

const notificationsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/notifications',
  component: Notifications,
});

const mechanicsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/mechanics',
  component: MechanicsHelp,
});

const mechanicsPostRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/mechanics/$postId',
  component: MechanicsPostDetails,
});

const meetsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/meets',
  component: CarMeets,
});

const meetDetailsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/meets/$meetId',
  component: CarMeetDetails,
});

const buildsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/builds',
  component: BuildLogs,
});

const buildDetailsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/builds/$logId',
  component: BuildLogDetails,
});

const classifiedsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/classifieds',
  component: Classifieds,
});

const listingDetailsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/classifieds/$listingId',
  component: ListingDetails,
});

const adminRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/admin',
  component: AdminPanel,
});

const aboutRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/about',
  component: About,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  layoutRoute.addChildren([
    feedRoute,
    discoverRoute,
    filteredFeedRoute,
    uploadRoute,
    inboxRoute,
    conversationRoute,
    profileRoute,
    leaderboardRoute,
    notificationsRoute,
    mechanicsRoute,
    mechanicsPostRoute,
    meetsRoute,
    meetDetailsRoute,
    buildsRoute,
    buildDetailsRoute,
    classifiedsRoute,
    listingDetailsRoute,
    adminRoute,
    aboutRoute,
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <RouterProvider router={router} />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
