import { GoogleGenerativeAI } from "@google/generative-ai";

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "https://gricha.dev/happyholidays/mcp";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

const MCP_HEADERS = {
  "Content-Type": "application/json",
  "Accept": "application/json, text/event-stream",
};

const REQUEST_TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;
const FRIENDLY_ERROR = "Oops! Something went wrong on our end. Please try again.";

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Request timed out")), ms)
  );
  return Promise.race([promise, timeout]);
}

interface McpTool {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

interface McpSession {
  sessionId: string;
  tools: McpTool[];
}

async function initializeMcpSession(): Promise<McpSession | null> {
  try {
    const initResponse = await fetch(MCP_SERVER_URL, {
      method: "POST",
      headers: MCP_HEADERS,
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "holiday-terminal-ai", version: "1.0" },
        },
        id: 1,
      }),
    });
    const sessionId = initResponse.headers.get("mcp-session-id");
    await initResponse.json();

    if (!sessionId) return null;

    const toolsResponse = await fetch(MCP_SERVER_URL, {
      method: "POST",
      headers: {
        ...MCP_HEADERS,
        "Mcp-Session-Id": sessionId,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/list",
        params: {},
        id: 2,
      }),
    });
    const toolsData = await toolsResponse.json();
    const tools: McpTool[] = toolsData.result?.tools || [];

    return { sessionId, tools };
  } catch {
    return null;
  }
}

async function listMcpTools(sessionId: string): Promise<McpTool[]> {
  try {
    const response = await fetch(MCP_SERVER_URL, {
      method: "POST",
      headers: {
        ...MCP_HEADERS,
        "Mcp-Session-Id": sessionId,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/list",
        params: {},
        id: Date.now(),
      }),
    });
    const data = await response.json();
    return data.result?.tools || [];
  } catch {
    return [];
  }
}

async function callMcpTool(
  sessionId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  try {
    const response = await fetch(MCP_SERVER_URL, {
      method: "POST",
      headers: {
        ...MCP_HEADERS,
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

function mcpToolToGeminiFunction(tool: McpTool) {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  if (tool.inputSchema?.properties) {
    for (const [key, value] of Object.entries(tool.inputSchema.properties)) {
      const prop = value as { type?: string; description?: string };
      properties[key] = {
        type: prop.type || "string",
        description: prop.description || "",
      };
    }
  }

  if (tool.inputSchema?.required) {
    required.push(...tool.inputSchema.required);
  }

  return {
    name: tool.name,
    description: tool.description || "",
    parameters: {
      type: "object",
      properties,
      required,
    },
  };
}

const ERROR_MESSAGE =
  "I didn't quite understand that. You can do things like 'look', 'go', 'take', 'use', or 'interact' with items. Type 'hint' if you're stuck!";

interface HistoryEntry {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface GameRequest {
  command: string;
  sessionId?: string;
  history?: HistoryEntry[];
}

export interface GameResponse {
  response: string;
  sessionId: string;
}

export async function handleGameCommand(req: GameRequest): Promise<GameResponse> {
  const { command, sessionId: existingSessionId, history = [] } = req;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      let sessionId = existingSessionId;
      let tools: McpTool[] = [];

      if (!sessionId) {
        const session = await initializeMcpSession();
        if (!session) {
          throw new Error("Failed to connect to game server");
        }
        sessionId = session.sessionId;
        tools = session.tools;
      } else {
        tools = await listMcpTools(sessionId);
      }

      if (tools.length === 0) {
        throw new Error("No game tools available");
      }

      const geminiTools = tools.map(mcpToolToGeminiFunction);

      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        tools: [{ functionDeclarations: geminiTools }],
        systemInstruction:
          "You are a text adventure game command parser. Parse the player's natural language input and call the appropriate game tool. Common mappings: 'start'/'begin' → start_game, 'look'/'l' → look, 'go X'/'walk to X' → go (direction can be cardinal like north/south or room names like bedroom/kitchen), 'take X'/'get X'/'grab X'/'pick up X' → take, 'use X'/'use X on Y'/'put on X'/'wear X'/'build X'/'open X' → use (treat 'put on', 'wear', 'build', and 'open' as using/interacting with an item or target), 'examine X'/'look at X'/'x X' → examine, 'talk to X' → talk, 'i'/'inventory' → inventory. Always call a tool - pick the closest match for the player's intent.",
      });

      const chat = model.startChat({
        history: history.slice(-10),
      });

      const result = await withTimeout(chat.sendMessage(command), REQUEST_TIMEOUT_MS);
      const response = result.response;
      const functionCall = response.functionCalls()?.[0];

      if (!functionCall) {
        return { response: ERROR_MESSAGE, sessionId };
      }

      const toolName = functionCall.name;
      const args = (functionCall.args || {}) as Record<string, unknown>;

      console.log(`MCP call: ${toolName}`, args);
      const gameResponse = await callMcpTool(sessionId, toolName, args);

      return { response: gameResponse || ERROR_MESSAGE, sessionId };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt + 1} failed:`, lastError.message);
    }
  }

  console.error("All retries failed:", lastError);
  return { response: FRIENDLY_ERROR, sessionId: existingSessionId || "" };
}
