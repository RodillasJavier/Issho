/**
 * src/App.tsx
 *
 * Main application component that sets up routing and layout.
 */
import { Navigate, Outlet, Route, Routes } from "react-router";
import { Navbar } from "./components/Navbar";
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

// The auth pages own their full-bleed layout, so they render outside this
// shell rather than under the persistent Navbar/container chrome.
function AppShell() {
  return (
    <div className="min-h-screen bg-black text-gray-100 transition-opacity duration-500 pt-20">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <Outlet />
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
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
    </Routes>
  );
}

export default App;
