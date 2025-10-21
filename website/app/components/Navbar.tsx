import { useLocation } from "react-router";

export function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isBlog = location.pathname.startsWith('/blog');

  return (
    <nav className="flex justify-center space-x-12 mb-16 text-sm font-mono">
      <a
        href="/"
        className={`${
          isHome
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-600 dark:text-gray-400'
        } hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 relative group px-2 py-1`}
      >
        home
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 group-hover:w-full rounded-full"></span>
      </a>
      <a
        href="/blog"
        className={`${
          isBlog
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-600 dark:text-gray-400'
        } hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 relative group px-2 py-1`}
      >
        blog
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 group-hover:w-full rounded-full"></span>
      </a>
    </nav>
  );
}
