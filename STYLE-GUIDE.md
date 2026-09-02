# CGD Interactive Visualisation Production Standard

> **This flat document has been restructured into a skill.** The canonical,
> agent-facing version now lives at
> `~/.claude/skills/cgd-interactive-visualisations/` (i.e.
> `C:\Users\SamuelHuckstep(shuck\.claude\skills\cgd-interactive-visualisations\`):
> a lean always-loaded `SKILL.md` (contracts, a ranked "check these first"
> defect list, and a mandatory render-and-verify loop), on-demand `references/`
> files carved from the sections below, and `templates/` with a frozen shared
> layer and worked example figures. Because it sits in `~/.claude/skills/`, agents
> discover and load it automatically. Prefer the skill for new work. Keep edits
> in one place — do not update this file and the skill separately, or they will
> drift. This copy is retained only as the flat, single-file reference.

**Status:** permanent production standard  
**Owner:** Center for Global Development (CGD)  
**Applies to:** custom interactive charts, maps, tables, calculators, and small data tools published by CGD  
**Last reviewed:** 2026-07-24  
**Governing sources:** the files in `cgd-interactive-toolkit`, incorporated here so this document is sufficient for day-to-day production

---

## 0. How to use this standard

This is a build specification. A builder should be able to create, review, and hand off a complete CGD interactive using this document alone.

Read Sections 0–10 and 15–17 for every interactive. Then read only the relevant visual-form section in Sections 11–14.

| Task | Required sections |
|---|---|
| Any custom interactive | 0–10, 15–17 |
| Bars, lines, areas, dots, scatters, or ranked lists | 11 |
| Tables or matrices | 12 |
| Choropleth, symbol, locator, or flow map | 13 |
| Calculator, multi-step tool, or small dashboard | 14 |
| Editing an approved interactive | 15.8 in addition to the relevant sections |

### 0.1 Requirement language

The words below are deliberate:

* **Must / required / do not:** publication requirement. Departure requires an explicit project decision documented in the README.
* **Should / recommended:** strong default. Depart only when the data, audience, or host context makes another choice materially clearer.
* **May / optional:** use only when it adds distinct reader value.

If an example conflicts with a written requirement, the written requirement wins. Examples illustrate a pattern; they are not permission to copy irrelevant content, field names, or structure.

### 0.2 Precedence

Resolve conflicts in this order:

1. legal, privacy, security, licensing, and accessibility requirements;
2. an explicit, current project instruction agreed with CGD communications;
3. this standard;
4. visual-form judgement needed to preserve clarity or analytical honesty.

Document material departures. Never use “house style” to justify a misleading encoding, unreadable label, inaccessible control, or incorrect calculation.

### 0.3 Definition of complete

An interactive is complete only when:

* its analytical question and default state are clear;
* every displayed value is correct and traceable;
* the layout works from `320px` to `1200px`, at `200%` zoom, and with touch and keyboard input;
* the iframe grows and shrinks correctly after load and interaction;
* all essential information is available without hover;
* the visual uses the CGD brand and component rules;
* analytics follow the exact CGD contract;
* security, privacy, performance, and accessibility checks pass;
* the production URL has been tested inside a realistic parent page;
* `README.md` and, where applicable, `TRACKING.md` are accurate.

---

## 1. Governance and scope

### 1.1 Involve communications before building

Contact CGD communications before bespoke development. Agree:

* whether a custom interactive is justified;
* publication context and expected article-column width;
* hosting and the production origin;
* analytics expectations;
* data sensitivity, licensing, and update ownership;
* whether a build step, backend, live data source, or paid dependency is proposed;
* the reviewer and final acceptance process.

Early architecture choices can materially affect speed, cost, security, and maintenance.

### 1.2 Use the simplest adequate form

Most figures should be static or made in CGD's Flourish account. Use custom code only when the required analytical interaction, data volume, integration, or presentation control cannot be achieved adequately there.

Prefer, in order:

1. well-designed static figure;
2. Flourish using a standard CGD workflow;
3. vanilla HTML/CSS/JavaScript with semantic HTML and SVG or canvas;
4. Chart.js for conventional interactive charts;
5. Plotly when its built-in interactions justify the additional weight;
6. D3 when custom layout, geometry, or interaction genuinely requires it;
7. a heavier architecture only with communications approval.

Do not use interactivity as decoration. Every control must answer a plausible reader question.

### 1.3 Editorial figure, not default dashboard

CGD interactives normally sit inside policy articles. The primary view should feel like an editorial figure:

* the finding or question is encountered before interface chrome;
* controls are few, compact, and clearly labelled;
* the default state is analytically meaningful;
* the chart remains interpretable before interaction;
* detail is progressively disclosed;
* fullscreen is helpful but never required for the primary task.

Use a dashboard structure only when the task genuinely involves monitoring or coordinating several distinct views.

---

## 2. Analytical and editorial design

### 2.1 Define the question first

Before choosing a chart, write:

1. the question the visual answers;
2. the comparison the reader must make;
3. the main measure, unit, denominator, population, and period;
4. the intended default state;
5. the decisions the available controls enable.

If these cannot be stated succinctly, resolve the analysis before styling.

### 2.2 Information hierarchy

Use this order where applicable:

1. surrounding CMS title and editorial context;
2. optional dynamic in-embed title, only when it changes with state;
3. concise controls;
4. primary visual;
5. exact details on focus, hover, or tap;
6. source, unit, and essential caveats;
7. optional data download or accessible table.

Static titles, subtitles, captions, and source/credit notes generally belong in the surrounding CGD page so editors can update them without redeploying the interactive. Put a title inside the iframe only when it changes with controls or the embed must also work independently.

### 2.3 Avoid duplication

Do not repeat the same state or fact in controls, title, cards, legend, plot labels, tooltip, and notes. Each element must have a distinct job:

* controls expose the current choice;
* a dynamic title describes the resulting view;
* the visual carries comparisons;
* a legend decodes an otherwise unclear encoding;
* a tooltip gives exact detail;
* notes explain source, unit, coverage, and methods.

Remove “Selected country: …,” “Showing X of Y,” instructional captions, and summary cards when another visible element already communicates the same information.

### 2.4 Default state

Use the broadest meaningful and least surprising default:

* `All entities`, `All sectors`, or the complete eligible population;
* the latest period for a current-status question;
* a comparison view when change is the question;
* absolute values for scale and relative values for intensity or fairness.

An `All` option is a real analytical state. Define its membership, deduplicate overlaps, calculate it from the same filtered rows as the chart, and test it independently. Do not carry stale selections, pagination, highlights, or popup content into a new state.

### 2.5 Labels and public language

* Use reader-facing names, not raw field names, workbook labels, codes, or file paths.
* Retain codes only where they disambiguate, usually as secondary text.
* Put the unit in the axis label, title, or visible note; do not make the reader infer it.
* Use sentence case for UI and axis labels.
* Do not rotate text. Shorten, wrap, reposition, facet, or change chart orientation.
* Use `N/A`, `No data`, `Not applicable`, or a precise alternative. Never render missing data as `0`.

### 2.6 Descriptor cards / headline figures

**Default: absent.** Descriptor cards, KPI cards, or “tabs” are optional. There is no default count.

Add one or more only when each card communicates a headline value that:

* materially helps interpret the current visual state;
* is not immediately visible from the chart;
* is not already stated by the title, controls, legend, or note;
* updates from the same filtered data as the visual;
* remains useful at phone width without pushing the visual too far down.

Do not call a static KPI card a “tab.” A tab changes the visible panel and requires tab semantics; a card displays information and is not interactive unless it performs a real action.

Before adding a card, ask: “Would removing this make the reader less able to answer the analytical question?” If not, omit it.

---

## 3. CGD visual identity

### 3.1 Core palette

| Token | Hex | Primary use |
|---|---|---|
| Teal | `#0B4C5B` | identity, headings, primary UI |
| Gold | `#FFB52C` | identity, restrained accent |
| Teal Gray | `#85A5AD` | secondary strokes and context |
| Light Teal | `#006970` | primary data-series colour |
| Cream | `#F3F6F7` | light background |
| Dark Gray | `#394649` | secondary text and UI |
| Teal Black | `#1A272A` | primary text |
| Blue | `#2D99B5` | supplementary series |
| Light Blue | `#BFDEE0` | supplementary/light series |
| Light Gold | `#FEE8BF` | supplementary/light series |
| Light Gray | `#DFE0E2` | grid, neutral, no/none where appropriate |
| Green | `#00896C` | positive/good only when semantically valid |
| Red | `#D15553` | negative/bad only when semantically valid |

```css
:root {
  --cgd-teal: #0B4C5B;
  --cgd-gold: #FFB52C;
  --cgd-teal-gray: #85A5AD;
  --cgd-light-teal: #006970;
  --cgd-cream: #F3F6F7;
  --cgd-dark-gray: #394649;
  --cgd-teal-black: #1A272A;
  --cgd-blue: #2D99B5;
  --cgd-light-blue: #BFDEE0;
  --cgd-light-gold: #FEE8BF;
  --cgd-light-gray: #DFE0E2;
  --cgd-green: #00896C;
  --cgd-red: #D15553;
  --cgd-white: #FFFFFF;
  --cgd-border: #D9E1E4;
  --cgd-panel: #F8FAFB;
}
```

### 3.2 Data colour systems

Choose colour by data semantics, not preference.

**Categorical, in order**

```js
const CGD_CATEGORICAL = [
  '#006970', '#FFB52C', '#2D99B5', '#BFDEE0',
  '#FEE8BF', '#85A5AD', '#394649', '#DFE0E2'
];
```

Use for unordered categories. Avoid more than six simultaneous colours unless labels and separation remain clear.

**Sequential, light to dark**

```js
const CGD_SEQUENTIAL = [
  '#DFE0E2', '#85A5AD', '#BFDEE0', '#2D99B5',
  '#006970', '#0B4C5B', '#394649', '#1A272A'
];
```

Use for ordered magnitude. Match the number of steps to the number of meaningful bins; do not imply precision through excessive classes.

**Diverging**

```js
const CGD_DIVERGING = ['#006970', '#85A5AD', '#BFDEE0', '#FEE8BF', '#FFB52C'];
```

Use only when a defensible midpoint separates two directions.

**Status**

```js
const CGD_STATUS = {
  good: '#00896C',
  caution: '#FFB52C',
  bad: '#D15553'
};
```

Use status colours only when good/caution/bad is genuinely defined. For simple increase/decrease without a normative meaning, use neutral wording and consider teal/gold rather than green/red.

### 3.3 Colour rules

* Light Teal `#006970` is the default primary chart series.
* Teal `#0B4C5B` is the default heading and UI colour.
* Never rely on colour alone. Add position, label, shape, pattern, stroke style, or numeric text.
* No-data must differ from both zero and the low end of a sequential scale.
* Verify text contrast at `4.5:1` for normal text and `3:1` for large text.
* Meaningful non-text UI boundaries and focus indicators need at least `3:1` against adjacent colours.
* Test categorical and status encodings with a colour-vision deficiency simulator.
* Avoid gradients, shadows, transparency, and blend modes unless they convey information or solve a specific layering problem.

### 3.4 Typography

Primary typeface: Sofia Pro. Fallback:

```css
--font-sans: "Sofia Pro", Inter, "Helvetica Neue", Arial, sans-serif;
```

If Sofia Pro is unavailable, preserve hierarchy with Inter or system sans. Do not fetch or distribute Sofia Pro without a valid licence.

The official figure hierarchy is Sofia Pro Bold for titles, Medium for axis labels, Regular for tick values, and Light Italic for data labels/notes. Treat the source point sizes (`18pt` title, `14pt` axis label, `12pt` ticks/data/notes) as hierarchy ratios rather than literal CSS points. For web interactives, use the responsive CSS-pixel translation below.

| Element | Default | Narrow-layout floor |
|---|---:|---:|
| Dynamic in-embed title | `24px`, 700 | `20px` |
| Panel heading / axis title | `16–18px`, 600–700 | `14px` |
| Body/control text | `14–16px` | `14px` |
| Axis/legend text | `12–13px` | `12px` |
| Data labels and notes/source | `12–13px`, line-height ≥ `1.4` | `12px` |

An `11px` label is permitted only for short, high-contrast, non-interactive secondary chart text when collision testing proves it necessary. Never use text below `11px`. Do not shrink labels to rescue an unsuitable layout.

Use relative units for text and allow `200%` zoom. Avoid essential text sized directly with `vw`.

Use teal, underlined hyperlinks. Reserve a gold CTA/button treatment for a genuine primary external action; filters and view controls use the restrained teal/white component system in Section 5.

### 3.5 Lines and figure styling

| Element | Default |
|---|---|
| Axis line | solid, `1px`, Teal Black |
| Grid line | solid, `1px`, Light Gray |
| Primary data line | solid, approximately `3–4px`, Light Teal |
| Projection | dashed, same series colour, approximately `10 4` dash |
| Trend/reference | dotted or thin, Gold where appropriate |
| Separator | dashed/thin, Teal Gray |
| Indicator | solid, `1px`, Teal Gray |

Use the thinnest line that remains visible and the fewest grid lines needed for reading. Direct labels are preferred when they fit; otherwise use a compact legend. Do not add outlines, bevels, drop shadows, or decorative backgrounds to plot marks.

### 3.6 Logo

Do not place a CGD logo inside an iframe by default; the surrounding CGD page already supplies identity. If the visual will circulate independently and communications requests a logo, use an approved standard, inverse, teal-only, monochrome, or logomark asset with correct clear space. Never recreate or distort the logo.

---

## 4. Technical architecture, files, and data

### 4.1 Default stack

Default to static files on GitHub Pages or another communications-approved static host:

```text
project-name/
  index.html
  README.md
  TRACKING.md            # required when analytics are sent
  data/
    processed-data.csv
  scripts/
    prepare-data.js
```

For several separately embedded figures:

```text
project-name/
  figure-1.html
  figure-2.html
  table-1.html
  README.md
  TRACKING.md
  data/
  scripts/
  shared/
    styles.css
    utils.js
    tracking.js
```

Use one repository per publication/project. Give each iframe a separate HTML file and analytics identity. Use short, stable kebab-case names.

Small interactives may keep CSS, JavaScript, and data inside one HTML file when that is easier to scan and maintain. Split files when code/data are shared, independently reviewed, large, or difficult to navigate. Do not introduce a build system merely to split files.

### 4.2 Dependencies

* Prefer vanilla HTML/CSS/JavaScript.
* Prefer jsDelivr unless an official vendor CDN is clearly better.
* Pin exact versions; never use `latest`.
* Load minified production bundles and the smallest suitable partial bundle.
* Use Subresource Integrity and `crossorigin="anonymous"` where feasible.
* Keep a dependency inventory in the README.
* Do not introduce Highcharts, ECharts, Shiny, React, Vite, server-side code, or another paid/heavy/build-step dependency without communications approval.
* Leaflet is the default map library. CARTO Positron, Voyager, and Dark Matter are approved key-free basemaps, subject to attribution and terms.

Pinned CDN syntax:

```html
<!-- Replace the version and integrity value with the reviewed release. -->
<script
  src="https://cdn.jsdelivr.net/npm/library-name@1.2.3/dist/library.min.js"
  integrity="sha384-REPLACE_WITH_VERIFIED_RELEASE_HASH"
  crossorigin="anonymous"
></script>
```

Do not ship the placeholder. If the selected CDN does not publish a verifiable SRI hash, document that fact and retain the exact version pin.

### 4.3 Data placement and preparation

Data under roughly `50 KB` minified may be embedded when this improves durability. Use separate JSON/CSV when data are larger, shared, independently updated, or downloadable.

Precompute expensive:

* joins and crosswalks;
* aggregates and denominators;
* geographic simplification;
* derived measures;
* path samples/spatial indexes;
* display-ready labels and ordering.

Keep a reproducible preparation script. Do not live-fetch an API, spreadsheet, or third-party data file without communications approval and a maintenance/failure plan. A published browser cannot keep a secret.

### 4.4 Privacy and licensing

* No personal or sensitive data without explicit approval.
* Never commit secrets, tokens, credentials, private keys, or private API keys.
* Front-end environment variables are public.
* Record data and asset licences, attribution, and permitted use.
* Stop and ask if data sensitivity or licensing is uncertain.

### 4.5 Data contract

Before rendering, define and validate:

* unique key(s);
* field types;
* units and scaling convention;
* missing/zero/not-applicable representation;
* category domain and order;
* date/period domain;
* numerator and denominator;
* valid value range;
* join coverage and unmatched keys.

Fail visibly in development when the contract is violated. In production, show a clear error state rather than an empty or misleading chart.

```js
function assertRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Expected a non-empty data array.');
  }

  const ids = new Set();
  for (const [index, row] of rows.entries()) {
    if (row.id == null || row.id === '') {
      throw new Error(`Row ${index} has no id.`);
    }
    if (ids.has(row.id)) {
      throw new Error(`Duplicate id: ${row.id}`);
    }
    ids.add(row.id);

    if (row.value != null && !Number.isFinite(Number(row.value))) {
      throw new Error(`Invalid value for ${row.id}`);
    }
  }
}
```

---

## 5. Canonical document shell and visual components

### 5.1 Minimum HTML shell

Use this structure unless the visual genuinely needs a different semantic arrangement. Omit optional elements rather than leaving empty containers.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Descriptive interactive title</title>
  <style>
    /* Use the canonical CSS in Section 5.2. */
  </style>
</head>
<body>
  <main class="viz" id="viz">
    <!-- Include only when the title changes with state or the file stands alone. -->
    <header class="viz__header">
      <div>
        <h1 class="viz__title" id="vizTitle">Dynamic title</h1>
        <p class="viz__subtitle" id="vizSubtitle" hidden></p>
      </div>
      <button
        class="icon-button"
        id="fullscreenButton"
        type="button"
        aria-label="View fullscreen"
        title="View fullscreen"
      >
        <svg class="icon--expand" aria-hidden="true"
             viewBox="0 0 24 24" width="20" height="20">
          <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"
                fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg class="icon--compress" aria-hidden="true"
             viewBox="0 0 24 24" width="20" height="20">
          <path d="M9 4v5H4M15 4v5h5M15 20v-5h5M9 20v-5H4"
                fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </header>

    <!-- Optional. Default is to omit descriptor cards. -->
    <section class="summary-cards" id="summaryCards" hidden
             aria-label="Key figures"></section>

    <section class="controls" id="controls" aria-label="Visualisation controls">
      <!-- Use labelled native controls or the patterns in Section 10. -->
    </section>

    <section class="panel" aria-labelledby="panelTitle">
      <div class="panel__header">
        <h2 class="panel__title" id="panelTitle">Chart title</h2>
        <div class="legend" id="legend" hidden></div>
      </div>
      <div class="chart" id="chart"></div>
      <p class="chart-summary visually-hidden" id="chartSummary"></p>
      <div class="status" id="status" role="status" aria-live="polite"></div>
    </section>

    <footer class="notes">
      <p id="note">Note: …</p>
      <p id="source">Source: …</p>
      <a id="downloadData" href="#" download>Download data</a>
    </footer>

    <!-- Keep overlays inside .viz so they remain available in fullscreen. -->
    <div class="tooltip" id="tooltip" role="tooltip" hidden></div>

    <dialog class="dialog" id="detailDialog" aria-labelledby="dialogTitle">
      <form method="dialog">
        <button class="icon-button dialog__close" value="close"
                aria-label="Close details">×</button>
      </form>
      <h2 id="dialogTitle"></h2>
      <div id="dialogBody"></div>
    </dialog>
  </main>

  <script>
    /* Initialise state, validation, rendering, resizing, and analytics here. */
  </script>
</body>
</html>
```

### 5.2 Canonical CSS

This establishes uniform typography, spacing, controls, panels, focus, and responsive behaviour. Extend it with visual-specific CSS; do not override the accessibility floors.

```css
:root {
  --cgd-teal: #0B4C5B;
  --cgd-gold: #FFB52C;
  --cgd-teal-gray: #85A5AD;
  --cgd-light-teal: #006970;
  --cgd-cream: #F3F6F7;
  --cgd-dark-gray: #394649;
  --cgd-teal-black: #1A272A;
  --cgd-blue: #2D99B5;
  --cgd-light-blue: #BFDEE0;
  --cgd-light-gold: #FEE8BF;
  --cgd-light-gray: #DFE0E2;
  --cgd-green: #00896C;
  --cgd-red: #D15553;
  --cgd-white: #FFFFFF;
  --cgd-border: #D9E1E4;
  --cgd-panel: #F8FAFB;

  --font-sans: "Sofia Pro", Inter, "Helvetica Neue", Arial, sans-serif;
  --text: 14px;
  --text-small: 12px;
  --title: clamp(20px, 3.4cqi, 24px);
  --control-height: 34px;
  --icon-target: 44px;
  --radius: 10px;
  --panel-radius: 12px;
  --focus: 0 0 0 3px rgba(45, 153, 181, 0.32);
}

*, *::before, *::after { box-sizing: border-box; }

html, body {
  width: 100%;
  margin: 0;
  padding: 0;
}

body {
  overflow-x: hidden;
  background: transparent;
  color: var(--cgd-teal-black);
  font-family: var(--font-sans);
  font-size: var(--text);
  line-height: 1.45;
  text-rendering: optimizeLegibility;
}

button, input, select, textarea { font: inherit; }
button, select, input[type="checkbox"], input[type="radio"] { cursor: pointer; }
button:disabled, select:disabled, input:disabled { cursor: not-allowed; }

.viz {
  container: cgd-viz / inline-size;
  width: 100%;
  min-width: 0;
  padding: clamp(12px, 2.2cqi, 20px);
}

.viz__header,
.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.viz__header { margin-bottom: 12px; }

.viz__title {
  margin: 0;
  color: var(--cgd-teal);
  font-size: var(--title);
  font-weight: 700;
  line-height: 1.12;
  text-wrap: balance;
}

.viz__subtitle {
  max-width: 72ch;
  margin: 6px 0 0;
  color: var(--cgd-dark-gray);
  font-size: 14px;
}

.controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
  gap: 10px 12px;
  margin: 0 0 12px;
  padding: 12px;
  border: 1px solid var(--cgd-border);
  border-radius: var(--panel-radius);
  background: var(--cgd-panel);
}

