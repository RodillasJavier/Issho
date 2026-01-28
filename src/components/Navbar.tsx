import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../hooks/useAuth";

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut, user } = useAuth();
  const displayName = user?.email ? user.email.split("@")[0] : null;

  return (
    <nav className="fixed top-0 w-full bg-[rgba(10,10,10,.8)] z-40 backdrop-blur-lg border-b border-white/10 shadow-lg">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="font-mono text-xl font-bold white">
            Issho
            <span className="text-rose-400">
              {displayName ? `.${displayName}` : ""}
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Home
            </Link>

            <Link
              to="/create"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Create
            </Link>

            <Link
              to="/anime/create"
              className="text-gray-300 hover:text-white transition-colors"
            >
              New Anime
            </Link>

            {/* Desktop Auth Buttons */}
            {user ? (
              <button
                onClick={signOut}
                className="px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/signin"
                  className="px-4 py-2 rounded-md text-rose-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>

                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-md text-white hover:text-rose-400 bg-rose-500 hover:bg-rose-400/20 border-1 border-transparent hover:border-rose-400 transition:border transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Hamburger Menu */}
          <div className="md:hidden">
            <button
              onClick={() => {
                setMenuOpen((prev) => !prev);
              }}
              className="text-gray-300 focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {menuOpen ? (
                  // Close icon
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  // Hamburger icon
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="md:hidden bg-[rgba(10,10,10,0.9)]">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className="block text-center px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
            >
              Home
            </Link>

            <Link
              to="/create"
              className="block text-center px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
            >
              Create
            </Link>

            <Link
              to="/anime/create"
              className="block text-center px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
            >
              New Anime
            </Link>

            {/* Mobile Auth Buttons */}
            {user ? (
              <button
                onClick={signOut}
                className="block text-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
              >
                Sign Out
              </button>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="block px-4 py-2 text-center rounded-md text-rose-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>

                <Link
                  to="/signup"
                  className="block px-4 py-2 text-center rounded-md text-white hover:text-rose-400 bg-rose-500 hover:bg-rose-400/20 border-1 border-transparent hover:border-rose-400 transition:border transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
