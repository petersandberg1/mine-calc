import Redis from "ioredis";
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

// Init Redis-klient
function createRedisClient() {
  if (!process.env.REDIS_URL) {
    throw new Error(
      "Redis är inte konfigurerat. Sätt REDIS_URL i dina environment variables."
    );
  }

  // ioredis samlar själv connection för återanvändning
  return new Redis(process.env.REDIS_URL);
}

const redis = createRedisClient();

// Get all scenario IDs
export async function getAllScenarioIds(): Promise<string[]> {
  try {
    const ids = await redis.smembers(SCENARIOS_KEY);
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
    const raw = await redis.get(`${SCENARIO_PREFIX}${id}`);
    if (!raw) return null;

    const data = JSON.parse(raw) as ScenarioData;
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
    const key = `${SCENARIO_PREFIX}${scenario.id}`;

    // Spara scenariot som JSON
    await redis.set(key, JSON.stringify(scenario));

    // Lägg till i mängden med alla IDs
    await redis.sadd(SCENARIOS_KEY, scenario.id);

    return true;
  } catch (error) {
    console.error("Error saving scenario:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      throw error; // som du gjorde tidigare
    }
    return false;
  }
}

// Delete a scenario
export async function deleteScenario(id: string): Promise<boolean> {
  try {
    const key = `${SCENARIO_PREFIX}${id}`;

    // Ta bort från setet
    await redis.srem(SCENARIOS_KEY, id);

    // Ta bort själva datat
    await redis.del(key);

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
export async function getAllScenarios(): Promise<
  Array<{ id: string; name: string; createdAt: string; updatedAt: string }>
> {
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

    const validScenarios = scenarios.filter(
      (s): s is NonNullable<typeof s> => s !== null
    );

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