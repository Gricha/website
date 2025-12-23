import type { Route } from "./+types/happyholidays.terminal";
import { useState, useRef, useEffect } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Holiday Terminal | gricha.dev" },
    {
      name: "description",
      content: "Play Rudolph's Missing Nose - A Zork-style text adventure",
    },
  ];
}

const MCP_SERVER_URL = "https://gricha.dev/happyholidays/mcp";

interface TerminalLine {
  type: "input" | "output" | "error" | "system";
  content: string;
}

async function initializeSession(): Promise<string | null> {
  try {
    const response = await fetch(MCP_SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "holiday-terminal", version: "1.0" },
        },
        id: 1,
      }),
    });
    const sessionId = response.headers.get("mcp-session-id");
    await response.json(); // consume response
    return sessionId;
  } catch {
    return null;
  }
}

async function callTool(
  sessionId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  try {
    const response = await fetch(MCP_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Mcp-Session-Id": sessionId,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: { name: toolName, arguments: args },
        id: Date.now(),
      }),
    });
    const data = await response.json();
    if (data.error) {
      return `Error: ${data.error.message}`;
    }
    // MCP tool results come in content array
    if (data.result?.content) {
      return data.result.content
        .map((c: { type: string; text?: string }) =>
          c.type === "text" ? c.text : ""
        )
        .join("\n");
    }
    return JSON.stringify(data.result, null, 2);
  } catch (e) {
    return `Connection error: ${e}`;
  }
}

async function listTools(sessionId: string): Promise<string[]> {
  try {
    const response = await fetch(MCP_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Mcp-Session-Id": sessionId,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/list",
        id: Date.now(),
      }),
    });
    const data = await response.json();
    return data.result?.tools?.map((t: { name: string }) => t.name) || [];
  } catch {
    return [];
  }
}

export default function HolidayTerminal() {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tools, setTools] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Initialize on mount
  useEffect(() => {
    async function init() {
      setLines([
        { type: "system", content: "Connecting to North Pole servers..." },
      ]);
      const sid = await initializeSession();
      if (sid) {
        setSessionId(sid);
        const toolList = await listTools(sid);
        setTools(toolList);
        setLines([
          { type: "system", content: "Connected!" },
          { type: "system", content: "" },
          {
            type: "output",
            content: `+------------------------------------------+
|                                          |
|     RUDOLPH'S MISSING NOSE               |
|     A Holiday Text Adventure             |
|                                          |
+------------------------------------------+`,
          },
          { type: "system", content: "" },
          {
            type: "output",
            content:
              'Type "start" to begin your adventure, or "help" for commands.',
          },
        ]);
      } else {
        setLines([
          {
            type: "error",
            content: "Failed to connect. Please refresh to try again.",
          },
        ]);
      }
    }
    init();
  }, []);

  // Auto-scroll to bottom and keep focus
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
    // Always refocus input after lines update
    inputRef.current?.focus();
  }, [lines]);

  // Also refocus when loading state changes
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  // Focus input on click anywhere in terminal
  const focusInput = () => inputRef.current?.focus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || isLoading) return;

    const command = input.trim().toLowerCase();
    setLines((prev) => [...prev, { type: "input", content: `> ${input}` }]);
    setInput("");
    setIsLoading(true);
    // Keep focus on input
    inputRef.current?.focus();

    // Handle local commands
    if (command === "help") {
      setLines((prev) => [
        ...prev,
        {
          type: "output",
          content: `Available commands:
  start    - Begin or restart the game
  look     - Look around your current location
  go <dir> - Move in a direction (north, south, east, west)
  take <x> - Pick up an item
  use <x>  - Use an item
  inv      - Check your inventory
  help     - Show this help message
  clear    - Clear the terminal`,
        },
      ]);
      setIsLoading(false);
      return;
    }

    if (command === "clear") {
      setLines([]);
      setIsLoading(false);
      return;
    }

    // Map user commands to MCP tools
    let toolName = "";
    let args: Record<string, unknown> = {};

    if (command === "start") {
      toolName = "start_game";
    } else if (command === "look") {
      toolName = "look";
    } else if (command.startsWith("go ")) {
      toolName = "move";
      args = { direction: command.slice(3) };
    } else if (command.startsWith("take ") || command.startsWith("get ")) {
      toolName = "take";
      args = { item: command.split(" ").slice(1).join(" ") };
    } else if (command.startsWith("use ")) {
      toolName = "use";
      args = { item: command.split(" ").slice(1).join(" ") };
    } else if (command === "inv" || command === "inventory") {
      toolName = "inventory";
    } else {
      // Try to send as generic action
      toolName = "action";
      args = { command };
    }

    // Check if tool exists, otherwise try generic
    if (!tools.includes(toolName) && tools.includes("action")) {
      toolName = "action";
      args = { command };
    }

    const result = await callTool(sessionId, toolName, args);
    setLines((prev) => [...prev, { type: "output", content: result }]);
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
        <form onSubmit={handleSubmit} className="flex items-center">
          <span className="text-[#50fa7b] mr-2">{">"}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || !sessionId}
            className="flex-1 bg-transparent text-[#f8f8f2] outline-none caret-[#50fa7b]"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
          {isLoading && (
            <span className="text-[#6272a4] animate-pulse">▋</span>
          )}
        </form>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#222] text-center flex items-center justify-center gap-3 text-xs">
        <a
          href="/happyholidays2025"
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
