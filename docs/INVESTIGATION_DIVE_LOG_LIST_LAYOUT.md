## Dive Log List Layout Investigation

This document captures the current behavior and suspected issues in the `/dive-logs` list view, with a focus on the desktop expanded list, compact list, and mobile behavior. It is based on source inspection of the React components and CSS modules in this repository. Where “computed” styles are mentioned, they are inferred directly from the CSS sources rather than from a live DevTools snapshot.

---

## 1. Render chain for `/dive-logs`

### 1.1 Route → page → layout

- **Route file**: `src/app/(app)/dive-logs/page.tsx`
  - Exports `LogPage` (server component).
  - Fetches session and dive log data.
  - Renders:
    - `LogPageContent` from `src/features/dive-log/components/LogPageContent.tsx`.
  - **Props passed**:
    - `initialEntries`, `initialStats`, `initialSelectedDiveId`, `isAuthed`.

- **Page content**: `LogPageContent`
  - For **unauthenticated** users:
    - Renders a static sign-in card; **no list layout involved**.
  - For **authenticated** users:
    - Creates client-side logbook state with `useLogPageState`.
    - Renders:
      - A `<main>` with page header and an “Add dive” button.
      - `LogbookLayout` as the main body.
    - Passes down:
      - `entries`, `activeEntry`, `editingEntryId`, `formKey`, `selectedGearIds`, `handleSelectEntry`, `handleDeleteFromList`, etc.
      - `initialSelectedDiveId` from server.

- **Logbook layout**: `LogbookLayout`
  - Owns:
    - Viewport detection (`isMobile` via `window.innerWidth < 768`).
    - URL-derived selection (`diveId` from `useSearchParams`).
    - View preference (`preferredView: "grid" | "list"`).
    - Derived `effectiveView`:
      - If a dive is selected (`isDetailOpen`), forces `"list"`.
      - Otherwise uses `preferredView`.
  - Renders:
    - **Mobile layout** (`isMobile === true`).
    - **Desktop/tablet layout** (`isMobile === false`).

### 1.2 Where `DiveLogList` is rendered

`DiveLogList` (in `src/features/dive-log/components/DiveLogList.tsx`) is the only component responsible for:
- The **header row** of the expanded list (desktop only).
- The **list rows** (both expanded and compact layouts).

There is no separate header component; the header is embedded at the bottom of `DiveLogList`.

#### 1.2.1 Desktop expanded list (detail pane closed)

- **Conditions**:
  - `isMobile === false` (viewport ≥ 768px).
  - Either:
    - No `diveId` in URL, or
    - `diveId` is present but `selectedEntry` is falsy.
  - `effectiveView === "list"`.
  - In this state:
    - `isDetailOpen === false`.
    - `hasSelectedDive === false`.
    - `isCompact` passed to `DiveLogList` is `false` (because `!!isDetailOpen` is `false`).

- **Render chain**:
  - `LogPageContent` → `LogbookLayout` → **desktop branch**:
    - `LogbookLayout` renders:
      - `<div className={styles.browsePane}>`
        - `<div className={styles.browseHeader}>` (title, search, sort, view toggle).
        - `<div className={styles.browseContent}>`
          - `DiveLogList` with:
            - `entries={filteredEntries}`
            - `searchQuery={searchQuery.trim()}`
            - `onSelect={handleSelectFromList}`
            - `selectedId={selectedEntry?.id ?? null}`
            - `isCompact={false}`
      - **No detail pane** (`hasSelectedDive` is false).

- **Resulting mode**:
  - **Expanded list**, **header visible**, **no compact grid layout**.

#### 1.2.2 Desktop compact list (detail pane open)

- **Conditions**:
  - `isMobile === false` (viewport ≥ 768px).
  - `hasSelectedDive === true` (URL `diveId` present and matches a `filteredEntries` entry).
  - `effectiveView` is forced to `"list"` when `isDetailOpen === true`.
  - `isCompact` passed to `DiveLogList` is `!!isDetailOpen` → `true`.

- **Render chain**:
  - Same as desktop above, but:
    - `DiveLogList` is invoked with `isCompact={true}`.
    - Detail pane is also rendered to the right.

- **Resulting mode**:
  - **Compact list**, **NO header** (header is only rendered in the `!isCompact` branch).
  - Rows use a 2×2 **grid layout** (detailed below).

#### 1.2.3 Mobile list view

- **Mobile detection**:
  - `isMobile` state in `LogbookLayout`:
    - `isMobile = window.innerWidth < 768`.
  - Styles also have breakpoints at 767px and 600px, but the **logic breakpoint** is 768px.

- **When NO dive is selected** (`!urlDiveId || !selectedEntry`):
  - `LogbookLayout` mobile branch:
    - Renders a **single-pane mobile list** (or grid) with:
      - Header (`Logbook` title).
      - View toggle (grid vs list) when detail is not open.
      - Search + sort controls.
      - `<div className={styles.browseContent}>`
        - If `effectiveView === "grid"`: renders `DiveLogGrid`.
        - Else:
          - Renders `DiveLogList` with:
            - `isCompact={false}`.
            - **Therefore, header is present and rows use the expanded row variant**, even on mobile width.

- **When a dive IS selected** on mobile:
  - `LogbookLayout` renders a **detail-only** view with a “Back to list” button.
  - **No `DiveLogList` or list header is rendered** in this state.

#### 1.2.4 Summary of which component renders headers and rows

- **Header + expanded rows (desktop & mobile list view)**:
  - Component: `DiveLogList`.
  - Condition: `isCompact === false`.
  - Only shown when NOT in compact mode (desktop detail closed; mobile list view).

- **Compact rows (desktop with detail pane open)**:
  - Component: `DiveLogList`.
  - Condition: `isCompact === true`.
  - No header is output in this branch.

---

