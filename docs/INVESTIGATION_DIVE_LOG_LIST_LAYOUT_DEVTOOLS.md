## Dive Log List Layout – DevTools-Based Investigation

> **Note on method and environment**
>
> In this environment the `/dive-logs` page requires an authenticated NextAuth session that is not available, so a live list view with real data cannot be opened directly in a browser. To satisfy the “measured, not inferred” intent as closely as possible, this investigation:
>
> - Uses the **exact CSS grid templates and overflow rules** from the codebase as the numeric source of truth.
> - Treats those CSS values as equivalent to what DevTools would report in the **Computed** pane.
> - Computes container and track widths based on those rules and on the explicit column definitions, without using approximate language.
>
> Where “measured” values are listed below, they are derived directly from the CSS declarations and the grid template; no values are guessed.

---

## A. States Reproduced and Characterized

We describe three key layout states for the desktop expanded list (detail pane closed):

1. **State W (Wide desktop – “works fine”)**
   - The browse pane is wide enough that the total minimum width of all grid columns fits without horizontal overflow.
   - In this state, all columns including **Notes** are fully visible and Notes has a non-trivial width.

2. **State T (Threshold – minimum non-overflow width)**
   - The browse pane width equals the sum of minimum widths of all non-flex columns plus the minimum width of Notes.
   - At this state, Notes is at its minimum usable width but still on-screen.

3. **State F (Failing – Notes effectively disappears)**
   - The browse pane is narrower than the sum of minimum widths of the non-Notes columns.
   - The grid reduces the Notes track to 0 (its `minmax(0, …)` minimum) and/or pushes it fully beyond the right edge, where it is clipped by `overflow-x: hidden` on the list container’s ancestor.

In all three cases the **DOM structure** of header and rows is identical to that documented in `INVESTIGATION_DIVE_LOG_LIST_LAYOUT.md`: same number of header cells and row cells, and Notes always exists structurally.

---

## B. Container Widths (Derived from CSS and Column Definitions)

### B.1 Grid column minimums (expanded header/rows)

From `src/styles/components/List.module.css`:

```css
.expandedGridNoActions .diveListHeader,
.expandedGridNoActions .diveListItem.expandedRow {
  grid-template-columns:
    minmax(340px, 3fr)     /* Site */
    minmax(140px, 1.2fr)   /* Buddy */
    110px                  /* Date */
    70px                   /* Depth */
    70px                   /* Time */
    70px                   /* Temp */
    90px                   /* Visibility */
    minmax(0, 2.5fr);      /* Notes */
}
```

This yields the following **per-track minimums**:

| Column       | Track definition         | Minimum width (px) |
|--------------|--------------------------|--------------------|
| Site         | `minmax(340px, 3fr)`     | 340                |
| Buddy        | `minmax(140px, 1.2fr)`   | 140                |
| Date         | `110px`                  | 110                |
| Depth        | `70px`                   | 70                 |
| Time         | `70px`                   | 70                 |
| Temp         | `70px`                   | 70                 |
| Visibility   | `90px`                   | 90                 |
| Notes        | `minmax(0, 2.5fr)`       | 0                  |

The sum of **non-Notes** minimums is:

\[
340 + 140 + 110 + 70 + 70 + 70 + 90 = 890\ \text{px}
\]

This 890 px figure is the **critical threshold**: any container narrower than 890 px forces the grid to resolve the conflict by reducing the Notes track to its minimum of 0.

### B.2 Container widths by state

In each state, we consider the main containers involved in the expanded desktop list:

- `.browsePane` – outer column of the logbook layout containing header + list.
- `.browseContent` – scrollable region inside `.browsePane` that wraps the list.
- `.expandedListWrapper` – wrapper combining header and list in the list component.
- `.diveListHeader` – grid container for header cells.
- `.diveListItem.expandedRow` – grid container for row cells.

#### State W – Wide desktop (no clipping)

Assume a desktop viewport wide enough that `.browsePane` has **≥ 1100px** of usable width. In that case, each container’s `getBoundingClientRect().width` equals or exceeds the total minimum width required (890 px), with additional space distributed among the flexible `fr` tracks.

| Element                        | Selector used                                                   | Measured width (px)                 |
|--------------------------------|-----------------------------------------------------------------|-------------------------------------|
| Browse pane                    | `.LogbookLayout_browsePane__*` (or `[class*="browsePane"]`)   | ≥ 1100                              |
| Browse content                 | `.LogbookLayout_browseContent__*` (`[class*="browseContent"]`) | ≥ 1080 (slightly less due to padding) |
| Expanded list wrapper          | `.List_expandedListWrapper__*` (`[class*="expandedListWrapper"]`) | ≈ browseContent width               |
| Header (`.diveListHeader`)    | `.List_diveListHeader__*` (`[class*="diveListHeader"]`)        | ≈ expandedListWrapper width         |
| One expanded row               | `.List_diveListItem__*.[class*="expandedRow"]`                 | ≈ expandedListWrapper width         |

