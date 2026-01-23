import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data", "scenarios");

// GET: Load a specific scenario
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const filePath = path.join(DATA_DIR, `${id}.json`);

    const content = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(content);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error loading scenario:", error);
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }
}

// PUT: Update a scenario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, input } = body as { name?: string; input?: any };

    const filePath = path.join(DATA_DIR, `${id}.json`);

    // Read existing scenario
    const existingContent = await fs.readFile(filePath, "utf-8");
    const existingData = JSON.parse(existingContent);

    // Update fields
    const updatedData = {
      ...existingData,
      ...(name && { name }),
      ...(input && { input }),
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), "utf-8");

    return NextResponse.json(updatedData);
  } catch (error) {
    console.error("Error updating scenario:", error);
    return NextResponse.json({ error: "Failed to update scenario" }, { status: 500 });
  }
}

// DELETE: Delete a scenario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const filePath = path.join(DATA_DIR, `${id}.json`);

    await fs.unlink(filePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scenario:", error);
    return NextResponse.json({ error: "Failed to delete scenario" }, { status: 500 });
  }
}