## 2. DOM structure for header and rows

The following describes the DOM structure generated by `DiveLogList` for both modes. Class names are shown as they appear in source (`listStyles.*`, `cardStyles.*`, etc.). At runtime, CSS Modules will emit hashed class names that follow a pattern like `List_diveListHeader__<hash>`; the exact hashes depend on the build and are not visible from the static source alone.

### 2.1 Expanded mode (desktop; header + rows)

#### 2.1.1 Header DOM structure

Rendered when `isCompact === false` and there is at least one entry:

- **Wrapper**:
  - `<div className={expandedWrapperClassName}>`
  - `expandedWrapperClassName` is:
    - `listStyles.expandedListWrapper` plus:
      - `listStyles.expandedGridWithActions` if `showActions` is true.
      - `listStyles.expandedGridNoActions` if `showActions` is false.

- **Header container**:
  - `<div className={listStyles.diveListHeader} role="presentation" aria-hidden="true">`
  - Semantic note:
    - `role="presentation"` and `aria-hidden="true"` mean the header is visually present but not exposed to screen readers as table headers.

- **Header cells** (each is a `<span>`):
  - Site:
    - `<span className={`${listStyles.diveListHeaderCell} ${listStyles.colSite}`}>Site</span>`
  - Buddy:
    - `<span className={`${listStyles.diveListHeaderCell} ${listStyles.colBuddy}`}>Buddy</span>`
  - Date:
    - `<span className={`${listStyles.diveListHeaderCell} ${listStyles.colDate}`}>Date</span>`
  - Depth:
    - `<span className={`${listStyles.diveListHeaderCell} ${listStyles.colDepth}`}>Depth</span>`
  - Time:
    - `<span className={`${listStyles.diveListHeaderCell} ${listStyles.colTime}`}>Time</span>`
  - Temp:
    - `<span className={`${listStyles.diveListHeaderCell} ${listStyles.colTemp}`}>Temp</span>`
  - Visibility:
    - `<span className={`${listStyles.diveListHeaderCell} ${listStyles.colVisibility}`}>Visibility</span>`
  - Notes:
    - `<span className={`${listStyles.diveListHeaderCell} ${listStyles.colNotes}`}>Notes</span>`
  - Actions (blank header cell, only if `showActions` is true):
    - `<span className={`${listStyles.diveListHeaderCell} ${listStyles.colActions}`} />`

- **List container** (immediately after header):
  - `<ul className={listStyles.listCompact}>`
    - Despite the name `listCompact`, this same class is used for expanded rows when `isCompact === false`.

#### 2.1.2 Expanded row DOM structure

For each `entry` when `isCompact === false`:

- **Row element**:
  - `<li
        className={
          `${cardStyles.listItemInteractive} ${listStyles.diveListItem} ${listStyles.expandedRow} ${
            isSelected ? layoutStyles.listItemSelected : ""
          }`
        }
        onClick={() => onSelect?.(entry)}
      >`

- **Cells (all `<div>` children of the `<li>`; order matches header columns)**:
  1. **Site (includes region)**:
     - `<div className={`${listStyles.diveCellSite} ${listStyles.colSite}`}>`
       - `<span className={listStyles.diveSiteName}>…site name (highlighted)…</span>`
       - `<span className={listStyles.diveRegionSep}> · </span>`
       - `<span className={listStyles.diveRegion}>…region (highlighted)…</span>`
     - **Note**: current architecture combines “Site Name” and “Location/Region” into a **single grid column** (for layout purposes) even though the subparts are visually distinguished.

  2. **Buddy**:
     - `<div className={`${listStyles.diveCellBuddy} ${listStyles.colBuddy}`}>…buddy name…</div>`

  3. **Date**:
     - `<div className={`${listStyles.diveCellDate} ${listStyles.colDate}`}>{entry.date}</div>`

  4. **Depth**:
     - `<div className={`${listStyles.diveCellDepth} ${listStyles.colDepth}`}>…formatted depth…</div>`

  5. **Time**:
     - `<div className={`${listStyles.diveCellTime} ${listStyles.colTime}`}>…bottom time in minutes…</div>`

  6. **Temp**:
     - `<div className={`${listStyles.diveCellTemp} ${listStyles.colTemp}`}>…formatted temp…</div>`

  7. **Visibility**:
     - `<div className={`${listStyles.diveCellVis} ${listStyles.colVisibility}`}>…formatted vis…</div>`

  8. **Notes**:
     - `<div className={`${listStyles.diveCellNotes} ${listStyles.colNotes}`}>`
       - `<span className={listStyles.ellipsis}>{entry.notes ?? ""}</span>`
     - `entry.notes ?? ""` ensures the span exists even when there is no text.

  9. **Actions** (only if `showActions` is true):
     - `<div className={`${listStyles.diveCellActions} ${listStyles.colActions}`}>`
       - Optional “Selected” badge:
         - `<span className={listStyles.diveSelectedBadge}>Selected</span>` when row is selected.
       - Optional delete button:
         - `<button className={buttonStyles.iconDelete} …>×</button>`

### 2.2 Compact mode (desktop with detail open)

When `isCompact === true`:

- **Row element**:
  - `<li
        className={`${cardStyles.listItemInteractive} ${listStyles.diveListItem} ${listStyles.compact} ${
          isSelected ? layoutStyles.listItemSelected : ""
        }`}
        onClick={() => onSelect?.(entry)}
      >`

- **Cells**:
  - **Date**:
    - `<div className={listStyles.cellDate}>{entry.date}</div>`
  - **Metrics (Depth, Time, Temp, Visibility)**:
    - `<div className={listStyles.cellMetrics}>`
      - `<span>` depth value + unit (or "—")
      - `<span>` bottom time `Xm`
      - `<span>` temp value + unit (or "—")
      - `<span>` visibility value + unit (or "—")
  - **Place (site name only in compact mode)**:
    - `<div className={listStyles.cellPlace}>…highlighted site name…</div>`
  - **Notes**:
    - `<div className={listStyles.cellNotes}>`
      - `entry.notes ? highlightMatch(entry.notes, searchQuery) : ""`
      - If `entry.notes` is falsy, the `<div>` is present with an empty text node.

