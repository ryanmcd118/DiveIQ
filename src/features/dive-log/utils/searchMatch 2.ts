/**
 * Word-boundary search matching. Escapes special regex chars and uses \b
 * so "rig" matches "Oil Rig" but not "frigid".
 */
export function matchesQuery(field: string, q: string): boolean {
  if (!q) return true;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}`, "i");
  return regex.test(field);
}
