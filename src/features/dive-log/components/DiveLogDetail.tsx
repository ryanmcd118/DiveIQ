"use client";

import type { DiveLogEntry } from "@/features/dive-log/types";
import { useUnitPreferences } from "@/hooks/useUnitPreferences";
import {
  displayDepth,
  displayTemperature,
  displayDistance,
} from "@/lib/units";
import cardStyles from "@/styles/components/Card.module.css";
import layoutStyles from "@/styles/components/Layout.module.css";
import detailStyles from "./LogbookLayout.module.css";

interface DiveLogDetailProps {
  entry: DiveLogEntry;
  gearLoading?: boolean;
}

export function DiveLogDetail({ entry, gearLoading = false }: DiveLogDetailProps) {
  const { prefs } = useUnitPreferences();

  const depth = displayDepth(entry.maxDepthCm, prefs.depth);
  const waterTemp = entry.waterTempCx10
    ? displayTemperature(entry.waterTempCx10, prefs.temperature)
    : null;
  const visibility = entry.visibilityCm
    ? displayDistance(entry.visibilityCm, prefs.depth)
    : null;

  return (
    <article className={cardStyles.card}>
      {/* Header */}
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
        </p>
        <h2 className={layoutStyles.pageTitle} style={{ fontSize: "1.25rem" }}>
          {entry.siteName}
        </h2>
        <p
          style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-muted)",
          }}
        >
          {entry.region}
        </p>
      </header>

      {/* Profile section */}
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
          Profile
        </h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-4)",
            fontSize: "var(--font-size-sm)",
          }}
        >
          <div>
            <div style={{ color: "var(--color-text-muted)" }}>Max depth</div>
            <div>
              {depth.value}
              {depth.unit}
            </div>
          </div>
          <div>
            <div style={{ color: "var(--color-text-muted)" }}>Bottom time</div>
            <div>{entry.bottomTime} min</div>
          </div>
        </div>
      </section>

      {/* Conditions */}
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
          Conditions
        </h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-4)",
            fontSize: "var(--font-size-sm)",
          }}
        >
          <div>
            <div style={{ color: "var(--color-text-muted)" }}>Water temp</div>
            <div>
              {waterTemp
                ? `${waterTemp.value}${waterTemp.unit}`
                : "Not recorded"}
            </div>
          </div>
          <div>
            <div style={{ color: "var(--color-text-muted)" }}>Visibility</div>
            <div>
              {visibility
                ? `${visibility.value}${visibility.unit}`
                : "Not recorded"}
            </div>
          </div>
        </div>
      </section>

      {/* Buddy & notes */}
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
          Buddy & Notes
        </h3>
        <div style={{ fontSize: "var(--font-size-sm)" }}>
          <p style={{ marginBottom: "var(--space-2)" }}>
            <span style={{ color: "var(--color-text-muted)" }}>Buddy: </span>
            {entry.buddyName || "Not recorded"}
          </p>
          <p
            style={{
              whiteSpace: "pre-wrap",
              color: entry.notes
                ? "var(--color-text-primary)"
                : "var(--color-text-muted)",
            }}
          >
            {entry.notes || "No additional notes for this dive."}
          </p>
        </div>
      </section>

      {/* Gear used */}
      <section>
        <h3
          style={{
            fontSize: "var(--font-size-xs)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
            marginBottom: "var(--space-2)",
          }}
        >
          Gear used
        </h3>
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
                {gear.nickname ||
                  `${gear.manufacturer} ${gear.model}`.trim()}
              </li>
            ))}
          </ul>
        ) : (
          <p className={detailStyles.emptyState}>No gear recorded.</p>
        )}
      </section>
    </article>
  );
}

