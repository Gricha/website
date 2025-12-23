import type { Route } from "./+types/happyholidays2025";
import { useState } from "react";
import { SocialsIconsOnly } from "../components/SocialsIconsOnly";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Happy Holidays 2025 | gricha.dev" },
    {
      name: "description",
      content: "Happy Holidays 2025 - Connect to a festive MCP server",
    },
  ];
}

const MCP_SERVER_URL = "https://gricha.dev/happyholidays/mcp";
const MCP_SERVER_NAME = "holidays-game";

const mcpConfig = { type: "http", url: MCP_SERVER_URL };
const mcpConfigJson = JSON.stringify(mcpConfig);

// Elegant geometric snowflake for decorative accents
function Snowflake({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      className={className}
    >
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
      <line x1="12" y1="2" x2="9" y2="5" />
      <line x1="12" y1="2" x2="15" y2="5" />
      <line x1="12" y1="22" x2="9" y2="19" />
      <line x1="12" y1="22" x2="15" y2="19" />
      <line x1="2" y1="12" x2="5" y2="9" />
      <line x1="2" y1="12" x2="5" y2="15" />
      <line x1="22" y1="12" x2="19" y2="9" />
      <line x1="22" y1="12" x2="19" y2="15" />
    </svg>
  );
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 px-2.5 py-1 text-xs font-mono tracking-wide bg-slate-700/80 hover:bg-slate-600 text-slate-300 rounded border border-slate-600/50 transition-all duration-300 hover:border-slate-500"
    >
      {copied ? "Copied" : label || "Copy"}
    </button>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative group" style={{ animation: "fadeInUp 0.5s ease-out 0.3s backwards" }}>
      <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-5 rounded-lg overflow-x-auto text-sm font-mono border border-slate-700/50 dark:border-slate-800">
        <code>{code}</code>
      </pre>
      <CopyButton text={code} />
    </div>
  );
}

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  code: string;
}

