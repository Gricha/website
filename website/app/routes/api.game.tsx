import { GoogleGenerativeAI } from "@google/generative-ai";

const MCP_SERVER_URL = "https://gricha.dev/happyholidays/mcp";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

async function initializeMcpSession(): Promise<string | null> {
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
          clientInfo: { name: "holiday-terminal-ai", version: "1.0" },
        },
        id: 1,
      }),
    });
    const sessionId = response.headers.get("mcp-session-id");
    await response.json();
    return sessionId;
  } catch {
    return null;
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

const ERROR_MESSAGE =
  "I didn't understand that command. Please try again with a game action like 'look', 'go north', 'take item', or 'start'.";

const gameTools = [
  {
    name: "game",
    description:
      "Execute a game command. action is required. For 'go' also provide direction. For 'take'/'use'/'examine' also provide target. For 'talk' provide character name.",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["start_game", "look", "go", "take", "use", "examine", "talk", "inventory", "status", "unknown"],
          description: "The game action: start_game, look, go, take, use, examine, talk, inventory, status",
        },
        direction: {
          type: "string",
          enum: ["north", "south", "east", "west"],
          description: "Direction for 'go' action",
        },
        target: {
          type: "string",
          description: "Item/person name for take/use/examine/talk/look actions",
        },
      },
      required: ["action"],
    },
  },
];

interface HistoryEntry {
  role: "user" | "model";
  parts: { text: string }[];
}

export async function action({ request }: { request: Request }) {
  const { command, sessionId: existingSessionId, history = [] } = await request.json() as {
    command: string;
    sessionId?: string;
    history?: HistoryEntry[];
  };

  let sessionId = existingSessionId;
  if (!sessionId) {
    sessionId = await initializeMcpSession();
    if (!sessionId) {
      return Response.json(
        { error: "Failed to connect to game server" },
        { status: 500 }
      );
    }
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      tools: [{ functionDeclarations: gameTools }],
      systemInstruction:
        "Parse the player's text adventure command and call the game function. Map: 'start'/'begin' to start_game, 'look'/'l' to look, 'go north'/'n'/'north' to go+direction, 'take X'/'get X'/'grab X' to take+target, 'use X' to use+target, 'examine X'/'x X' to examine+target, 'talk to X' to talk+target, 'i'/'inventory' to inventory, 'status' to status. For unclear commands use action=unknown. Use conversation history for context if user refers to previous commands.",
    });

    // Use chat for multi-turn context
    const chat = model.startChat({
      history: history.slice(-10), // Keep last 10 exchanges for context
    });

    const result = await chat.sendMessage(command);
    const response = result.response;
    const functionCall = response.functionCalls()?.[0];

    if (!functionCall) {
      return Response.json({
        response: ERROR_MESSAGE,
        sessionId,
      });
    }

    const { action: gameAction, direction, target } = functionCall.args as {
      action: string;
      direction?: string;
      target?: string;
    };

    if (gameAction === "unknown") {
      return Response.json({
        response: ERROR_MESSAGE,
        sessionId,
      });
    }

    // Build args based on action type
    const args: Record<string, string | number> = {};
    if (gameAction === "go" && direction) {
      args.direction = direction;
    } else if (gameAction === "look" && target) {
      args.target = target;
    } else if (gameAction === "take" && target) {
      args.item = target;
    } else if (gameAction === "use" && target) {
      args.item = target;
    } else if (gameAction === "examine" && target) {
      args.target = target;
    } else if (gameAction === "talk" && target) {
      args.character = target;
    }

    const gameResponse = await callMcpTool(sessionId, gameAction, args);

    return Response.json({
      response: gameResponse || ERROR_MESSAGE,
      sessionId,
    });
  } catch (error) {
    console.error("Game API error:", error);
    return Response.json(
      { error: "Failed to process command", details: String(error) },
      { status: 500 }
    );
  }
}
