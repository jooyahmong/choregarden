import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AuthPage } from './pages/auth/AuthPage';
import { ParentSignUpPage } from './pages/auth/ParentSignUpPage';
import { AddChildPage } from './pages/parent/AddChildPage';
import { ChildAppShell } from './layouts/ChildAppShell';
import { ChildGardenPage } from './pages/child/ChildGardenPage';
import { ChildChoresPage } from './pages/child/ChildChoresPage';
import { ChildMoneyPage } from './pages/child/ChildMoneyPage';
import { ChildFlowerBookPage } from './pages/child/ChildFlowerBookPage';
import { ParentAppShell } from './layouts/ParentAppShell';
import { ParentFamilyGardenPage } from './pages/parent/ParentFamilyGardenPage';
import { ParentChoresPage } from './pages/parent/ParentChoresPage';
import { ParentMoneyPage } from './pages/parent/ParentMoneyPage';
import { ParentChildrenPage } from './pages/parent/ParentChildrenPage';
import { ParentChildDetailPage } from './pages/parent/ParentChildDetailPage';
import { ParentChoreTemplatesPage } from './pages/parent/ParentChoreTemplatesPage';
import { ParentSettingsPage } from './pages/parent/ParentSettingsPage';
import { ChildSettingsPage } from './pages/child/ChildSettingsPage';
import { Spinner } from './components/ui/Spinner';

const RequireParent = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (user?.type !== 'parent') return <Navigate to="/" replace state={{ returnTo: `${location.pathname}${location.search}` }} />;
  return <Outlet />;
};

const RequireChild = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user?.type !== 'child') return <Navigate to="/" replace />;
  return <Outlet />;
};

/**
 * Only wraps routes with no further onboarding step of their own — signup
 * intentionally sits outside this guard so it can navigate to
 * /parent/children/add itself without racing this redirect.
 */
const RedirectIfAuthed = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;
  if (user?.type === 'parent') return <Navigate to={returnTo?.startsWith('/parent/') ? returnTo : '/parent/garden'} replace />;
  if (user?.type === 'child') return <Navigate to="/child/garden" replace />;
  return <Outlet />;
};

/**
 * "/landing" is a static marketing page (public/landing/index.html), not an
 * SPA route. SPA fallbacks can serve the app shell for the slashless path
 * before the static directory index resolves, so bounce it over with a real
 * navigation.
 */
const LandingRedirect = () => {
  useEffect(() => {
    window.location.replace('/landing/');
  }, []);
  return null;
};

export const AppRoutes = () => (
  <Routes>
    <Route element={<RedirectIfAuthed />}>
      <Route path="/" element={<AuthPage />} />
    </Route>
    <Route path="/parent/signup" element={<ParentSignUpPage />} />
    <Route path="/landing" element={<LandingRedirect />} />

    <Route path="/parent" element={<RequireParent />}>
      <Route element={<ParentAppShell />}>
        <Route index element={<Navigate to="garden" replace />} />
        <Route path="garden" element={<ParentFamilyGardenPage />} />
        <Route path="chores" element={<ParentChoresPage />} />
        <Route path="money" element={<ParentMoneyPage />} />
        <Route path="children" element={<ParentChildrenPage />} />
        <Route path="children/add" element={<AddChildPage />} />
        <Route path="children/:childId" element={<ParentChildDetailPage />} />
        <Route path="chore-templates" element={<ParentChoreTemplatesPage />} />
        <Route path="settings" element={<ParentSettingsPage />} />
      </Route>
    </Route>

    <Route path="/child" element={<RequireChild />}>
      <Route element={<ChildAppShell />}>
        <Route index element={<Navigate to="garden" replace />} />
        <Route path="garden" element={<ChildGardenPage />} />
        <Route path="chores" element={<ChildChoresPage />} />
        <Route path="money" element={<ChildMoneyPage />} />
        <Route path="book" element={<ChildFlowerBookPage />} />
        <Route path="settings" element={<ChildSettingsPage />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
