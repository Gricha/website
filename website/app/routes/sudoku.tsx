import type { Route } from "./+types/sudoku";
import { Link } from "react-router";
import { useEffect, useRef } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sudoku GBA | gricha.dev" },
    { name: "description", content: "Play Sudoku on a Game Boy Advance emulator in your browser" },
  ];
}

export default function Sudoku() {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Configure EmulatorJS
    (window as any).EJS_player = "#game";
    (window as any).EJS_core = "gba";
    (window as any).EJS_gameUrl = "/sudoku/sudoku.gba";
    (window as any).EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";
    (window as any).EJS_defaultOptions = {
      "save-state-slot": 1,
    };

    // Load EmulatorJS
    const script = document.createElement("script");
    script.src = "https://cdn.emulatorjs.org/stable/data/loader.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 selection:bg-emerald-200 selection:text-gray-900 dark:selection:bg-emerald-900 dark:selection:text-gray-100">
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
              className="text-xs tracking-wide transition-all duration-200 relative py-1 text-gray-400 dark:text-gray-600 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <main>
        <div className="mb-8">
          <h1 className="text-4xl font-semibold mb-3 text-gray-900 dark:text-gray-100 tracking-tight">
            SUDOKU GBA
          </h1>
          <div className="w-16 h-0.5 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full"></div>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
          A Sudoku game for Game Boy Advance, written in Rust with Claude. 700 puzzles across 4 difficulty levels.
          Your progress saves automatically.{" "}
          <a
            href="https://github.com/Gricha/sudoku-gba"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            View source
          </a>
        </p>

        <div
          id="game"
          ref={gameRef}
          className="w-full aspect-[3/2] mb-8 rounded-lg overflow-hidden"
        />

        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-4">
            Controls
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 text-sm">
            <div className="flex gap-3">
              <span className="text-gray-900 dark:text-gray-100 font-medium min-w-[80px]">Arrow keys</span>
              <span className="text-gray-500 dark:text-gray-500">Navigate grid</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-900 dark:text-gray-100 font-medium min-w-[80px]">X</span>
              <span className="text-gray-500 dark:text-gray-500">Cycle numbers 1-9</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-900 dark:text-gray-100 font-medium min-w-[80px]">Z</span>
              <span className="text-gray-500 dark:text-gray-500">Clear cell</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-900 dark:text-gray-100 font-medium min-w-[80px]">A + Z</span>
              <span className="text-gray-500 dark:text-gray-500">Undo</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-900 dark:text-gray-100 font-medium min-w-[80px]">S + Z</span>
              <span className="text-gray-500 dark:text-gray-500">Redo</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-900 dark:text-gray-100 font-medium min-w-[80px]">Enter</span>
              <span className="text-gray-500 dark:text-gray-500">Pause</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-900 dark:text-gray-100 font-medium min-w-[80px]">Shift</span>
              <span className="text-gray-500 dark:text-gray-500">Toggle music</span>
            </div>
          </div>
        </div>

        <p className="text-gray-500 dark:text-gray-600 text-xs">
          Powered by{" "}
          <a
            href="https://emulatorjs.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            EmulatorJS
          </a>
        </p>
      </main>
    </div>
  );
}