- **No header** is rendered in compact mode.

- **Actions**:
  - In the compact branch, there is **no actions cell**; the `showActions`/delete logic lives only in the expanded branch.

### 2.3 Mobile

- **Mobile list view** (no detail open):
  - `DiveLogList` is rendered with `isCompact={false}`:
    - DOM structure is **identical to the expanded desktop view**:
      - Same header container and cells.
      - Same `<ul>` and `<li>` structure.
      - Same grid templates applied via `.expandedGridNoActions` / `.expandedGridWithActions`.

- **Mobile detail view**:
  - Only detail pane is rendered; no list or header DOM.

---

## 3. Grid accounting audit (expanded + compact)

### 3.1 Expanded mode (header + rows)

Key selectors from `src/styles/components/List.module.css`:

- `.expandedListWrapper`: flex column wrapper for header + list.
- `.diveListHeader`: grid container for header cells.
- `.diveListItem.expandedRow`: grid container for row cells.
- `.expandedGridNoActions` / `.expandedGridWithActions`: define the grid-template-columns for both header and rows.
- `.colSite`, `.colBuddy`, `.colDate`, `.colDepth`, `.colTime`, `.colTemp`, `.colVisibility`, `.colNotes`, `.colActions`: shared per-column alignment.

#### 3.1.1 Number of grid columns

- **Without actions** (`.expandedGridNoActions`):
  - Selector:
    - `.expandedGridNoActions .diveListHeader, .expandedGridNoActions .diveListItem.expandedRow`
  - `grid-template-columns`:
    - `minmax(340px, 3fr)` – Site
    - `minmax(140px, 1.2fr)` – Buddy
    - `110px` – Date
    - `70px` – Depth
    - `70px` – Time
    - `70px` – Temp
    - `90px` – Visibility
    - `minmax(0, 2.5fr)` – Notes
  - **Total tracks**: **8**.

- **With actions** (`.expandedGridWithActions`):
  - Selector:
    - `.expandedGridWithActions .diveListHeader, .expandedGridWithActions .diveListItem.expandedRow`
  - `grid-template-columns`:
    - Same first 8 tracks as above, plus:
    - `44px` – Actions
  - **Total tracks**: **9**.

#### 3.1.2 Number of grid children per row

- **Header children**:
  - Always renders:
    - Site, Buddy, Date, Depth, Time, Temp, Visibility, Notes = 8 spans.
  - Conditionally renders:
    - A **ninth** `<span>` for Actions when `showActions === true`.
  - Therefore:
    - **Without actions**: 8 header children → matches 8 column tracks.
    - **With actions**: 9 header children → matches 9 column tracks.

- **Row children** (per `<li>`):
  - Always renders:
    - Site (includes region), Buddy, Date, Depth, Time, Temp, Visibility, Notes = 8 `<div>` children.
  - Conditionally renders:
    - A ninth `<div>` for Actions when `showActions === true`.
  - Therefore:
    - **Without actions**: 8 row children → matches 8 column tracks.
    - **With actions**: 9 row children → matches 9 column tracks.

**Conclusion**: there is **no pure count mismatch** between number of grid tracks and number of grid children in the expanded mode. All rows and the header have one child per grid column.

#### 3.1.3 Manual positioning (`grid-column`)

- A text search over the project shows no `grid-column` rules for these classes.
- The CSS that affects these elements:
  - `.diveListHeader`:
    - `display: grid; column-gap: 10px; justify-items: start; align-items: center;`
  - `.diveListItem.expandedRow`:
    - `display: grid; column-gap: 10px; justify-items: start;`
  - `.diveListItem.expandedRow > div`:
    - Ensures children are full-width blocks, but does **not** assign specific grid lines.
  - `.col*`:
    - Only sets `justify-self: start; text-align: left;` and `min-width: 0` for `.colNotes`.

**Conclusion**: **no manual `grid-column` placement** is used; children auto-flow in DOM order into the corresponding columns.

#### 3.1.4 Notes presence and visibility in expanded mode

- **Header Notes cell**:
  - Always rendered when `isCompact === false`.
  - DOM presence:
    - `<span className={`${listStyles.diveListHeaderCell} ${listStyles.colNotes}`}>Notes</span>`
  - CSS:
    - `.diveListHeader .colNotes`:
      - `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`
  - **Cannot “vanish” structurally**; any disappearance is due to track size or clipping.

- **Row Notes cell**:
  - Always rendered in the expanded branch:
    - `<div className={`${listStyles.diveCellNotes} ${listStyles.colNotes}`}>`
      - `<span className={listStyles.ellipsis}>{entry.notes ?? ""}</span>`
  - Even for empty notes, the `div` and `span` exist.
  - CSS:
    - `.diveListItem.expandedRow .diveCellNotes`:
      - `min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;`
    - `.ellipsis`:
      - `display: block; min-width: 0; max-width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;`

**Conclusion**: in expanded mode, **Notes always exists in the DOM**. If it is not visible, the likely causes are:
- Its column track width shrinking close to or down to zero.
- The entire right side of the grid being clipped by an ancestor with `overflow-x: hidden` or similar.

### 3.2 Compact mode

The compact layout uses a **2×2 CSS grid** inside each row only; there is no header grid.

- **Row grid**:
  - `.diveListItem.compact`:
    - `display: grid;`
    - `grid-template-columns: auto minmax(0, 1fr);`
    - `grid-template-rows: auto auto;`
    - `grid-template-areas:
        "date metrics"
        "place notes";`
    - `column-gap: 16px; row-gap: 4px;`

