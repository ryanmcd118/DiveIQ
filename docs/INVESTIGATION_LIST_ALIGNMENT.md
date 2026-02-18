# Investigation: List View Column Alignment Inconsistency

**Page:** `/dive-logs`  
**View:** List (expanded, detail pane closed)  
**Problem:** Column headers and row cells have mixed alignment (some left, some centered, some right). Prior fixes had no visible effect.

---

## A) File/Component map (paths)

| Role | Path |
|------|------|
| **List component (header + rows)** | `src/features/dive-log/components/DiveLogList.tsx` |
| **List styles (grid, column classes, cell rules)** | `src/styles/components/List.module.css` |
| **Card styles (row wrapper – list item)** | `src/styles/components/Card.module.css` (`.listItem`, `.listItemInteractive`) |
| **Layout wrapper (browse area)** | `src/features/dive-log/components/LogbookLayout.tsx` |
| **Layout styles (browseContent, etc.)** | `src/features/dive-log/components/LogbookLayout.module.css` |
| **Button styles (delete in actions cell)** | `src/styles/components/Button.module.css` (`.iconDelete`) |
| **Selected row highlight** | `src/features/dive-log/components/LogbookLayout.module.css` (`.listItemSelected`) |
| **Global base** | `src/app/globals.css` (imports tokens, typography, utilities) |

**Note:** All list/header/cell class names are from CSS modules; in the DOM they appear hashed (e.g. `List_colSite__xxxxx`, `Card_listItemInteractive__xxxxx`).

---

## B) DOM/className structure (HeaderRow + DataRow)

### Header row (one row, column titles)

Rendered only when **not** compact (detail pane closed). Structure:

```
<div class="[List.]expandedListWrapper">
  <div class="[List.]diveListHeader" role="presentation" aria-hidden="true">
    <span class="[List.]diveListHeaderCell [List.]colSite">Site</span>
    <span class="[List.]diveListHeaderCell [List.]colBuddy">Buddy</span>
    <span class="[List.]diveListHeaderCell [List.]colDate">Date</span>
    <span class="[List.]diveListHeaderCell [List.]colDepth">Depth</span>
    <span class="[List.]diveListHeaderCell [List.]colTime">Time</span>
    <span class="[List.]diveListHeaderCell [List.]colTemp">Temp</span>
    <span class="[List.]diveListHeaderCell [List.]colVisibility">Visibility</span>
    <span class="[List.]diveListHeaderCell [List.]colNotes">Notes</span>
    <span class="[List.]diveListHeaderCell [List.]colActions"></span>
  </div>
  <ul class="[List.]listCompact">...</ul>
</div>
```

- **Row wrapper:** `div.diveListHeader` (grid container).
- **Cells:** Each is a `<span>` with **two** classes: `diveListHeaderCell` + one of `colSite`, `colBuddy`, `colDate`, `colDepth`, `colTime`, `colTemp`, `colVisibility`, `colNotes`, `colActions`.
- **Text:** Direct text node inside the span (no inner element for “Site”, “Buddy”, etc.).

**Critical:** There is **no** `.diveListHeaderCell` rule in `List.module.css`. The class is applied in JSX but has no styles; only the `col*` classes affect header cells.

---

### Data row (one card/row, e.g. “Great Pyramid of Giza”)

```
<ul class="[List.]listCompact">
  <li class="[Card.]listItemInteractive [List.]diveListItem [List.]expandedRow [LogbookLayout.]listItemSelected?">
    <div class="[List.]diveCellSite [List.]colSite">
      <span class="[List.]diveSiteName">…site name…</span>
      <span class="[List.]diveRegionSep"> · </span>
      <span class="[List.]diveRegion">…region…</span>
    </div>
    <div class="[List.]diveCellBuddy [List.]colBuddy">…buddy or ""…</div>
    <div class="[List.]diveCellDate [List.]colDate">…date…</div>
    <div class="[List.]diveCellDepth [List.]colDepth">…depth…</div>
    <div class="[List.]diveCellTime [List.]colTime">…time…</div>
    <div class="[List.]diveCellTemp [List.]colTemp">…temp…</div>
    <div class="[List.]diveCellVis [List.]colVisibility">…visibility…</div>
    <div class="[List.]diveCellNotes [List.]colNotes">…notes or ""…</div>
    <div class="[List.]diveCellActions [List.]colActions">
      <span class="[List.]diveSelectedBadge">Selected</span>  <!-- if selected -->
      <button class="[Button.]iconDelete" ...>×</button>       <!-- if onDelete -->
    </div>
  </li>
</ul>
```

- **Row wrapper:** `<li>` with `listItemInteractive` (Card) + `diveListItem` + `expandedRow` (List); optionally `listItemSelected` (LogbookLayout).
- **Cells:** Each data column is a `<div>` with a **cell** class (`diveCellSite`, `diveCellBuddy`, …) and the same **column** class (`colSite`, `colBuddy`, …) as the header.
- **Text:** Site has inner spans (`.diveSiteName`, `.diveRegionSep`, `.diveRegion`); other cells have text or React nodes directly in the div.

