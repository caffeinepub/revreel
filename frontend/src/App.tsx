import { createRouter, RouterProvider, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Layout from './components/Layout';
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
import AuthGuard from './components/AuthGuard';

const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
      <Layout>
        <Outlet />
      </Layout>
      <Toaster theme="dark" />
    </ThemeProvider>
  ),
});

const feedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Feed,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/$userId',
  component: Profile,
});

const myProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: () => <AuthGuard><Profile /></AuthGuard>,
});

const uploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/upload',
  component: () => <AuthGuard><Upload /></AuthGuard>,
});

const discoverRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/discover',
  component: Discover,
});

const filteredFeedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/filter/$type/$value',
  component: FilteredFeed,
});

const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/leaderboard',
  component: Leaderboard,
});

const carMeetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/meets',
  component: CarMeets,
});

const carMeetDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/meets/$meetId',
  component: CarMeetDetails,
});

const mechanicsHelpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mechanics',
  component: MechanicsHelp,
});

const mechanicsPostDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mechanics/$postId',
  component: MechanicsPostDetails,
});

const inboxRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/inbox',
  component: Inbox,
});

const conversationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/messages/$userId',
  component: Conversation,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminPanel,
});

const routeTree = rootRoute.addChildren([
  feedRoute,
  profileRoute,
  myProfileRoute,
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
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