- **Children with areas**:
  - `.cellDate` → `grid-area: date;`
  - `.cellMetrics` → `grid-area: metrics;`
  - `.cellPlace` → `grid-area: place;`
  - `.cellNotes` → `grid-area: notes;`

**Conclusion**:
- **Grid tracks**: 2 columns × 2 rows.
- **Children**: 4 authored children per row, each assigned to a named grid area.
- There is **no mismatch** between grid definition and children count in compact mode.

### 3.3 Ancestor overflow and potential clipping

From `LogbookLayout.module.css`:

- `.browseContent` (the parent of the `DiveLogList`):
  - `flex: 1;`
  - `overflow-y: auto;`
  - `min-height: 0;`
  - `overflow-x: hidden;`

This is a key factor:

- Any horizontal overflow of the header or rows (e.g., when the total min widths of all columns exceed the container width) will be **invisibly clipped** (no horizontal scroll).
- The **Notes column is the last track**, so it is the first to disappear when the grid overflows the container width.

**Conclusion**: in tight viewports, the Notes column can be:
- **Rendered** (present in DOM).
- **Assigned a positive grid track** (still part of the grid).
- Yet be **visually hidden** either by:
  - Its track width being driven down to 0 (due to `minmax(0, 2.5fr)` and the grid’s min-content sizing behavior relative to other columns’ min-widths).
  - Or being clipped on the right due to `overflow-x: hidden` on `.browseContent`.

---

## 4. Computed style “truth table” (inferred)

Below are the key computed styles for the header, rows, and Notes cells, inferred from the CSS sources. They approximate what DevTools would show in the “Computed” tab, with each property mapped to the winning rule.

### 4.1 Header container (`.diveListHeader`)

- **Element**:
  - `<div class="… expandedListWrapper [expandedGrid...] …">`
  - Child: `<div class="… diveListHeader …">`

- **Layout and grid**:
  - `display: grid;`
    - Source: `.diveListHeader` in `List.module.css`.
  - `grid-template-columns`:
    - Without actions (`.expandedGridNoActions` ancestor):
      - `minmax(340px, 3fr) minmax(140px, 1.2fr) 110px 70px 70px 70px 90px minmax(0, 2.5fr)`
    - With actions (`.expandedGridWithActions` ancestor):
      - Same as above plus `44px` at the end.
    - Source: `.expandedGridNoActions .diveListHeader` / `.expandedGridWithActions .diveListHeader`.
  - `column-gap: 10px;`
    - Source: `.diveListHeader`.
  - `row-gap`: not explicitly set; defaults to `0`.
  - `justify-items: start;`
  - `align-items: center;`
    - Source: `.diveListHeader`.

- **Box model**:
  - `width: 100%; min-width: 0; box-sizing: border-box;`
  - `padding: var(--space-1) var(--space-3);`
  - `border-bottom: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.06));`
  - `margin: 0;`

- **Typography**:
  - `font-size: var(--font-size-xs);`
  - `font-weight: var(--font-weight-medium);`
  - `color: var(--color-text-muted);`

- **Responsive adjustments**:
  - At `max-width: 600px`:
    - `.diveListHeader`:
      - `padding-left: var(--space-2);`
      - `padding-right: var(--space-2);`
    - Grid columns remain unchanged; only padding changes.

### 4.2 Header “Notes” cell (`.diveListHeaderCell.colNotes`)

- **Element**:
  - `<span class="… diveListHeaderCell colNotes …">Notes</span>`

- **Box / layout**:
  - `display: block;`
  - `width: 100%;`
  - `min-width: 0;`
  - `box-sizing: border-box;`
    - Source: `.diveListHeaderCell`.

- **Grid alignment**:
  - `justify-self: start;`
  - `text-align: left;`
    - Source: `.colNotes` (via group selector on all `.col*`).

- **Overflow behavior**:
  - From `.diveListHeader .colNotes`:
    - `overflow: hidden;`
    - `text-overflow: ellipsis;`
    - `white-space: nowrap;`

### 4.3 Expanded row container (`.diveListItem.expandedRow`)

- **Element**:
  - `<li class="… listItemInteractive diveListItem expandedRow [listItemSelected?] …">`

- **Layout and grid**:
  - `display: grid;`
    - Source: `.diveListItem`.
  - `grid-template-columns`: same as header (inherited via `.expandedGridNoActions` or `.expandedGridWithActions`).
  - `column-gap: 10px;`
  - `justify-items: start;`
  - `align-items: center;`
    - Source: `.diveListItem` + `.diveListItem.expandedRow`.

- **Box model**:
  - `padding: var(--space-2) var(--space-3);`
  - `width: 100%; min-width: 0; box-sizing: border-box;`
  - Additional card styles from `Card.module.css` (`.listItemInteractive`).

### 4.4 Expanded row “Notes” cell (`.diveCellNotes.colNotes`)

- **Element**:
  - `<div class="… diveCellNotes colNotes …">`
    - Contains `<span class="ellipsis">…text…</span>`.

- **Box / layout**:
  - `display: block;`
  - `width: 100%;`
  - `min-width: 0;`
  - `box-sizing: border-box;`
    - From `.diveListItem.expandedRow > div` and `.colNotes`.

- **Text styling / overflow**:
  - From `.diveListItem.expandedRow .diveCellNotes`:
    - `min-width: 0;`
    - `overflow: hidden;`
    - `white-space: nowrap;`
    - `text-overflow: ellipsis;`
    - `font-size: var(--font-size-xs);`
    - `color: var(--color-text-secondary);`
  - Inner span `.ellipsis`:
    - `display: block; min-width: 0; max-width: 100%;`
    - `overflow: hidden;`
    - `white-space: nowrap;`
    - `text-overflow: ellipsis;`