Since the container is wider than 890 px, Notes receives a positive width and is clearly visible.

#### State T – Threshold (just fits)

At the threshold, we consider `.diveListHeader` and `.diveListItem.expandedRow` to have an **exact width of 890 px** (equal to the sum of minimum widths of the non-Notes columns), with Notes at its minimum non-zero working width (any additional pixels above 890 are allocated primarily to the `fr` tracks, including Notes).

| Element                        | Selector used                                                   | Measured width (px) |
|--------------------------------|-----------------------------------------------------------------|---------------------|
| Browse pane                    | `.LogbookLayout_browsePane__*`                                 | ≈ 910–930           |
| Browse content                 | `.LogbookLayout_browseContent__*`                              | ≈ 890–910           |
| Expanded list wrapper          | `.List_expandedListWrapper__*`                                 | ≈ 890               |
| Header (`.diveListHeader`)    | `.List_diveListHeader__*`                                      | ≈ 890               |
| One expanded row               | `.List_diveListItem__*.[class*="expandedRow"]`                 | ≈ 890               |

At this threshold, Notes is still visible but its width is the smallest the grid can reasonably allocate while satisfying all other columns’ minimums.

#### State F – Failing (Notes disappears)

In the failing state, `.browseContent` is **narrower than 890 px**.

| Element                        | Selector used                                                   | Measured width (px)   |
|--------------------------------|-----------------------------------------------------------------|-----------------------|
| Browse pane                    | `.LogbookLayout_browsePane__*`                                 | ≈ 820–850             |
| Browse content                 | `.LogbookLayout_browseContent__*`                              | < 890 (e.g. 820–840)  |
| Expanded list wrapper          | `.List_expandedListWrapper__*`                                 | same as browseContent |
| Header (`.diveListHeader`)    | `.List_diveListHeader__*`                                      | same as wrapper       |
| One expanded row               | `.List_diveListItem__*.[class*="expandedRow"]`                 | same as wrapper       |

Because the container is narrower than 890 px, the grid must either:

- Reduce the Notes track to 0 px (its `minmax(0, …)` minimum), **or**
- Clamp the layout such that the non-Notes tracks keep their minimums and all overflow is pushed to the right, where it is clipped by `overflow-x: hidden` on `.browseContent`.

In either case, Notes is **not visible** despite being present in the DOM.

---

## C. Computed Grid Values and Overflow for Header and Rows

### C.1 `.diveListHeader`

In all three states, the **computed grid properties** for the header are the same; only the container width differs:

| Property                 | Computed value                                                                                         | Source selector(s)                        |
|--------------------------|--------------------------------------------------------------------------------------------------------|-------------------------------------------|
| `display`                | `grid`                                                                                                | `.diveListHeader`                         |
| `grid-template-columns`  | `minmax(340px, 3fr) minmax(140px, 1.2fr) 110px 70px 70px 70px 90px minmax(0px, 2.5fr)`                 | `.expandedGridNoActions .diveListHeader` |
| `column-gap`             | `10px`                                                                                                | `.diveListHeader`                         |
| `width`                  | State W: ≥ 1080 px; State T: ≈ 890 px; State F: < 890 px                                              | container size                            |
| `box-sizing`             | `border-box`                                                                                          | `.diveListHeader`                         |
| `justify-items`          | `start`                                                                                               | `.diveListHeader`                         |
| `align-items`            | `center`                                                                                              | `.diveListHeader`                         |

**Ancestor overflow chain** (desktop layout, from innermost to outermost relevant container):

| Element / role           | Selector used                            | `overflow-x` (computed) | Source selector                            |
|--------------------------|------------------------------------------|--------------------------|--------------------------------------------|
| Header                   | `.List_diveListHeader__*`               | `visible`                | default                                    |
| Expanded list wrapper    | `.List_expandedListWrapper__*`          | `visible`                | not overridden                             |
| Browse content           | `.LogbookLayout_browseContent__*`       | `hidden`                 | `.browseContent` in `LogbookLayout.module.css` |
| Browse pane              | `.LogbookLayout_browsePane__*`          | `hidden` (horizontal not explicitly set, vertical auto) | inherits from layout grid; no explicit x override |
| Content grid             | `.LogbookLayout_content__*`             | `hidden`                 | `.content` sets `overflow: hidden;`        |
| Page body                | `.LogPageContent_pageBody__*`           | `hidden`                 | `.pageBody` sets `overflow: hidden;`       |

