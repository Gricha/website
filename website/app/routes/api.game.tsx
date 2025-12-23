import { handleGameCommand } from "~/lib/game-api";

export async function action({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const result = await handleGameCommand(body);
    return Response.json(result);
  } catch (error) {
    console.error("Game API error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to process command" },
      { status: 500 }
    );
  }
}
