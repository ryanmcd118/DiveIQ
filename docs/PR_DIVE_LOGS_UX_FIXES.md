# PR: Dive Logs UX Fixes (View Persistence + Compact Row Content)

## Summary

Two UX fixes on `/dive-logs`:

1. **View mode persistence** – List/Grid selection now persists across refresh and navigation.
2. **Compact list content** – When a dive detail is open (desktop 2-pane), the compact list shows Region/Location instead of Notes.

---

## 1. View Mode Persistence

### Where it is stored

The preferred view is stored in the **URL query param** `view` with values `list` or `grid`:

- `?view=list` → List view
- `?view=grid` or no param → Grid view (default)

### Implementation

- **Source of truth**: `searchParams.get("view")` in `LogbookLayout.tsx`.
- **On load**: `preferredView` is derived from the URL. If `view=list`, use List; otherwise use Grid.
- **On toggle**: `handleViewChange(view)` updates the URL with `router.replace()` so history is not cluttered.
- **When detail closes**: `handleCloseDetail` and `handleBackToList` preserve existing search params (including `view`) when removing `diveId`.

### Behavior

- When the detail pane is open, `effectiveView` is forced to `"list"` for layout, but the stored preference (URL) is unchanged.
- When the detail pane closes, the previously chosen mode (from the URL) is restored.
- Refreshing the page keeps the current view.

---

## 2. Compact List Shows Region Instead of Notes

### Implementation

In `DiveLogList.tsx`, when `isCompact === true` (desktop detail pane open):

- The cell that previously showed Notes now shows **Region/Location** (`entry.region`).
- A new `.cellRegion` class was added in `List.module.css` with the same styling as `.cellNotes` (muted, ellipsized).
- The compact grid template area was updated from `"place notes"` to `"place region"`.

### Behavior

- **Compact list (detail open)**: Site name + Region/Location. Notes are not shown.
- **Expanded list (detail closed)**: Still shows Site, Location, Buddy, Notes, and metrics via `DiveLogTable`.
- **Search**: Search still matches notes (for filtering), but notes are not shown in the compact row UI.

---

## Files Changed

- `src/features/dive-log/components/LogbookLayout.tsx` – URL-based view persistence
- `src/features/dive-log/components/DiveLogList.tsx` – Compact row: region instead of notes
- `src/styles/components/List.module.css` – `.cellRegion` and grid area update
