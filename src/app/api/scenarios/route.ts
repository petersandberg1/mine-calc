import { NextRequest, NextResponse } from "next/server";
import { type ScenarioInput } from "@/lib/calc";
import { getAllScenarios, saveScenario } from "@/lib/kv";

// GET: List all scenarios
export async function GET() {
  try {
    const scenarios = await getAllScenarios();
    return NextResponse.json(scenarios);
  } catch (error) {
    console.error("Error listing scenarios:", error);
    return NextResponse.json({ error: "Failed to list scenarios" }, { status: 500 });
  }
}

// POST: Save a new scenario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, input } = body as { name: string; input: ScenarioInput };

    if (!name || !input) {
      return NextResponse.json({ error: "Name and input are required" }, { status: 400 });
    }

    // Generate ID from timestamp
    const id = `scenario_${Date.now()}`;

    const scenarioData = {
      id,
      name,
      input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const success = await saveScenario(scenarioData);
      if (!success) {
        return NextResponse.json(
          { error: "Failed to save scenario. Check server logs for details." },
          { status: 500 }
        );
      }
      return NextResponse.json(scenarioData);
    } catch (error) {
      console.error("Error saving scenario:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save scenario. Make sure Vercel KV is configured.";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save scenario" },
      { status: 500 }
    );
  }
}