.control {
  min-width: 0;
}

.control > label,
.control__label {
  display: block;
  margin: 0 0 5px;
  color: var(--cgd-teal);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
}

.control select,
.control input[type="text"],
.control input[type="search"],
.control input[type="number"] {
  width: 100%;
  min-height: var(--control-height);
  padding: 9px 36px 9px 11px;
  border: 1px solid var(--cgd-teal-gray);
  border-radius: var(--radius);
  background: var(--cgd-white);
  color: var(--cgd-teal-black);
  font-size: 14px;
}

.icon-button {
  display: inline-flex;
  flex: 0 0 var(--icon-target);
  align-items: center;
  justify-content: center;
  width: var(--icon-target);
  height: var(--icon-target);
  padding: 0;
  border: 1px solid var(--cgd-border);
  border-radius: 9px;
  background: var(--cgd-white);
  color: var(--cgd-teal);
}

.icon--compress { display: none; }
.viz:fullscreen .icon--expand { display: none; }
.viz:fullscreen .icon--compress { display: block; }

button:hover,
select:hover,
input:hover {
  border-color: var(--cgd-teal-gray);
}

button:focus-visible,
select:focus-visible,
input:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--cgd-teal);
  outline-offset: 2px;
  box-shadow: var(--focus);
}

.panel {
  min-width: 0;
  overflow: clip;
  border: 1px solid var(--cgd-border);
  border-radius: var(--panel-radius);
  background: var(--cgd-white);
  padding: clamp(12px, 2cqi, 18px);
}

.panel__title {
  margin: 0;
  color: var(--cgd-teal);
  font-size: 17px;
  line-height: 1.2;
}

.chart {
  position: relative;
  min-width: 0;
  margin-top: 10px;
}

.chart svg,
.chart canvas,
img {
  display: block;
  max-width: 100%;
}

.status:empty { display: none; }
.status {
  margin-top: 10px;
  color: var(--cgd-dark-gray);
}

.notes {
  margin-top: 10px;
  padding-top: 9px;
  border-top: 1px solid var(--cgd-light-gray);
  color: var(--cgd-dark-gray);
  font-size: var(--text-small);
  line-height: 1.45;
}

.notes p { margin: 0 0 4px; }
.notes a { color: var(--cgd-teal); text-underline-offset: 2px; }

.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0 0 0 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

[hidden] { display: none !important; }