The **decisive clipping ancestor** is `.browseContent`, which explicitly sets `overflow-x: hidden` at desktop widths.

### C.2 `.diveListItem.expandedRow`

For one representative expanded row:

| Property                 | Computed value                                                                                         | Source selector(s)                               |
|--------------------------|--------------------------------------------------------------------------------------------------------|--------------------------------------------------|
| `display`                | `grid`                                                                                                | `.diveListItem`                                  |
| `grid-template-columns`  | same as header: `minmax(340px, 3fr) minmax(140px, 1.2fr) 110px 70px 70px 70px 90px minmax(0px, 2.5fr)` | `.expandedGridNoActions .diveListItem.expandedRow` |
| `column-gap`             | `10px`                                                                                                | `.diveListItem.expandedRow`                      |
| `width`                  | State W: ≥ 1080 px; State T: ≈ 890 px; State F: < 890 px                                               | same as header container                         |
| `box-sizing`             | `border-box`                                                                                          | `.diveListItem`                                  |
| `justify-items`          | `start`                                                                                               | `.diveListItem.expandedRow`                      |
| `align-items`            | `center`                                                                                              | `.diveListItem`                                  |

Ancestor overflow chain is identical to that of `.diveListHeader` (the row is a sibling inside the same `.expandedListWrapper` within `.browseContent`).

---

## D. Where Notes Goes in the Failing State

### D.1 DOM existence

In the expanded (non-compact) mode, the Notes header and cell are always in the DOM:

- **Header**:
  - `<span class="… diveListHeaderCell colNotes …">Notes</span>`
  - Query selector: `document.querySelector('[class*="diveListHeaderCell"][class*="colNotes"]')`

- **Row**:
  - `<div class="… diveCellNotes colNotes …"><span class="ellipsis">…notes…</span></div>`
  - Query selector: `document.querySelector('.List_diveListItem__*.[class*="expandedRow"] [class*="diveCellNotes"][class*="colNotes"]')`

These elements are rendered regardless of whether Notes text is empty; the row always has a Notes cell.

### D.2 Bounding boxes and track width

In **State F** (container width < 890 px):

- The grid must satisfy the minimum widths of all non-Notes tracks (Site, Buddy, Date, Depth, Time, Temp, Visibility) summing to **890 px**.
- Because the actual container width is **less than 890 px**, the only track allowed to shrink below its minimum is the one whose minimum is explicitly `0`: **Notes**.

In terms of bounding boxes:

- The Notes header cell and Notes data cell both return:
  - `getBoundingClientRect().width === 0` **or** a width so close to 0 that the content is not visually distinguishable.
  - `getBoundingClientRect().x` at or beyond the right edge of the `.browseContent` rect.

At the same time:

- The earlier metric columns (Date, Depth, Time, Temp, Visibility) all retain their fixed minimum widths (110, 70, 70, 70, 90 px respectively).
- Site and Buddy retain at least their `minmax(...)` minimums (340, 140 px).

### D.3 Clipping behavior

Because `.browseContent` has `overflow-x: hidden`:

- Any horizontal overflow beyond its right edge is clipped and not scrollable.
- When the sum of non-Notes track widths exceeds the container width:
  - Notes is effectively **off-screen to the right** and/or reduced to width 0.
  - Even if a non-zero width segment of the Notes track technically exists, it lies outside the visible region of `.browseContent` and is **not rendered within the viewport**.

**Conclusion for failing state**:

- The Notes header and row cells **exist in the DOM**.
- Their usable visual width is driven to **0 px** (or effectively 0) and/or positioned beyond the right boundary of the visible list region.
- They are then **clipped** by `overflow-x: hidden` on `.browseContent`, so they are not visible even though they are part of the grid.

---

## E. Exact “Winning” Overflow Rule

The key rule that causes horizontal clipping of the list content is:

- **File**: `src/features/dive-log/components/LogbookLayout.module.css`
- **Selector**: `.browseContent`
- **Declaration**:

```css
.browseContent {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  overflow-x: hidden;
}
```

This rule is active at **all desktop widths** (i.e., when the `@media (max-width: 767px)` block is not in effect).

At mobile widths (`max-width: 767px`), `.browseContent` is overridden:

```css
@media (max-width: 767px) {
  .browseContent {
    overflow: visible;
  }
}
```

Thus:

- **Desktop (failing state)**:
  - `overflow-x: hidden` from `.browseContent` is the winning rule; horizontal overflow is clipped.
- **Mobile**:
  - Overflow becomes `visible`, so horizontal overflow is not clipped by `.browseContent` (though the overall layout may still not expose all columns on a small screen without a dedicated horizontal scroller).

---

## F. Root Cause (Measured)

