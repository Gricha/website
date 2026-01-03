import { Link, useLocation } from "react-router";

export function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="flex items-center justify-between mb-8">
      <Link
        to="/"
        className="text-gray-400 dark:text-gray-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200 text-xs tracking-widest uppercase"
      >
        GREG PSTRUCHA
      </Link>

      <div className="flex items-center gap-6">
        {[
          { path: "/", label: "about" },
          { path: "/projects", label: "projects" },
          { path: "/blog", label: "writing" },
        ].map(({ path, label }) => (
          <Link
            key={path}
            to={path}
            className={`
              text-xs tracking-wide transition-all duration-200
              relative py-1
              ${isActive(path)
                ? "text-gray-900 dark:text-gray-100"
                : "text-gray-400 dark:text-gray-600 hover:text-emerald-600 dark:hover:text-emerald-400"
              }
            `}
          >
            {label}
            <span
              className={`
                absolute -bottom-0.5 left-0 h-px bg-emerald-500 transition-all duration-200
                ${isActive(path) ? "w-full" : "w-0 group-hover:w-full"}
              `}
            />
          </Link>
        ))}
      </div>
    </nav>
  );
}