@container cgd-viz (width < 520px) {
  .controls { grid-template-columns: 1fr; }
  .panel { padding: 12px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

### 5.3 Summary-card pattern

Cards are not part of the default shell. If Section 2.6 justifies them:

```html
<section class="summary-cards" aria-label="Key figures">
  <article class="summary-card" style="--accent:#006970">
    <h2 class="summary-card__label">Concise measure</h2>
    <p class="summary-card__value">42%</p>
    <p class="summary-card__context">Short qualifier</p>
  </article>
</section>
```

```css
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.summary-card {
  position: relative;
  overflow: clip;
  min-width: 0;
  padding: 11px 12px 10px;
  border: 1px solid var(--cgd-border);
  border-radius: var(--radius);
  background: var(--cgd-white);
}

.summary-card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: var(--accent, var(--cgd-light-teal));
}

.summary-card__label,
.summary-card__value,
.summary-card__context { margin: 0; }

.summary-card__label {
  color: var(--cgd-teal);
  font-size: 12px;
  line-height: 1.2;
}

.summary-card__value {
  margin-top: 4px;
  color: var(--cgd-teal-black);
  font-size: 18px;
  font-weight: 700;
}

.summary-card__context {
  margin-top: 2px;
  color: var(--cgd-dark-gray);
  font-size: 12px;
}

@container cgd-viz (width < 420px) {
  .summary-cards { grid-template-columns: 1fr; }
}
```

Never inject card content with unsanitised `innerHTML`. Update known elements with `textContent`, or use the safe DOM helper in Section 15.5.

---

## 6. Iframe embedding and dynamic height

### 6.1 Embed requirements

Most custom CGD interactives are cross-origin iframes on cgdev.org. Build the document as the **inside** of that iframe:

* no outer border, shadow, rounded page container, or decorative page background;
* no margin or padding on `html` or `body`;
* internal spacing on `.viz`;
* transparent body background unless an intentional figure background is required;
* width `100%`;
* no fixed production content height;
* no page-level horizontal scrollbar;
* unique and descriptive iframe `title` on the parent page.

Use `overflow-x: hidden`, never `overflow: hidden`; hiding both axes can conceal a failed height report.

### 6.2 Required child-side resize code

Include this code in every custom CGD iframe. Do not rename the message type or change the target origin.

```html
<script>
(function () {
  var PARENT_ORIGIN = 'https://www.cgdev.org';
  var lastHeight = -1;

  function measure() {
    return Math.ceil(document.body.getBoundingClientRect().height);
  }

  function report() {
    var height = measure();
    if (height <= 0 || height === lastHeight) return;
    lastHeight = height;
    window.parent.postMessage(
      { type: 'cgd-iframe-resize', height: height },
      PARENT_ORIGIN
    );
  }

  window.addEventListener('load', report);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(report);
  }

  if (window.ResizeObserver) {
    new ResizeObserver(report).observe(document.body);
  } else {
    window.addEventListener('resize', report);
  }
})();
</script>
```

Why each detail is required:

* `document.body` can shrink after the parent reduces the iframe height; `document.documentElement` may remain stuck at a previous larger height.
* root margin/padding can collapse or escape measurement; use wrapper padding.
* `ResizeObserver` captures width reflow, filters, accordions, errors, font changes, and other height changes.
* `lastHeight` prevents no-op feedback after the parent applies the height.
* `document.fonts.ready` catches wrapping changes after web fonts settle.
* the exact origin prevents messages being delivered to an unintended parent.

If a chart animates its own height, avoid the height animation or ensure the final frame is reported. A normal width redraw does not require a manual call because observing `body` captures the resulting height.

### 6.3 Parent-side listener reference

This is already deployed on CGD and is shown to make the contract unambiguous. Do not include it inside the child interactive.

```html
<script>
(function () {
  var exactAllowedOrigins = [
    'https://center-for-global-development.github.io'
  ];
  var maxHeight = 20000;

  function isAllowedOrigin(origin) {
    try {
      var url = new URL(origin);
      if (url.protocol !== 'https:') return false;
      if (exactAllowedOrigins.indexOf(origin) !== -1) return true;
      if (url.hostname.endsWith('.cgdev.workers.dev')) return true;
      return false;
    } catch (err) {
      return false;
    }
  }

  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'cgd-iframe-resize') return;
    if (!isAllowedOrigin(event.origin)) return;

    var height = Number(event.data.height);
    if (!Number.isFinite(height) || height <= 0) return;
    height = Math.min(Math.ceil(height), maxHeight);

    document.querySelectorAll('iframe').forEach(function (iframe) {
      if (iframe.contentWindow === event.source) {
        iframe.style.height = height + 'px';
      }
    });
  });
})();
</script>
```

A new host requires communications to update and republish the parent allowlist. Test both resize and analytics: their allowed-origin lists are separate infrastructure.

### 6.4 Parent iframe markup

```html
<iframe
  src="https://center-for-global-development.github.io/project-name/"
  title="Interactive chart comparing …"
  loading="lazy"
  scrolling="no"
  style="display:block;width:100%;height:600px;border:0"
></iframe>
```

The initial `height` is only a loading placeholder. The child message owns settled height.

### 6.5 Local testing

`postMessage` sent to `https://www.cgdev.org` will not resize a localhost parent. For local diagnostics:

1. log the outgoing payload and check its type/height; or
2. temporarily use `'*'` with an explicit `// LOCAL TEST ONLY` comment.

Never commit or publish a wildcard target origin. Before handoff, test the production child inside an HTTPS parent that implements the real origin checks.

After a GitHub Pages or CDN deployment, do not infer the deployed version from
one phone refresh. Compare at least one deployed child file and the shared CSS
with the committed files (hash or a unique release marker), then test with a
release query string such as `?v=2026-07-27b`. Apply the same version query to
the preview iframe `src` and its “Open standalone” link. This is cache
invalidation for verification, not responsive logic. Record which deployed
version was tested; remove or advance the marker on the next release.

### 6.6 Fixed-height fallback

If a non-CGD host cannot run a listener, document and test explicit desktop and mobile heights. This is a degraded fallback.

Do not use a fixed aspect ratio for a visual containing controls, wrapped text, tables, notes, or expanding content. A fixed aspect ratio is acceptable only when the entire visual genuinely preserves that geometry.

---

## 7. Analytics

### 7.1 Architecture

The iframe sends flat `postMessage` objects to the CGD parent. Google Tag Manager validates the origin, namespace, event name, and required fields, then pushes to CGD's GA4 data layer. Do not add a separate GA tag inside the iframe; that fragments sessions.

Resize and analytics are different contracts:

* resize: `type: 'cgd-iframe-resize'`;
* analytics: `type: 'cgd_analytics'`.

Never count resize, scroll, hover, or ordinary browser behaviour as engagement.

### 7.2 Exact event schema

Only two event names are allowed.

```json
{
  "type": "cgd_analytics",
  "event": "interactive_view",
  "interactive_name": "project-figure1"
}
```

```json
{
  "type": "cgd_analytics",
  "event": "interactive_engagement",
  "interactive_name": "project-figure1",
  "action_type": "filter",
  "action_label": "country_filter",
  "action_value": "Kenya"
}
```

`action_value` is optional. Omit it entirely when it does not apply.

Allowed `action_type` values:

| Value | Use |
|---|---|
| `filter` | Changes which data/model result is shown |
| `preset` | Sets several parameters; select/clear all; reset |
| `detail_open` | Opens item detail, dialog, accordion, or disclosure |
| `detail_close` | Closes that detail |
| `view_control` | Changes presentation without changing underlying data |
| `navigate` | Moves between internal steps, sections, or tabs |
| `compare` | Adds, switches, or removes a comparison |
| `external_link` | Leaves the interactive |
| `download` | User-initiated data or image export |

Do not invent values without updating the organisational analytics standard.

### 7.3 Required tracking module

Use one utility so validation and payload shape cannot drift:

```js
// tracking.js
(() => {
  const PARENT_ORIGIN = 'https://www.cgdev.org';
  const INTERACTIVE_NAME =
    window.CGD_INTERACTIVE_NAME || 'replace-with-project-slug';

  if (
    INTERACTIVE_NAME === 'replace-with-project-slug' ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(INTERACTIVE_NAME)
  ) {
    throw new Error(
      'Set a valid kebab-case window.CGD_INTERACTIVE_NAME before publishing.'
    );
  }

  const VALID_ACTION_TYPES = new Set([
    'filter',
    'preset',
    'detail_open',
    'detail_close',
    'view_control',
    'navigate',
    'compare',
    'external_link',
    'download'
  ]);

  let viewTracked = false;

  function send(eventName, params) {
    if (typeof window === 'undefined' || !window.parent) return;
    window.parent.postMessage(
      Object.assign({ type: 'cgd_analytics', event: eventName }, params),
      PARENT_ORIGIN
    );
  }

  function trackView() {
    if (viewTracked) return;
    viewTracked = true;
    send('interactive_view', {
      interactive_name: INTERACTIVE_NAME
    });
  }

  function trackEngagement(actionType, actionLabel, actionValue) {
    if (!VALID_ACTION_TYPES.has(actionType)) return;

    const params = {
      interactive_name: INTERACTIVE_NAME,
      action_type: actionType,
      action_label: actionLabel
    };

    if (
      actionValue !== undefined &&
      actionValue !== null &&
      actionValue !== ''
    ) {
      params.action_value = String(actionValue);
    }

    send('interactive_engagement', params);
  }

  window.CGDTracking = {
    INTERACTIVE_NAME,
    trackView,
    trackEngagement
  };
})();
```

For several HTML files sharing `tracking.js`, set identity before loading:

```html
<script>window.CGD_INTERACTIVE_NAME = 'project-figure1';</script>
<script src="shared/tracking.js"></script>
```

Use kebab-case `interactive_name`, normally matching the repository or a shared project prefix plus figure/table suffix. Do not derive it from a query string.

Use concise snake_case `action_label`, such as:

* `country_filter`;
* `year_range_slider`;
* `chart_type_toggle`;
* `project_detail`;
* `source_data`;
* `reset`.

### 7.4 Instrumentation

```js
window.addEventListener('load', () => {
  CGDTracking.trackView();
});

countrySelect.addEventListener('change', event => {
  updateState({ country: event.target.value });
  CGDTracking.trackEngagement(
    'filter',
    'country_filter',
    event.target.value
  );
});

yearSlider.addEventListener('input', event => {
  updatePreview(event.target.value); // responsive visual feedback
});

yearSlider.addEventListener('change', event => {
  CGDTracking.trackEngagement(
    'filter',
    'year_range_slider',
    event.target.value
  );
});

resetButton.addEventListener('click', () => {
  resetState();
  CGDTracking.trackEngagement('preset', 'reset');
});

downloadButton.addEventListener('click', () => {
  CGDTracking.trackEngagement('download', 'filtered_csv');
});
```

Track committed actions, not implementation events. Do not track:

* hover or tooltip display;
* map pan/zoom gestures;
* every slider `input` during drag;
* window resize;
* ordinary scroll or text selection.

### 7.5 Cardinality

Analytics dimensions must remain bounded:

* never send raw URLs, free text, arbitrary database IDs, or coordinates;
* label an external destination semantically (`methodology_pdf`), not with its URL;
* do not send thousands of entity identifiers;
* if normal use could exceed roughly `100–200` values, categorise or omit `action_value`;
* prefer no `action_value` to low-quality high-cardinality data.

### 7.6 `TRACKING.md`

```markdown
# Event Tracking: [Interactive Name]

`interactive_name`: `project-figure1`

Tracking follows the CGD Interactive Analytics Tracking Standard.

## Tracked Events

| `action_type` | `action_label` | `action_value` | Notes |
|---|---|---|---|
| `filter` | `country_filter` | country name | Dropdown selection |
| `preset` | `reset` | — | Restores defaults |
| `download` | `filtered_csv` | — | Current filtered data |

## Not Tracked

Map pan/zoom and hover are excluded because they are continuous or low-signal.
```

For multiple iframes, use a separate table per `interactive_name`. Any code change that adds, removes, or renames a tracked action must update `TRACKING.md` in the same change.

### 7.7 Parent/GTM reference

CGD's parent listener:

* permits known hosting suffixes (`.github.io`, `.shinyapps.io`, `.amplifyapp.com`, `.vercel.app`, `.pages.dev`, `.workers.dev`);
* accepts only `type: 'cgd_analytics'`;
* accepts only `interactive_view` and `interactive_engagement`;
* requires `interactive_name`, plus `action_type` and `action_label` for engagement;
* guards against duplicate listener installation;
* pushes only validated fields to `dataLayer`.

GA4 must have event-scoped custom dimensions for `interactive_name`, `action_type`, `action_label`, and `action_value`. GTM uses two custom-event triggers and two GA4 event tags. A new hosting platform requires an allowlist update and GTM republish; events otherwise fail silently.

---

## 8. Responsive and small-screen implementation

### 8.1 Standard

The same URL must remain intuitive, legible, and fully operable from `320px` to `1200px`. Responsive design means re-rendering and recomposing for the inline space available. It does **not** mean shrinking a desktop composition with CSS transforms.

At `320 CSS px` and at `200%` zoom:

* no essential content or function may be lost;
* ordinary content must not require two-dimensional scrolling;
* text and controls must not overlap or clip;
* the main analytical comparison must remain available;
* the iframe must report the new height.

Phone layouts may be taller. Width should fit; height should follow content.

### 8.2 Adaptation order

When a composition stops working, adapt in this order:

1. **Reflow:** stack or wrap controls, notes, cards, and small multiples.
2. **Reposition:** move legend or labels; put bar labels above/beside marks.
3. **Reduce spacing:** trim outer margins, panel padding, and decorative gaps.
4. **Reduce density:** fewer ticks, priority labels, pagination, or valid aggregation.
5. **Change geometry:** horizontal bars, taller plot, fewer small-multiple columns, list/table alternative.
6. **Remove redundancy:** duplicated annotations or decoration only.

Do not remove a unique measure, unit, uncertainty statement, essential control, source, or caveat to make a phone layout fit.

This mirrors leading tools: Flourish and Datawrapper use width-responsive redraw plus child-to-parent height messaging; Datawrapper may change direct line labels to a legend on mobile; Tableau permits phone-specific rearrangement. The uniformity requirement is semantic and stylistic, not identical pixel geometry at every width.

### 8.3 Container-driven breakpoints

Base changes on the interactive/container width, not user-agent detection or named phone models.

```css
.viz { container: cgd-viz / inline-size; }

.controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
}

@container cgd-viz (width < 560px) {
  .two-column-layout { grid-template-columns: 1fr; }
}

@container cgd-viz (width < 420px) {
  .summary-cards { grid-template-columns: 1fr; }
}
```

Choose a breakpoint when real content fails:

* a longest label wraps into an unusable shape;
* controls or targets collide;
* the plot becomes too narrow for the intended comparison;
* axis labels overlap;
* tooltip/menu placement cannot remain inside the viewport.

Do not add a breakpoint merely because `768px` or another common device number exists.

### 8.4 Required width observer

Charts must render from the chart container's actual width. Use one observer and schedule one render per animation frame:

```js
function observeInlineSize(element, render) {
  let lastWidth = -1;
  let frame = 0;

  function visibleViewportWidth() {
    const values = [
      window.visualViewport?.width,
      document.documentElement.clientWidth,
      window.innerWidth
    ].filter(value => Number.isFinite(value) && value > 0);
    return values.length ? Math.min(...values) : Infinity;
  }

  function schedule(width) {
    /*
      iOS may retain a desktop-like layout viewport inside an iframe and then
      visually scale it. Never render wider than the visual viewport.
    */
    const nextWidth = Math.floor(Math.min(width, visibleViewportWidth()));
    if (nextWidth <= 0 || nextWidth === lastWidth) return;
    lastWidth = nextWidth;

    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      render(nextWidth);
    });
  }

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(entries => {
      schedule(entries[0].contentRect.width);
    });
    observer.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }

  function onResize() {
    schedule(element.getBoundingClientRect().width);
  }

  window.addEventListener('resize', onResize);
  window.visualViewport?.addEventListener('resize', onResize);
  onResize();
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', onResize);
    window.visualViewport?.removeEventListener('resize', onResize);
  };
}

const chartElement = document.getElementById('chart');
const stopObserving = observeInlineSize(chartElement, width => {
  renderChart(width, currentState);
});
```

Rules:

* normally render from `contentRect.width`; cap it at `visualViewport.width` to prevent iOS iframe down-scaling from selecting a desktop layout;
* avoid observing every mark or child;
* do not write layout during the observer callback without scheduling;
* render deterministically from `state + width`;
* store state independently of the DOM so a resize does not reset filters or selection;
* clean up observers if the component is removed.

CSS media/container queries can suffer from the same iOS iframe mismatch. Add a
single compact-mode class from the effective visible width and use it as a
fallback alongside container queries:

```js
function syncViewportMode() {
  const widths = [
    window.visualViewport?.width,
    document.documentElement.clientWidth,
    window.innerWidth
  ].filter(value => Number.isFinite(value) && value > 0);
  const width = Math.min(...widths);
  document.documentElement.classList.toggle('cgd-mobile-embed', width <= 600);
}

syncViewportMode();
addEventListener('resize', syncViewportMode);
visualViewport?.addEventListener('resize', syncViewportMode);
```

```css
@container cgd-viz (width < 560px) { /* normal path */ }
.cgd-mobile-embed .controls { /* iOS iframe fallback */ }
```

Do not use this class to deliver a different feature set by device. It exists
only to make the same width-driven composition reliable when iframe viewport
reporting is inconsistent.

The iframe-height observer in Section 6 and this chart-width observer have different jobs. Both are required.

### 8.5 Layout mode function

Centralise responsive decisions instead of scattering inconsistent width tests:

```js
function getLayout(width) {
  if (width < 400) {
    return {
      name: 'compact',
      margin: { top: 16, right: 10, bottom: 44, left: 48 },
      tickTarget: 4,
      labelMode: 'priority',
      controlColumns: 1
    };
  }

  if (width < 700) {
    return {
      name: 'medium',
      margin: { top: 18, right: 16, bottom: 46, left: 56 },
      tickTarget: 5,
      labelMode: 'priority',
      controlColumns: 2
    };
  }

  return {
    name: 'wide',
    margin: { top: 20, right: 24, bottom: 48, left: 64 },
    tickTarget: 7,
    labelMode: 'direct',
    controlColumns: 3
  };
}
```

The values are safe starting points, not universal chart margins. Adjust from longest-label measurement and mark geometry. Keep the mode names and decision centralisation.

### 8.6 Responsive SVG pattern

Recompute scales and axes at each width. Do not render a `900px` chart and scale the whole SVG down.

```js
function createSvg(container, width, height, label) {
  container.replaceChildren();

  const svg = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'svg'
  );

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', String(height));
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  container.append(svg);

  return svg;
}

function renderChart(width, state) {
  const layout = getLayout(width);
  const rows = getFilteredRows(state);

  // Example: ranked rows become taller rather than smaller on a phone.
  const rowHeight = layout.name === 'compact' ? 34 : 30;
  const height = Math.max(280, rows.length * rowHeight + 90);

  const svg = createSvg(
    document.getElementById('chart'),
    width,
    height,
    'Ranked values for the current selection'
  );

  // Build scales from width/height/layout, then render axes and marks.
}
```

For static aspect-ratio illustrations, `height: auto` may be suitable. For analytical charts, explicit recomputation is normally better because it preserves type and hit-target sizes.

Use:

```css
.data-line,
.hit-line {
  vector-effect: non-scaling-stroke;
}
```

when a stroke must retain visible or interactive width during zoom/scaling.

### 8.7 Canvas high-DPI pattern

```js
function sizeCanvas(canvas, cssWidth, cssHeight) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);

  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  canvas.width = Math.round(cssWidth * ratio);
  canvas.height = Math.round(cssHeight * ratio);

  const context = canvas.getContext('2d');
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return context;
}
```

Redraw after width changes. Canvas still requires an accessible name and, where feasible, a text summary plus data table or download.

### 8.8 Typography, targets, and controls

* Body and controls: normally `14–16px`; never below `12px`.
* Axis/legend: normally `12–13px`; exceptional `11px` floor only as defined in Section 3.4.
* Notes/source: at least `12px`.
* Visible text/select/segmented controls: normally `34–36px` high.
* Icon-only primary controls and dialog close buttons: normally `44 × 44 CSS px`.
* WCAG 2.2 AA floor: `24 × 24 CSS px` or its defined spacing exception.
* Adjacent compact controls require at least `6px` clear separation; use `8px` where space permits.

A small visible mark may have a larger transparent hit region. Dense, spatially essential marks may use the WCAG exception, but provide an equivalent list, selector, keyboard route, or tap-to-pin detail when feasible.

Do **not** apply `min-height: 44px !important` to every button, input, select,
toggle, and option. That turns a small filter bank into most of a phone screen.
Use a `34px` visible control, adequate spacing, and a `44px` target for isolated
icon actions. This satisfies the WCAG 2.2 target-size rule without pretending
that every visible pill must follow an icon-button convention.

The canonical, fully accessible segmented control is the native-radio
`.segmented` component in Section 10.5; prefer it, because it gives correct
arrow-key and form semantics for free. The button/`aria-pressed` variant below
(`.segmented-toggle`) is shown only to illustrate target sizing. It is a
distinct component with a distinct class name so the two never collide; if you
use it, you must wire `aria-pressed` state and arrow-key handling yourself:

```css
.segmented-toggle {
  display: flex;
  min-height: var(--control-height); /* 34px */
  padding: 2px;
  border: 1px solid var(--cgd-border);
  border-radius: 999px;
  background: #fff;
}

.segmented-toggle button {
  flex: 1 1 0;
  min-width: 0;
  min-height: 32px;
  padding: 4px 7px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--cgd-dark-gray);
  font: inherit;
  font-size: 12px;
  line-height: 1.15;
  white-space: nowrap;
}

.segmented-toggle button[aria-pressed="true"] {
  background: var(--cgd-teal);
  color: #fff;
  font-weight: 700;
}
```

Control layout is content-designed, not `auto-fit` by hope:

1. List every control and its longest real label/value.
2. At each required width, assign an explicit one-, two-, or three-column grid.
3. Fill every row. Do not leave an empty half-row because a spacer element or
   an unplanned odd control count fell into CSS auto-placement.
4. Put two compact, related controls on one row when both remain legible.
5. Use three columns only for short values such as year/view/metric; give a
   long selector more fractional width.
6. Make a genuinely long segmented control or country selector span the row.
7. Hide layout-only spacer elements in grid mode.
8. If segmented labels would wrap, first shorten valid public labels; otherwise
   replace that control with a native select. Never hyphenate a control label.

```css
.controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 8px;
}

.control--wide { grid-column: 1 / -1; }
.control-spacer { display: none; }

/* Three short controls; the middle selector receives more width. */
.controls--three {
  grid-template-columns: minmax(94px, .95fr)
                         minmax(112px, 1.15fr)
                         minmax(82px, .8fr);
}
```

The release criterion is not “the controls wrap.” It is: aligned heights,
complete rows, no blank grid cell, no clipped or multi-line toggle label, and
the smallest control area that preserves clear reading and operation.

When a field label and segmented control share one grid cell, do not set the
segmented control to `width: 100%` inside a horizontal flex row: that requests
the full cell width *in addition to* the label and gap. Use an inner grid whose
second track may shrink, and reset any component-level `min-width`:

```css
.controls {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, .7fr);
  gap: 6px;
}

.control {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.control .segmented {
  width: 100%;
  min-width: 0;
}
```

Do not approve a control bank from page-level `scrollWidth` alone. A child may
overflow a clipped parent without increasing document width. At every required
phone width, fail QA when:

* any visible control or control group extends outside its controls panel;
* sibling control groups intersect;
* a button's text is wider or taller than its content box;
* an intended single-line label wraps, clips, or uses ellipsis;
* a later control is partly or wholly outside the visual.

Use rendered boxes, not inferred CSS widths:

```js
const controlAudit = await page.locator('.controls').evaluate(panel => {
  const panelBox = panel.getBoundingClientRect();
  const groups = [...panel.children]
    .filter(node => getComputedStyle(node).display !== 'none')
    .map(node => ({ node, box: node.getBoundingClientRect() }));

  const outside = groups.filter(({ box }) =>
    box.left < panelBox.left - 1 ||
    box.right > panelBox.right + 1 ||
    box.top < panelBox.top - 1 ||
    box.bottom > panelBox.bottom + 1
  );

  const intersections = [];
  for (let i = 0; i < groups.length; i += 1) {
    for (let j = i + 1; j < groups.length; j += 1) {
      const a = groups[i].box;
      const b = groups[j].box;
      if (
        a.left < b.right - 1 && a.right > b.left + 1 &&
        a.top < b.bottom - 1 && a.bottom > b.top + 1
      ) intersections.push([i, j]);
    }
  }

  const clippedText = [...panel.querySelectorAll('button, label')].filter(node =>
    node.scrollWidth > node.clientWidth + 1 ||
    node.scrollHeight > node.clientHeight + 1
  );

  return {
    outside: outside.length,
    intersections,
    clippedText: clippedText.map(node => node.textContent.trim())
  };
});

expect(controlAudit).toEqual({
  outside: 0,
  intersections: [],
  clippedText: []
});
```

Run this test after fonts load and after every state that changes a control's
label. Include `320`, `360`, `375`, `390/393`, and `430px`; `390px` alone does
not cover the narrower iPhone layouts.

Editable controls must be at least `16px` on iOS Safari. Smaller input text can
cause focus to zoom the visual viewport and make the iframe appear to jump.
Never prevent reader zoom with `user-scalable=no` or a restrictive
`maximum-scale`.

```css
@media (max-width: 520px), (hover: none) and (pointer: coarse) {
  input,
  select,
  textarea,
  [role="combobox"] {
    font-size: 16px;
  }
}
```

### 8.8.1 Axis and label budgeting

Margins and tick counts must be calculated for the labels that actually render.
A phone chart must not inherit a desktop tick array or reserve most of its width
for long category labels.

Required phone rules:

* target `3–5` ticks per axis, including endpoints;
* use short, unambiguous units (`$1m`, `$1bn`, `25%`);
* shorten an axis title before reducing it below the type floor;
* for horizontal bars with long categories, put a concise label above each bar
  and let the bar use the full plot width;
* for a source–recipient pair, use two deliberate lines—one country per
  line—rather than truncating the second country out of existence;
* never rotate labels merely to preserve an excessive number of ticks;
* measure rendered bounds after fonts load.

Use an even subset when the scale library produces too many valid ticks:

```js
function thinTicks(ticks, maximum = 4) {
  if (ticks.length <= maximum) return ticks;

  const indices = new Set([0, ticks.length - 1]);
  for (let i = 1; i < maximum - 1; i += 1) {
    indices.add(Math.round(i * (ticks.length - 1) / (maximum - 1)));
  }
  return ticks.filter((_, index) => indices.has(index));
}
```

After rendering, fail QA if tick or label boxes overlap or leave the SVG
viewBox. Visual inspection is still required because technically non-overlapping
text can remain too dense to read.

### 8.9 Height and viewport units

* Derive ranked-chart height from row count and row height.
* Paginate or “show more” very long views; do not render thousands of pixels by default.
* Do not use `height: 100vh` in a normal iframe.
* In fullscreen only, use `100vh` followed by `100dvh`.
* Rotation portrait → landscape → portrait must redraw and re-report height.
* Content that shrinks after filtering must shrink the iframe as well as grow it.

### 8.10 Horizontal scrolling

The page and ordinary chart shell must not scroll horizontally at `320px`.

Allow a labelled internal horizontal scroller only when two-dimensional layout is essential:

* precision table;
* matrix;
* long timeline;
* map workspace whose meaning cannot be preserved in one dimension.

```css
.data-scroll {
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  -webkit-overflow-scrolling: touch;
}
```

Keep caption, summary, and essential controls outside the scroller. Do not trap vertical touch scroll. Consider a mobile list/key-columns view first.

### 8.11 Touch behaviour

* Hover information must also open by focus and tap.
* Tap may pin a tooltip; a deliberate second action may open detail.
* Do not intercept vertical article scrolling.
* Apply `touch-action` only to the area that needs it.

```css
.horizontal-drag-control { touch-action: pan-y; }
.map-canvas { touch-action: none; } /* only if two-dimensional map gestures are essential */
```

Maps need visible zoom and reset controls so gestures are not the only route.

### 8.12 Responsive test matrix

Test the production URL directly and inside a realistic parent:

| Dimension | Required checks |
|---|---|
| Width | `320`, `360`, `390/393`, `430`, `520`, `700/768`, `930`, `1200px`, plus continuous drag between them |
| Zoom | `200%` browser/text zoom; equivalent `320 CSS px` reflow |
| Height | load, web fonts, filter growth, filter shrink, open/close detail, no-data/error, rotation |
| Input | keyboard only, touch/coarse pointer, mouse |
| Content | longest labels, largest/negative values, missing data, maximum series/rows, empty state |
| Overflow | no page-level horizontal scroll; no clipped focus, tooltip, menu, dialog, source, or final row |
| State | selections, filters, page, zoom, and open detail remain correct after resize |
| Performance | throttled mobile network/CPU where available; responsive controls; clean console |
| Security | exact parent origin; allowed production host; no wildcard |

Record browsers, widths, and deliberate scroll exceptions in the README or QA record.

### 8.13 Responsive QA automation scaffold

Automation catches regressions but does not replace visual, keyboard, touch, or screen-reader review. Keep this as development-only test code; do not ship Playwright to readers.

```js
// qa/responsive.spec.js
import { test, expect } from '@playwright/test';

const url = process.env.VIZ_URL;
if (!url) throw new Error('Set VIZ_URL to the deployed interactive URL.');

const viewports = [
  { name: 'phone-320', width: 320, height: 800 },
  { name: 'phone-360', width: 360, height: 800 },
  { name: 'phone-393', width: 393, height: 852 },
  { name: 'phone-430', width: 430, height: 932 },
  { name: 'narrow-520', width: 520, height: 900 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'article-930', width: 930, height: 900 },
  { name: 'wide-1200', width: 1200, height: 900 }
];

for (const viewport of viewports) {
  test(`${viewport.name}: no unintended overflow or undersized controls`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts?.ready);

    const result = await page.evaluate(() => {
      const root = document.documentElement;
      const controls = [...document.querySelectorAll(
        'button, select, input:not([type="hidden"]), [role="button"], [role="tab"]'
      )]
        .filter(element => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            rect.width > 0 &&
            rect.height > 0
          );
        })
        .map(element => {
          const rect = element.getBoundingClientRect();
          return {
            label:
              element.getAttribute('aria-label') ||
              element.textContent.trim().slice(0, 40) ||
              element.id ||
              element.tagName,
            width: rect.width,
            height: rect.height
          };
        });

      return {
        horizontalOverflow: root.scrollWidth - root.clientWidth,
        undersizedControls: controls.filter(
          item => item.width < 44 || item.height < 44
        )
      };
    });

    expect(result.horizontalOverflow).toBeLessThanOrEqual(1);
    expect(result.undersizedControls).toEqual([]);
    await page.screenshot({
      path: `qa/screenshots/${viewport.name}.png`,
      fullPage: true
    });
  });
}
```

Add a chart-specific rendered-text check. Supply selectors that include tick and
category labels but exclude intentional multi-line `<tspan>` groups:

```js
async function auditSvgText(page, selector) {
  return page.locator(selector).evaluateAll(nodes => {
    const boxes = nodes
      .filter(node => getComputedStyle(node).visibility !== 'hidden')
      .map(node => {
        const rect = node.getBoundingClientRect();
        const svgRect = node.ownerSVGElement.getBoundingClientRect();
        return {
          text: node.textContent.trim(),
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          svgLeft: svgRect.left,
          svgRight: svgRect.right,
          svgTop: svgRect.top,
          svgBottom: svgRect.bottom
        };
      });

    const clipped = boxes.filter(box =>
      box.left < box.svgLeft - 1 ||
      box.right > box.svgRight + 1 ||
      box.top < box.svgTop - 1 ||
      box.bottom > box.svgBottom + 1
    );

    const overlaps = [];
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i], b = boxes[j];
        if (
          a.left < b.right - 1 && a.right > b.left + 1 &&
          a.top < b.bottom - 1 && a.bottom > b.top + 1
        ) overlaps.push([a.text, b.text]);
      }
    }
    return { clipped, overlaps };
  });
}

const axisAudit = await auditSvgText(page, '.axis text, .row-label');
expect(axisAudit.clipped).toEqual([]);
expect(axisAudit.overlaps).toEqual([]);
```

At phone widths also assert:

* every focused editable input has computed `font-size >= 16px`;
* the fullscreen control is hidden for a coarse-pointer context;
* an open custom menu overlaps or directly abuts its trigger horizontally and
  begins within a small tolerance below it;
* a tap-pinned tooltip remains visible after `pointerleave` and closes on
  background tap;
* opening and closing each dialog changes and then restores reported iframe
  height;
* sticky matrix row headings retain the same viewport `left` position after the
  matrix scroller moves horizontally.
* every visible previous/next control contains the intended arrow icon or
  character, not a replacement glyph or mojibake sequence.

For portable arrow controls, prefer inline SVG. If text is generated through
`innerHTML`, use numeric character references such as `&#8592;` and `&#8594;`
rather than pasting a character whose bytes may be decoded under the wrong
encoding. Keep an explicit `aria-label` such as `Previous three destinations`;
the icon itself is not the accessible name.

Run at minimum in Chromium and one other browser engine. Add project-specific assertions for:

* expected title/default selection;
* no-data and maximum-data states;
* filter/reset/download;
* dialog open/close and returned focus;
* table sort/pagination;
* map zoom/reset;
* analytics payload count/shape.

The script must distinguish control types: enforce `44px` for icon-only actions
and dialog close buttons; enforce `34px` plus at least `6px` separation for
ordinary visible filter/toggle controls; and never permit less than the WCAG
`24px` AA floor unless its defined spacing/essential exception is documented.
Do not use one global selector that silently makes every segmented control
`44px` high.

The iframe grow/shrink contract must also be tested in the real production parent because a direct-child test cannot verify origin allowlists or parent height application.

### 8.14 Industry evidence and interpretation

The following external practice informs this standard:

* Flourish recommends its script embed because the child reports height to the parent and can use a different mobile aspect ratio.
* Datawrapper's responsive iframe also listens for child height and changes chart presentation on mobile, including moving line labels into a legend.
* Tableau supports distinct phone arrangements while retaining one published dashboard.
* Observable's responsive helpers use `ResizeObserver` and re-render from container dimensions.
* Research on responsive visualisation identifies a density–message trade-off: responsive work requires layout, encoding, interaction, and data-density decisions, not only proportional scaling.

There is no universal pixel breakpoint for every chart. The high-confidence industry pattern is: observe real width, re-render, recompose when constraints fail, preserve semantics and functionality, allow content-driven height, and test explicit small-screen states.

---

## 9. Accessibility and inclusive operation

Accessibility is a release requirement, not a later enhancement.

### 9.1 Semantic structure

* Use native headings, paragraphs, buttons, links, labels, inputs, selects, tables, and dialogs.
* Every input has a visible label or a programmatic label where a visible label would be redundant.
* DOM order must remain logical when CSS changes layout.
* Use real buttons for actions and links for navigation.
* Do not attach click-only behaviour to a `div` or SVG mark without keyboard semantics.

### 9.2 Chart description

Provide:

1. an accessible iframe title on the parent;
2. an accessible chart name;
3. a concise summary of the main pattern/current state;
4. exact data via table or download where feasible.

```html
<div
  id="chart"
  role="img"
  aria-labelledby="panelTitle chartSummary"
></div>
<p id="chartSummary" class="visually-hidden">
  Values generally rise over the period; the selected entity has …
</p>
```

Update the summary when state changes, but do not flood an `aria-live` region with every mark. Announce concise outcomes such as “Showing 18 countries for 2024.”

SVG should have `role="img"` and an accessible name/description. Hide decorative SVG groups with `aria-hidden="true"`. Canvas needs adjacent text/table because its pixels have no semantic structure.

### 9.3 Keyboard

All controls must work with keyboard:

* Tab/Shift+Tab moves through controls in logical order;
* Enter/Space activates buttons;
* arrow keys operate radio groups, sliders, tabs, and listboxes according to native/ARIA conventions;
* Escape closes a tooltip/menu/dialog where applicable;
* focus is visible and never clipped;
* opening detail moves focus appropriately;
* closing returns focus to the invoking element.

Do not make every one of thousands of marks a tab stop. Provide structured group navigation, nearest-point navigation, a selector, or a data table.

### 9.4 Colour and contrast

* Colour is never the sole carrier of meaning.
* Text contrast meets WCAG AA.
* Focus, control boundaries, selected marks, and data strokes required to identify content remain distinguishable.
* No-data, zero, excluded, selected, muted, and unavailable states are visually and textually distinct.

### 9.5 Motion and flashes

Respect `prefers-reduced-motion`. Do not use gratuitous animation, parallax, auto-advancing steps, or flashes. Motion should explain a state transition and normally complete quickly. Never animate height in a way that causes page jumping.

### 9.6 Hover/focus content

Hover/focus content must be:

* dismissible without moving pointer/focus;
* hoverable when the pointer moves into it, if it contains content;
* persistent until hover/focus leaves, Escape is pressed, or the user dismisses it;
* available through focus and tap;
* not placed over the active mark when an adjacent position is available.

### 9.7 Data access

For complex visuals, provide at least one:

* downloadable filtered CSV;
* accessible table;
* structured textual summary;
* keyboard exploration interface.

The alternative must reflect the same filters and definitions as the visual.

### 9.8 Accessibility QA

Required:

* keyboard-only pass;
* screen-reader smoke test in at least one current browser/reader pair;
* `200%` zoom;
* `320px` reflow;
* contrast check;
* touch-target measurement;
* reduced-motion check;
* automated audit (useful, not sufficient);
* manual verification that dynamic labels/state are announced sensibly.

---

## 10. Controls and interaction components

### 10.1 General control rules

Every control must have:

* a visible purpose and label;
* a meaningful default;
* a unique accessible name;
* keyboard and touch operation;
* a visible selected/current state;
* a deterministic effect on central state;
* analytics classification or an explicit decision not to track it.

Keep controls in one state object and render all dependent outputs from it:

```js
const DEFAULT_STATE = Object.freeze({
  year: '2024',
  entity: 'ALL',
  metric: 'value',
  page: 0,
  selectedId: null
});

let state = { ...DEFAULT_STATE };

function setState(patch) {
  state = { ...state, ...patch };
  render(state);
}

function resetState() {
  state = { ...DEFAULT_STATE };
  render(state);
}
```

Do not maintain separate unsynchronised “chart state,” “card state,” and “download state.”

### 10.2 Native select first

Use a native `<select>` when options are short enough to scan, typically fewer than about 15–20.

```html
<div class="control">
  <label for="countrySelect">Country</label>
  <select id="countrySelect">
    <option value="ALL">All countries</option>
  </select>
</div>
```

Populate safely:

```js
function setSelectOptions(select, options, selectedValue) {
  const fragment = document.createDocumentFragment();

  for (const option of options) {
    const element = document.createElement('option');
    element.value = option.value;
    element.textContent = option.label;
    element.selected = option.value === selectedValue;
    fragment.append(element);
  }

  select.replaceChildren(fragment);
}
```

### 10.3 Searchable selectors

Use a searchable combobox only when search materially improves a long list. An accessible combobox is not merely a text input plus an absolutely positioned `div`.

Required behaviour:

* label and combobox accessible name;
* `role="combobox"`, `aria-expanded`, `aria-controls`, and active descendant;
* listbox/options with stable IDs;
* Up/Down navigation, Enter selection, Escape close;
* visible focus/active option;
* match text announced;
* full valid list shown whenever the control reopens;
* selected option scrolled into view;
* `All …` first where meaningful;
* menu clamped to the iframe viewport;
* click/tap outside closes without losing the selected value.

Prefer a tested accessible component/library already approved for the project over an improvised incomplete implementation. If no approved combobox is available, use a native select even if it is less polished.

Do not turn a short closed list—year, income group, metric, or region—into a
searchable combobox. Use a native `<select>` or a short segmented control.
Native selectors intentionally look different across iOS, Android, and desktop;
their behaviour and accessibility are more important than pixel-identical
chrome.

For a required custom combobox, the menu must be one bounded surface attached to
the trigger. Options are rows, not separate rounded “bubbles”. Do not switch the
menu to `position: fixed` at a phone breakpoint: browser toolbars, keyboards,
iframe offsets, and the visual viewport can detach it from the field.

```css
.combobox {
  position: relative;
  min-width: 0;
}

.combobox__menu {
  position: absolute;
  z-index: 30;
  inset-inline: 0;
  top: calc(100% + 4px);
  max-height: min(48dvh, 360px);
  overflow: auto;
  padding: 4px;
  border: 1px solid var(--cgd-border);
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 12px 26px rgba(26,39,42,.16);
}

.combobox__option {
  width: 100%;
  min-height: 36px;
  margin: 0;
  padding: 8px 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--cgd-teal-black);
  font: inherit;
  text-align: left;
}

.combobox__option[aria-selected="true"],
.combobox__option.is-active {
  background: #eef4f5;
}
```

Opening a selector on a coarse pointer must not automatically focus its search
field and summon the keyboard. Let the reader tap the search field deliberately:

```js
function openCombobox() {
  menu.hidden = false;
  trigger.setAttribute('aria-expanded', 'true');
  renderOptions();

  if (matchMedia('(min-width: 521px) and (pointer: fine)').matches) {
    requestAnimationFrame(() => searchInput.focus());
  }
}
```

Mobile QA must open every custom selector in every state that changes its option
list or position. Verify that the menu touches the trigger, remains inside the
iframe, scrolls independently, selects on the first tap, closes on outside tap
and Escape, and does not leave a stale menu after re-render.

### 10.4 Dependent controls

When a parent filter changes:

```js
function updateParentFilter(nextParent) {
  const validChildren = getChildren(nextParent);
  const childIsValid = validChildren.some(
    option => option.value === state.child
  );

  setState({
    parent: nextParent,
    child: childIsValid ? state.child : 'ALL',
    page: 0,
    selectedId: null
  });
}
```

Preserve a valid child selection; otherwise reset to its defined `All` state. Rebuild labels, title, chart, cards, tooltip data, download, and option list from the resulting state.

### 10.5 Segmented single-choice control

Use native radios styled as a segmented control; this gives correct arrow-key and form semantics.

```html
<fieldset class="segmented">
  <legend class="control__label">Measure</legend>
  <label>
    <input type="radio" name="measure" value="value" checked>
    <span>Value</span>
  </label>
  <label>
    <input type="radio" name="measure" value="share">
    <span>Share</span>
  </label>
</fieldset>
```

```css
.segmented {
  display: inline-grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  min-width: min(100%, 220px);
  margin: 0;
  padding: 3px;
  border: 1px solid var(--cgd-border);
  border-radius: 11px;
  background: var(--cgd-white);
}

.segmented legend { margin-bottom: 5px; }
.segmented label { position: relative; min-width: 0; }
.segmented input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.segmented span {
  display: flex;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  padding: 5px 8px;
  border-radius: 8px;
  color: var(--cgd-teal);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}
.segmented input:checked + span {
  background: var(--cgd-teal);
  color: var(--cgd-white);
}
.segmented input:focus-visible + span {
  outline: 2px solid var(--cgd-teal);
  outline-offset: 2px;
  box-shadow: var(--focus);
}
```

Use two or three short choices. For more or long options, use radios in a vertical group or a select.

### 10.6 Sliders

Use a slider only when continuous/ordered exploration matters. Always show its current value and expose an exact alternative if precision matters.

```html
<div class="control">
  <label for="yearSlider">Year: <output id="yearOutput">2024</output></label>
  <input id="yearSlider" type="range" min="2000" max="2024" step="1"
         value="2024">
</div>
```

Update the visual on `input` only if rendering is cheap or debounced. Track analytics on `change`.

### 10.7 Legend as control

A legend may double as a series filter only when the legend already identifies a small, fixed set of series.

* Render it with buttons or checkboxes, not clickable text spans.
* Preserve a visible selected/muted state and `aria-pressed`/checked state.
* Do not remove all context unless “isolate series” is explicitly the action.
* Include an `All`/reset route.
* Do not use both a legend-control and a separate equivalent dropdown.

### 10.8 Real tabs

Use tabs only when the reader switches among distinct panels in the same location. Do not use tab styling for summary cards or filters.

```html
<div class="tabs">
  <div role="tablist" aria-label="Analysis view">
    <button id="tab-overview" type="button" role="tab"
            aria-selected="true" aria-controls="panel-overview"
            tabindex="0">Overview</button>
    <button id="tab-detail" type="button" role="tab"
            aria-selected="false" aria-controls="panel-detail"
            tabindex="-1">Detail</button>
  </div>

  <section id="panel-overview" role="tabpanel"
           aria-labelledby="tab-overview"></section>
  <section id="panel-detail" role="tabpanel"
           aria-labelledby="tab-detail" hidden></section>
</div>
```

```js
function initialiseTabs(tablist) {
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];

  function activate(tab, { focus = true } = {}) {
    for (const item of tabs) {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;

      const panel = document.getElementById(
        item.getAttribute('aria-controls')
      );
      panel.hidden = !selected;
    }

    if (focus) tab.focus();
  }

  tablist.addEventListener('click', event => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) activate(tab, { focus: false });
  });

  tablist.addEventListener('keydown', event => {
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;

    let next = current;
    if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') {
      next = (current - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;

    event.preventDefault();
    activate(tabs[next]);
  });
}

document.querySelectorAll('[role="tablist"]').forEach(initialiseTabs);
```

Tabs must:

* have short labels and a visible selected state;
* use Left/Right, Home, and End keyboard behaviour;
* retain one tab in the normal tab sequence;
* hide inactive panels from all users;
* preserve panel state when switching where appropriate;
* track `navigate` or `view_control`, according to the analytical effect.

On a phone, allow the tablist to wrap only if labels remain clearly associated; otherwise use a native select or vertical accordion. Do not make tabs horizontally scroll without an obvious affordance.

### 10.9 Tooltips

Tooltips give compact exact detail. They do not carry essential definitions or the only accessible version of a value.

```css
.tooltip {
  position: fixed;
  z-index: 10000;
  width: max-content;
  min-width: min(220px, calc(100vw - 24px));
  max-width: min(360px, calc(100vw - 24px));
  padding: 10px 12px;
  border: 1px solid var(--cgd-border);
  border-radius: 10px;
  background: rgba(255,255,255,.98);
  color: var(--cgd-teal-black);
  font-size: 12px;
  line-height: 1.35;
  box-shadow: 0 10px 24px rgba(26,39,42,.14);
  pointer-events: auto;
}

.tooltip__title {
  margin: 0 0 6px;
  color: var(--cgd-teal);
  font-size: 13px;
  font-weight: 700;
}

.tooltip__grid {
  display: grid;
  grid-template-columns: minmax(92px, 1fr) auto;
  gap: 4px 12px;
}

.tooltip__value {
  font-variant-numeric: tabular-nums;
  text-align: right;
}
```

Pointer-safe placement:

```js
function placeTooltip(tooltip, clientX, clientY, offset = 16) {
  const pad = 12;
  const box = tooltip.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;

  let left = clientX + offset;
  let top = clientY + offset;

  if (left + box.width > viewportWidth - pad) {
    left = clientX - box.width - offset;
  }
  if (top + box.height > viewportHeight - pad) {
    top = clientY - box.height - offset;
  }

  left = Math.max(pad, Math.min(left, viewportWidth - box.width - pad));
  top = Math.max(pad, Math.min(top, viewportHeight - box.height - pad));

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}
```

Use one owner/pinned state and delayed dismissal so the pointer can enter the tooltip:

```js
const tooltip = document.getElementById('tooltip');
let tooltipOwner = null;
let tooltipPinned = false;
let tooltipCloseTimer = 0;

function tooltipPointFor(owner) {
  const box = owner.getBoundingClientRect();
  return {
    x: box.left + box.width / 2,
    y: box.top + box.height / 2
  };
}

function showTooltip(owner, contentNode, point = tooltipPointFor(owner)) {
  clearTimeout(tooltipCloseTimer);
  tooltipOwner?.removeAttribute('aria-describedby');
  tooltipOwner = owner;
  owner.setAttribute('aria-describedby', tooltip.id);

  tooltip.replaceChildren(contentNode);
  tooltip.hidden = false;
  placeTooltip(tooltip, point.x, point.y);
}

function scheduleTooltipClose() {
  clearTimeout(tooltipCloseTimer);
  tooltipCloseTimer = setTimeout(() => {
    if (tooltipPinned) return;
    tooltip.hidden = true;
    tooltipOwner?.removeAttribute('aria-describedby');
    tooltipOwner = null;
  }, 120);
}

function attachTooltip(owner, contentFactory) {
  owner.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'touch') {
      showTooltip(owner, contentFactory(), {
        x: event.clientX,
        y: event.clientY
      });
    }
  });

  owner.addEventListener('pointermove', event => {
    if (!tooltip.hidden && !tooltipPinned && event.pointerType !== 'touch') {
      placeTooltip(tooltip, event.clientX, event.clientY);
    }
  });

  owner.addEventListener('pointerleave', scheduleTooltipClose);
  owner.addEventListener('focus', () => {
    tooltipPinned = false;
    showTooltip(owner, contentFactory());
  });
  owner.addEventListener('blur', scheduleTooltipClose);

  owner.addEventListener('pointerup', event => {
    if (event.pointerType === 'touch') {
      tooltipPinned = !(tooltipPinned && tooltipOwner === owner);
      if (tooltipPinned) showTooltip(owner, contentFactory());
      else scheduleTooltipClose();
    }
  });
}

tooltip.addEventListener('pointerenter', () => {
  clearTimeout(tooltipCloseTimer);
});
tooltip.addEventListener('pointerleave', scheduleTooltipClose);

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  tooltipPinned = false;
  scheduleTooltipClose();
});

document.addEventListener('pointerdown', event => {
  if (
    event.target.closest('[data-tooltip-owner]') ||
    event.target.closest('#tooltip')
  ) return;

  tooltipPinned = false;
  tooltip.hidden = true;
  tooltipOwner?.removeAttribute('aria-describedby');
  tooltipOwner = null;
});
```

`contentFactory()` must build DOM nodes with `textContent`, not unsanitised HTML. If a mark click opens a dialog, do not also use click to pin a tooltip: make the dialog the touch detail route and retain tooltip for pointer hover/keyboard focus.

Do not use centred `translate(-50%, -100%)` placement over a dense mark. On keyboard focus, position relative to the focused mark. Escape dismisses.

A tapped tooltip must persist long enough to read and must have an obvious
dismissal route: tap the same mark again, tap chart background/outside, or press
Escape. Do not re-render the clicked mark and then call `showTooltip` on the
detached old node; save the pointer coordinates or find the replacement node
after rendering. Conversely, `pointerleave` must not close a touch-pinned
tooltip.

Dynamic selection must not add or remove legend entries if doing so changes the
plot position. Prefer selection styling on the mark. If a selection key is
essential, reserve its space from initial render.

### 10.10 Detail dialog

Use native `<dialog>` for substantial detail. It supplies modal semantics and focus containment in current browsers.

```js
const detailDialog = document.getElementById('detailDialog');
let dialogInvoker = null;

function openDetail(invoker, title, buildBody) {
  dialogInvoker = invoker;
  document.getElementById('dialogTitle').textContent = title;
  const body = document.getElementById('dialogBody');
  body.replaceChildren(buildBody());
  detailDialog.showModal();
  CGDTracking.trackEngagement('detail_open', 'item_detail');
}

detailDialog.addEventListener('close', () => {
  CGDTracking.trackEngagement('detail_close', 'item_detail');
  dialogInvoker?.focus();
  dialogInvoker = null;
});
```

```css
.dialog {
  width: min(620px, calc(100vw - 24px));
  max-height: min(80dvh, 760px);
  overflow: auto;
  padding: 20px;
  border: 1px solid var(--cgd-border);
  border-radius: 14px;
  color: var(--cgd-teal-black);
  background: var(--cgd-white);
  box-shadow: 0 20px 60px rgba(26,39,42,.24);
}
.dialog::backdrop { background: rgba(26,39,42,.42); }
.dialog__close { float: right; font-size: 24px; line-height: 1; }

@media (max-width: 520px), (hover: none) and (pointer: coarse) {
  .dialog {
    width: 100%;
    max-width: none;
    max-height: min(82dvh, 680px);
    margin: auto 0 0;
    padding: 14px;
    border-radius: 16px 16px 0 0;
    overscroll-behavior: contain;
  }

  .dialog__header {
    position: sticky;
    top: -14px;
    z-index: 2;
    padding-top: 14px;
    background: #fff;
  }
}
```

Do not duplicate the chart's entire method in a dialog. Use it for exact values or distinct drill-down.

Keep mobile detail concise. Show the identifying title, two to four priority
facts, then the drill-down. Use at most three dense record cards or five short
one-line rows per page, with Previous/Next controls and an explicit `1 of N`
status. Do not put an unbounded top-10 or top-20 list above the close control.
Preserve the current page only while that same detail remains open; reset to
page 1 for a new cell/mark.

Pagination controls require `44px` targets, disabled states, accessible names,
and a tracked `navigate` event. A “further records” aggregate belongs after the
last page. If all records are analytically necessary at once, provide a separate
table/download rather than an oversized popup.

### 10.11 Fullscreen

Fullscreen is optional. Add it when space materially improves exploration, especially maps and dense tables. The embedded view must remain functional without it.

Do not show a fullscreen/enlarge button where the Fullscreen API is unavailable
or where the device has a coarse pointer/phone layout and the control adds no
usable space. The phone layout itself must be complete; fullscreen is never the
mobile fix.

```js
const viz = document.getElementById('viz');
const fullscreenButton = document.getElementById('fullscreenButton');

if (!document.fullscreenEnabled) {
  fullscreenButton.hidden = true;
}

const visibleWidth = Math.min(
  visualViewport?.width || Infinity,
  document.documentElement.clientWidth || Infinity,
  innerWidth || Infinity
);
const coarsePointer = matchMedia('(pointer: coarse)').matches ||
  navigator.maxTouchPoints > 0;

if (visibleWidth <= 600 || coarsePointer) {
  fullscreenButton.hidden = true;
}

function syncFullscreenButton() {
  const active = document.fullscreenElement === viz;
  const label = active ? 'Exit fullscreen' : 'View fullscreen';
  fullscreenButton.setAttribute('aria-label', label);
  fullscreenButton.setAttribute('title', label);
}

fullscreenButton.addEventListener('click', async () => {
  if (document.fullscreenElement === viz) {
    await document.exitFullscreen();
  } else {
    await viz.requestFullscreen();
  }
});

document.addEventListener('fullscreenchange', () => {
  syncFullscreenButton();
  // Width observer redraws the chart; body observer reports final height.
});
```

```css
[hidden] { display: none !important; }

.viz:fullscreen {
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: auto;
  padding: 22px;
  background: var(--cgd-white);
}

@media (hover: none) and (pointer: coarse), (max-width: 520px) {
  #fullscreenButton { display: none; }
}
```

Menus, tooltips, and dialogs must be descendants of the fullscreen element or otherwise able to render above it.

### 10.12 CSV download

Download exactly the data represented by current filters, with reader-facing headers and documented units.

```js
function csvCell(value) {
  if (value == null) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadCsv(filename, columns, rows) {
  const lines = [
    columns.map(column => csvCell(column.label)).join(','),
    ...rows.map(row =>
      columns.map(column => csvCell(row[column.key])).join(',')
    )
  ];

  const blob = new Blob(
    ['\uFEFF' + lines.join('\r\n')],
    { type: 'text/csv;charset=utf-8' }
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

Do not expose hidden internal IDs or misleading preformatted strings.

---

## 11. Chart selection and chart-specific standards

### 11.1 Selection table

| Reader task | Preferred form |
|---|---|
| Compare category magnitudes | bar/dot plot |
| Rank many labelled items | horizontal bar, lollipop, or dot plot |
| Show change over ordered time | line chart |
| Show composition over time | stacked area only with few stable parts; otherwise lines/small multiples |
| Compare two periods per item | slope/dumbbell for labelled rows; parity scatter for many entities |
| Examine association | scatter/bubble |
| Show distribution | histogram, box/violin, strip/dot distribution |
| Exact multi-field lookup | table |
| Row-by-column relationship | matrix |
| Geographic spatial pattern | map |
| Directional relationships | flow map only when geography matters; otherwise network/ranked flows |

Do not choose a map merely because data contain countries. Do not use pie/donut charts for numerous or close comparisons. Avoid 3D.

### 11.2 Common chart rules

* Encode the main comparison with position or length before area or colour.
* Use a common scale for panels intended for comparison.
* Start bar axes at zero unless the chart is a justified deviation form with an explicit baseline.
* Label units once, clearly.
* Show uncertainty when material.
* Keep grid lines quiet and sparse.
* Format numbers consistently across axis, label, tooltip, card, and download.
* Do not hide excluded or missing rows silently; disclose the rule.
* Sort deliberately and preserve stable order when readers compare states.
* Use annotations to explain a meaningful event or outlier, not to narrate every feature.

### 11.3 Number formatting

Store numbers as numbers. Format at display time.

```js
const formatters = {
  integer: new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }),
  oneDecimal: new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }),
  compact: new Intl.NumberFormat('en-GB', {
    notation: 'compact',
    maximumFractionDigits: 1
  }),
  percent: new Intl.NumberFormat('en-GB', {
    style: 'percent',
    maximumFractionDigits: 1
  })
};

