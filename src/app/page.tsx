"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { TopBar } from "@/components/ui/TopBar";
import { calculateScenario, type ScenarioInput, type ScenarioResult } from "@/lib/calc";
import { exportToPDF } from "@/lib/pdfExport";

type View = "login" | "app";

const AUTH_KEY = "presales_proto_authed_v1";

export default function Page() {
  const [view, setView] = useState<View>("login");
  const [loginUser, setLoginUser] = useState("user");
  const [loginPass, setLoginPass] = useState("password");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [input, setInput] = useState<ScenarioInput>({
    // Inputs requested
    materialKtonsPerYear: 5000, // "1000-tals ton" -> ktons (1 = 1000 ton)
    haulDistanceKmOneWay: 2.5,
    avgSpeedLoadedKmph: 25,
    avgSpeedEmptyKmph: 30,
    avgGradePercent: 4,

    queueToLoaderSecondsAvg: 45,
    queueToDumpSecondsAvg: 60,

    loadingTimeMin: 3.5,
    dumpingTimeMin: 1.2,

    uptimePercent: 90,
    shiftChangeMinPerShift: 20,

    // Prices requested
    priceVehicleEur: 250_000,
    priceHwEur: 100_000,
    licenseEurPerYearPerTruck: 50_000,
    siteLicenseEurPerYear: 100_000,
    fmsFixedEurPerYear: 200_000,
    fmsPerTruckEurPerYear: 10_000,
    serviceSekPerKm: 85, // SEK / km
  });

  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<Array<{ id: string; name: string; createdAt: string; updatedAt: string }>>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const authed = typeof window !== "undefined" && localStorage.getItem(AUTH_KEY) === "1";
    setView(authed ? "app" : "login");
    if (authed) {
      loadScenarios();
    }
  }, [view]);

  const loadScenarios = async () => {
    try {
      const response = await fetch("/api/scenarios");
      if (response.ok) {
        const data = await response.json();
        setSavedScenarios(data);
      }
    } catch (error) {
      console.error("Failed to load scenarios:", error);
    }
  };

  const saveScenario = async () => {
    if (!saveName.trim()) {
      alert("Please enter a name for the scenario");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: saveName.trim(), input }),
      });
      if (response.ok) {
        await loadScenarios();
        setShowSaveModal(false);
        setSaveName("");
      } else {
        alert("Failed to save scenario");
      }
    } catch (error) {
      console.error("Failed to save scenario:", error);
      alert("Failed to save scenario");
    } finally {
      setIsLoading(false);
    }
  };

  const loadScenario = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/scenarios/${id}`);
      if (response.ok) {
        const data = await response.json();
        setInput(data.input);
        setResult(null); // Clear results when loading new scenario
      } else {
        alert("Failed to load scenario");
      }
    } catch (error) {
      console.error("Failed to load scenario:", error);
      alert("Failed to load scenario");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteScenario = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scenario?")) return;
    try {
      const response = await fetch(`/api/scenarios/${id}`, { method: "DELETE" });
      if (response.ok) {
        await loadScenarios();
      } else {
        alert("Failed to delete scenario");
      }
    } catch (error) {
      console.error("Failed to delete scenario:", error);
      alert("Failed to delete scenario");
    }
  };

  const onLogin = () => {
    setLoginError(null);
    // Hardcoded auth per your request
    if (loginUser === "user" && loginPass === "password") {
      localStorage.setItem(AUTH_KEY, "1");
      setView("app");
      return;
    }
    setLoginError("Incorrect username or password.");
  };

  const onLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setResult(null);
    setView("login");
  };

  const summary = useMemo(() => {
    if (!result) return null;
    const fmtInt = (n: number) => new Intl.NumberFormat("sv-SE").format(Math.round(n));
    const fmtEur = (n: number) =>
      new Intl.NumberFormat("sv-SE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
    const fmtSek = (n: number) =>
      new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(n);
    const fmtEur2 = (n: number) =>
      new Intl.NumberFormat("sv-SE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);

    return { fmtInt, fmtEur, fmtSek, fmtEur2 };
  }, [result]);

  if (view === "login") {
    return (
      <div className="min-h-screen bg-scania-bg text-scania-ink">
        <TopBar title="Pre-Sales Mining Calculator" onLogout={undefined} />
        <main className="mx-auto max-w-xl px-4 py-10">
          <Card title="Login (prototype)">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="u">Username</Label>
                <Input id="u" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p">Password</Label>
                <Input id="p" type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
              </div>

              {loginError && (
                <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {loginError}
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button onClick={onLogin}>Log in</Button>
                <div className="text-sm text-scania-muted">
                  Demo: <span className="font-mono">user</span> / <span className="font-mono">password</span>
                </div>
              </div>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-scania-bg text-scania-ink">
      <TopBar title="Pre-Sales Mining Calculator" onLogout={onLogout} />

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Total Tonnage Highlight */}
        <div className="mb-6 rounded-2xl border-2 border-scania-accent bg-gradient-to-r from-scania-accent/10 to-scania-accent/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-scania-muted">Total Annual Tonnage</div>
              <div className="mt-1 text-3xl font-bold text-scania-ink">
                {new Intl.NumberFormat("sv-SE").format(input.materialKtonsPerYear * 1000)} tons
              </div>
              <div className="mt-1 text-sm text-scania-muted">
                ({new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 }).format(input.materialKtonsPerYear)} ktons)
              </div>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card
            title="Input"
            subtitle="Simple prototype with hardcoded assumptions. Adjust values and run the calculation."
          >
            <div className="grid gap-6">
              {/* Mine/Quarry Section */}
              <section className="grid gap-3 rounded-xl border border-scania-border bg-white/40 p-4">
                <h3 className="text-base font-semibold tracking-wide text-scania-ink">Mine / Quarry</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Material per year (kton)</Label>
                    <Input
                      type="number"
                      value={input.materialKtonsPerYear}
                      onChange={(e) => setInput((p) => ({ ...p, materialKtonsPerYear: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Distance loading → dump (km, one way)</Label>
                    <Input
                      type="number"
                      value={input.haulDistanceKmOneWay}
                      onChange={(e) => setInput((p) => ({ ...p, haulDistanceKmOneWay: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Spotting time → loader (seconds)</Label>
                    <Input
                      type="number"
                      value={input.queueToLoaderSecondsAvg}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : Number(e.target.value);
                        setInput((p) => ({ ...p, queueToLoaderSecondsAvg: isNaN(val) ? 0 : val }));
                      }}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Spotting time → dump area (seconds)</Label>
                    <Input
                      type="number"
                      value={input.queueToDumpSecondsAvg}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : Number(e.target.value);
                        setInput((p) => ({ ...p, queueToDumpSecondsAvg: isNaN(val) ? 0 : val }));
                      }}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Loading time (min)</Label>
                    <Input
                      type="number"
                      value={input.loadingTimeMin}
                      onChange={(e) => setInput((p) => ({ ...p, loadingTimeMin: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Dumping time (min)</Label>
                    <Input
                      type="number"
                      value={input.dumpingTimeMin}
                      onChange={(e) => setInput((p) => ({ ...p, dumpingTimeMin: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </section>

              {/* Vehicle Section */}
              <section className="grid gap-3 rounded-xl border border-scania-border bg-white/40 p-4">
                <h3 className="text-base font-semibold tracking-wide text-scania-ink">Vehicle</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Speed loaded (km/h)</Label>
                    <Input
                      type="number"
                      value={input.avgSpeedLoadedKmph}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : Number(e.target.value);
                        setInput((p) => ({ ...p, avgSpeedLoadedKmph: isNaN(val) ? 0 : val }));
                      }}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Speed empty (km/h)</Label>
                    <Input
                      type="number"
                      value={input.avgSpeedEmptyKmph}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : Number(e.target.value);
                        setInput((p) => ({ ...p, avgSpeedEmptyKmph: isNaN(val) ? 0 : val }));
                      }}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Average grade (%, affects speed)</Label>
                    <Input
                      type="number"
                      value={input.avgGradePercent}
                      onChange={(e) => setInput((p) => ({ ...p, avgGradePercent: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Uptime (%)</Label>
                    <Input
                      type="number"
                      value={input.uptimePercent}
                      onChange={(e) => setInput((p) => ({ ...p, uptimePercent: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Shift change time (min / shift)</Label>
                    <Input
                      type="number"
                      value={input.shiftChangeMinPerShift}
                      onChange={(e) => setInput((p) => ({ ...p, shiftChangeMinPerShift: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </section>

              {/* Financial Section */}
              <section className="grid gap-3 rounded-xl border border-scania-border bg-white/40 p-4">
                <h3 className="text-base font-semibold tracking-wide text-scania-ink">Financial</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Vehicle (EUR, each)</Label>
                    <Input
                      type="number"
                      value={input.priceVehicleEur}
                      onChange={(e) => setInput((p) => ({ ...p, priceVehicleEur: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>HW (EUR, each)</Label>
                    <Input
                      type="number"
                      value={input.priceHwEur}
                      onChange={(e) => setInput((p) => ({ ...p, priceHwEur: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>License (EUR/year per truck)</Label>
                    <Input
                      type="number"
                      value={input.licenseEurPerYearPerTruck}
                      onChange={(e) =>
                        setInput((p) => ({ ...p, licenseEurPerYearPerTruck: Number(e.target.value) }))
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Site license (EUR/year)</Label>
                    <Input
                      type="number"
                      value={input.siteLicenseEurPerYear}
                      onChange={(e) => setInput((p) => ({ ...p, siteLicenseEurPerYear: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>FMS fixed (EUR/year)</Label>
                    <Input
                      type="number"
                      value={input.fmsFixedEurPerYear}
                      onChange={(e) => setInput((p) => ({ ...p, fmsFixedEurPerYear: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>FMS per truck (EUR/year per truck)</Label>
                    <Input
                      type="number"
                      value={input.fmsPerTruckEurPerYear}
                      onChange={(e) => setInput((p) => ({ ...p, fmsPerTruckEurPerYear: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Service cost (SEK/km)</Label>
                    <Input
                      type="number"
                      value={input.serviceSekPerKm}
                      onChange={(e) => setInput((p) => ({ ...p, serviceSekPerKm: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </section>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => {
                    const r = calculateScenario(input);
                    setResult(r);
                  }}
                  disabled={isLoading}
                >
                  Run calculation
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setResult(null);
                  }}
                  disabled={isLoading}
                >
                  Clear results
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowSaveModal(true)}
                  disabled={isLoading}
                >
                  Save scenario
                </Button>
              </div>

              {/* Saved Scenarios */}
              {savedScenarios.length > 0 && (
                <div className="rounded-xl border border-scania-border bg-white/40 p-4">
                  <h3 className="mb-3 text-sm font-semibold tracking-wide text-scania-ink">Saved Scenarios</h3>
                  <div className="grid gap-2">
                    {savedScenarios.map((scenario) => (
                      <div
                        key={scenario.id}
                        className="flex items-center justify-between rounded-lg border border-scania-border bg-white p-3"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-scania-ink">{scenario.name}</div>
                          <div className="text-xs text-scania-muted">
                            {new Date(scenario.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => loadScenario(scenario.id)}
                            disabled={isLoading}
                          >
                            Load
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => deleteScenario(scenario.id)}
                            disabled={isLoading}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Modal */}
              {showSaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="w-full max-w-md rounded-2xl border border-scania-border bg-white p-6 shadow-lg">
                    <h3 className="mb-4 text-lg font-semibold text-scania-ink">Save Scenario</h3>
                    <div className="mb-4">
                      <Label htmlFor="scenario-name">Scenario Name</Label>
                      <Input
                        id="scenario-name"
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        placeholder="Enter scenario name"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveScenario();
                          if (e.key === "Escape") setShowSaveModal(false);
                        }}
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={saveScenario} disabled={isLoading || !saveName.trim()}>
                        {isLoading ? "Saving..." : "Save"}
                      </Button>
                      <Button variant="secondary" onClick={() => setShowSaveModal(false)} disabled={isLoading}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-scania-border bg-white/60 p-4 text-sm text-scania-muted">
                <div className="font-semibold text-scania-ink">Hardcoded assumptions (V0)</div>
                <ul className="mt-2 list-disc pl-5">
                  <li>Payload per load: 40 tons</li>
                  <li>Operation: 20 h/day, 2 shifts/day, 365 days/year</li>
                  <li>Spotting times: separate times for loader and dump area (in seconds)</li>
                  <li>Grade impact: simple speed reduction (see code)</li>
                  <li>Currency conversion: OPEX shown in EUR + service separately in SEK (currently)</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card title="Results" subtitle="Rough price indication level (prototype)">
            {!result || !summary ? (
              <div className="text-sm text-scania-muted">Run the calculation to see results.</div>
            ) : (
              <div className="grid gap-5">
                <div className="grid gap-3 rounded-2xl border border-scania-border bg-white p-4">
                  <div className="text-sm font-semibold text-scania-muted">Fleet sizing</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Kpi label="Number of trucks" value={summary.fmtInt(result.trucksNeeded)} />
                    <Kpi label="Annual tonnage (tons)" value={summary.fmtInt(result.tonsPerYearTarget)} />
                    <Kpi label="Tons per truck and year (tons)" value={summary.fmtInt(result.tonsPerTruckPerYear)} />
                    <Kpi label="Cycle time (min)" value={result.cycleTimeMinutes.toFixed(2)} />
                  </div>
                </div>

                <div className="grid gap-3 rounded-2xl border border-scania-border bg-white p-4">
                  <div className="text-sm font-semibold text-scania-muted">Cost</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Kpi label="CAPEX (EUR)" value={summary.fmtEur(result.capexEur)} />
                    <Kpi label="OPEX/year (EUR)" value={summary.fmtEur(result.opexEurPerYear)} />
                    <Kpi label="Service/year (SEK)" value={summary.fmtSek(result.serviceSekPerYear)} />
                    <Kpi
                      label="Cost per ton (Year 1, EUR/ton)"
                      value={summary.fmtEur2(result.costPerTonYear1Eur)}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-scania-border bg-white p-4">
                  <div className="text-sm font-semibold text-scania-muted">Explain (breakdown)</div>
                  <div className="mt-2 grid gap-1 text-sm text-scania-ink">
                    {Object.entries(result.explain).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-4">
                        <div className="text-scania-muted">{k}</div>
                        <div className="font-mono">{typeof v === "number" ? v.toFixed(4) : String(v)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <Button
                    onClick={async () => {
                      if (result) {
                        try {
                          setIsLoading(true);
                          await exportToPDF(result, input);
                        } catch (error) {
                          console.error("Failed to export PDF:", error);
                          alert("Failed to export PDF. Please make sure Scania_logo.png is in the public folder.");
                        } finally {
                          setIsLoading(false);
                        }
                      }
                    }}
                    disabled={isLoading || !result}
                  >
                    {isLoading ? "Exporting..." : "Export to PDF"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-scania-surface p-3">
      <div className="text-xs font-semibold tracking-wide text-scania-muted">{label}</div>
      <div className="mt-1 text-lg font-semibold text-scania-ink">{value}</div>
    </div>
  );
}