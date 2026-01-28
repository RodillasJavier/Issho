import { Route, Routes } from "react-router";
import { Home } from "./pages/Home";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { CreatePostPage } from "./pages/CreatePostPage";
import { Navbar } from "./components/Navbar";
import { PostPage } from "./pages/PostPage";
import { AnimeListPage } from "./pages/AnimeListPage";
import { CreateAnimePage } from "./pages/CreateAnimePage";
import { AnimePage } from "./pages/AnimePage";

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

          {/* Posts */}
          <Route path="/post/create" element={<CreatePostPage />} />
          <Route path="/post/:id" element={<PostPage />} />

          {/* Anime */}
          <Route path="/anime" element={<AnimeListPage />} />
          <Route path="/anime/create" element={<CreateAnimePage />} />
          <Route path="/anime/:id" element={<AnimePage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