function formatValue(value, kind = 'oneDecimal') {
  return Number.isFinite(value) ? formatters[kind].format(value) : 'N/A';
}
```

Store a percentage as a fraction (`0.617`) and format it once (`61.7%`). If source data are percent units (`61.7`), normalise during preparation and document the convention.

Distinguish:

* percentage change: `(new - old) / old`;
* percentage-point change: `newShare - oldShare`;
* absolute change: `new - old`.

Do not calculate percentage change from zero without an explicit treatment.

### 11.4 Bars

Use horizontal bars for long category labels or more than about six categories.

* Sort by the measure unless a meaningful natural order exists.
* Put labels outside the plot or in a dedicated label column.
* Put values outside the bar by default. Move them inside only when contrast and available length are sufficient.
* Use one highlight colour and muted context rather than a rainbow for a single measure.
* Grouped bars are suitable for a small number of series; use small multiples when groups become crowded.
* Stacked bars are good for totals and composition, but only the first segment has a common baseline. Use grouped bars, dots, or small multiples when comparing all components matters.
* Diverging bars need a meaningful centre and balanced scale.

Phone adaptation: retain horizontal orientation, allow rows to become taller, reduce displayed tick count, and paginate long rankings. Do not reduce row labels below the text floor.

### 11.5 Lines

* Use for ordered, normally continuous time.
* Direct-label a small number of lines at the right edge when labels fit without collision.
* On narrow screens, move direct labels into a compact top/bottom legend or allow series selection; do not shrink labels into overlap.
* Use consistent temporal intervals and disclose gaps/interpolation.
* Projections use a clear dash and start at the observed/projected boundary.
* A selected line may remain saturated while context lines become muted; preserve their visibility.
* Tooltip should identify period, exact value, and series; consider nearest-x or nearest-line interaction rather than tiny point targets.

Avoid smoothing that suggests unobserved values. Use markers only when they add meaning or help sparse series.

### 11.6 Areas

Use area to emphasise magnitude over time, not merely as decoration under a line.

* Zero baseline is normally required.
* Stacked area works only with few, stable categories and clear total/composition interpretation.
* Do not compare internal bands by thickness when the comparison is important.
* Use lines or small multiples for many categories or crossing series.

### 11.7 Scatter and bubble

* Axes must state measure and unit.
* Use a parity/reference line only when it has a clear analytical interpretation.
* Bubble size encodes area, not radius:

```js
function radiusFromValue(value, maxValue, minRadius = 3, maxRadius = 18) {
  if (!Number.isFinite(value) || value <= 0 || maxValue <= 0) return minRadius;
  return minRadius + Math.sqrt(value / maxValue) * (maxRadius - minRadius);
}
```

* Keep small points visible and add a size legend when area carries important information.
* Use opacity, jitter, hexbin, or aggregation for overplotting; disclose aggregation.
* Selecting a point may highlight it and fade context. Closing detail should not necessarily clear selection; define selection and dialog visibility separately.
* Search may be a better selection mechanism than making every dense mark a tiny target.
* Provide a table/download for exact lookup.

### 11.8 Two-period parity scatter

For many entities comparing the same measure in two periods:

* baseline on x, comparison on y;
* equal domains and equal physical scale;
* subtle 45-degree parity line;
* dynamic title naming measure and periods;
* tooltip with both values and absolute/relative change;
* optional size encoding only for a distinct, relevant variable;
* no default descriptor cards or “largest shifts” table;
* optional category legend-control when categories are few and visible;
* searchable entity selection for dense points.

Validate that values are comparable across periods and definitions did not change.

### 11.9 Ranked dot, lollipop, and dumbbell

Use a dumbbell when each row has exactly two comparable values and the change itself matters.

* baseline dot muted; comparison dot primary;
* line connects the two values;
* use green/red for direction only when normative meaning is valid; otherwise neutral teal/gold or labelled direction;
* sort by the comparison value unless another order is analytically central;
* place value labels outside the dot span, never over the connector;
* leave x-domain room for outside labels;
* rows missing either period are normally excluded from the dumbbell and disclosed, not converted to zero;
* paginate long lists (`15–25` rows is a useful starting point);
* reset page when a filter/metric changes.

```js
function labelPosition({ x0, x1, plotWidth, gap = 8, labelWidth = 48 }) {
  const left = Math.min(x0, x1);
  const right = Math.max(x0, x1);

  if (x1 >= x0) {
    if (right + gap + labelWidth <= plotWidth) {
      return { x: right + gap, anchor: 'start' };
    }
    return { x: left - gap, anchor: 'end' };
  }

  if (left - gap - labelWidth >= 0) {
    return { x: left - gap, anchor: 'end' };
  }
  return { x: right + gap, anchor: 'start' };
}
```

For a diverging or net-flow bar, the numeric label must not occupy the same
pixels as the bar unless contrast has been deliberately designed and verified.
Prefer an outside label. For a negative value:

1. place the label immediately before the negative endpoint when it fits;
2. if it would cross the plot's left boundary, place it immediately after the
   zero line on the unused positive side;
3. never place it at the negative endpoint with normal left alignment, because
   the bar then runs underneath the text.

The `labelPosition` function above implements this fallback. QA must include the
largest positive value, the largest negative value, a very short negative bar,
and a negative endpoint near the plot boundary. Compare each `.bar-label`
rectangle with its corresponding `.bar`: their intersection area must be zero
for labels designated as outside.

Pagination controls use `44px` targets and an accessible range label such as `1–20 of 84`.

### 11.10 Small multiples

Use small multiples when consistent repeated structure enables comparison better than colour or interaction.

* common scales when comparing magnitude;
* stable category order;
* one shared legend;
* two to four columns at wide widths as content permits;
* one column on a phone, or two only when each panel remains legible;
* do not duplicate axes/titles unnecessarily;
* the width observer must recompute panel columns and plot width.

### 11.11 Distribution charts

* Histograms need meaningful, consistent bins.
* Box plots need an explanation for non-specialist audiences and should show sample size where relevant.
* Violin density can obscure counts; pair with points or sample size.
* Dot/strip plots are often clearer for small samples.
* Never infer distributional detail from heavily aggregated source data.

### 11.12 Chart QA

* Is the chart form matched to the comparison?
* Are scales, baselines, units, bins, denominators, and ordering defensible?
* Are zero, missing, excluded, and no-data distinct?
* Does every filter update title, chart, summary, tooltip, table/download, and notes consistently?
* Do long labels and extreme values fit?
* Are positive and negative direct labels outside their marks, or otherwise
  proven legible with sufficient contrast and no glyph/mark collision?
* Does the mobile version preserve the same analytical question?
* Can a keyboard/touch user obtain the important detail?

---

## 12. Tables and matrices

### 12.1 When to use a table

Use a table when exact lookup, many fields, or precise comparison matters more than pattern recognition. A table is not a failed chart.

Required:

* semantic `<table>`, `<caption>`, `<thead>`, `<tbody>`, `<th scope>`;
* units in headers;
* numeric alignment and tabular numerals;
* clear missing-data text;
* keyboard-operable sorting if sortable;
* current sort indicated visually and with `aria-sort`;
* stable row keys and sorting;
* download matching the visible/filter scope.

```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}
.data-table th,
.data-table td {
  padding: 9px 10px;
  border-bottom: 1px solid var(--cgd-light-gray);
  text-align: left;
  vertical-align: top;
}
.data-table .numeric { text-align: right; }
.data-table thead th {
  color: var(--cgd-teal);
  font-size: 12px;
}
```

### 12.2 Responsive tables

Preferred order:

1. keep only essential columns;
2. allow headers/cells to wrap;
3. offer a mobile key-fields/card view when the table remains useful in one dimension;
4. use internal horizontal scroll for irreducible precision tables.

If horizontally scrollable:

* keep the caption and summary outside;
* use a visible “Scroll table horizontally” hint that disappears after use where appropriate;
* pinned columns must have opaque backgrounds and separators;
* do not reduce text below `12px`;
* verify keyboard and touch scroll.

For a matrix, freeze the row-heading column whenever data columns scroll
horizontally. The reader must not have to scroll back to rediscover which row a
cell belongs to. Use the same rule for the bottom-row label if totals are shown:

```css
.matrix-scroll {
  max-width: 100%;
  overflow-x: auto;
  padding-left: 0;
  isolation: isolate;
  overscroll-behavior-inline: contain;
  -webkit-overflow-scrolling: touch;
}

