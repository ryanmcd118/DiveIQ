/**
 * Build accordion section summaries from CURRENT FORM VALUES (strings).
 * Used for live updates while typing/selecting.
 */

import type { UnitPreferences } from "@/lib/units";
import { getUnitLabel } from "@/lib/units";

export interface FormSummaryValues {
  siteName?: string;
  maxDepth?: string;
  bottomTime?: string;
  safetyStopDepth?: string;
  safetyStopDuration?: string;
  surfaceIntervalMin?: string;
  waterTempSurface?: string;
  waterTempBottom?: string;
  visibility?: string;
  current?: string;
  gasType?: string;
  fO2?: string;
  tankCylinder?: string;
  startPressure?: string;
  endPressure?: string;
  exposureProtection?: string;
  weightUsed?: string;
  gearKitName?: string;
  gearItemCount?: number;
  gearNotes?: string;
  isTrainingDive?: boolean;
  trainingCourse?: string;
  trainingSkills?: string;
}

function trim(v: string | undefined): string {
  return (v ?? "").trim();
}

export function profileSummaryFromForm(
  v: FormSummaryValues,
  prefs: UnitPreferences
): string | null {
  const parts: string[] = [];
  const depth = trim(v.maxDepth);
  const depthUnit = getUnitLabel("depth", prefs);
  if (depth) parts.push(`Depth ${depth}${depthUnit}`);
  const bt = trim(v.bottomTime);
  if (bt) parts.push(`${bt}min`);
  if (v.safetyStopDepth) {
    const dur = v.safetyStopDuration ? `${v.safetyStopDuration}min` : "";
    parts.push(`SS ${v.safetyStopDepth}${depthUnit}${dur ? `/${dur}` : ""}`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function conditionsSummaryFromForm(
  v: FormSummaryValues,
  prefs: UnitPreferences
): string | null {
  const parts: string[] = [];
  const tempUnit = getUnitLabel("temperature", prefs);
  const temp = trim(v.waterTempSurface) || trim(v.waterTempBottom);
  if (temp) parts.push(`Temp ${temp}${tempUnit}`);
  const vis = trim(v.visibility);
  const visUnit = getUnitLabel("distance", prefs);
  if (vis) parts.push(`Vis ${vis}${visUnit}`);
  if (v.current && v.current !== "None") parts.push(`Current ${v.current}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function gasSummaryFromForm(
  v: FormSummaryValues,
  prefs: UnitPreferences
): string | null {
  const parts: string[] = [];
  if (v.gasType === "Nitrox" && v.fO2) parts.push(`Nitrox ${v.fO2}`);
  else if (v.gasType) parts.push(v.gasType);
  if (v.startPressure || v.endPressure) {
    const unit = getUnitLabel("pressure", prefs);
    parts.push(`${v.startPressure || "—"}→${v.endPressure || "—"} ${unit}`);
  }
  if (v.tankCylinder) parts.push(v.tankCylinder);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function exposureSummaryFromForm(
  v: FormSummaryValues,
  prefs: UnitPreferences
): string | null {
  const parts: string[] = [];
  if (v.exposureProtection) parts.push(v.exposureProtection);
  const weight = trim(v.weightUsed);
  if (weight) parts.push(`${weight}${getUnitLabel("weight", prefs)}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function gearSummaryFromForm(v: FormSummaryValues): string | null {
  const parts: string[] = [];
  if (v.gearKitName) parts.push(`Kit: ${v.gearKitName}`);
  if (v.gearItemCount && v.gearItemCount > 0) parts.push(`${v.gearItemCount} items`);
  if (v.gearNotes) {
    const short = v.gearNotes.length > 20 ? v.gearNotes.slice(0, 17) + "…" : v.gearNotes;
    parts.push(`Notes: ${short}`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function trainingSummaryFromForm(v: FormSummaryValues): string | null {
  if (!v.isTrainingDive) return null;
  const parts: string[] = [];
  if (v.trainingCourse) parts.push(v.trainingCourse);
  if (v.trainingSkills) {
    const skills = v.trainingSkills.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    if (skills.length > 0) parts.push(`Skills: ${skills.slice(0, 3).join(", ")}${skills.length > 3 ? "…" : ""}`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}