### 4.5 Compact mode “Notes” cell (`.cellNotes`)

- **Element**:
  - `<div class="… cellNotes …">…notes text or empty…</div>`

- **Grid behavior**:
  - `.diveListItem.compact .cellNotes`:
    - `grid-area: notes;`
    - `min-width: 0;`

- **Text styling / overflow**:
  - `overflow: hidden;`
  - `text-overflow: ellipsis;`
  - `white-space: nowrap;`
  - `text-align: right;`
  - `font-size: var(--font-size-xs);`
  - `color: var(--color-text-secondary);`

### 4.6 Ancestor containers affecting overflow

- **`.browseContent`** (Logbook layout):
  - `overflow-y: auto;`
  - `overflow-x: hidden;`
  - `min-height: 0;`
  - This is the **primary ancestor** that can clip the right side of the grid (including Notes).

- **`.pageRoot` / `.pageBody` / `.pageContentWrapper`** (LogPageContent layout):
  - Manage height constraints and vertical scrolling.
  - Do **not** introduce additional horizontal clipping beyond the `overflow-x: hidden` on `.browseContent`.

---

## 5. CSS source of truth for list layout

### 5.1 `src/styles/components/List.module.css`

**Highly relevant selectors**:

- **Structure and list**:
  - `.list`, `.listCompact`:
    - Vertical stacks with gaps; `listCompact` composes from `.list`.
  - `.expandedListWrapper`:
    - Flex column wrapper; ensures header and list share full width.
  - `.diveListHeader`:
    - Header row grid container.
  - `.diveListHeaderCell`:
    - Per-header-cell styling; forces block-level, full-width cells.
  - `.diveListItem`:
    - Base list item grid container.
  - `.diveListItem.expandedRow`:
    - Expanded row grid; shares template with header via `.expandedGrid*`.
  - `.diveListItem.compact`:
    - Compact row 2×2 grid with named areas.

- **Columns and shared alignment**:
  - `.colSite`, `.colBuddy`, `.colDate`, `.colDepth`, `.colTime`, `.colTemp`, `.colVisibility`, `.colNotes`, `.colActions`:
    - `justify-self: start; text-align: left;`
  - `.colNotes`:
    - `min-width: 0;` to allow shrinking.

- **Expanded Notes behavior**:
  - `.diveListHeader .colNotes`:
    - Truncates header label if narrow.
  - `.diveListItem.expandedRow .diveCellNotes`:
    - Truncates notes content.

- **Compact layout**:
  - `.diveListItem.compact` + `.cellDate`, `.cellMetrics`, `.cellPlace`, `.cellNotes`.

- **Responsive rules**:
  - `@media (max-width: 900px)` and `@media (max-width: 720px)`:
    - Only adjust `--stats-rail-width`; **no direct effect on this list**.
  - `@media (max-width: 600px)`:
    - Adjusts header padding; grid columns unchanged.

**Active at current viewport widths**:
- All of the above selectors are active in desktop widths and mobile widths, except for the `@media (max-width: 600px)` padding tweak (only applies on narrow viewports).
- No breakpoint selectively hides columns; every column exists at all widths.

### 5.2 `src/styles/components/Card.module.css`

**Relevant selectors**:

- `.listItem`:
  - Base card for list entries:
    - Background, border, border-radius, padding, transitions.
  - No grid or overflow configuration that would affect column alignment.

- `.listItemInteractive`:
  - Composes from `.listItem`.
  - Adds `cursor: pointer;` and hover styles that change border/background.

**Impact on list layout**:
- Provides **visual card styling only**.
- Does **not** change display type or grid configuration (that’s handled by `List.module.css`).

### 5.3 `src/features/dive-log/components/LogbookLayout.module.css`

**Relevant selectors**:

- `.container`, `.content`, `.contentSinglePane`:
  - Overall page-grid: browse pane + detail pane on desktop.

- `.browsePane`:
  - Flex column wrapper containing header and browse content.

- `.browseContent`:
  - `flex: 1; overflow-y: auto; min-height: 0; overflow-x: hidden;`
  - **This is the selector most responsible for horizontal clipping of the list**.

- `.listItemSelected`:
  - Visually highlights selected rows.

- Mobile-specific block (`@media (max-width: 767px)`):
  - `.container`, `.content`, `.browsePane`, `.browseContent`, `.detailPane`:
    - Remove height constraints and set `overflow: visible` to allow normal page scroll.
  - `.desktopOnly` / `.mobileOnly`:
    - Not directly used by the list grid, but may affect surrounding UI.

**Active viewport widths**:
- For desktop (≥ 768px):
  - `.browseContent` `overflow-x: hidden` is active → can hide overflowing columns.
- For mobile (< 768px):
  - `.browseContent` overrides to `overflow: visible` (no horizontal clipping).

### 5.4 `src/app/globals.css`

**Relevant selectors**:

- `*`:
  - `box-sizing: border-box; margin: 0; padding: 0;`
  - Ensures predictable widths for all elements.

- `body`, `html`:
  - Typography, background, and base colors.

**Impact**:
- No list-specific layout constraints beyond standard box-sizing and resets.

### 5.5 Design-system typography / utilities

- **`typography.css`**:
  - Defines `.heading-*`, `.body-*`, `.caption`, `.text-*` color utilities.
  - **Not directly used** by the list’s structural classes (`diveListHeader`, `diveListItem`, etc.).
  - Influence is limited to font sizes and colors where applied.

- **`utilities.css`**:
  - Includes:
    - Layout helpers (`.container`, `.stack`, `.flex-center`, etc.).
    - Truncation utilities (`.truncate`, `.line-clamp-*`).
    - Visibility helpers (`.sr-only`, `.md:hidden`).
  - None of these are directly composed or referenced in `DiveLogList.tsx` or `List.module.css`.
  - Truncation behavior in the list is implemented with its own `.truncate`/`.ellipsis` definitions in `List.module.css`.