.matrix-corner,
.matrix-row-heading,
.matrix-total-row-heading {
  position: sticky;
  left: 0;
  z-index: 3;
  background: var(--cgd-cream); /* opaque: data must not show through */
  box-shadow: 6px 0 8px -8px rgba(26,39,42,.45);
}

.matrix-corner { z-index: 5; }
```

The sticky column must be inside the scrolling element and occupy the first
explicit grid/table column. No scroll-container padding or transparent grid gap
may remain to its left: otherwise scrolled values become visible in that strip.
The top-left corner header must also be `position: sticky`; a later
`.matrix-corner { position: relative; }` rule must not override it. Test the
opaque mask, separator, focus ring, corner label, bottom total label, and
z-index at both scroll extremes. At a point inside the frozen strip,
`document.elementFromPoint()` must return the frozen heading, never a data
cell. Do not make the entire page horizontally scrollable.

### 12.3 Sorting pattern

Use a button inside the header:

```html
<th scope="col" aria-sort="none">
  <button type="button" class="sort-button" data-key="value">
    Value
  </button>
</th>
```

On activation:

* update one authoritative sort state;
* use stable sort and deterministic tie-break;
* update `aria-sort` to `ascending`/`descending`;
* retain focus;
* announce the result succinctly;
* track `view_control`, not `filter`.

### 12.4 Matrix / heat grid

Use for a true row-by-column relationship. Keep it closer to an enhanced table than a dashboard.

Structure:

1. concise controls, if needed;
2. optional legend only when colour is not self-evident;
3. scrollable matrix;
4. row totals, column totals, and grand total only when meaningful;
5. click/focus detail for a cell when underlying records matter;
6. notes/source.

Default: no descriptor cards, second title, explanatory banner, or duplicated “largest cell” callout.

On touch, a cell detail view should show at most five underlying rows at once;
paginate longer lists as specified in Section 10.10. The popup title must repeat
both the source-column and recipient-row labels because the selected cell may no
longer be visible behind the dialog.

### 12.5 Matrix corner and direction

Label row and column meaning in a top-left corner cell. Use a real SVG diagonal, not a CSS gradient:

```html
<div class="matrix-corner" aria-label="Columns: source; rows: recipient">
  <svg aria-hidden="true" viewBox="0 0 100 100"
       preserveAspectRatio="none">
    <line x1="0" y1="0" x2="100" y2="100"></line>
  </svg>
  <span class="matrix-corner__column">Source</span>
  <span class="matrix-corner__row">Recipient</span>
