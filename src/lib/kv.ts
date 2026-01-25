import { kv } from "@vercel/kv";
import { type ScenarioInput } from "./calc";

export type ScenarioData = {
  id: string;
  name: string;
  input: ScenarioInput;
  createdAt: string;
  updatedAt: string;
};

const SCENARIOS_KEY = "scenarios";
const SCENARIO_PREFIX = "scenario:";

// Check if KV is configured
function checkKVConfig() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    throw new Error(
      "Vercel KV is not configured. Please create a KV database in your Vercel project and add the environment variables."
    );
  }
}

// Get all scenario IDs
export async function getAllScenarioIds(): Promise<string[]> {
  try {
    checkKVConfig();
    const ids = await kv.smembers(SCENARIOS_KEY);
    return ids.map((id) => String(id));
  } catch (error) {
    console.error("Error getting scenario IDs:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    return [];
  }
}

// Get a single scenario
export async function getScenario(id: string): Promise<ScenarioData | null> {
  try {
    checkKVConfig();
    const data = await kv.get<ScenarioData>(`${SCENARIO_PREFIX}${id}`);
    return data;
  } catch (error) {
    console.error("Error getting scenario:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    return null;
  }
}

// Save a scenario
export async function saveScenario(scenario: ScenarioData): Promise<boolean> {
  try {
    checkKVConfig();
    // Save the scenario data
    await kv.set(`${SCENARIO_PREFIX}${scenario.id}`, scenario);
    // Add to the set of all scenario IDs
    await kv.sadd(SCENARIOS_KEY, scenario.id);
    return true;
  } catch (error) {
    console.error("Error saving scenario:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      // Re-throw to get better error messages in API
      throw error;
    }
    return false;
  }
}

// Delete a scenario
export async function deleteScenario(id: string): Promise<boolean> {
  try {
    checkKVConfig();
    // Remove from the set
    await kv.srem(SCENARIOS_KEY, id);
    // Delete the scenario data
    await kv.del(`${SCENARIO_PREFIX}${id}`);
    return true;
  } catch (error) {
    console.error("Error deleting scenario:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    return false;
  }
}

// Get all scenarios (list view)
export async function getAllScenarios(): Promise<Array<{ id: string; name: string; createdAt: string; updatedAt: string }>> {
  try {
    const ids = await getAllScenarioIds();
    const scenarios = await Promise.all(
      ids.map(async (id) => {
        const data = await getScenario(id);
        if (!data) return null;
        return {
          id: data.id,
          name: data.name,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      })
    );

    // Filter out nulls and sort by updatedAt
    const validScenarios = scenarios.filter((s): s is NonNullable<typeof s> => s !== null);
    validScenarios.sort((a, b) => {
      const timeA = new Date(a.updatedAt || 0).getTime();
      const timeB = new Date(b.updatedAt || 0).getTime();
      return timeB - timeA;
    });

    return validScenarios;
  } catch (error) {
    console.error("Error getting all scenarios:", error);
    return [];
  }
}