function TabbedCodeBlock({ tabs }: { tabs: TabItem[] }) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");
  const activeTabData = tabs.find((t) => t.id === activeTab);

  return (
    <div
      className="rounded-lg overflow-hidden border border-slate-700/50 dark:border-slate-800"
      style={{ animation: "fadeInUp 0.5s ease-out 0.3s backwards" }}
    >
      <div className="flex bg-slate-800/80 dark:bg-slate-900 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-300 border-b-2 ${
              activeTab === tab.id
                ? "bg-slate-900 dark:bg-slate-950 text-white border-blue-500"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 border-transparent"
            }`}
          >
            {tab.icon && <span className="w-4 h-4 opacity-70">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTabData && (
        <div className="relative">
          <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-5 overflow-x-auto text-sm font-mono">
            <code>{activeTabData.code}</code>
          </pre>
          <CopyButton text={activeTabData.code} />
        </div>
      )}
    </div>
  );
}

function InstallButton({
  href,
  icon,
  label,
  variant,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  variant: "vscode" | "cursor";
}) {
  const variants = {
    vscode:
      "bg-[#1e1e1e] hover:bg-[#2d2d2d] text-white border-[#3c3c3c] hover:border-[#4a4a4a]",
    cursor:
      "bg-[#f5f4f0] hover:bg-[#eae9e4] text-[#26251e] border-[#e0dfd9] hover:border-[#d0cfc9]",
  };

  return (
    <a
      href={href}
      className={`group flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 border hover:shadow-md hover:shadow-slate-900/10 dark:hover:shadow-black/20 ${variants[variant]}`}
    >
      <span className="w-4 h-4 flex-shrink-0">{icon}</span>
      <span>{label}</span>
    </a>
  );
}

function VSCodeIcon() {
  return <img src="/vscode-icon.svg" alt="VS Code" className="w-full h-full" />;
}

function CursorIcon() {
  return <img src="/cursor-icon.svg" alt="Cursor" className="w-full h-full" />;
}

function TerminalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-4 h-4"
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

const cliTools: TabItem[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    icon: <TerminalIcon />,
    code: `claude mcp add ${MCP_SERVER_NAME} ${MCP_SERVER_URL} --transport http`,
  },
  {
    id: "opencode",
    label: "OpenCode",
    icon: <TerminalIcon />,
    code: `# Add to ~/.config/opencode/opencode.json (see https://opencode.ai/docs/config/)
{
  "mcp": {
    "${MCP_SERVER_NAME}": {
      "type": "remote",
      "url": "${MCP_SERVER_URL}",
      "enabled": true
    }
  }
}`,
  },
  {
    id: "codex",
    label: "Codex",
    icon: <TerminalIcon />,
    code: `codex mcp add ${MCP_SERVER_NAME} --url ${MCP_SERVER_URL}`,
  },
];

function SectionHeader({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <h2
      className="text-xl font-semibold mb-5 text-gray-900 dark:text-white tracking-tight"
      style={{ animation: `fadeInUp 0.5s ease-out ${delay}s backwards` }}
    >
      {children}
    </h2>
  );
}

export default function HappyHolidays2025() {
  const vscodeUrl = `https://insiders.vscode.dev/redirect/mcp/install?name=${encodeURIComponent(MCP_SERVER_NAME)}&config=${encodeURIComponent(mcpConfigJson)}`;
  const cursorConfigBase64 =
    typeof btoa !== "undefined"
      ? btoa(mcpConfigJson)
      : Buffer.from(mcpConfigJson).toString("base64");
  const cursorUrl = `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(MCP_SERVER_NAME)}&config=${cursorConfigBase64}`;

  return (
    <>
      {/* Back link and socials */}
      <div className="mb-8 -mt-8 flex items-center justify-between">
        <a
          href="/"
          className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 text-base font-mono inline-flex items-center group"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1 -translate-y-px">
            &larr;
          </span>
          <span className="ml-2">Home</span>
        </a>
        <SocialsIconsOnly />
      </div>

      <article className="mb-24">
        {/* Header */}
        <header className="mb-10">
          <h1
            className="text-4xl font-semibold mb-4 text-gray-900 dark:text-white tracking-tight bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text"
            style={{ animation: "fadeInUp 0.5s ease-out backwards" }}
          >
            Happy Holidays
          </h1>

          <div
            className="flex items-center gap-3 text-xs font-mono tracking-wide text-gray-600 dark:text-gray-500 mb-6"
            style={{ animation: "fadeInUp 0.5s ease-out 0.05s backwards" }}
          >
            <span>Greg Pstrucha & Jeremy Stanley</span>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <time>December 2025</time>
          </div>

          <p
            className="text-base leading-7 text-gray-700 dark:text-gray-300 max-w-lg"
            style={{ animation: "fadeInUp 0.5s ease-out 0.1s backwards" }}
          >
            Connect your AI coding assistant to a festive MCP server for a
            holiday-themed experience. Choose your preferred installation method
            below.
          </p>
        </header>

        {/* One-Click Installs */}
        <section className="mb-12">
          <SectionHeader delay={0.2}>Install with One Click</SectionHeader>

          <div
            className="flex gap-3"
            style={{ animation: "fadeInUp 0.5s ease-out 0.25s backwards" }}
          >
            <InstallButton
              href={vscodeUrl}
              icon={<VSCodeIcon />}
              label="VS Code"
              variant="vscode"
            />

            <InstallButton
              href={cursorUrl}
              icon={<CursorIcon />}
              label="Cursor"
              variant="cursor"
            />
          </div>
        </section>

        {/* CLI Commands */}
        <section className="mb-12">
          <SectionHeader delay={0.35}>Command Line</SectionHeader>
          <TabbedCodeBlock tabs={cliTools} />
        </section>

        {/* Manual Configuration */}
        <section className="mb-12">
          <SectionHeader delay={0.4}>Manual Configuration</SectionHeader>

          <p
            className="text-base leading-7 mb-5 text-gray-700 dark:text-gray-300"
            style={{ animation: "fadeInUp 0.5s ease-out 0.45s backwards" }}
          >
            For Claude Desktop or any MCP-compatible client, add this to your
            configuration file:
          </p>

          <CodeBlock
            code={`{
  "mcpServers": {
    "${MCP_SERVER_NAME}": {
      "type": "http",
      "url": "${MCP_SERVER_URL}"
    }
  }
}`}
          />

          <div
            className="mt-5 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg"
            style={{ animation: "fadeInUp 0.5s ease-out 0.5s backwards" }}
          >
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Configuration file locations
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5 font-mono">
              <li className="flex items-start gap-2">
                <span className="text-slate-400 select-none">~</span>
                <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  ~/Library/Application Support/Claude/claude_desktop_config.json
                </code>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 select-none">~</span>
                <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  ~/.cursor/mcp.json
                </code>
              </li>
            </ul>
          </div>
        </section>

        {/* Footer */}
        <footer
          className="pt-8 border-t border-gray-200 dark:border-gray-800"
          style={{ animation: "fadeInUp 0.5s ease-out 0.55s backwards" }}
        >
          <div className="flex items-center justify-center gap-3 text-gray-500 dark:text-gray-500">
            <Snowflake className="w-4 h-4 opacity-40" />
            <p className="text-sm">Wishing you a wonderful holiday season</p>
            <Snowflake className="w-4 h-4 opacity-40" />
          </div>
        </footer>
      </article>
    </>
  );
}