</div>
```

```css
.matrix-corner {
  position: relative;
  min-width: 132px;
  min-height: 92px;
  color: var(--cgd-teal);
  font-size: 12px;
  font-weight: 700;
}
.matrix-corner svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.matrix-corner line {
  stroke: var(--cgd-border);
  stroke-width: 1.3;
  vector-effect: non-scaling-stroke;
}
.matrix-corner__column {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 48%;
  text-align: right;
}
.matrix-corner__row {
  position: absolute;
  left: 10px;
  bottom: 10px;
  width: 50%;
}
```

Increase cell height on narrow screens rather than shrinking the labels.

### 12.6 Matrix colour

Colour supports values; it does not replace text.

* Use a sequential CGD scale for magnitude.
* If values span orders of magnitude, use a disclosed transform or quantile bins only when analytically appropriate.
* Switch text to white only when the computed background contrast is sufficient.
* Zero and missing have distinct styles.
* Tooltips/dialogs state row, column, exact value, unit, share, and relevant underlying detail.
* Do not let row/column totals distort a colour scale intended for interior cells.

### 12.7 Table/matrix QA

* Do totals reconcile with displayed cells?
* Are direction, row, and column meaning unambiguous?
* Are headers and units visible?
* Is sort stable and announced?
* Does scroll preserve pinned-column opacity and focus visibility?
* Are values readable at `320px` and `200%` zoom?
* Is the same filtered dataset used for totals, detail, and download?

---

## 13. Maps and geographic flow

### 13.1 Decide whether geography is analytical

Use a map when location, adjacency, spatial distribution, distance, or direction is important. Use a bar/table when the reader mainly needs ranking or exact comparison.

Select:

* choropleth for a normalised area measure;
* proportional symbol for totals/counts;
* locator map for place/context;
* flow map for directional relationships where geography matters;
* cartogram only with a strong explanation.

Never map raw totals with a choropleth when area/population size confounds interpretation.

### 13.2 Geometry and joins

* Record geometry source, date, licence, administrative level, and simplification.
* Join by stable codes, not labels.
* Maintain a reviewed crosswalk for boundary/name differences.
* Report matched/unmatched counts in development.
* Do not silently drop territories or unmatched data.
* Simplify enough for phone performance without visibly damaging boundaries.
* Preserve islands/small territories through insets, markers, or an accessible lookup.

```js
function auditJoin(features, rows, featureKey, rowKey) {
  const dataKeys = new Set(rows.map(row => String(row[rowKey])));
  const featureKeys = new Set(
    features.map(feature => String(feature.properties[featureKey]))
  );

  return {
    dataWithoutGeometry: [...dataKeys].filter(key => !featureKeys.has(key)),
    geometryWithoutData: [...featureKeys].filter(key => !dataKeys.has(key))
  };
}
```

### 13.3 Projection

Choose projection for region/task:

* use a regional equal-area or conformal projection appropriate to the analytical purpose;
* use a world projection that avoids severe visual distortion for global choropleths;
* do not default to Web Mercator for analytical area comparison;
* use Web Mercator only when required by slippy-map tiles and acknowledge its properties;
* fit to the intended region, not to remote territories that make the main area tiny;
* use insets/extent overrides for remote territories.

Document the choice when it can affect interpretation.

### 13.4 Choropleth

* Use a normalised comparable measure.
* Prefer a continuous scale when readers need approximate magnitude and the legend can be interpreted.
* Use discrete bins when thresholds are meaningful or exact class reading matters.
* Use a defensible classification (equal interval, quantile, natural breaks, or policy threshold) and state it.
* Keep no-data separate from the scale.
* Boundaries are subtle and remain visible on dark fills.
* Hover/selection outline is a separate non-scaling layer, not a fill mutation that changes the data encoding.
* Tooltip: geography, value/unit, period, denominator/coverage where relevant.
* Click/focus detail may add comparison or components.

### 13.5 Map shell and controls

Recommended structure:

1. optional dynamic title;
2. optional headline card(s) only under Section 2.6;
3. compact controls;
4. map with visible legend;
5. zoom/reset buttons where applicable;
6. notes/source and data alternative.

Default map panel:

```css
.map {
  position: relative;
  min-height: clamp(360px, 62cqi, 620px);
  overflow: hidden;
  border: 1px solid var(--cgd-border);
  border-radius: var(--panel-radius);
  background: #F7FAFA;
}
.map svg,
.map canvas { width: 100%; height: 100%; }
.map-control {
  min-width: 44px;
  min-height: 44px;
  border: 1px solid var(--cgd-border);
  border-radius: 9px;
  background: rgba(255,255,255,.96);
  color: var(--cgd-teal);
}
```

For touch maps, avoid capturing article scroll before the user deliberately interacts. Provide zoom buttons and Reset.

### 13.6 Zoom and state

* Constrain zoom scale and translation.
* Reset returns to the current geographic extent, not an unrelated global view.
* Selecting a geography may animate focus quickly; respect reduced motion.
* Non-geographic filter changes should preserve zoom when meaningful.
* Geographic scope changes should refit.
* Fullscreen entry/exit must preserve state and trigger a size-aware redraw.

### 13.7 Labels and small geographies

* Label only priority geographies at overview.
* Use collision detection or manually reviewed offsets.
* Do not shrink all labels.
* Provide searchable selection for every geography.
* Use callouts, insets, or marker dots for microstates/islands.
* Keep labels above fills/flows but below active tooltip/dialog.

### 13.8 Flow maps

Use flows only when direction and geography are both necessary.

Data must include stable source/target IDs, values, units, period, coordinates/geometry, and direction definition.

Visual rules:

* curved shortest-path routes;
* width encodes magnitude; opacity/darkness may reinforce but not contradict;
* arrowheads/directional animation only when needed and legible;
* round caps/joins;
* limit visible flows to preserve comprehension;
* totals/cards use the full filtered dataset unless labelled “shown flows”;
* reciprocal directions use mirrored curves so they do not overlap;
* no-data/negative/reversed flows have explicit treatment.

### 13.9 Visible and hit paths

Thin routes need a separate invisible hit path:

```css
.flow-visible,
.flow-hit {
  fill: none;
  vector-effect: non-scaling-stroke;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.flow-hit {
  stroke: transparent;
  stroke-width: 14px;
  pointer-events: stroke;
}
```

Place visible paths after hit paths so highlighting remains visible. Do not raise one hit path above all others on hover; that can create sticky stale targets. Clear tooltip/highlight whenever nearest candidate changes or pointer leaves.

### 13.10 Reciprocal curves

Assign a stable dyad key and opposite curve signs:

```js
function dyadKey(source, target) {
  return [source, target].sort().join('::');
}

function reciprocalSign(source, target) {
  return source < target ? 1 : -1;
}
```

Use the sign to offset the geodesic/control point consistently. Both directions must remain distinct at all zoom levels.

### 13.11 Dense-flow performance

Do not call expensive SVG path geometry methods across every path on every pointer move.

For dense maps:

1. sample each rendered path during render;
2. store sample point, path ID, and local position;
3. build a quadtree/spatial index;
4. query a small pointer radius;
5. compute the nearest candidate precisely;
6. throttle pointer processing to one animation frame.

Rebuild the index after projection, zoom mode, filter, or width changes. Keep a maximum activation radius so a tooltip does not appear far from any line.

### 13.12 Legends

* Choropleth legend states measure, unit, endpoints/bins, and no-data.
* Flow-width legend uses representative values and matches actual stroke scaling.
* Do not rely on a narrative note instead of a legend.
* Keep legend visible at phone width; place below/above map if an overlay would cover important geography.

### 13.13 Map accessibility

* Search/select route for geography.
* Keyboard-operable zoom/reset.
* Focus/tap equivalent for hover.
* Text summary and downloadable data/table.
* Selected geography/flow announced.
* Colour not sole carrier.
* Dense essential map marks may use target-size exception, but alternative operation is strongly preferred.

### 13.14 Map QA

* Are map and measure appropriate?
* Do joins reconcile and unmatched IDs have reviewed treatment?
* Are projection and extents appropriate?
* Are small/remote geographies accessible?
* Are legend, no-data, zero, units, and classification clear?
* Does zoom/reset work with mouse, keyboard, and touch?
* Do reciprocal flows remain distinct?
* Can every important flow be selected without sticky tooltips or lag?
* Does mobile preserve context and not trap scrolling?
* Are tiles/geometry attributed and licensed?

---

## 14. Calculators, multi-step tools, and small dashboards

### 14.1 Use only when the task requires it

Calculators and dashboards require more state, validation, accessibility, and maintenance than figures. Use them only when readers need to enter assumptions, compare scenarios, or coordinate several distinct views.

### 14.2 Inputs and validation

* Use native input types and visible units.
* State allowed range and assumptions before invalid submission.
* Validate on input/blur without erasing user data.
* Error messages identify the field and remedy.
* Do not calculate from invalid, missing, or stale inputs.
* Use a summary error region for multi-field forms.
* Preserve user values across responsive redraw.
* Do not collect personal information without explicit approval.

```js
function parseFiniteNumber(input, { min = -Infinity, max = Infinity } = {}) {
  const value = Number(input.value);
  if (!Number.isFinite(value)) return { ok: false, message: 'Enter a number.' };
  if (value < min) return { ok: false, message: `Enter ${min} or more.` };
  if (value > max) return { ok: false, message: `Enter ${max} or less.` };
  return { ok: true, value };
}
```

### 14.3 Calculations

* Keep pure calculation functions separate from rendering.
* Unit-test boundaries, zeros, negatives, missing values, and known examples.
* Display rounding must not feed back into calculations.
* Explain model assumptions and non-obvious formulas.
* Label modelled/scenario results as such.
* Make clear when a result is illustrative rather than advice.

```js
function calculateResult({ numerator, denominator }) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;
  if (denominator === 0) return null;
  return numerator / denominator;
}
```

### 14.4 Multi-step navigation

* Use an ordered progress indicator.
* Back preserves completed inputs.
* Next is not the only way to discover validation errors.
* Current step has accessible heading/focus.
* URL/history integration is optional but must not expose sensitive data.
* Track `navigate` for meaningful step movement.

### 14.5 Small dashboards

* One primary view per screen region.
* No repeated filters controlling the same state.
* Cards are optional under Section 2.6, not a dashboard decoration requirement.
* Use shared scales/legends for comparisons.
* Cross-filtering must be visibly reversible.
* Mobile stacks in analytical priority order, not arbitrary DOM/CSS order.
* If phone use becomes an endless column of unrelated panels, split into tabs/steps or separate interactives.

### 14.6 Share/reset/download

* Reset restores documented defaults and is tracked as `preset`.
* Shareable URLs may encode non-sensitive state if stable and reviewed.
* Download states whether it contains source, model output, or current filtered rows.
* Never put user-entered personal or sensitive values in URLs or analytics.

---

## 15. Data integrity, state, security, performance, and revision

### 15.1 One data pipeline

Use:

```text
raw/validated data
    → current state filters
    → derived rows/aggregates
    → chart + title + cards + tooltip source + table/download + notes