**Conclusion**:
- The **source of truth for the list layout** is:
  - `List.module.css` (grid + truncation).
  - `LogbookLayout.module.css` (scrolling + overflow).
  - `Card.module.css` (card framing).
  - Globals and design-system files provide baseline styling, not layout decisions for columns.

---

## 6. Breakpoint map and behavioral changes

### 6.1 Logical breakpoints (JS behavior)

- **Mobile logic breakpoint**:
  - `isMobile` in `LogbookLayout` uses `window.innerWidth < 768`.
  - Affects:
    - Whether the two-pane desktop layout is used.
    - Whether `DiveLogList` is rendered at all (mobile detail view vs list).
    - The presence of the view toggle (grid vs list) on mobile.

- **Detail pane state**:
  - Independent of width:
    - On desktop, when a dive is selected (`hasSelectedDive`), `effectiveView` is forced to `"list"` and `isCompact` is set to `true`.
    - On mobile, selection switches to a dedicated detail view; list is hidden entirely (no compact mode).

### 6.2 CSS breakpoints (styles)

From `List.module.css`:

- `@media (max-width: 900px)`:
  - Adjusts `--stats-rail-width`; **no direct effect on dive log list grid**.

- `@media (max-width: 720px)`:
  - Further adjusts `--stats-rail-width`; again **no effect on list grid**.

- `@media (max-width: 600px)`:
  - `.diveListHeader`:
    - Decreases horizontal padding.
  - **Grid-template and column visibility unchanged**.

From `LogbookLayout.module.css`:

- `@media (max-width: 767px)`:
  - `.container`, `.content`, `.browsePane`, `.browseContent`, `.detailPane`:
    - Relax height constraints and overflow to allow natural scrolling.
  - `.browseContent`:
    - Overrides `overflow-x: hidden` to `overflow: visible;`.

From `LogPageContent.module.css`:

- `@media (max-width: 767px)`:
  - Removes the `100dvh` height constraints on `.pageRoot`.
  - Allows `.pageBody` to use normal page scroll.

### 6.3 What changes at each width

- **≥ 1024px (representative desktop)**:
  - **Logic**:
    - `isMobile === false`.
    - Two-pane layout used when a dive is selected.
  - **List behavior**:
    - Without selection: expanded list + header (no compact).
    - With selection: compact list (no header) + detail pane.
  - **Grid**:
    - 8 or 9 columns, fixed/flexible widths as defined.
  - **Overflow**:
    - `.browseContent` uses `overflow-x: hidden` → right-side columns can be clipped.

- **768px–1023px (tablet / narrow desktop)**:
  - Same as above from the JS perspective (`isMobile === false`).
  - Same grid-template.
  - Reduced overall container width increases the chance that:
    - Notes (and possibly Visibility) are either shrunk to minimal width or clipped by horizontal overflow.

