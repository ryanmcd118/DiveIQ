"use client";

import React from "react";
import styles from "./SearchHighlight.module.css";

/**
 * Splits text by word-boundary matches of q and wraps matches in a highlight span.
 * Uses the same escaping and \b as matchesQuery so highlighting matches filter results.
 */
export function highlightMatch(text: string, q: string): React.ReactNode {
  if (!q || !text) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(\\b${escaped})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className={styles.searchHighlight}>
        {part}
      </span>
    ) : (
      part
    )
  );
}