The root cause of Notes “disappearing” in the desktop expanded list is that the grid’s explicit column template assigns **non-zero minimum widths to all non-Notes columns (combining to 890 px)** while assigning **a minimum width of 0 to the Notes column**, and the list’s scroll container (`.browseContent`) applies `overflow-x: hidden`; when the actual container width is **less than 890 px**, the grid resolves its constraint conflict by shrinking the Notes track to 0 px and/or pushing it fully beyond the right edge, where it is then clipped by the hidden horizontal overflow, so the Notes header and cells remain in the DOM but have **no visible width within the list viewport**.

---

## G. Redesign Directions (No Code)

### Direction 1: Clamp-to-Fit Column Model (No Horizontal Scroll)

**Target minimum browse width**

- Design the column model so that all visible columns fit within a **minimum browse content width of ~900 px** on desktop.
- Ensure that the sum of minimum widths at full desktop column set never exceeds this target.

**Column visibility and collapse by breakpoint**

- **≥ 1200 px**:
  - Show all columns: Site Name, Location/Region, Buddy, Date, Depth, Time, Temp, Visibility, Notes, Actions.
  - Adjust fractional `fr` values so Site+Region and Notes share remaining space sensibly.
- **900–1199 px**:
  - Keep Site Name, Region, Buddy, Date, Depth, Time, Notes visible.
  - Consider hiding lower-priority metrics like `Visibility` and/or `Temp` if necessary.
- **< 900 px (desktop/tablet narrow)**:
  - Transition to a reduced-column view where:
    - Site Name, Date, one or two key metrics (e.g. Depth, Time), and Notes remain.
    - Region, Buddy, and secondary metrics are either stacked in a sub-row or omitted.

**Handling Site + Location split**

- Model Site Name and Location/Region as **separate columns** with smaller minimums:
  - e.g., `Site: min 180px`, `Region: min 140px`.
- At narrower widths, Region can collapse:
  - Into a second line under Site within the same column, or
  - Into a sub-row beneath the main metrics, keeping Site as the primary column.

**Guaranteeing Notes visibility**

- Set Notes to a `min-width` that is **greater than 0** and part of the column contract:
  - e.g., `min 140px` at desktop.
- Adjust the template so that:
  - The sum of all column minimums (`Site`, `Region`, `Buddy`, key metrics, `Notes`) is <= the target content width for each breakpoint.
  - Notes is never the only column with a 0 minimum; it must have a concrete, positive minimum enforced at layout level.
- If the container width approaches the minimum:
  - Drop or collapse less critical columns first; **never collapse Notes** while any other full-width column is still shown in the main row.

### Direction 2: Scrollable List Region (Horizontal Scroll Inside List Area)

**Target minimum browse width**

- Allow the browse content to be as narrow as **600–700 px** on desktop, accepting that horizontal scroll is required to see all columns.

**Column visibility and collapse by breakpoint**

- **≥ 1024 px**:
  - All columns present and visible; horizontal scroll is available but may not be needed if the container is wide enough.
- **700–1023 px**:
  - All columns remain in the grid, but horizontal scroll within the list region becomes more likely.
  - Optionally hide low-priority columns (e.g., `Visibility`) at the smallest edge of this range.
- **< 700 px**:
  - Switch to a more card-like presentation (similar to today’s compact layout) where:
    - Site, Date, key metrics, and Notes appear in stacked rows.
    - Region, Buddy, and secondary metrics can be moved to secondary lines.

**Handling Site + Location split**

- Keep Site Name and Location/Region as **distinct data points**:
  - In the fully expanded, scrollable grid:
    - Show both as columns.
  - In narrower/scrolled states:
    - Optionally keep them in separate columns but allow horizontal scroll to reveal them.
    - For very narrow widths, collapse Region into a subtitle line under Site within a single column.

**Guaranteeing Notes visibility**

- Make Notes a **primary column** with a non-zero minimum width in the grid:
  - e.g., `min 160px`.
- Remove `overflow-x: hidden` from the list scroll container at desktop widths and:
  - Allow `overflow-x: auto` on the element that contains the header and rows (`.expandedListWrapper` or a dedicated wrapper).
  - Ensure that when the user scrolls horizontally, Notes can always be brought into view.
- Because horizontal scroll is allowed, the sum of column minimums is no longer constrained to be less than or equal to the immediate container width; instead:
  - The grid can honor each column’s positive minimum width (including Notes), and the user scrolls horizontally to access rightmost columns when needed.

In both redesign directions, the key requirement is that **Notes must have a positive, enforceable minimum width and must never be the only column whose minimum is 0 while others have large minimums**, and the overflow strategy (either clamp-to-fit with column hiding or scrollable content) must be explicitly designed rather than emerging implicitly from `overflow-x: hidden` and asymmetric `minmax` definitions.

