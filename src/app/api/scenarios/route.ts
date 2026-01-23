import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { type ScenarioInput } from "@/lib/calc";

const DATA_DIR = path.join(process.cwd(), "data", "scenarios");

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// GET: List all scenarios
export async function GET() {
  try {
    await ensureDataDir();
    const files = await fs.readdir(DATA_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const scenarios = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(DATA_DIR, file);
        const content = await fs.readFile(filePath, "utf-8");
        const data = JSON.parse(content);
        return {
          id: file.replace(".json", ""),
          name: data.name || "Unnamed Scenario",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      })
    );

    // Sort by updatedAt descending
    scenarios.sort((a, b) => {
      const timeA = new Date(a.updatedAt || 0).getTime();
      const timeB = new Date(b.updatedAt || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json(scenarios);
  } catch (error) {
    console.error("Error listing scenarios:", error);
    return NextResponse.json({ error: "Failed to list scenarios" }, { status: 500 });
  }
}

// POST: Save a new scenario
export async function POST(request: NextRequest) {
  try {
    await ensureDataDir();

    const body = await request.json();
    const { name, input } = body as { name: string; input: ScenarioInput };

    if (!name || !input) {
      return NextResponse.json({ error: "Name and input are required" }, { status: 400 });
    }

    // Generate ID from timestamp
    const id = `scenario_${Date.now()}`;
    const filePath = path.join(DATA_DIR, `${id}.json`);

    const scenarioData = {
      id,
      name,
      input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(filePath, JSON.stringify(scenarioData, null, 2), "utf-8");

    return NextResponse.json(scenarioData);
  } catch (error) {
    console.error("Error saving scenario:", error);
    return NextResponse.json({ error: "Failed to save scenario" }, { status: 500 });
  }
}
