/**
 * src/App.tsx
 *
 * Main application component that sets up routing and layout.
 */
import { Route, Routes } from "react-router";
import { Home } from "./pages/Home";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { CreateEntryPage } from "./pages/CreateEntryPage";
import { Navbar } from "./components/Navbar";
import { EntryPage } from "./pages/EntryPage";
import { AnimeListPage } from "./pages/AnimeListPage";
import { CreateAnimePage } from "./pages/CreateAnimePage";
import { AnimePage } from "./pages/AnimePage";
import { MyListPage } from "./pages/MyListPage";

function App() {
  return (
    <div className="min-h-screen bg-black text-gray-100 transition-opacity duration-500 pt-20">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Auth */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Entries */}
          <Route path="/entry/create" element={<CreateEntryPage />} />
          <Route path="/entry/:id" element={<EntryPage />} />

          {/* Anime */}
          <Route path="/anime" element={<AnimeListPage />} />
          <Route path="/anime/create" element={<CreateAnimePage />} />
          <Route path="/anime/:id" element={<AnimePage />} />

          {/* User List */}
          <Route path="/my-list" element={<MyListPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
