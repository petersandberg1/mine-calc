export type ScenarioInput = {
  materialKtonsPerYear: number;

  haulDistanceKmOneWay: number;
  avgSpeedLoadedKmph: number;
  avgSpeedEmptyKmph: number;
  avgGradePercent: number;

  queueToLoaderSecondsAvg: number;
  queueToDumpSecondsAvg: number;

  loadingTimeMin: number;
  dumpingTimeMin: number;

  uptimePercent: number;
  shiftChangeMinPerShift: number;

  priceVehicleEur: number;
  priceHwEur: number;
  licenseEurPerYearPerTruck: number;
  siteLicenseEurPerYear: number;
  fmsFixedEurPerYear: number;
  fmsPerTruckEurPerYear: number;

  serviceSekPerKm: number;
};

export type ScenarioResult = {
  trucksNeeded: number;

  tonsPerYearTarget: number;
  tonsPerTruckPerYear: number;

  cycleTimeMinutes: number;

  capexEur: number;
  opexEurPerYear: number;
  serviceSekPerYear: number;

  costPerTonYear1Eur: number;

  explain: Record<string, number | string>;
};

const ASSUMPTIONS = {
  payloadTonsPerTrip: 40, // hardcoded V0
  hoursPerDay: 20, // hardcoded V0
  shiftsPerDay: 2, // hardcoded V0
  daysPerYear: 365, // hardcoded V0

  // Very simple penalty: effectiveSpeed = speed * max(0.6, 1 - k*|grade|)
  gradePenaltyK: 0.02,
  minSpeedFactor: 0.6,
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function calculateScenario(input: ScenarioInput): ScenarioResult {
  // Material input is in ktons (thousand tons)
  const tonsPerYearTarget = Math.max(0, input.materialKtonsPerYear) * 1000;

  const haulKmOneWay = Math.max(0, input.haulDistanceKmOneWay);
  const haulKmRoundTrip = haulKmOneWay * 2;

  // Speed adjusted for grade (very simple prototype model)
  const gradeAbs = Math.abs(input.avgGradePercent || 0);
  const speedFactor = clamp(1 - ASSUMPTIONS.gradePenaltyK * gradeAbs, ASSUMPTIONS.minSpeedFactor, 1);
  
  // Use loaded speed for loaded leg, empty speed for empty leg
  // Handle undefined/NaN values by defaulting to reasonable values
  const avgSpeedLoadedKmph = Number.isNaN(Number(input.avgSpeedLoadedKmph)) || input.avgSpeedLoadedKmph == null ? 25 : Number(input.avgSpeedLoadedKmph);
  const avgSpeedEmptyKmph = Number.isNaN(Number(input.avgSpeedEmptyKmph)) || input.avgSpeedEmptyKmph == null ? 30 : Number(input.avgSpeedEmptyKmph);
  const effectiveSpeedLoadedKmph = Math.max(1, avgSpeedLoadedKmph) * speedFactor;
  const effectiveSpeedEmptyKmph = Math.max(1, avgSpeedEmptyKmph) * speedFactor;

  // Travel time on main haul (loaded one way, empty one way)
  const travelHoursLoaded = haulKmOneWay / effectiveSpeedLoadedKmph;
  const travelHoursEmpty = haulKmOneWay / effectiveSpeedEmptyKmph;
  const travelMinutes = (travelHoursLoaded + travelHoursEmpty) * 60;

  // Maneuver/queue segments (now in seconds, convert to minutes)
  // Handle undefined/NaN values
  const queueToLoaderSeconds = Number.isNaN(Number(input.queueToLoaderSecondsAvg)) || input.queueToLoaderSecondsAvg == null ? 0 : Number(input.queueToLoaderSecondsAvg);
  const queueToDumpSeconds = Number.isNaN(Number(input.queueToDumpSecondsAvg)) || input.queueToDumpSecondsAvg == null ? 0 : Number(input.queueToDumpSecondsAvg);
  const queueMinutes = (Math.max(0, queueToLoaderSeconds) + Math.max(0, queueToDumpSeconds)) / 60;

  const loadingMinutes = Math.max(0, input.loadingTimeMin);
  const dumpingMinutes = Math.max(0, input.dumpingTimeMin);

  const cycleTimeMinutes = travelMinutes + queueMinutes + loadingMinutes + dumpingMinutes;

  // Effective operating time per year
  const uptime = clamp((input.uptimePercent ?? 90) / 100, 0, 1);

  const shiftChangeHoursPerDay =
    (Math.max(0, input.shiftChangeMinPerShift) * ASSUMPTIONS.shiftsPerDay) / 60;

  const effectiveHoursPerDay = Math.max(0, ASSUMPTIONS.hoursPerDay - shiftChangeHoursPerDay);
  const effectiveHoursPerYear = effectiveHoursPerDay * ASSUMPTIONS.daysPerYear * uptime;

  // Throughput
  const cyclesPerHour = cycleTimeMinutes > 0 ? 60 / cycleTimeMinutes : 0;
  const tonsPerHourPerTruck = cyclesPerHour * ASSUMPTIONS.payloadTonsPerTrip;
  const tonsPerTruckPerYear = tonsPerHourPerTruck * effectiveHoursPerYear;

  const trucksNeeded = tonsPerTruckPerYear > 0 ? Math.ceil(tonsPerYearTarget / tonsPerTruckPerYear) : 0;

  // Costs
  const capexEur = trucksNeeded * (Math.max(0, input.priceVehicleEur) + Math.max(0, input.priceHwEur));

  const licenseEur = trucksNeeded * Math.max(0, input.licenseEurPerYearPerTruck);
  const siteLicenseEur = Math.max(0, input.siteLicenseEurPerYear);
  const fmsEur = Math.max(0, input.fmsFixedEurPerYear) + trucksNeeded * Math.max(0, input.fmsPerTruckEurPerYear);

  // Distance per cycle (haul round trip, queue segments are time-based now)
  const kmPerCycle = haulKmRoundTrip;
  const cyclesPerYearPerTruck = cyclesPerHour * effectiveHoursPerYear;
  const kmPerYearPerTruck = kmPerCycle * cyclesPerYearPerTruck;
  const kmPerYearFleet = kmPerYearPerTruck * trucksNeeded;

  const serviceSekPerYear = kmPerYearFleet * Math.max(0, input.serviceSekPerKm);

  // OPEX in EUR (excluding service SEK for now, since you gave SEK input)
  const opexEurPerYear = licenseEur + siteLicenseEur + fmsEur;

  // Cost per ton (Year 1) in EUR/ton: (CAPEX + OPEX) / annual tons
  const costPerTonYear1Eur = tonsPerYearTarget > 0 ? (capexEur + opexEurPerYear) / tonsPerYearTarget : 0;

  return {
    trucksNeeded,
    tonsPerYearTarget,
    tonsPerTruckPerYear,

    cycleTimeMinutes,

    capexEur,
    opexEurPerYear,
    serviceSekPerYear,

    costPerTonYear1Eur,

    explain: {
      payloadTonsPerTrip: ASSUMPTIONS.payloadTonsPerTrip,
      hoursPerDay: ASSUMPTIONS.hoursPerDay,
      shiftsPerDay: ASSUMPTIONS.shiftsPerDay,
      daysPerYear: ASSUMPTIONS.daysPerYear,
      uptime: uptime,
      gradeAbsPercent: gradeAbs,
      speedFactor,
      effectiveSpeedLoadedKmph,
      effectiveSpeedEmptyKmph,
      haulKmRoundTrip,
      queueSeconds: queueToLoaderSeconds + queueToDumpSeconds,
      cycleTimeMinutes,
      cyclesPerHour,
      effectiveHoursPerYear,
      tonsPerTruckPerYear,
      kmPerYearFleet,
      opexEurPerYear,
    },
  };
}