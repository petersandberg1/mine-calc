import { NextRequest, NextResponse } from "next/server";
import { getScenario, saveScenario, deleteScenario } from "@/lib/kv";

// GET: Load a specific scenario
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await getScenario(id);

    if (!data) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

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

    // Get existing scenario
    const existingData = await getScenario(id);
    if (!existingData) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    // Update fields
    const updatedData = {
      ...existingData,
      ...(name && { name }),
      ...(input && { input }),
      updatedAt: new Date().toISOString(),
    };

    const success = await saveScenario(updatedData);
    if (!success) {
      return NextResponse.json({ error: "Failed to update scenario" }, { status: 500 });
    }

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
    const success = await deleteScenario(id);

    if (!success) {
      return NextResponse.json({ error: "Failed to delete scenario" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scenario:", error);
    return NextResponse.json({ error: "Failed to delete scenario" }, { status: 500 });
  }
}
