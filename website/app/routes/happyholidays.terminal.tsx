import type { Route } from "./+types/happyholidays.terminal";
import { useState, useRef, useEffect } from "react";

const SESSION_COOKIE_NAME = "mcp_session_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Holiday Terminal | gricha.dev" },
    {
      name: "description",
      content: "A holiday text adventure game",
    },
  ];
}

interface TerminalLine {
  type: "input" | "output" | "error" | "system";
  content: string;
}

interface HistoryEntry {
  role: "user" | "model";
  parts: { text: string }[];
}

async function sendCommand(
  command: string,
  sessionId: string | null,
  history: HistoryEntry[]
): Promise<{ response: string; sessionId: string }> {
  const res = await fetch("/api/game", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command, sessionId, history }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to process command");
  }

  return res.json();
}

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export default function HolidayTerminal() {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [spinnerFrame, setSpinnerFrame] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Spinner animation
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setSpinnerFrame((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 80);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Initialize on mount - restore session or start fresh
  useEffect(() => {
    const savedSessionId = getCookie(SESSION_COOKIE_NAME);

    setLines([{ type: "system", content: "Connecting..." }]);
    setIsLoading(true);

    const startFresh = async () => {
      const result = await sendCommand("start", null, []);
      setSessionId(result.sessionId);
      setHistory([
        { role: "user", parts: [{ text: "start" }] },
        { role: "model", parts: [{ text: result.response }] },
      ]);
      setLines([{ type: "output", content: result.response }]);
    };

    const initialize = async () => {
      try {
        if (savedSessionId) {
          // Try to restore session
          setSessionId(savedSessionId);
          const result = await sendCommand("look", savedSessionId, []);
          // Check if response indicates invalid session
          if (result.response.includes("not found") || result.response.includes("Error")) {
            clearCookie(SESSION_COOKIE_NAME);
            await startFresh();
          } else {
            setSessionId(result.sessionId);
            setLines([{ type: "output", content: result.response }]);
          }
        } else {
          await startFresh();
        }
      } catch (error) {
        // If restore fails, try fresh start
        clearCookie(SESSION_COOKIE_NAME);
        try {
          await startFresh();
        } catch {
          setLines([
            { type: "error", content: `Failed to connect: ${error instanceof Error ? error.message : "Unknown error"}` },
            { type: "output", content: 'Type "start" to try again.' },
          ]);
        }
      }
      setIsLoading(false);
      setIsReady(true);
    };

    initialize();
  }, []);

  // Save session ID to cookie when it changes
  useEffect(() => {
    if (sessionId) {
      setCookie(SESSION_COOKIE_NAME, sessionId, COOKIE_MAX_AGE);
    }
  }, [sessionId]);

  // Auto-scroll to bottom and keep focus
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
    inputRef.current?.focus();
  }, [lines]);

  // Refocus when loading state changes
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const focusInput = () => inputRef.current?.focus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isReady) return;

    const command = input.trim();
    setLines((prev) => [...prev, { type: "input", content: `> ${command}` }]);
    setInput("");
    setIsLoading(true);
    inputRef.current?.focus();

    // Handle local commands
    if (command.toLowerCase() === "help" || command.toLowerCase() === "/help") {
      setLines((prev) => [
        ...prev,
        {
          type: "output",
          content: `USAGE
    <command> [arguments]

GAME COMMANDS
    look              Look around your current location
    go <direction>    Move (north, south, east, west, or room name)
    take <item>       Pick up an item
    use <item>        Use or interact with an item
    examine <item>    Look closely at something
    inventory         Check what you're carrying
    hint              Get a hint if you're stuck

SYSTEM COMMANDS
    restart           Start a new game from the beginning
    clear             Clear the terminal screen
    help              Show this help message

TIPS
    You can type naturally - "pick up the key" works just as well as "take key"`,
        },
      ]);
      setIsLoading(false);
      return;
    }

    if (command.toLowerCase() === "restart") {
      clearCookie(SESSION_COOKIE_NAME);
      setSessionId(null);
      setHistory([]);
      setLines([{ type: "system", content: "Starting new game..." }]);
      try {
        const result = await sendCommand("start", null, []);
        setSessionId(result.sessionId);
        setHistory([
          { role: "user", parts: [{ text: "start" }] },
          { role: "model", parts: [{ text: result.response }] },
        ]);
        setLines([{ type: "output", content: result.response }]);
      } catch {
        setLines((prev) => [
          ...prev,
          { type: "error", content: "Failed to start new game. Try again." },
        ]);
      }
      setIsLoading(false);
      return;
    }

    if (command.toLowerCase() === "clear") {
      setLines([]);
      setIsLoading(false);
      return;
    }


    try {
      const result = await sendCommand(command, sessionId, history);
      setSessionId(result.sessionId);
      setLines((prev) => [...prev, { type: "output", content: result.response }]);

      // Update history for context
      setHistory((prev) => [
        ...prev,
        { role: "user", parts: [{ text: command }] },
        { role: "model", parts: [{ text: result.response }] },
      ].slice(-20)); // Keep last 20 entries (10 exchanges)
    } catch (error) {
      setLines((prev) => [
        ...prev,
        {
          type: "error",
          content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ]);
    }

    setIsLoading(false);
  };

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] font-mono flex flex-col overflow-hidden">
      {/* Terminal content */}
      <div
        ref={terminalRef}
        onClick={focusInput}
        className="flex-1 overflow-y-auto p-4 cursor-text"
      >
        {lines.map((line, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap mb-1 ${
              line.type === "input"
                ? "text-[#50fa7b]"
                : line.type === "error"
                  ? "text-[#ff5555]"
                  : line.type === "system"
                    ? "text-[#6272a4]"
                    : "text-[#f8f8f2]"
            }`}
          >
            {line.content}
          </div>
        ))}

        {/* Input line */}
        {isLoading ? (
          <div className="flex items-center">
            <span className="text-[#6272a4] mr-2">{SPINNER_FRAMES[spinnerFrame]}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center">
            <span className="text-[#50fa7b] mr-2">{">"}</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!isReady}
              className="flex-1 bg-transparent text-[#f8f8f2] outline-none caret-[#50fa7b]"
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#222] text-center flex items-center justify-center gap-3 text-xs">
        <a
          href="/happyholidays"
          className="text-[#6272a4] hover:text-[#8be9fd] transition-colors"
        >
          Play the game with MCP
        </a>
        <span className="text-[#444]">|</span>
        <a
          href="https://x.com/gricha_91"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#6272a4] hover:text-[#8be9fd] transition-colors"
        >
          Follow me on X
        </a>
      </div>
    </div>
  );
}
