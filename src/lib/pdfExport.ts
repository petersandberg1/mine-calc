"use client";

import { jsPDF } from "jspdf";
import { type ScenarioResult, type ScenarioInput } from "./calc";

export async function exportToPDF(
  result: ScenarioResult,
  input: ScenarioInput,
  scenarioName?: string
) {
  // Dynamic import for jspdf-autotable v5 (client-side only)
  const { autoTable } = await import("jspdf-autotable");
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Helper function to format numbers
  const fmtInt = (n: number) => new Intl.NumberFormat("sv-SE").format(Math.round(n));
  const fmtEur = (n: number) =>
    new Intl.NumberFormat("sv-SE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  const fmtSek = (n: number) =>
    new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(n);
  const fmtEur2 = (n: number) =>
    new Intl.NumberFormat("sv-SE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);

  // Load and add Scania logo
  try {
    const logoResponse = await fetch("/Scania_logo.png");
    if (logoResponse.ok) {
      const logoBlob = await logoResponse.blob();
      const logoUrl = URL.createObjectURL(logoBlob);
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = logoUrl;
      });
      
      // Add logo at top right (scaled to fit)
      const logoWidth = 40;
      const logoHeight = (img.height / img.width) * logoWidth;
      doc.addImage(img, "PNG", pageWidth - margin - logoWidth, margin, logoWidth, logoHeight);
      URL.revokeObjectURL(logoUrl);
    }
  } catch (error) {
    console.warn("Could not load Scania logo:", error);
  }

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Pre-Sales Mining Calculator", margin, yPos);
  yPos += 10;

  if (scenarioName) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Scenario: ${scenarioName}`, margin, yPos);
    yPos += 8;
  }

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString("sv-SE")}`, margin, yPos);
  yPos += 15;

  // Fleet Sizing Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Fleet Sizing", margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: [
      ["Number of trucks", fmtInt(result.trucksNeeded)],
      ["Annual tonnage (tons)", fmtInt(result.tonsPerYearTarget)],
      ["Tons per truck and year (tons)", fmtInt(result.tonsPerTruckPerYear)],
      ["Cycle time (min)", result.cycleTimeMinutes.toFixed(2)],
    ],
    theme: "striped",
    headStyles: { fillColor: [0, 102, 153] }, // Scania blue
    styles: { fontSize: 10 },
    margin: { left: margin, right: margin },
  });
  yPos = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 15 : yPos + 50;

  // Cost Section
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = margin;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Cost Analysis", margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [["Cost Item", "Value"]],
    body: [
      ["CAPEX (EUR)", fmtEur(result.capexEur)],
      ["OPEX/year (EUR)", fmtEur(result.opexEurPerYear)],
      ["Service/year (SEK)", fmtSek(result.serviceSekPerYear)],
      ["Cost per ton (Year 1, EUR/ton)", fmtEur2(result.costPerTonYear1Eur)],
    ],
    theme: "striped",
    headStyles: { fillColor: [0, 102, 153] },
    styles: { fontSize: 10 },
    margin: { left: margin, right: margin },
  });
  yPos = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 15 : yPos + 50;

  // Input Parameters Section
  if (yPos > pageHeight - 100) {
    doc.addPage();
    yPos = margin;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Input Parameters", margin, yPos);
  yPos += 8;

  const inputRows = [
    ["Material per year (kton)", fmtInt(input.materialKtonsPerYear)],
    ["Distance loading → dump (km, one way)", input.haulDistanceKmOneWay.toFixed(2)],
    ["Speed loaded (km/h)", fmtInt(input.avgSpeedLoadedKmph)],
    ["Speed empty (km/h)", fmtInt(input.avgSpeedEmptyKmph)],
    ["Average grade (%)", input.avgGradePercent.toFixed(1)],
    ["Spotting time → loader (seconds)", fmtInt(input.queueToLoaderSecondsAvg)],
    ["Spotting time → dump area (seconds)", fmtInt(input.queueToDumpSecondsAvg)],
    ["Loading time (min)", input.loadingTimeMin.toFixed(1)],
    ["Dumping time (min)", input.dumpingTimeMin.toFixed(1)],
    ["Uptime (%)", input.uptimePercent.toFixed(1)],
    ["Shift change time (min/shift)", input.shiftChangeMinPerShift.toFixed(1)],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["Parameter", "Value"]],
    body: inputRows,
    theme: "striped",
    headStyles: { fillColor: [0, 102, 153] },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });
  yPos = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 15 : yPos + 50;

  // Financial Parameters
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = margin;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Financial Parameters", margin, yPos);
  yPos += 8;

  const financialRows = [
    ["Vehicle (EUR, each)", fmtEur(input.priceVehicleEur)],
    ["HW (EUR, each)", fmtEur(input.priceHwEur)],
    ["License (EUR/year per truck)", fmtEur(input.licenseEurPerYearPerTruck)],
    ["Site license (EUR/year)", fmtEur(input.siteLicenseEurPerYear)],
    ["FMS fixed (EUR/year)", fmtEur(input.fmsFixedEurPerYear)],
    ["FMS per truck (EUR/year per truck)", fmtEur(input.fmsPerTruckEurPerYear)],
    ["Service cost (SEK/km)", fmtSek(input.serviceSekPerKm)],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["Parameter", "Value"]],
    body: financialRows,
    theme: "striped",
    headStyles: { fillColor: [0, 102, 153] },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });

  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount} - Pre-Sales Mining Calculator`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  // Save PDF
  const fileName = scenarioName
    ? `Mining_Calculator_${scenarioName.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
    : `Mining_Calculator_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}