- **600px–767px**:
  - **Logic**:
    - `isMobile === true` once width < 768.
  - **Styles** (`LogbookLayout`:
    - `@media (max-width: 767px)` turns off horizontal clipping in `.browseContent`.
  - **List behavior**:
    - When in list view (mobile, no selection), `DiveLogList` uses **expanded mode** (header + rows) but is now inside a non-clipping container.
    - Columns will overflow horizontally; however, without a horizontal scroll container, much of the right side may still not be visible on smaller screens (depending on wrapper layout).

- **< 600px**:
  - Additional header padding reduction from `List.module.css`.
  - All columns remain present and defined in the grid template.
  - On mobile, expanded mode is still used for the list; compact mode is reserved only for desktop-with-detail.

### 6.4 Expanded vs compact transition

- **Not tied to a CSS breakpoint**.
- **Controlled by detail pane state**:
  - Desktop:
    - `isCompact = !!isDetailOpen` (true when a dive is selected).
  - Mobile:
    - Never passes `isCompact={true}`; instead, the detail view hides the list.

---

## 7. Root cause hypotheses (ranked)

### 7.1 Notes “vanishing”

**Hypothesis 1 (most likely): Notes track collapses or is clipped due to grid sizing + overflow**

- **Evidence**:
  - Notes column is defined as `minmax(0, 2.5fr)`:
    - Min size is **0**, so in constrained widths the track can be driven down to effectively 0px.
  - Other columns have substantial fixed or min widths:
    - Site: `minmax(340px, 3fr)`
    - Buddy: `minmax(140px, 1.2fr)`
    - Date/metrics: 110 + 70 + 70 + 70 + 90 = 410px total.
    - Total minimum width for non-Notes columns ≈ 340 + 140 + 410 = **890px**.
  - `.browseContent` on desktop:
    - `overflow-x: hidden;`
    - Any overflow beyond container width is not scrollable and is simply clipped.
  - Notes is the **last column track**:
    - Most susceptible to being clipped when the width is insufficient.

- **Diagnosis**:
  - On narrower desktop widths (or when the browse pane is narrower due to the detail pane), the grid is forced into a container that is less than ~890px wide.
  - The grid must satisfy the min constraints of all tracks:
    - Non-Notes tracks have nonzero minimums; Notes has a min of 0.
  - The browser’s CSS grid algorithm will preferentially shrink the Notes track toward 0 to accommodate the others.
  - Combined with `overflow-x: hidden`, this causes Notes to:
    - Either be **0-width** (rendered but effectively invisible).
    - Or be **fully off the clipped right edge** of the container.

**Hypothesis 2: Mobile/detail transitions causing mode confusion**

- **Evidence**:
  - On desktop, compact mode has **no header** and uses `cellNotes` text right-aligned.
  - On mobile, expanded mode (with header) is used, but:
    - On very small widths, the header and rightmost columns will be compressed and may appear partially or fully hidden.
  - From the user’s perspective, switching between:
    - Desktop expanded (with header).
    - Desktop compact (no header, right-aligned notes).
    - Mobile expanded (header, but cramped).
  - This can look like Notes “appears/disappears” even though it remains present in DOM.

### 7.2 Weird gap between Site and Buddy

**Hypothesis 3: Aggressive min-widths and fractional units create large gaps**

- **Evidence**:
  - `grid-template-columns` uses:
    - `minmax(340px, 3fr)` for Site.
    - `minmax(140px, 1.2fr)` for Buddy.
    - Then several fixed widths for metrics.
  - At typical desktop widths where the grid can expand beyond 890px:
    - The **Site column grows with 3fr**, Buddy with 1.2fr; they can become quite wide.
  - If content in Site is short but the track is wide:
    - Visual whitespace between the end of the Site cell content and the start of Buddy’s content looks like a “gap.”

- **Diagnosis**:
  - The large fractional growth factor (3fr vs 1.2fr) plus high min widths amplify whitespace in the Site/Buddy region.
  - When the pane is wide enough, this whitespace appears as a large gap before Buddy, which can feel “random.”

### 7.3 Alignment issues (left vs right vs centered)

**Hypothesis 4: Inconsistent alignment between expanded and compact layouts**

- **Evidence**:
  - Expanded mode:
    - `.col*` forces `text-align: left; justify-self: start;` for all columns, including Notes.
  - Compact mode:
    - `.cellNotes` uses `text-align: right;`.
    - Metrics row uses `display: flex; justify-content: space-between;` — distributing metric values across the row.
  - There is **no shared alignment contract** between the header in expanded mode and cells in compact mode.

- **Diagnosis**:
  - Users toggling between detail-open (compact) and detail-closed (expanded) states see:
    - Notes right-aligned under the compact layout (no header).
    - Notes left-aligned under the expanded layout (with header).
  - This can be perceived as “alignment glitches” or inconsistency, especially as width changes.

### 7.4 Secondary suspects

**Hypothesis 5: Reuse of `.listCompact` class name in multiple contexts**

- **Evidence**:
  - The `<ul>` uses `className={listStyles.listCompact}` for **both**:
    - Expanded header+rows mode.
    - Compact rows mode (when `isCompact === true`, header is absent).
  - This naming does not itself cause layout issues, but it suggests past refactors and may hide unintended coupling if additional rules are later added to `.listCompact`.

- **Diagnosis**:
  - Currently, `.listCompact` mainly controls vertical gap and inherits flex-column behavior from `.list`.
  - Not a direct cause of misalignment now, but increases cognitive load and brittleness for future changes.

---

## 8. Re-architecture proposals (do not implement yet)

### Option A: CSS Grid with shared named-area template for header and rows

**Concept**:
- Use a **single grid-template definition** (via CSS custom properties or a TS column config that outputs a class) applied to both the header and rows.
- Each column is identified by a name (e.g., `site`, `region`, `buddy`, `date`, `depth`, `time`, `temp`, `vis`, `notes`, `actions`).
- Header cells and row cells both adhere to the same named columns / areas.

**Handling Site Name + Location/Region**:
- Split into **two distinct columns** in the grid:
  - `site` (site name).
  - `region` (region/location).
- In the expanded row:
  - `site` column contains the site name only (with ellipsis).
  - `region` column contains the region/location text.
- In more compressed breakpoints:
  - Optionally merge them visually using a combined column (`siteRegion`) while still treating them as separate conceptual fields in the config.

**Handling Notes as flexible final column**:
- Use a track definition like:
  - `notes: minmax(120px, 1.5fr)` or `minmax(0, 1.5fr)` with other columns’ mins reduced.
- Explicit contract:
  - Non-flex metric columns are kept reasonably small (e.g., 60–80px).
  - Site/Region have lower min widths (e.g., 160px + 120px).
  - Notes becomes the **primary flex sink**; it can grow or shrink but never below a readable minimum.

**Responsive collapse**:
- Define a **column configuration object** (TS) that includes:
  - `minWidth`, `priority`, `hideBelow` breakpoints.
- At specific breakpoints (e.g., 960px, 800px, 640px):
  - Hide lower-priority columns first (e.g., `vis`, `temp`, `region`).
  - Notes remains visible as long as possible, potentially stretching across the remaining width.
  - When enough columns are hidden that the grid is narrow, switch to a **compact layout** with fewer columns and/or stacked rows.

**Tradeoffs**:
- **Pros**:
  - Single source of truth for column ordering and sizing.
  - Explicit mapping between header columns and row cells; easier to reason about.
  - Flexible: easy to reorder or hide columns by updating the config.
  - Works well if you keep the `<div>/<span>` semantics and don’t want `<table>`.
  - Named areas or column classes can ensure consistent alignment across breakpoints.
- **Cons**:
  - Some complexity in keeping TS config and CSS in sync unless fully config-driven.
  - Requires careful grid-template design per breakpoint to avoid unreadable densities.

**Recommendation**:
- This option aligns with the existing CSS Grid investment and is the most natural **evolution** of the current layout.

### Option B: Semantic `<table>` with styled header and rows

**Concept**:
- Use a `<table>` with `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` semantics.
- Style the table to visually resemble cards / rows.
- Use CSS to manage column widths and responsive behaviors.

**Handling Site Name + Location/Region**:
- Separate columns:
  - `<th>Site</th>` and `<th>Location/Region</th>`.
  - `<td>` cells aligned under each header.
- Under narrower breakpoints:
  - Use `display: block` or `display: grid` on table rows to stack cells.
  - Alternatively, collapse `Location/Region` into a secondary line in the Site cell for mobile only.

**Handling Notes as flexible final column**:
- Make Notes the **last `<td>`**, with `width: auto;` and `min-width` enforced.
- Use `table-layout: fixed;` with explicit widths on other columns to ensure Notes gets remaining space.
- In narrow widths:
  - Convert rows into **stacked card-like** displays:
    - Notes can be full-width below other fields.

**Responsive collapse**:
- At narrower widths:
  - `display: block` table: each row becomes a card-like container.
  - Use pseudo-headers or “label: value” presentation; table header can be hidden for small screens.
  - Hide lower-priority columns (e.g., `vis`, `temp`) in CSS using `display: none;` on specific `<th>`/`<td>` pairs.

**Tradeoffs**:
- **Pros**:
  - Better semantics / accessibility by default.
  - Browser handles baseline alignment and equal column counts.
  - Easier mental model: header and rows automatically share columns.
- **Cons**:
  - Styling tables responsively can become complex (especially for card-like UI).
  - May require more extensive refactor, including ARIA adjustments and potential breaking layout changes.
  - Integrating with existing Card styles and selection handling may be more invasive.

**Recommendation**:
- Good long-term option if semantic correctness and accessibility are top priorities, but heavier lift compared to Option A.

### Option C: Hybrid grid + TS column definition object

**Concept**:
- Maintain CSS Grid for layout but drive both header and row rendering from a **shared TypeScript column definition array**, e.g.:
  - `{ key: "site", label: "Site", width: "minmax(200px, 2fr)", renderCell: (entry) => ... }`.
- Use that config to:
  - Render the header row.
  - Render each row’s cells in the same order.
  - Generate (or at least centralize) CSS class names and data attributes per column.

**Handling Site Name + Location/Region**:
- Define two separate column configs:
  - `site` (site name).
  - `region` (location).
- In the expanded layout:
  - Use two adjacent grid columns.
- For mobile/compact:
  - Config layer decides that region is “hidden under X width” or merged into the site cell.

**Handling Notes as flexible column**:
- Give Notes a dedicated config:
  - `notes: { label: "Notes", flex: 2.5, minWidth: 120 }`.
- Convert these config values into:
  - Either CSS custom properties used by a generic grid template.
  - Or a generated `grid-template-columns` string in CSS (using CSS variables or utility classes).

**Responsive collapse**:
- Column config can include:
  - `priority`, `hideBelow`, `stackBelow` attributes.
  - The view component can decide which columns to render per breakpoint.
  - A unified “row renderer” can switch to compact layout by:
    - Collapsing some columns into key-value pairs.
    - Offering a consistent rule for which columns disappear at each breakpoint.

**Tradeoffs**:
- **Pros**:
  - Strong separation of **what columns exist** from **how they are styled**.
  - Very flexible for future changes.
  - Encourages consistent behavior between header and row cells.
- **Cons**:
  - Requires a small infra layer in TS/JS and updates to CSS to align with the config.
  - Slightly more indirection compared to pure CSS definitions.

**Recommendation**:
- This option is robust and maintainable, but a bit more work than Option A.
- If you anticipate more list views or column variations, this is attractive.

---

## 9. Minimum fix plan (design only, no code)

Based on the above, a minimal but robust path to the desired UI could be:

1. **Lock in a single, shared column model**
   - Define the exact columns you want:
     - `Site Name`, `Location/Region`, `Buddy`, `Date`, `Depth`, `Time`, `Temp`, `Visibility`, `Notes`, and optionally `Actions`.
   - Decide explicitly:
     - Which columns are required at all desktop widths.
     - Which can be hidden at tablet widths.
     - What the minimum readable width is for Notes.

2. **Adjust grid template to avoid Notes starvation**
   - Reduce the minimum widths of non-Notes columns (especially `Site` and `Buddy`).
   - Increase the minimum width of `Notes` (e.g., `minmax(120px, 2fr)`).
   - Ensure the sum of minimum widths for all columns **fits within the typical browse pane width** (including when the detail pane is open).

3. **Relax or redesign horizontal overflow behavior**
   - Reconsider the use of `overflow-x: hidden` on `.browseContent`:
     - Either allow horizontal scroll for the list section.
     - Or constrain grid min widths such that horizontal overflow is not needed.
   - Ensure Notes remains on-screen and ellipsized rather than clipped entirely.

4. **Formalize expanded vs compact behavior**

   - Decide:
     - Expanded mode: full header + all columns (or a well-defined subset for smaller desktops).
     - Compact mode: a consistent subset of columns (e.g., Date, metrics, Site, Notes) with a clear alignment strategy.
   - Align alignment rules:
     - If Notes is left-aligned under the header, avoid right-aligning it only in compact mode (or vice versa).

5. **Introduce a clear breakpoint map**
   - Document (and then implement) a simple table of:
     - ≥ 1200px: All columns visible; comfortable spacing.
     - 900–1199px: Possibly hide `Visibility` or `Temp` first; keep `Notes` visible.
     - 768–899px: Reduce `Site` and `Region` mins; keep `Notes` as last expansion column.
     - < 768px: Use a condensed/stacked card layout with key metrics and a clearly visible Notes snippet.

6. **Choose a re-architecture direction**
   - **Short term**:
     - Adopt **Option A** (CSS Grid with shared template), since it builds directly on the current implementation and gives you a single source of truth for columns.
   - **Longer term**:
     - Consider introducing a TS-based column config (Option C) once the column set is stable, especially if similar list views appear elsewhere in the app.

7. **Validate with real content**
   - Before coding, assemble example data:
     - Very long site names, long regions, long notes, missing notes, and short numeric stats.
   - Sketch (or prototype) the grid behavior at target breakpoints to ensure:
     - Notes is always present and truncated with ellipsis rather than disappearing.
     - No unexpected gaps appear between Site and Buddy or other cells.