---

## C) Computed-style table (Header vs Row per column, with source file:line)

Inferred from the CSS (no DevTools run). “Computed” here means the last-declared rule that would apply in the cascade for the **cell** element (header span or row div).

| Column       | Header cell element        | Row cell element             | Source (alignment-related) |
|-------------|-----------------------------|------------------------------|-----------------------------|
| Site        | `text-align: left`; `justify-self: start` | same + overflow/ellipsis/nowrap | List.module.css .colSite (86–91); row also .diveListItem.expandedRow .diveCellSite (127–133) |
| Buddy       | `text-align: left`; `justify-self: start` | same + overflow/ellipsis/nowrap | List.module.css .colBuddy (86–91); row .diveCellBuddy (135–142) |
| Date        | `text-align: right`; `justify-self: end`  | same + white-space: nowrap  | List.module.css .colDate (94–99); row .diveCellDate (148–155) |
| Depth       | `text-align: right`; `justify-self: end`  | same + nowrap              | List.module.css .colDepth (94–99); row .diveCellDepth (148–155) |
| Time        | `text-align: right`; `justify-self: end`  | same + nowrap              | List.module.css .colTime (94–99); row .diveCellTime (148–155) |
| Temp        | `text-align: right`; `justify-self: end`  | same + nowrap              | List.module.css .colTemp (94–99); row .diveCellTemp (148–155) |
| Visibility  | `text-align: right`; `justify-self: end`  | same + nowrap              | List.module.css .colVisibility (94–99); row .diveCellVis (148–155) |
| Notes       | `text-align: left`; `justify-self: start` | same + overflow/ellipsis/nowrap | List.module.css .colNotes (86–91); row .diveCellNotes (157–164) |
| Actions     | `text-align: right`; `justify-self: end`  | same; no flex on cell      | List.module.css .colActions (102–105); row .diveCellActions (166–172) |

**Row container (one data row):**

- **display:** grid (List.module.css .diveListItem 109, .diveListItem.expandedRow 114–126).
- **grid-template-columns:** Same as header (see D).
- **align-items:** center (List.module.css .diveListItem 110).
- **justify-items:** not set → default `stretch`.

**Header container:**

- **display:** grid (List.module.css .diveListHeader 62).
- **grid-template-columns:** Same as rows (see D).
- **align-items:** center (List.module.css .diveListHeader 78).
- **justify-items:** not set → default `stretch`.

**Notes/Date truncation:**

- Notes (row): min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap (List.module.css 157–164).
- Date/numeric (row): white-space: nowrap only (List.module.css 148–155).

---

## D) Matching CSS rules list (selectors + file:line)

Only rules that affect the **expanded** list header or data rows (no compact layout).

### Header row container

| Selector | Properties (alignment/layout) | File:line |
|----------|-------------------------------|-----------|
| `.diveListHeader` | display: grid; grid-template-columns: …; column-gap: 12px; align-items: center; width: 100%; min-width: 0; box-sizing: border-box | List.module.css 61–84 |

### Data row container

| Selector | Properties (alignment/layout) | File:line |
|----------|-------------------------------|-----------|
| `.diveListItem` | padding: …; display: grid; align-items: center; box-sizing: border-box | List.module.css 108–113 |
| `.diveListItem.expandedRow` | grid-template-columns: …; column-gap: 12px; width: 100%; min-width: 0 | List.module.css 115–126 |

### Column alignment (shared header + row cells)

| Selector | Properties | File:line |
|----------|------------|-----------|
| `.colSite`, `.colBuddy`, `.colNotes` | justify-self: start; text-align: left | List.module.css 86–91 |
| `.colDate`, `.colDepth`, `.colTime`, `.colTemp`, `.colVisibility` | justify-self: end; text-align: right | List.module.css 94–99 |
| `.colActions` | justify-self: end; text-align: right | List.module.css 102–105 |

### Row cell content (no alignment override)

| Selector | Properties (layout/truncation only) | File:line |
|----------|-------------------------------------|-----------|
| `.diveListItem.expandedRow .diveCellSite` | min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size | List.module.css 128–134 |
| `.diveListItem.expandedRow .diveCellBuddy` | min-width: 0; overflow: …; white-space: nowrap; font-size; color | List.module.css 136–142 |
| `.diveListItem.expandedRow .diveCellDate`, …Depth, …Time, …Temp, …Vis | min-width: 0; white-space: nowrap; font-size; color | List.module.css 144–155 |
| `.diveListItem.expandedRow .diveCellNotes` | min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size; color | List.module.css 157–164 |
| `.diveListItem.expandedRow .diveCellActions` | min-width: 0 | List.module.css 166–168 |
| `.diveListItem.expandedRow .diveCellActions > * + *` | margin-left: var(--space-1) | List.module.css 170–172 |

### Parent / list container

