// ✅ VERIFIED: Split onboarding out of the dashboard shell so the access gate can redirect cleanly before dashboard access. Manual test: incomplete users should land on /onboarding without the dashboard shell, then reach /dashboard after completion.
import * as React from 'react';
import { Navigate, Outlet, createRoute, createRootRoute, createRouter } from '@tanstack/react-router';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { PublicRoute } from '../components/PublicRoute';
import { useAuthStore } from '@/store/auth.store';
import DashboardLayout from '../pages/(dashboard)/layout';
import LandingPage from '../pages/page';
import AuthPage from '../pages/auth/page';
import AuthCallbackPage from '../pages/auth/callback/page';
import OnboardingPage from '../pages/onboarding/page';
import DashboardPage from '../pages/(dashboard)/dashboard/page';
import ProjectsPage from '../pages/(dashboard)/projects/page';
import NewProjectPage from '../pages/(dashboard)/projects/new/page';
import ProjectDetailPage from '../pages/(dashboard)/projects/[projectId]/page';
import TimelinePage from '../pages/(dashboard)/timeline/page';
import ClientCallsPage from '../pages/(dashboard)/client-calls/page';
import ClientUpdatesPage from '../pages/(dashboard)/client-updates/page';
import ApprovalsPage from '../pages/(dashboard)/approvals/page';
import PaymentsPage from '../pages/(dashboard)/payments/page';
import ProfilePage from '../pages/(dashboard)/profile/page';
import SettingsPage from '../pages/(dashboard)/settings/page';
import WrappedPage from '../pages/(dashboard)/wrapped/page';

function RootLayout() {
  return <Outlet />;
}

function PublicLayout() {
  return (
    <PublicRoute>
      <Outlet />
    </PublicRoute>
  );
}

function AuthLayout() {
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  );
}

function AppLayout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}

function CatchAllRedirect() {
  const { isAuthenticated } = useAuthStore();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} />;
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const publicRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'public',
  component: PublicLayout,
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  component: AuthLayout,
});

const appRoute = createRoute({
  getParentRoute: () => authRoute,
  id: 'app',
  component: AppLayout,
});

const landingRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/',
  component: LandingPage,
});

const loginRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/login',
  component: AuthPage,
});

const registerRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/register',
  component: AuthPage,
});

const authCallbackRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/auth/callback',
  component: AuthCallbackPage,
});

const onboardingRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/onboarding',
  component: OnboardingPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const projectsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/projects',
  component: ProjectsPage,
});

const newProjectRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/projects/new',
  component: NewProjectPage,
});

const projectDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/projects/$projectId',
  component: ProjectDetailPage,
});

const timelineRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/timeline',
  component: TimelinePage,
});

const clientUpdatesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/client-updates',
  component: ClientUpdatesPage,
});

const clientCallsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/client-calls',
  component: ClientCallsPage,
});

const clientsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/clients',
  component: ClientUpdatesPage,
});

const approvalsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/approvals',
  component: ApprovalsPage,
});

const paymentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/payments',
  component: PaymentsPage,
});

const profileRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/profile',
  component: ProfilePage,
});

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/settings',
  component: SettingsPage,
});

const wrappedRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/wrapped',
  component: WrappedPage,
});

const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  component: CatchAllRedirect,
});

const routeTree = rootRoute.addChildren([
  publicRoute.addChildren([landingRoute, loginRoute, registerRoute, authCallbackRoute]),
  authRoute.addChildren([
    onboardingRoute,
    appRoute.addChildren([
      dashboardRoute,
      projectsRoute,
      newProjectRoute,
      projectDetailRoute,
      timelineRoute,
      clientCallsRoute,
      clientUpdatesRoute,
      clientsRoute,
      approvalsRoute,
      paymentsRoute,
      profileRoute,
      settingsRoute,
      wrappedRoute,
    ]),
  ]),
  catchAllRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
