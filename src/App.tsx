/**
 * src/App.tsx
 *
 * Route table. Built with createBrowserRouter (via createRoutesFromElements,
 * so the route tree below is still plain JSX) rather than plain
 * <BrowserRouter>/<Routes>, specifically so AppShell can use
 * <ScrollRestoration> — that component only works under the data-router
 * APIs. Nothing else about routing changed: every route, and every
 * component's use of useNavigate/useParams/Link/etc., behaves exactly as it
 * did before.
 */
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
} from "react-router";
import { AppShell } from "./components/AppShell";
import { Home } from "./pages/Home";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { CreateEntryPage } from "./pages/CreateEntryPage";
import { EntryPage } from "./pages/EntryPage";
import { AnimeListPage } from "./pages/AnimeListPage";
import { CreateAnimePage } from "./pages/CreateAnimePage";
import { AnimePage } from "./pages/AnimePage";
import { FranchisePage } from "./pages/FranchisePage";
import { UserProfilePage } from "./pages/UserProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { FriendsPage } from "./pages/FriendsPage";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Auth */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />

        {/* Entries */}
        <Route path="/entry/create" element={<CreateEntryPage />} />
        <Route path="/entry/:id" element={<EntryPage />} />

        {/* Anime */}
        <Route path="/anime" element={<AnimeListPage />} />
        <Route path="/anime/create" element={<CreateAnimePage />} />
        <Route path="/anime/:id" element={<AnimePage />} />
        <Route path="/series/:franchiseKey" element={<FranchisePage />} />

        {/* User Profiles */}
        <Route path="/profile/:username" element={<UserProfilePage />} />
        <Route path="/profile/:username/friends" element={<FriendsPage />} />

        {/* Settings — /profile/edit predates the wider settings page. */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="/profile/edit"
          element={<Navigate to="/settings" replace />}
        />
      </Route>
    </>
  )
);