| Selector | Properties | File:line |
|----------|------------|-----------|
| `.list` | display: flex; flex-direction: column; gap; font-size | List.module.css 23–27 |
| `.listCompact` | composes: list; gap: var(--space-3) | List.module.css 29–32 |
| `.expandedListWrapper` | display: flex; flex-direction: column; gap: 0; width: 100%; min-width: 0; box-sizing: border-box | List.module.css 45–52 |
| `.expandedListWrapper .listCompact` | width: 100%; min-width: 0; box-sizing: border-box | List.module.css 54–57 |

### Row wrapper (card)

| Selector | Properties | File:line |
|----------|------------|-----------|
| `.listItem` (Card) | background; border; border-radius; padding | Card.module.css 86–92 |
| `.listItemInteractive` (Card) | composes: listItem; cursor: pointer | Card.module.css 94–97 |

No `text-align`, `justify-*`, or `align-*` on the card list item.

### Other

| Selector | Properties | File:line |
|----------|------------|-----------|
| `.listItemSelected` (LogbookLayout) | border; background (gradient) | LogbookLayout.module.css 225–233 |
| `.iconDelete` (Button) | display: inline-flex; align-items: center; justify-content: center; … | Button.module.css 84–97 |

`.diveListHeaderCell`: **no rule in any stylesheet**; class is present in DOM only.

---

## E) Root-cause hypotheses (ranked)

Based on the evidence above (code and CSS only; no live DevTools).

### 1) **CSS module hashing / selector specificity (high)**

- Header cells are **`<span>`** with `diveListHeaderCell` + `col*`.
- Row cells are **`<div>`** with `diveCell*` + `col*`.
- Column alignment is intended to come from the shared `col*` classes. If, in the built output, the order or specificity of the generated module selectors (e.g. `.List_colSite__hash` vs `.List_diveListHeaderCell__hash`) or other global/utility selectors is different for header vs row, one set of cells could get different effective alignment.  
- **Check:** Built CSS and DevTools to see which rules actually apply to a header span vs a row div for the same column.

### 2) **Header uses span, row uses div (medium)**

- Default `display` for span is `inline`, for div is `block`. For a **grid item**, both are block-level when participating in the grid, so `justify-self` and `text-align` should apply the same.  
- If any non-module or reset rule sets `display` (or `text-align`) differently for `span` vs `div` in lists, header and row could diverge.  
- **Check:** Computed `display` and `text-align` on one header span and one row div for the same column.

### 3) **Missing or overridden .diveListHeaderCell (low–medium)**

- `diveListHeaderCell` is applied in JSX but has **no** rule in `List.module.css`. So header cells are styled only by `col*`. If somewhere else (or in a different build) a `.diveListHeaderCell` rule exists and sets `text-align: center` or similar, that would override the `col*` alignment for header only.  
- **Check:** Full-project search for `diveListHeaderCell` in CSS and built assets.

### 4) **Parent or global text-align / flex centering (medium)**

- **Not found in code:** No `text-align` on `.browseContent`, `.expandedListWrapper`, `.listCompact`, or `.list` that would center or right-align children. No `justify-content: center` on those containers for the list.  
- **Caveat:** If any parent above the list (e.g. in layout or a shared wrapper) sets `text-align: center` or a flex center utility, it could be inherited and override the cell-level `text-align` in some contexts.  
- **Check:** Full DOM path from `body` to header/row and each cell; computed `text-align` on every ancestor.

### 5) **Grid default justify-items: stretch (low)**

- Both header and row grids leave `justify-items` unset (stretch). With `justify-self: start` or `end` on the cell, the item should not stretch and should align as intended. So this is only a concern if `justify-self` is not applied (e.g. wrong or missing class on the element).  
- **Check:** Computed `justify-self` on each header and row cell.

### 6) **Header and rows do not share the same grid (ruled out)**

- **Same grid-template-columns:** In `List.module.css`, `.diveListHeader` (62–72) and `.diveListItem.expandedRow` (116–125) use the **same** `grid-template-columns` (and same column-gap). At 900px and 600px they are changed together in the same media blocks (251–288). So header and rows use the same grid definition; alignment inconsistency is not due to different column widths or different grids.

---

## Summary

- **Structure:** Header is a single `div.diveListHeader` (grid) whose cells are `span` with `diveListHeaderCell` + `col*`. Data rows are `li` (grid) whose cells are `div` with `diveCell*` + `col*`. Same column classes are used for header and row.
- **Alignment:** Intended to come only from the shared `col*` rules (justify-self + text-align). No conflicting text-align or justify-content was found on list containers or card item. `.diveListHeaderCell` has no CSS rule.
- **Most plausible causes:** (1) CSS module output or specificity applying column alignment differently to header vs row, and (2) element type (span vs div) or an unknown `.diveListHeaderCell`/global rule affecting header cells only. Recommended next step: inspect computed styles in the browser for one header cell and one row cell per column and confirm which rules are winning and whether `justify-self` and `text-align` are applied as expected.