```

Do not let each component filter or aggregate independently.

```js
function deriveViewModel(data, state) {
  const filtered = data.filter(row => {
    return (
      (state.entity === 'ALL' || row.entity === state.entity) &&
      (state.year === 'ALL' || row.year === state.year)
    );
  });

  return {
    rows: filtered,
    total: filtered.reduce(
      (sum, row) => sum + (Number.isFinite(row.value) ? row.value : 0),
      0
    ),
    missingCount: filtered.filter(row => row.value == null).length
  };
}

function render(state) {
  const view = deriveViewModel(DATA, state);
  renderTitle(view, state);
  renderOptionalCards(view, state);
  renderChart(currentChartWidth, view, state);
  renderDownload(view, state);
  renderNotes(view, state);
}
```

Do not use the total reducer above when missing values must invalidate a total; implement the documented analytical rule instead.

### 15.2 Missing, zero, suppressed, and excluded

Represent distinctly in data:

```js
const Status = Object.freeze({
  VALUE: 'value',
  ZERO: 'zero',
  MISSING: 'missing',
  NOT_APPLICABLE: 'not_applicable',
  SUPPRESSED: 'suppressed',
  EXCLUDED: 'excluded'
});
```

Define:

* whether a missing row is excluded from denominators;
* whether `0` is observed or imputed;
* how suppressed values affect totals;
* whether “not applicable” is part of the universe;
* coverage threshold for display/caution.

Never coerce blanks, `null`, `N/A`, or failed parsing to zero.

### 15.3 Aggregation and double counting

For `All`/group totals:

* define the universe;
* deduplicate using stable keys;
* account for overlapping membership;
* aggregate after applying valid filters;
* compare with independent reference totals;
* state whether totals include estimates, projections, or incomplete reporting.

```js
function uniqueBy(rows, keyFn) {
  const seen = new Set();
  return rows.filter(row => {
    const key = keyFn(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
```

Do not use this helper blindly: duplicates may represent valid components. Define the key and aggregation unit first.

### 15.4 Ratios and denominators

* Numerator and denominator use compatible units, population, geography, and period.
* Store proportions as fractions.
* Validate impossible or unusual values.
* Hand-calculate several displayed results.
* Explain values above `100%` if analytically possible; otherwise treat as likely error.
* Never divide by zero.

```js
function safeRatio(numerator, denominator) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;
  if (denominator === 0) return null;
  return numerator / denominator;
}
```

### 15.5 Safe DOM construction

Do not use `innerHTML` for data/user-controlled content.

```js
function element(tag, options = {}, children = []) {
  const node = document.createElement(tag);

  if (options.className) node.className = options.className;
  if (options.text != null) node.textContent = String(options.text);

  for (const [name, value] of Object.entries(options.attributes || {})) {
    node.setAttribute(name, String(value));
  }

  for (const child of children) {
    node.append(child);
  }

  return node;
}
```

Validate user input before using it in calculations, URLs, selectors, or queries. Outbound links with `target="_blank"` require `rel="noopener noreferrer"`.

### 15.6 Performance

Required defaults:

* load only the data and libraries needed by that iframe;
* precompute expensive transformations;
* use minified/pinned dependencies;
* avoid large imagery, unused framework code, and thousands of unnecessary DOM nodes;
* schedule width redraws with one `requestAnimationFrame`;
* debounce expensive continuous input around `80ms` as a starting point;
* use spatial indexing for dense pointer search;
* lazy-load only when it does not break view analytics or initial narrative;
* keep interaction responsive on throttled phone CPU/network;
* clean observers/listeners if components are destroyed.

```js
function debounce(fn, delay = 80) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
```

Measure before optimising. Record unusually large data/library decisions.

### 15.7 Error and loading states

An empty white box is not an error state.

```js
function showStatus(message, { error = false } = {}) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.dataset.kind = error ? 'error' : 'info';
}
```

* Show a concise loading state only when load is perceptible.
* Catch fetch/parse/render failure and tell the reader the visual could not load.
* Do not expose stack traces or internal paths publicly.
* Log actionable detail to the console in development.
* Preserve source/method contact route where appropriate.
* The iframe-height observer must include loading/error height.

### 15.8 Editing an existing approved interactive

An edit request does not authorise a redesign.

1. Capture before screenshots at wide, article, and phone widths.
2. Inventory current state, controls, analytics, calculations, and accepted visual behaviour.
3. Identify exact requested change and dependencies.
4. Make the smallest coherent change.
5. Preserve approved geometry, library, state semantics, and wording unless change is required.
6. Re-run the full regression matrix, not only the changed state.
7. Compare before/after for accidental drift.
8. Update README/TRACKING/data notes with the same change.

Do not replace working code merely because another pattern is personally preferred. Do not restore an earlier geometry while implementing an unrelated fix.

### 15.9 Git and maintenance

* Use clear, descriptive commits.
* Keep data, design, and implementation changes reviewable.
* Do not mix unrelated changes.
* Never use generated minified source as the only maintainable source unless the project intentionally has a build pipeline.
* Do not over-engineer hypothetical future needs.
* Record ownership and update process.

---

## 16. Build and verification workflow

### 16.1 Before code

* communications involved;
* custom build justified;
* analytical question, measure, unit, denominator, and audience defined;
* data/licensing/privacy reviewed;
* host/origin agreed;
* static vs live update plan agreed;
* visual form chosen;
* default and control states specified;
* accessibility/data alternative planned;
* acceptance criteria recorded.

### 16.2 Data-first prototype

1. Validate data contract and joins.
2. Hand-calculate benchmark values.
3. Build the default static view.
4. Confirm chart form/scales/labels.
5. Add state and controls.
6. Derive every component from the same view model.

Do not spend time polishing an analytically incorrect prototype.

### 16.3 Embedded-first build

1. Add root reset and viewport metadata.
2. Add child resize code.
3. Render from container width.
4. Establish the `320px` layout and text/target floors.
5. Build wide layout without changing semantics.
6. Add touch/focus operation.
7. Add optional fullscreen only after the embed works.

### 16.4 Interaction and accessibility

1. Use native controls where possible.
2. Establish keyboard order and focus.
3. Add tooltip as enhancement, not sole content.
4. Add dialog only for distinct detail.
5. Add summary/table/download.
6. Test reduced motion and screen-reader output.

### 16.5 Analytics and documentation

Add analytics when interaction design is stable:

1. assign unique `interactive_name`;
2. audit every action;
3. instrument only meaningful events;
4. create `TRACKING.md`;
5. test child payload;
6. test parent/GTM/GA4 chain where access permits;
7. update README and data notes.

### 16.6 Visual QA

Check:

* hierarchy and brand palette;
* no decorative clutter or duplicated text;
* no unnecessary descriptor cards;
* consistent control height/radius/focus;
* labels, ticks, legend, tooltip, notes, and units;
* meaningful default;
* long labels/extreme numbers;
* no-data/empty/error/loading;
* phone and wide states;
* fullscreen, if present.

### 16.7 Functional QA

Exercise every combination reasonably likely to expose stale state:

* each filter and `All`;
* parent/child filter changes;
* reset;
* selection, deselection, popup close, background clear;
* sort and pagination boundaries;
* download;
* fullscreen entry/exit;
* map zoom/reset;
* resize and rotation while detail is open;
* missing/empty state;
* back/next for multi-step tools.

### 16.8 Data QA

* independent totals reconcile;
* denominators and units match;
* fractions/percent scaling checked;
* duplicate keys reviewed;
* missing is not zero;
* join coverage reported;
* exclusions disclosed;
* sorting/ranking stable;
* tooltip/download/chart agree;
* estimates/projections labelled;
* benchmark values match hand calculation.

### 16.9 Production QA

* HTTPS production URL;
* correct MIME types and no mixed content;
* no console or network errors;
* exact dependency versions;
* allowed origin for resize and analytics;
* iframe source matched correctly;
* correct iframe title;
* resize grows and shrinks;
* analytics view fires once;
* no secret/sensitive data;
* attribution/licence present;
* throttled mobile performance acceptable;
* surrounding article layout tested.

---

## 17. Release gate, documentation, and maintenance

### 17.1 Final release gate

Do not hand off as complete until every applicable item is yes or explicitly documented as a reviewed exception.

#### Scope and governance

- [ ] Communications was involved before completion.
- [ ] Custom code is justified over static/Flourish.
- [ ] Hosting, analytics, privacy, licence, and ownership are agreed.

#### Analysis and data

- [ ] Measure, unit, denominator, period, and universe are clear.
- [ ] Totals/ratios/joins/benchmarks have independent checks.
- [ ] Missing, zero, excluded, suppressed, and no-data are distinct.
- [ ] Source, date, transformations, caveats, and licence are documented.
- [ ] No personal/sensitive data or secrets are present.

#### Editorial and visual

- [ ] Default view answers the main question.
- [ ] Chart/map/table form is appropriate.
- [ ] CGD palette and typography are applied.
- [ ] No duplicated title/control/card/legend/annotation content.
- [ ] Descriptor cards are absent unless individually justified.
- [ ] Units, legend, labels, sources, and caveats are visible.

#### Responsive iframe

- [ ] No outer chrome or root spacing.
- [ ] Works `320–1200px` and at `200%` zoom.
- [ ] No page-level horizontal scroll except documented two-dimensional content.
- [ ] Chart re-renders from container width.
- [ ] Phone layout recomposes rather than proportionally shrinking.
- [ ] Text/target floors are met.
- [ ] Exact child resize code is present.
- [ ] Frame grows and shrinks after every height-changing state.
- [ ] Production origin is allowed.

#### Accessibility and interaction

- [ ] Native semantic controls and labels are used.
- [ ] Keyboard order and operation pass.
- [ ] Visible focus is not clipped.
- [ ] Hover detail is available by focus/tap.
- [ ] Colour is not the sole carrier.
- [ ] Contrast and reduced motion pass.
- [ ] Chart summary plus table/download is available where feasible.
- [ ] Dialog focus opens/closes correctly.

#### Function

- [ ] Every control, `All`, reset, sort, pagination, download, and fullscreen state works.
- [ ] Title/cards/chart/tooltip/table/download derive from one state.
- [ ] No stale selection/page/popup/zoom after filter change.
- [ ] Error/loading/empty states are readable.
- [ ] Console and network are clean.

#### Analytics

- [ ] Unique kebab-case `interactive_name`.
- [ ] `interactive_view` fires once.
- [ ] Only allowed `action_type` values are used.
- [ ] Slider tracked on `change`, not every `input`.
- [ ] Hover/pan/resize/scroll are not tracked.
- [ ] Values are bounded and low-cardinality.
- [ ] `TRACKING.md` matches code.

#### Handoff

- [ ] README is complete.
- [ ] Data regeneration instructions work.
- [ ] Dependencies and versions are recorded.
- [ ] Production URL and embed location are recorded.
- [ ] Test evidence/browsers/widths are recorded.
- [ ] Known limitations and ownership are recorded.

### 17.2 Required `README.md`

```markdown
# [Interactive title]

## Purpose

What the interactive shows, intended audience, and publication context.

## Production

- Production URL:
- cgdev.org embed page:
- Hosting:
- Owner:

## Files and architecture

Entry files, shared files, dependencies and exact versions, and major choices.

## Data

Sources, retrieval dates, licences, units, definitions, transformations,
denominators, missing-data treatment, and caveats.

## Regenerating processed data

Exact prerequisites and commands/steps.

## Responsive and accessibility behaviour

Supported width, deliberate layout changes, data alternative, and any
documented two-dimensional-scroll exception.

## Analytics

Link to TRACKING.md and interactive_name(s).

## QA

Browsers/devices/widths/zoom/input methods tested and benchmark checks.

## Deployment

How to publish/update and required origin allowlists.

## Maintenance

Owner, update frequency, known limitations, and deprecation/archive plan.
```

### 17.3 Handoff contents

Provide:

* complete repository/folder;
* source and processed data permitted for publication;
* preparation scripts;
* README;
* TRACKING document where applicable;
* production URL and embed markup;
* QA record/screenshots where useful;
* known limitations;
* concise change summary for revisions.

Use the collaboration and repository handoff workflow agreed for the project.

### 17.4 Maintenance rule

Any future change must keep code, data notes, README, analytics inventory, and production behaviour aligned. A change is not complete if documentation describes the previous state.

---

## 18. Reference basis and confidence

### 18.1 Organisational sources incorporated

This standard incorporates the operative requirements from:

* `cgd-interactive-toolkit/README.md`;
* `cgd-interactive-toolkit/interactive-coding-standard.md`;
* `cgd-interactive-toolkit/cgd-brand-reference.md`;
* `cgd-interactive-toolkit/analytics-tracking-standard.md`.

If those governance files are formally changed, review this standard for alignment. Until then, this document is sufficient for building and QA.

### 18.2 External standards and leading-provider practice

* [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
* [WCAG Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow)
* [WCAG Resize Text](https://www.w3.org/WAI/WCAG20/Understanding/resize-text)
* [WCAG Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
* [MDN Resize Observer](https://developer.mozilla.org/en-US/docs/Web/API/Resize_Observer_API)
* [MDN container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries)
* [MDN secure `postMessage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
* [MDN SVG `preserveAspectRatio`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/preserveAspectRatio)
* [Flourish responsive embed options](https://helpcenter.flourish.studio/hc/en-us/articles/8761559763343-Understanding-the-difference-between-Flourish-s-embed-options)
* [Flourish mobile-friendly visualisations](https://helpcenter.flourish.studio/hc/en-us/articles/8761567966351-How-to-create-mobile-friendly-visualizations)
* [Datawrapper responsive iframe](https://developer.datawrapper.de/docs/responsive-iframe)
* [Datawrapper responsive sizing](https://www.datawrapper.de/academy/how-to-change-the-size-of-your-visualizations)
* [Datawrapper accessibility](https://www.datawrapper.de/accessibility)
* [Tableau device layouts](https://help.tableau.com/current/pro/desktop/en-gb/dashboards_dsd_create.htm)
* [Observable responsive resize helper](https://observablehq.com/framework/javascript)
* [Design Patterns and Trade-Offs in Responsive Visualization for Communication](https://onlinelibrary.wiley.com/doi/10.1111/cgf.14321)

### 18.3 Confidence and judgement

High-confidence, non-negotiable elements:

* CGD iframe and analytics contracts;
* data/privacy/security requirements;
* responsive reflow and zoom requirements;
* semantic controls, keyboard operation, contrast, and target floors;
* container-width redraw and content-driven iframe height;
* reproducibility and documentation.

Strong house defaults, adjustable with evidence:

* typography sizes above accessibility floors;
* spacing, radii, and component styling;
* chart-specific mobile transformations;
* row counts/pagination;
* tooltip dimensions;
* breakpoint locations.

No standard can pre-select the best chart or exact breakpoint without the data and editorial question. Builders must use the decision tests and QA evidence in this document, not invent device-specific shortcuts or treat an example as universal.
