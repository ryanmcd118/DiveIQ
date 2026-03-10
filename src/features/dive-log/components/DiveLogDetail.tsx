"use client";

import type { DiveLogEntry } from "@/features/dive-log/types";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import {
  displayDepth,
  displayTemperature,
  displayDistance,
  formatPressureForDisplay,
  formatWeightForDisplay,
  getUnitLabel,
} from "@/lib/units";
import cardStyles from "@/styles/components/Card.module.css";
import layoutStyles from "@/styles/components/Layout.module.css";
import detailStyles from "./LogbookLayout.module.css";

function parseDiveTypeTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseTrainingSkills(skills: string | null | undefined): string[] {
  if (!skills) return [];
  return skills
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
  isEmpty?: boolean;
}

function DetailSection({ title, children, isEmpty }: DetailSectionProps) {
  if (isEmpty) return null;
  return (
    <section
      style={{
        paddingBottom: "var(--space-4)",
        borderBottom: "1px solid var(--color-border-subtle)",
        marginBottom: "var(--space-4)",
      }}
    >
      <h3
        style={{
          fontSize: "var(--font-size-xs)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
          marginBottom: "var(--space-2)",
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

interface DiveLogDetailProps {
  entry: DiveLogEntry;
  gearLoading?: boolean;
}

export function DiveLogDetail({
  entry,
  gearLoading = false,
}: DiveLogDetailProps) {
  const { prefs } = useUnitPreferences();

  const depth = displayDepth(entry.maxDepthCm, prefs.depth);
  const waterTemp = entry.waterTempCx10
    ? displayTemperature(entry.waterTempCx10, prefs.temperature)
    : null;
  const waterTempBottom = entry.waterTempBottomCx10
    ? displayTemperature(entry.waterTempBottomCx10, prefs.temperature)
    : null;
  const visibility = entry.visibilityCm
    ? displayDistance(entry.visibilityCm, prefs.depth)
    : null;

  const gasLabel =
    entry.gasType === "Nitrox" && entry.fO2 != null
      ? `Nitrox ${entry.fO2}%`
      : entry.gasType || "Air";

  const atGlanceParts = [
    depth.value ? `${depth.value}${depth.unit}` : null,
    entry.bottomTime != null ? `${entry.bottomTime} min` : null,
    waterTemp
      ? `${waterTemp.value}${waterTemp.unit}`
      : waterTempBottom
        ? `${waterTempBottom.value}${waterTempBottom.unit}`
        : null,
    visibility ? `${visibility.value}${visibility.unit} vis` : null,
    gasLabel,
  ].filter(Boolean);

  const hasConditions =
    waterTemp ||
    waterTempBottom ||
    visibility ||
    (entry.current && entry.current !== "None");

  const hasGas =
    entry.gasType ||
    entry.tankCylinder ||
    entry.startPressureBar != null ||
    entry.endPressureBar != null;

  const hasExposure = entry.exposureProtection || entry.weightUsedKg != null;

  const hasTraining =
    entry.isTrainingDive &&
    (entry.trainingCourse || entry.trainingInstructor || entry.trainingSkills);

  const hasGear =
    (entry.gearItems && entry.gearItems.length > 0) || Boolean(entry.gearNotes);

  const diveTypeTags = parseDiveTypeTags(entry.diveTypeTags);

  return (
    <article className={cardStyles.card}>
      {/* Header: Site name + Location/Region beneath + Date prominent */}
      <header
        style={{
          paddingBottom: "var(--space-4)",
          borderBottom: "1px solid var(--color-border-subtle)",
          marginBottom: "var(--space-4)",
        }}
      >
        <p
          style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-muted)",
            marginBottom: "var(--space-1)",
          }}
        >
          {entry.date}
          {entry.startTime && ` · ${entry.startTime}`}
          {entry.diveNumber != null && ` · Dive #${entry.diveNumber}`}
        </p>
        <h2 className={layoutStyles.pageTitle} style={{ fontSize: "1.25rem" }}>
          {entry.siteName}
        </h2>
        {entry.region && (
          <p
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
            }}
          >
            {entry.region}
          </p>
        )}
        {entry.buddyName && (
          <p
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
              marginTop: "var(--space-1)",
            }}
          >
            Buddy: {entry.buddyName}
          </p>
        )}
        {diveTypeTags.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-1)",
              marginTop: "var(--space-2)",
            }}
          >
            {diveTypeTags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: "var(--font-size-xs)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-surface-elevated)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* At-a-glance strip */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-4)",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-secondary)",
          marginBottom: "var(--space-4)",
        }}
      >
        {atGlanceParts.join(" · ")}
      </div>

      {/* Profile */}
      <DetailSection
        title="Profile"
        isEmpty={
          !depth.value &&
          entry.bottomTime == null &&
          !entry.safetyStopDepthCm &&
          !entry.surfaceIntervalMin
        }
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-4)",
            fontSize: "var(--font-size-sm)",
          }}
        >
          {depth.value && (
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>Max depth</div>
              <div>{`${depth.value}${depth.unit}`}</div>
            </div>
          )}
          {entry.bottomTime != null && (
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>
                Bottom time
              </div>
              <div>{entry.bottomTime} min</div>
            </div>
          )}
          {entry.safetyStopDepthCm != null && (
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>
                Safety stop
              </div>
              <div>
                {displayDepth(entry.safetyStopDepthCm, prefs.depth).value}
                {displayDepth(entry.safetyStopDepthCm, prefs.depth).unit}
                {entry.safetyStopDurationMin != null &&
                  ` · ${entry.safetyStopDurationMin} min`}
              </div>
            </div>
          )}
          {entry.surfaceIntervalMin != null && (
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>
                Surface interval
              </div>
              <div>{entry.surfaceIntervalMin} min</div>
            </div>
          )}
          {!depth.value &&
            entry.bottomTime == null &&
            !entry.safetyStopDepthCm &&
            !entry.surfaceIntervalMin && (
              <div style={{ color: "var(--color-text-muted)" }}>—</div>
            )}
        </div>
      </DetailSection>

      {/* Conditions */}
      <DetailSection title="Conditions" isEmpty={!hasConditions}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-4)",
            fontSize: "var(--font-size-sm)",
          }}
        >
          {(waterTemp || waterTempBottom) && (
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>Water temp</div>
              <div>
                {waterTemp ? `${waterTemp.value}${waterTemp.unit}` : "—"}
                {waterTempBottom && (
                  <span>
                    {" "}
                    / {waterTempBottom.value}
                    {waterTempBottom.unit} (bottom)
                  </span>
                )}
              </div>
            </div>
          )}
          {visibility && (
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>Visibility</div>
              <div>{`${visibility.value}${visibility.unit}`}</div>
            </div>
          )}
          {entry.current && entry.current !== "None" && (
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>Current</div>
              <div>{entry.current}</div>
            </div>
          )}
        </div>
      </DetailSection>

      {/* Gas */}
      <DetailSection title="Gas" isEmpty={!hasGas}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-4)",
            fontSize: "var(--font-size-sm)",
          }}
        >
          {entry.gasType && (
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>Gas type</div>
              <div>{gasLabel}</div>
            </div>
          )}
          {entry.tankCylinder && (
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>
                Tank / cylinder
              </div>
              <div>{entry.tankCylinder}</div>
            </div>
          )}
          {(entry.startPressureBar != null || entry.endPressureBar != null) && (
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>Pressure</div>
              <div>
                {entry.startPressureBar != null
                  ? `${formatPressureForDisplay(entry.startPressureBar, prefs.pressure)} ${getUnitLabel("pressure", prefs)}`
                  : "—"}
                {" → "}
                {entry.endPressureBar != null
                  ? `${formatPressureForDisplay(entry.endPressureBar, prefs.pressure)} ${getUnitLabel("pressure", prefs)}`
                  : "—"}
              </div>
            </div>
          )}
        </div>
      </DetailSection>

      {/* Exposure & Weight */}
      <DetailSection title="Exposure & Weight" isEmpty={!hasExposure}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-4)",
            fontSize: "var(--font-size-sm)",
          }}
        >
          {entry.exposureProtection && (
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>
                Exposure protection
              </div>
              <div>{entry.exposureProtection}</div>
            </div>
          )}
          {entry.weightUsedKg != null && (
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>
                Weight used
              </div>
              <div>
                {formatWeightForDisplay(entry.weightUsedKg, prefs.weight)}{" "}
                {getUnitLabel("weight", prefs)}
              </div>
            </div>
          )}
        </div>
      </DetailSection>

      {/* Gear used */}
      <DetailSection title="Gear used" isEmpty={!hasGear}>
        {gearLoading ? (
          <p
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
            }}
          >
            Loading gear…
          </p>
        ) : entry.gearItems && entry.gearItems.length > 0 ? (
          <ul
            style={{
              listStyle: "disc",
              paddingLeft: "1.25rem",
              fontSize: "var(--font-size-sm)",
            }}
          >
            {entry.gearItems.map((gear) => (
              <li key={gear.id} style={{ marginBottom: "var(--space-1)" }}>
                {gear.nickname || `${gear.manufacturer} ${gear.model}`.trim()}
              </li>
            ))}
          </ul>
        ) : (
          <p className={detailStyles.emptyState}>No gear recorded.</p>
        )}
        {entry.gearNotes && (
          <p
            style={{
              fontSize: "var(--font-size-sm)",
              marginTop: "var(--space-2)",
              color: "var(--color-text-secondary)",
            }}
          >
            {entry.gearNotes}
          </p>
        )}
      </DetailSection>

      {/* Training */}
      <DetailSection title="Training" isEmpty={!hasTraining}>
        <div style={{ fontSize: "var(--font-size-sm)" }}>
          {entry.trainingCourse && (
            <p style={{ marginBottom: "var(--space-2)" }}>
              <span style={{ color: "var(--color-text-muted)" }}>Course: </span>
              {entry.trainingCourse}
            </p>
          )}
          {entry.trainingInstructor && (
            <p style={{ marginBottom: "var(--space-2)" }}>
              <span style={{ color: "var(--color-text-muted)" }}>
                Instructor / DM:{" "}
              </span>
              {entry.trainingInstructor}
            </p>
          )}
          {entry.trainingSkills &&
            parseTrainingSkills(entry.trainingSkills).length > 0 && (
              <p>
                <span style={{ color: "var(--color-text-muted)" }}>
                  Skills:{" "}
                </span>
                {parseTrainingSkills(entry.trainingSkills).join(", ")}
              </p>
            )}
        </div>
      </DetailSection>

      {/* Notes - always shown */}
      <section
        style={{
          paddingBottom: "var(--space-4)",
          borderBottom: "1px solid var(--color-border-subtle)",
          marginBottom: "var(--space-4)",
        }}
      >
        <h3
          style={{
            fontSize: "var(--font-size-xs)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
            marginBottom: "var(--space-2)",
          }}
        >
          Notes
        </h3>
        <p
          style={{
            whiteSpace: "pre-wrap",
            fontSize: "var(--font-size-sm)",
            color: entry.notes
              ? "var(--color-text-primary)"
              : "var(--color-text-muted)",
          }}
        >
          {entry.notes || "No notes recorded."}
        </p>
      </section>
    </article>
  );
}
