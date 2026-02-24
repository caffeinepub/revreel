import React from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
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
import BuildLogDetails from './pages/BuildLogDetails';
import ListingDetails from './pages/ListingDetails';
import About from './pages/About';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
  },
});

// Root route - renders bare Outlet (no layout)
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Landing page at '/' - no layout shell
const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

// App layout route - Layout uses <Outlet /> internally, no children needed
const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app-layout',
  component: Layout,
});

const feedRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/feed',
  component: Feed,
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

const meetsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/meets',
  component: CarMeets,
});

const meetDetailsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/meets/$meetId',
  component: CarMeetDetails,
});

const mechanicsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/mechanics',
  component: MechanicsHelp,
});

const mechanicsPostRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/mechanics/$postId',
  component: MechanicsPostDetails,
});

const buildsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/builds/$buildId',
  component: BuildLogDetails,
});

const classifiedsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/classifieds/$listingId',
  component: ListingDetails,
});

const uploadRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/upload',
  component: Upload,
});

const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/profile/$userId',
  component: Profile,
});

const profileSelfRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/profile',
  component: Profile,
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

const notificationsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/notifications',
  component: Notifications,
});

const adminRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin',
  component: AdminPanel,
});

const aboutRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/about',
  component: About,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  appLayoutRoute.addChildren([
    feedRoute,
    discoverRoute,
    filteredFeedRoute,
    leaderboardRoute,
    meetsRoute,
    meetDetailsRoute,
    mechanicsRoute,
    mechanicsPostRoute,
    buildsRoute,
    classifiedsRoute,
    uploadRoute,
    profileRoute,
    profileSelfRoute,
    inboxRoute,
    conversationRoute,
    notificationsRoute,
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
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
