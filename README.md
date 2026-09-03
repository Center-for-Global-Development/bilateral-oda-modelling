# Bilateral ODA after aid cuts — interactive figures

Interactive figures and the coordination tool for the 2026 CGD paper *Modelling
bilateral ODA flows to 2028*. Each figure is a separate HTML file intended for a
cgdev.org iframe and eventual static hosting.

**Status: connected to GitHub.** This is the
[bilateral-oda-modelling](https://github.com/Center-for-Global-Development/bilateral-oda-modelling)
repository; GitHub Pages is not yet enabled. It contains the
shared layer, Figures 1–16 and a Figure 17 test build. `shared-layer-check.html` is a
development harness, not a publishable figure; it is marked
`data-cgd-harness="true"` and the gate skips it.

## Preview and hosting

`preview.html` embeds all seventeen figures on one page, each in a full-width
iframe that sizes itself from the figure's own resize message — the same contract
production uses. It is a **review** page, not a publication: the digital note will
carry its own surrounding text and spacing.

Once GitHub Pages is enabled (see below), the preview and the individual figures
are served from:

**Preview of all seventeen figures:**
https://center-for-global-development.github.io/bilateral-oda-modelling/preview.html

| Figure | Title | Standalone URL |
|---|---|---|
| F1 | How donor ODA changes by 2028 | [f1-donor-headline-cuts.html](https://center-for-global-development.github.io/bilateral-oda-modelling/f1-donor-headline-cuts.html) |
| F2 | How much of each donor's bilateral ODA can be traced to a recipient and sector? | [f2-traceable-oda.html](https://center-for-global-development.github.io/bilateral-oda-modelling/f2-traceable-oda.html) |
| F3 | How aid losses are distributed across countries | [f3-flows-and-losses-map.html](https://center-for-global-development.github.io/bilateral-oda-modelling/f3-flows-and-losses-map.html) |
| F4 | Where sector-level aid is falling fastest | [f4-recipient-sector-losses.html](https://center-for-global-development.github.io/bilateral-oda-modelling/f4-recipient-sector-losses.html) |
| F5 | What lost aid means for a recipient's economy | [f5-fiscal-loss.html](https://center-for-global-development.github.io/bilateral-oda-modelling/f5-fiscal-loss.html) |
| F6 | Which donors account for the largest aid losses? | [f6-donor-attributed-losses.html](https://center-for-global-development.github.io/bilateral-oda-modelling/f6-donor-attributed-losses.html) |
| F7 | How aid portfolios are changing | [f7-oda-treemap.html](https://center-for-global-development.github.io/bilateral-oda-modelling/f7-oda-treemap.html) |
| F8 | How a recipient's donor mix changes over time | [f8-donor-oda-over-time.html](https://center-for-global-development.github.io/bilateral-oda-modelling/f8-donor-oda-over-time.html) |
| F9 | Does bilateral ODA follow where extreme poverty is? | [f9-poverty-share-allocation.html](https://center-for-global-development.github.io/bilateral-oda-modelling/f9-poverty-share-allocation.html) |
| F10 | ‘Orphaned’ recipient-sector pairs, by year | [f10-orphaned-recipient-sector-pairs.html](https://center-for-global-development.github.io/bilateral-oda-modelling/f10-orphaned-recipient-sector-pairs.html) |
| F11 | Changing concentration of reliance on the top bilateral donor | [f11-top-donor-reliance.html](https://center-for-global-development.github.io/bilateral-oda-modelling/f11-top-donor-reliance.html) |
| F12 | How recipients’ losses vary across scenarios | [f12-recipient-losses-across-scenarios.html](https://center-for-global-development.github.io/bilateral-oda-modelling/f12-recipient-losses-across-scenarios.html) |
| F13 | How do allocation rules change a donor’s portfolio? | [f13-donor-flows-by-scenario.html](https://center-for-global-development.github.io/bilateral-oda-modelling/f13-donor-flows-by-scenario.html) |
| F14 | Which allocation rules protect countries facing the greatest constraints? | [f14-priority-flows-across-scenarios.html](https://center-for-global-development.github.io/bilateral-oda-modelling/f14-priority-flows-across-scenarios.html) |
| F15 | How much does donor behaviour change the risk of ‘orphaning’? | [f15-orphaning-across-scenarios.html](https://center-for-global-development.github.io/bilateral-oda-modelling/f15-orphaning-across-scenarios.html) |
| F16 | How could a donor allocate its bilateral ODA differently? | [f16-interactive-allocations-tool.html](https://center-for-global-development.github.io/bilateral-oda-modelling/f16-interactive-allocations-tool.html) |
| F17 | How recipients fare across allocation rules | [f17-recipient-scenarios-table.html](https://center-for-global-development.github.io/bilateral-oda-modelling/f17-recipient-scenarios-table.html) |

`shared-layer-check.html` is a development harness rather than a figure. It is
marked `data-cgd-harness="true"`, the QA gate skips it, and it is deliberately
absent from the preview page.

### Reviewing locally

The figures fetch a binary payload, and `fetch()` is blocked on `file://`, so
opening `preview.html` from disk shows seventeen fail states rather than
seventeen charts. Serve the repository root over HTTP instead:

```
python -m http.server 8000
```

Then open `http://localhost:8000/preview.html`.

### Enabling GitHub Pages

Pages is served straight from the branch; no build workflow is needed, because
there is no build step.

1. In the repository on GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to *Deploy from a branch*.
3. Set **Branch** to `main` and the folder to `/ (root)`, then **Save**.
4. Wait for the `pages-build-deployment` action to go green under **Actions**.

`.nojekyll` at the repository root is load-bearing: it turns off Jekyll
preprocessing so the payload is published byte-for-byte. Do not delete it.

`https://center-for-global-development.github.io` is already on the CGD resize
listener's allowlist, so figures embedded from this origin resize correctly in
production. Resize and analytics have **separate** allowlists and both must be
confirmed after deployment.

### The transport check, if the host ever changes

Blobs are pre-compressed `.bin.gz` and inflated in the browser with
`DecompressionStream`, which requires the host to serve them **as bytes**. If a
host sets `Content-Encoding: gzip`, the browser inflates them first and
`DecompressionStream` then fails on already-inflated bytes — every figure would
render a fail state.

GitHub Pages was confirmed correct on 2 September 2026, so nothing needs doing
today. Run this again on any new host, or after any change to payload serving:

```
curl -sI https://center-for-global-development.github.io/bilateral-oda-modelling/data/static-v2.2.9-swe-exit-scope/manifest.json
curl -sI https://center-for-global-development.github.io/bilateral-oda-modelling/data/static-v2.2.9-swe-exit-scope/cube/baseline__gross.bin.gz
```

The `.bin.gz` response must **not** carry a `Content-Encoding: gzip` header. Note
`Vary: Accept-Encoding` on these responses: check with a browser's header set,
`-H "Accept-Encoding: gzip, deflate, br, zstd"`, and not only with curl's default,
or you may be reading a variant no reader is served.

If `Content-Encoding: gzip` does appear, stop and re-plan the payload transport;
the fix is not a front-end change. Opening `preview.html` on the live site is the
same check by eye: seventeen charts means the transport is correct, and a wall of
fail states means it is not.

### Embedding a figure in the digital note

Each figure carries the standard CGD child-side resize and analytics code. Embed
it with a full-width iframe whose initial height is only a loading placeholder:

```html
<iframe
  src="https://center-for-global-development.github.io/bilateral-oda-modelling/f1-donor-headline-cuts.html"
  title="How donor ODA changes by 2028"
  loading="lazy"
  scrolling="no"
  style="display:block;width:100%;height:1240px;border:0"
>
</iframe>
```

The child reports its content height with `{ type: "cgd-iframe-resize", height }`
and the CGD parent listener applies it after validating the child origin. Do not
tune a permanent fixed height; the figure reports again after width changes, font
loading, control changes, dialogs and any other reflow. The parent listener is
already deployed on CGD and must never be copied into a figure. `preview.html`
carries its own strict same-origin listener for review purposes; its analytics
are retained only in `window.CGDPreviewAnalytics` and are not forwarded to
production analytics.

Interaction events are documented in [TRACKING.md](TRACKING.md). Do not add a
separate analytics tag inside an iframe.

## Governing documents

| Document | What it governs |
|---|---|
| `docs/SCOPE.md` | What the product is and is not. Authoritative; if this repo contradicts it, this repo is wrong. |
| `docs/ACCEPTANCE_CRITERIA.md` | Per-figure definition of done, and the Part 0 shared-layer contract this repo implements. |
| `Visualisation briefs.docx` | Design intent for each figure. Held in the OneDrive project folder, not in this repository. |
| `STYLE-GUIDE.md` | Project copy of the CGD interactive visualisation production standard. |
| `cgd-interactive-visualisations` skill | House build standard, iframe/analytics contracts, QA gate. |

## Layout

```
repo/
  f1-donor-headline-cuts.html       F1 — donor headline ODA changes
  f2-traceable-oda.html             F2 — traceability of bilateral ODA
  f3-flows-and-losses-map.html      F3 — flows and recipient losses map
  f4-recipient-sector-losses.html   F4 — recipient/sector loss scatter
  f5-fiscal-loss.html       F5 — the fiscal meaning of bilateral ODA loss
  f6-donor-attributed-losses.html  F6 — recipient losses attributed by donor
  f7-oda-treemap.html              F7 — donor/recipient/sector treemap
  f8-donor-oda-over-time.html      F8 — recipient donor mix over time
  f9-poverty-share-allocation.html  F9 — poverty share versus ODA share
  f10-orphaned-recipient-sector-pairs.html  F10 — orphaned pairs by year
  f11-top-donor-reliance.html      F11 — concentration on the top donor
  f12-recipient-losses-across-scenarios.html  F12 — scenario spread by recipient
  f13-donor-flows-by-scenario.html  F13 — donor portfolios across scenarios
  f14-priority-flows-across-scenarios.html  F14 — priority flows across scenarios
  f15-orphaning-across-scenarios.html  F15 — orphaning across scenarios
  f16-interactive-allocations-tool.html  F16 — live donor allocation tool
  f17-recipient-scenarios-table.html  F17 — recipient × allocation-rule table
  preview.html              all seventeen figures on one page, for review
  shared-layer-check.html   development harness for the shared layer
  shared/
    cgd-embed.js            PUBLISHED CGD infra — iframe resize + analytics. Do not fork.
    cgd-figure.css          PUBLISHED CGD look. Do not fork.
    cgd-responsive.css      PUBLISHED CGD mobile/control behaviour. Do not fork.
    chart-core.js           CGD chart math (window.CGDCore). Do not fork.
    dom.js                  CGD safe DOM helpers (window.CGDDom). Do not fork.
    set-config.js           CGD entity colour map and within-chart distinctness.
    oda-payload.js          PROJECT — fail-closed payload client (window.ODAPayload)
    oda-model.js            PROJECT — domain semantics (window.ODAModel)
    oda-ui.js               PROJECT — shared controls and notes (window.ODAUI)
    oda-figure.css          PROJECT — fail state and missing-value marks only
  data/
    static-v2.2.9-swe-exit-scope/   the published payload (8.2 MB, 225 blobs)
  qa/verify.py              QA gate — §F steps 1-3 (Python + Playwright)
  qa/exercise.py            screenshots, state exercise, keyboard pass
  qa/exercise_f1_f4.py      F1–F4 responsive, state and lazy-failure exercise
  qa/exercise_f6_f8.py      F6–F8 state, failure and raw-payload reconciliation
  qa/exercise_f9_f12.py     F9–F12 interactions, screenshots and raw checks
  qa/exercise_f13_f15.py    F13–F15 interactions, screenshots and raw checks
  qa/exercise_f16.py        F16 live-solver reference and interaction checks
  qa/exercise_f17.py        F17 responsive and state exercise
  qa/audit_mobile.py        320/390/430/768/900px usability audit, all figures
  qa/shots/                 screenshots written by exercise.py
  docs/SCOPE.md             what the product is and is not
  docs/ACCEPTANCE_CRITERIA.md  per-figure definition of done
  .github/workflows/verify.yml
  .nojekyll                 disables Jekyll so the payload publishes as bytes
```

The five `cgd-*` / `chart-core` / `dom` files are copies of the published CGD
layer. Keep them in sync with the skill's `templates/shared/`; never fork them or
override their rules from a figure. `set-config.js` is the project-level entity
colour configuration and has deliberately been extended with the income-group,
sector and provider domains. The four `oda-*` files are this project's layer and
are the right place for other project-specific behaviour.

Where a figure genuinely cannot live inside a shared rule, the exception is a
**class** defined once in `oda-figure.css` (`.oda-span-row`, `.oda-controls-wide`)
and opted into per control — never an `#controls` override inside a figure, which
is how six figures had drifted apart.

## Colour

Colour is assigned by `CGDSet.assignColours(keys)`, across the whole key set at
once, not per key. A per-key hash cannot promise distinctness, and did not: the
United Kingdom and "Other cutting donors" came out the same grey in F6, four of
nine bands collided in F8, and three of seven segments shared one slate in F13.

Income groups are **distinct hues, not a sequential ramp**: gold for low income,
deep teal for lower middle, mid blue for upper middle, muted teal-grey for high
income, residual grey for not classified. A poorest-darkest ramp of one hue is
correct in principle and unreadable in practice — it put four teals on F9's
bubbles.

Three rules hold:

* **The residual grey `#DFE0E2` is reserved.** `Other`, `Other cutting donors`
  and `Not classified` take it; no real series ever may.
* **A minimum perceptual distance is enforced** between colours used together. A
  pinned colour that is too close to one already taken gives up its pin and takes
  a ramp colour: within-chart legibility outranks cross-chart stability.
* **Income groups are exempt**, because they are a sequential ramp where adjacent
  steps are meant to be close. Detected automatically from the key set.

Income groups, all 21 CRS sectors and the 20 largest providers are pinned, so
they do not drift between figures. One diverging ramp is used for loss/gain
throughout: neutral `#F3F6F7`, loss `#D15553`, gain `#006970`.

## Controls

Six conventions, all enforced in `oda-figure.css` rather than per figure:

* **Three dropdown widths only.** Standard 144px; wide 240px, opted into with
  `.oda-select-wide`; and 274px for the allocation-rule select alone
  (`.oda-select-rule`), whose option text is the longest in the set. `scenarioSelect` and `sortSelect` apply it themselves; the
  wide tier is for controls whose options are sentences, not for entity pickers.
  The tier is carried on the control GROUP as both `flex-basis` and `min-width`,
  never as a `width` on the select: a percentage-width select contributes its own
  content width to the row's `max-content` rather than its basis, so without the
  `min-width` a hugging bank comes out narrower than the tier and clips its
  options. Below 760px a wide control takes the whole phone row.
* **Every row of the bank is filled.** Control groups grow into whatever slack
  their row has, so a wrapped row never trails off into bare panel, and the phone
  layout is a grow-to-fill flex row rather than the house two-column grid (which
  left an empty cell on an odd control count). Two exceptions, both deliberate:
  growing is off for banks of three controls or fewer, which keep the house
  `nowrap` and hug their contents — there is no slack to absorb, and enabling
  grow lets sub-pixel rounding cascade into a spurious extra row; and the
  gross/GE toggle keeps a full-width phone row of its own, as the house intends,
  because it clips itself in a shared column.
* **Paging lives under the chart**, not in the control bank — `ODAUI.pagerRow`.


* **Two controls can be paired.** Wrap them in `.oda-pair` and they share one row
  at every width. The gross/GE toggle otherwise takes a phone row of its own,
  because "Grant-equivalent" does not fit a shared phone column; paired, it does,
  and below 760px it shows the short label `GE` (both labels are in the DOM, CSS
  picks one, and the accessible name always carries the long form).
* **Every compressible control has a floor.** Flex crushes whatever can be
  crushed, so `.oda-pair` (300px), its members (96px — a select needs ~44px of
  well and padding before any option text shows) and the year control (172px) all
  carry `min-width`. Slack goes mostly to the dropdowns, `flex-grow: 3` against a
  toggle's 1: a stretched two-button toggle is filled space but not neat space.
* **The year control is one state key with two renderings.** The stepper shows at
  760px and below; the slider shows above it. Never both. Both stay in the DOM
  and in sync, so a resize needs no re-render.
* **No scenario hint line.** The option text and its `title` carry the rule's
  name and description; a restatement below the control was a wasted line on
  nine figures.

`qa/shots` is a **rebuild-from-scratch** directory, not an incremental one:
`qa/rebuild_shots.py` deletes every PNG and re-shoots 17 figures at four widths
plus eight interaction states. Patching individual files into it leaves shots of
views that no longer exist, and a stale screenshot reads as a current one.

`qa/` also carries a mobile audit over 320/390/430/768/900px that checks what the
render gate cannot: boxes escaping the frame, text clipped by a clipping
ancestor, control groups overlapping, tap targets under 24px, SVG marks drawn
outside their own viewBox, a `<select>` whose option text is cut past legibility or
whose value matches no option, and blank space left on a control row. Run it from
the repo root: it globs `f*.html` from the working directory, so running it from
inside `qa/` audits nothing and reports zero issues.

## Notes

**Notes are one running paragraph, and as short as the figure can bear.** They
were a stack of separate `<p>` lines behind a collapsed *Notes* disclosure — up
to nine per figure, several restating the model's internals ("winsorised at the
95th percentile", "structurally zero in the current CRS extract", "at most 12
groups are drawn individually"). A reader of a CGD digital note is not debugging
the emitter, and a nine-line footnote block reads as a warning that the figure
cannot be trusted. `UI.notes` now emits one paragraph and no disclosure, so each
entry must be a complete sentence ending in its own full stop.

Two rules keep them that way:

* **No rosters.** A note reports a COUNT, never a comma-separated list of every
  affected recipient. `denominatorNote` and `incomeGroupNote` used to end with
  thirteen country names in one sentence, and F5 carried three such lists at
  once. The count is what tells a reader how much of the picture is missing; a
  reader who needs to know which ones can select them.
* **Live statements are not footnotes.** `visible` keeps its own paragraph,
  because those are statements about the current view — which recipients could
  not be drawn, and why — and they change as the reader clicks. Anything whose
  count already appears in the figure's own summary line does not belong in the
  notes at all.

### The source line

`UI.notes` puts **`Source: CGD modelling.`** first, and it is the same five
words on every figure. Each one used to close its notes with its own variant —
"CGD modelling and poverty need inputs, static-v2.2.9-swe-exit-scope.", "CGD
analysis of 2024 CRS disbursements, static-v2.2.9-swe-exit-scope." — so
seventeen figures ended in five different ways and each printed the release
name, which belongs in the repository and not on a published figure. No figure
passes a source of its own; `ODAUI.SOURCE` is the only place it is written.

`attribution` is the one escape hatch, for a credit that is not the source and
cannot be dropped. F3's map geometry is the only case.

### Versioning the shared assets

Every `<script>` and `<link>` pointing into `shared/` carries a `?v=` stamp, and
**it must be bumped whenever a file in `shared/` changes.**

This is not housekeeping. A shared-layer change went live while browsers kept
running the cached old copy, and because the figures had already been updated
the result was a set that was half old and half new: some figures showed the new
source line, some showed the old one, some showed none at all, depending on what
each browser had cached and when. The figures' own URLs were versioned in
`preview.html`; the shared layer they all load was not.

There is no build step to do this automatically, so it is a manual step in the
release checklist. `qa/verify.py` will not catch a stale stamp — the gate serves
files fresh.

## No native tooltips

**Nothing in this set uses a `title` attribute or an SVG `<title>` to carry
information a reader needs.** Browsers delay `title` by about a second, it never
appears on touch at all, and it cannot be styled or given more than one line.
Every figure now uses either its own `.tooltip` panel or the shared
`UI.hoverTip`, both of which appear immediately, work on tap and on keyboard
focus, and can hold several lines.

This mattered more than it sounds. F10's stacked bands had no tooltip of any
kind — a reader could see a shape and a colour but could not read a single
number off the chart without opening the drill-down. F12's drill-down had ten
dots per row, each needing a second's hover. F13's and F15's scenario labels
read `S1`, `S2A`, `S6B`, with the full name only in a `title`, so the one thing
a reader needed to interpret the axis was the thing hardest to reach. F14 had
four facts worth reading per row and a native tooltip that could show one.

## DAC membership

**The EU is a full member of the OECD Development Assistance Committee.**
`donor_meta` in the payload records EU Institutions as `dac_member: 0` with
`eu_institution: 1`, which put the largest non-sovereign provider in the model
under "Non-DAC providers" on F1 and called it a "Non-DAC provider" in F2's
tooltip. Both were wrong; the corrected count is 33 members, being 32 countries
plus the EU.

The correction lives in `ODAModel.isDacMember()` / `dacLabel()`, not in the
payload: the payload is emitted upstream and every blob is hash-verified in the
browser, so the figure layer cannot edit it. It is expressed in terms of the
`eu_institution` flag rather than a hard-coded donor code. **No figure may read
`donor_meta.dac_member` directly.** The upstream field should be fixed in the
emitter; until it is, this is the only place that knows.

A consequence: F1's All / DAC / Non-DAC filter is gone. The 17 statically-held
donors are also excluded from that figure now, and they were exactly the 17
non-DAC countries, so every donor F1 can show is a DAC member — "All" and "DAC"
would have selected the same 33 and "Non-DAC" none.

## Sector order

Every sector list a reader picks from is ordered **by name**, through
`ODAModel.sectorsAlphabetical()`. The sector axis is in CRS code order, which
groups sectors by DAC family: meaningful to someone who knows the CRS and
arbitrary to everyone else, since in a 21-item dropdown there is no way to guess
that "Humanitarian aid" sits last. Sector *colours* are pinned by code in
`set-config.js`, so reordering a list repaints nothing.

## Legends that are also filters

`UI.filterLegend` renders a legend whose keys switch their series on and off
(F4, F5, F9 and F11 for income groups; F12 uses the same pattern to highlight an
allocation rule). Three things about it are load-bearing:

* **The legend is built from the data present, not the data drawn.** Build it
  from the drawn rows and a switched-off group vanishes from the legend, leaving
  the reader no control to switch it back on.
* **The last visible key cannot be switched off**, because an empty chart reads
  as "no data for this selection" — a different and wrong claim.
* **The hidden set is a `'|'`-joined string in state, not an array.**
  `createState` compares patch values with `===` to decide what to reset, and a
  fresh array is never `===` the previous one, so an array would make every
  legend click look like a change to every dependent key and reset the reader's
  page and selection.

Filtering must also land at the right point in the pipeline. F9's y axis is a
recipient's share of allocable bilateral ODA, computed over *every* recipient;
filtering before that division would renormalise the shares to the visible
subset, so hiding high-income recipients would silently inflate everyone else's
share of global ODA.

Legend keys and other controls describe themselves through `UI.hoverTip`, not
`title`. Browsers delay `title` about a second, it never appears on touch, and it
cannot be styled — a legend key whose description arrives after the pointer has
moved on has not described anything. A legend key that is a `<button>` also
carries the 24px WCAG tap target, which it did not need as a `<span>`.

## Focus on an SVG mark

Clicking or tabbing a chart mark used to throw a large rectangle across the
figure. That was the browser's default focus ring: on an SVG element the ring is
drawn round the element's **bounding box**, not its shape, so a flow line from
Washington to Kabul produced a rectangle covering most of F3's map. The shared
rule in `oda-figure.css` replaces it with a gold stroke following the mark's own
outline, scoped to `:focus-visible` so it appears for keyboard focus and not for
a mouse click. A figure needing something different for a particular mark adds a
**more specific** rule (see the `.map-svg` rules in F3) and never re-enables
`outline`.

## Stacked drill-downs

`attachDismiss` keeps a stack, and only the innermost dialog responds to an
outside click or to Escape. Without it, dismissing a stacked drill-down closed
the whole stack: each dialog listened for a pointerdown outside its own card,
and the inner dialog's backdrop covers the outer card, so a click meant for "go
back to the list" landed on the inner backdrop — outside *both* cards. Both
listeners fired and the reader was returned to the chart having lost their place
in a paged list.

`pagedList` also pads its last page to a full page of rows, and
`.oda-rank-label` clamps a row label to two lines. Between them the dialog is the
same height on every page. It used to grow and shrink as the reader paged —
partly from a short final page, mostly because a pair name like "Democratic
Republic of the Congo — Population policies/programmes and reproductive health"
wrapped to four lines — which moves the pager buttons out from under the cursor
mid-click.

A drill-down dot is **sized by the US$ volume lost, on a log scale**, and says
so. Position on the track is the share of the 2024 total still projected; size is
the amount. Two pairs can both have lost 90% while one is US$40m and the other
US$0.03m, and position alone made those identical. The scale is log because
these losses span more than four orders of magnitude — the same range that puts
F4's and F6's axes on logs — and area-proportional sizing over that range is
useless in practice: against a US$500m maximum a US$0.03m loss came out at
7.08px against a 7px floor, so a whole page of small pairs was a row of
identical dots.

## Scenario names

Each allocation rule carries three names, for three jobs. `label` is the axis key
(`S2A`); `name` is the full editorial name, for dropdowns and tooltips; `short`
is for a chart's own label column. Seven of the ten full names open with
"Prioritisation of" or "Prioritisation by", so in F14's label column every row
truncated to `S5 — Prioritisation of macroeconomic…` and the rules could be told
apart only by their codes. F14 uses `short` and titles the column
*Prioritisation scenarios*, so the shared idea sits in the heading once instead
of being repeated down ten rows. `ODAModel.scenarioRank()` gives the published
order, which F14 lists in rather than re-sorting by value on every change of
metric and year.

## What an axis may respond to

Two figures had this wrong in opposite directions, so the rule is worth stating.
**An axis should respond to a change of population, and hold still across a
change of moment.**

* **F9 held nothing still.** Its domain came from the selected year alone, so
  stepping the year slider rescaled both axes and every bubble moved, including
  bubbles whose own values had not changed. On a log-log plot that is actively
  misleading: the reader is trying to watch recipients move between 2024 and
  2028 and the axes were moving underneath them. The domain now spans every
  year. A change of donor or allocation rule still rescales, because that is a
  different population rather than a different moment.
* **F16 held too much still.** Its percentage-change axis was hard-coded to a
  ratio domain of `[0.1, 10]` — from a tenth of projected to ten times projected
  — for every donor and every allocation rule. Almost no donor spans anything
  like that, so for most of them every bubble sat on the centre line and the
  chart said nothing. It is now data-driven, symmetric in log space around 1 so
  that "half as much" and "twice as much" sit equidistant from no change,
  floored at ±5% so a donor whose recommendation barely moves does not get an
  axis magnifying rounding noise, and capped at 20× so one recipient going from
  near-zero to funded cannot flatten everyone else.

Two things have to move together when a domain becomes data-driven. `pointY` was
clamping to a literal `[0.1, 10]`, which silently disagreed with the axis as
soon as the domain changed; it now clamps to `y.domain()`. And the ticks were a
fixed list, then a count-based thin, both of which put labels on top of each
other on a tight domain — they are now thinned by **pixel** distance, walking
outward from 1 so the no-change line is never the tick that gets dropped.

## What F16 recommends, and against what

**Revised 2 September 2026 on CGD instruction. This changes every recommended
allocation the tool produces, and the methodology document needs a matching
edit.**

The tool answers: *if this donor pursued the selected objective, how would its
allocation differ from what we project it will actually do?* That requires both
sides of the comparison to share a base, and until this revision they did not.

### What changed

| | Before | Now |
|---|---|---|
| x axis | Projected allocation | Unchanged — the audited projection, with every pin, floor and cap in it |
| Recommendation built from | The **2024 observed portfolio** | The **projection** for the selected year |
| y axis | 2024-derived recommendation ÷ projection | Change from the projection, which is what the label always claimed |
| Held for the focus donor | All 96 pinned corridors | **Ukraine only** |
| Amount reallocated | The gap between the 2024 total and the envelope — an accident of each donor's history | A stated share of the movable envelope, set by the reader, default 100% |
| Basis for the allocation | Winsorised 0–1 objective score | Unmet peer-funding gap, in dollars |

Peers are untouched: `coverage()` still reads
`scenarios/<rule>/donor_recipient_year__gross` at the selected year, so the
peer-funding gap that drives the objective still reflects projected spend
including every donor's own held corridors. Grain is unchanged: recipient, not
recipient-sector, restricted to recipients the donor funded in 2024.

**No emitter change was needed.** Everything required was already in the
payload — the projection, the envelope, the Ukraine pin, the viability floor and
the 2024 support set. The other 46 corridors remain in `tool/pinned_ge`; the
tool simply stops applying them to the focus donor.

### Why the old design produced nonsense

The US gave Marshall Islands US$647.3m in 2024, almost all one-off Compact
payments; the S1 projection puts 2028 at US$65.8m. The old solver cut RMI 63%
from the 2024 anchor — the deepest proportional cut in the portfolio, since its
objective score is zero — landing at US$237.6m. Divide that by a projection that
had cut 90% and the mark read **+261%**, which looks like a recommendation to
quadruple funding to an upper-middle-income country. Nothing was holding RMI up:
it was not pinned, not floored, and no US recipient hit the viability floor. It
was two different cuts of the same 2024 number, displayed as a ratio.

Under the new design RMI is projected US$65.8m, has no unmet peer-funding gap,
and is therefore allocated nothing. It falls, as it should.

### Three consequences worth knowing

* **At full intensity, most recipients get nothing.** About 70% of a donor's
  recipients have no unmet peer-funding gap under any single objective, so a
  clean slate leaves them with zero. The summary states the count, and the
  chart labels the clamped row `cut to zero` — a ratio of zero cannot sit on a
  log axis, so those marks pile on the bottom of the domain and would otherwise
  read as whatever the lowest tick says.
* **The movable pool is the projection over the 2024-funded set, not the
  envelope less Ukraine.** They differ: US$121.2m of the UK's US$1.84bn 2028
  envelope is projected for recipients it did not fund in 2024. Scaling the
  2024-funded set up to the full envelope would quietly move that money into
  the 2024 set, which broke two invariants — intensity 0 stopped reproducing the
  projection, and the recommendation summed to more than the projection over the
  same rows. It is reported as out of scope instead.
* **Intensity 0 is the projection, bar the viability floor.** The floor applies
  at every setting, so a projection that puts a recipient below a viable level
  is still lifted. For the US that is US$1.5m on US$13.9bn — 0.01% — and the
  help text says so rather than claiming the projection stands untouched.

### What the emitter question still is

The payload pins 96 corridors and the note on `tool/pinned_ge` calls them
"audited projected value; the tool holds these fixed". 89 of the 96 are *value*
pins rather than exits, and 27 of those are UK country programmes — which is to
say, announced country allocations. F16 no longer applies them to the focus
donor, so the figure is now consistent with its own note. **But the pinned set
itself may be wider than intended, and it still governs peers.** That is a
question for the emitter and the methodology, not the front end.

## What F16's axes may and may not respond to

**Revised 3 September 2026.** Four separate defects here shared one cause: a
quantity was allowed to set a scale it has no business setting.

### The reallocation default was 0%, not 100%

`parseUrl` read the intensity as `Number(q.get('i'))`. With no `i` in the query
string `q.get` returns `null`, `Number(null)` is `0`, and `0` is finite and
inside `[0, 1]` — so an absent parameter parsed as a deliberate "reallocate
nothing" and the tool opened with every mark on the no-change line. The `n(k)`
helper three lines above already guarded presence with `q.has`; this did not use
it. **Any new URL parameter with a valid zero must go through `n()`.**

The default is now 50%, which the methodology and its plain-language companion
both state. Changing it means changing them too.

### The x axis is the projection and nothing else

Its domain was `max(projected, recommended)` over the *plotted* rows. Both
halves were wrong. `recommended` is a function of the Reallocate slider, so
dragging a control that cannot change a single projected value slid every
bubble sideways; and reading it from the plotted rows rescaled it whenever the
income legend hid a group. It is now the projection over `current.rows`, which
no control in the figure can alter.

### Three different things were being confused at the top of the y axis

| | Test | Treatment |
|---|---|---|
| No base | projection under US$0.05m | Its own band above the plot, dodged 15px a row and individually labelled |
| Off scale | a real projection, recommendation more than 50x it | Stays at its true x, clamps to the domain top, counted in an annotation |
| Genuine outlier | inside the 20x cap | Plotted normally |

The old code had only the first category, tested at US$0.01m, which caught
almost nothing: EU Institutions projects **US$19,000** to Burkina Faso against a
recommendation of US$64.8m, and **US$105,000** to DPRK against US$285m. Read as
increases of 3,456% and 2,724% those two rows drove the domain to its 20x cap
and flattened EU Institutions' genuine 13.8x for Nigeria into the middle of the
chart.

An intermediate fix folded "off scale" into "no base" using the 50x test alone.
That was worse in a way no automated check caught: it put rows that **do** have a
projected allocation into a band captioned "no projected allocation to change",
so for Türkiye the figure asserted that of Nigeria and Kenya while their marks
sat mid-axis at their real projections. **A caption that names a category must be
true of every mark in it.** The two tests are now separate.

### The domain was symmetric, which cost half the plot

It was `[1/K, K]` — symmetric in log space, so "half as much" and "twice as
much" sat equal distances from no change. That is a defensible reading of a
ratio, and it is also why the UK's axis ran to +1900%: its deepest cut is 95%,
a ratio of 1/18.75, and the headroom on that pinned the top to the cap when its
largest increase was 7x. Ninety-five per cent of its recipients sat inside 7.4x.
Each end is now set from its own side of the data. The no-change line is drawn
and labelled, so zero is not ambiguous without the symmetry.

Donors still reaching the cap do so on real data — Türkiye would give Sudan 25
times its projection under a pure poverty objective, and Mali 45 times — so the
clamped marks are counted rather than hidden.

### A pin holds the y scale

`scaleRows` and `rawAbs` include `comparison.rows`, so the domain is the union
of the live data and the pin. Sliding Reallocate from 100% to 10% shrinks the
live spread, and on a domain read from live data alone the pinned rings — the
fixed thing the reader is comparing against — slid off the top of the chart.
Union rather than freeze, so a live mark can never be clipped by a stale domain.

### The band adds height; it does not take it

The UK reopens 19 corridors. Carving that out of a fixed 490px chart left the
ratio axis about 130px tall, and label collisions were then unavoidable. `h` is
`490 + bandH`, so the plot keeps its own space. A 10.8px label measures 13.3px,
so the row pitch is 15px: at 13px adjacent labels overlapped by three tenths of
a pixel, which the render gate reports as colliding text.

### Colour is income group, direction is the background

Fill was teal for an increase and gold for a cut, which spent the one channel a
reader expects to mean "which kind of country" on a fact the y axis already
carries. Fill is now `CGDSet.colourFor(d.income)` with a `UI.filterLegend`, as
in F4, F5, F9 and F11; direction is a pale green wash above the no-change line
and a pale red one below. The **key** swatches use a stronger tint than the
bands — at 10px square a 7.5% wash is white — while the bands stay pale because
130 marks sit on them.

### The Poland hang

**Selecting Poland and stepping the year used to kill the tab.** Worth recording,
because the shape of it will recur.

Poland's Ukraine corridor is pinned at US$170.45m and its projected envelope is
US$170.5m, so `envelope - pinnedTotal` came out as a floating-point residue --
US$0.0000046m -- rather than zero. Meanwhile the viability-floor pass had closed
every free recipient. `projectBox` then bisected for a `mu` that would make the
open indices sum to that sliver, and there were no open indices, so the sum was
zero for every `mu`, `hi` doubled forever and the renderer process died. No
error and no fail state: a frozen tab, which is the one failure mode the
fail-closed payload client cannot help with.

Three changes, in order of how much they matter:

* `projectBox` returns the best available allocation when the target cannot be
  reached, and **both** of its searches are bounded. An unbounded `while` in a
  browser is a latent hang whatever the input.
* A discretionary budget below US$1,000 is snapped to zero. It is a difference
  of two numbers around US$170m; its residue is not a budget.
* Recipients with neither projected nor recommended funding are no longer
  plotted. Poland had 45 of them, drawn at the x-axis floor on the 0% line --
  `ratio` is defined as 1 when both sides are zero, which reads as "no change",
  so the objective appeared to have considered them and left them alone. They
  are counted in the notes instead.

Poland is not unusual in kind, only in degree: any donor whose policy-held
corridors consume its whole envelope lands here. It is also worth knowing that
Poland has **five** pins, not one -- Ukraine at value, and Belarus, Ethiopia,
Georgia and Senegal pinned at zero -- and that in the 2028 projection Ukraine is
the only Polish recipient with a non-zero value at all.

## The F16 pin

A pin is a frozen snapshot, so **every** part of a pinned mark reads from the
pinned row — including the radius scale. Freezing the pinned row's own values
was not enough: the bubble radius encodes the peer funding gap, the gap is a
function of the objective weights, and the scale's domain is the maximum gap in
the current data. So dragging the objective triangle rescaled every radius and
the pinned rings resized even though their own values had not moved.

While a comparison is pinned, the radius domain is therefore **held** at the
value it had when the pin was taken. That also keeps the two marks comparable:
giving the pinned rings a private frozen scale would have stopped them moving but
put ring and bubble on different scales, so their relative sizes would have meant
nothing — the one thing a before-and-after pin is for. One held scale gives
both: the rings stay still, and the live bubbles still grow and shrink, because
their gap genuinely changes with the objective.

### Why the objective used to appear to do nothing

**Resolved by the redesign above; kept as a record of what the old anchor did.**

`allocateDesired` distributed the *difference* between the target envelope and
the 2024 portfolio it started from, so where those two were close the weights
had almost nothing to redistribute and every recipient stayed near its 2024
level whatever the reader did with the triangle. EU Institutions was exactly
that case: in 2026–2028 its discretionary envelope was within 1% of its 2024
portfolio (US$11.34bn against US$11.28bn), which is why its recommended
allocation for Malaysia sat at the 2024 value of US$4.81m under every objective.

The objective's reach is now a stated share of the movable envelope rather than
an artefact of each donor's history, so this cannot recur. `allocateDesired` has
been removed.

## Checkboxes

The box goes **inside** its label, and the label carries the 24px WCAG 2.2 target.
The box itself is 15px, which is what a checkbox should look like next to 12px text.
Aligning box and label as siblings does not work at any container setting — a
label's box and its line box differ in height, so the box lands two pixels low —
so nest rather than tune. `shared/oda-figure.css` styles `.advanced-line label` and
`.advanced-panel label`; a figure needs no rule of its own.

## Number formatting

One decimal place more than the obvious choice, and **a real value never formats
as zero**. Whole millions were hiding real flows: a US$0.3m recipient-sector
flow — an ordinary size for a small sector in a small country — came out as
`US$0m`, so F3's flow tooltips read `US$0` for every line into Angola's
communications sector and the reader could not tell a small flow from no flow at
all. That is the missing-data-rendered-as-zero defect wearing a rounding costume.

So `usd()` gives millions one decimal place, spends a second one below US$1m
where one is not enough, and renders anything under US$0.005m as `<US$0.01m`
rather than a figure that reads as nothing. Billions carry two places.
`percent()` defaults to one place rather than none.

`ODAModel.trimZeros` then takes back every place that carries no information,
and the decimal point with it: `24.0%` becomes `24%`, `US$15.00bn` becomes
`US$15bn`, `0.10%` becomes `0.1%`. Significant zeros are untouched (`0.01%`
keeps both). That is what stops the extra precision becoming clutter — it shows
up only where it changes what the reader learns. It runs inside `usd()` and
`percent()`, so every figure formatting through those gets it; figures whose axes
format through d3 (F9, F14, F16) call it explicitly.

## The `nan` income group

`recipient_meta` carries the literal string `"nan"` for four recipients —
Venezuela, Saint Helena, Tokelau and Wallis and Futuna — because the emitter
writes a pandas `NaN` through JSON. Every read goes through
`ODAModel.incomeGroup()`, which normalises it to `Not classified`. Read the field
directly and `"nan"` reaches a tooltip or a legend, and the recipient is coloured
off the pinned ramp.

## The payload

`shared/oda-payload.js` holds the release name in a single constant:

```js
const RELEASE = 'static-v2.2.9-swe-exit-scope';
```

That is the only place a release is named, as required by `web/data/README.md`.
A release bump is this line plus a new `data/` directory; no figure hard-codes it.

The client is **fail-closed**, per the binary contract in the manifest:

* every axis hash is verified before any index arithmetic, matching
  `build/emit_payload.py::axis_hash` — `sha256` of the axis values joined by U+0000;
* every blob is verified against `sha256_raw` of its **inflated** bytes, and against
  its declared element count;
* the cube support index is verified against `support_sha256` before any cube read,
  because a float array shows no sign of a misalignment;
* a payload with no manifest is refused — an interrupted promotion leaves exactly
  that state by design;
* on any failure the figure renders a visible fail state. It never draws an empty
  chart, which would read as "no data" — a different and wrong claim.

### Transport requirement, verified on GitHub Pages

Blobs are pre-compressed `.bin.gz` and inflated in the browser with
`DecompressionStream`. This requires the host to serve them **as bytes**, with
`Content-Type: application/gzip` and no `Content-Encoding: gzip`. If a host sets
`Content-Encoding: gzip`, the browser decompresses first and `DecompressionStream`
then fails on already-inflated bytes.

**Confirmed correct on GitHub Pages on 2 September 2026.** Pages serves the blobs
as `Content-Type: application/gzip` with no `Content-Encoding` header, under a
browser `Accept-Encoding: gzip, deflate, br, zstd` as well as without it; the
served bytes are `sha256`-identical to the committed file and still carry the
gzip magic number. All seventeen figures set `CGD_READY === true` and draw marks
on the live site. Also verified correct on Python's `http.server`.

Re-check it on any **new** host, and after any change to how the payload is
served. The check is in *Preview and hosting* above.

## The 2024 convention

`manifest.axes.year` holds projection years only (2025–2028). Observed 2024 is
served by `static/baseline_*` and `cube/baseline__*` on a separate 2024 support
index. `ODAModel.displayYears()` and `ODAModel.valueAt()` hide that from figures, so
no figure re-derives it. 2024 is identical under every allocation rule; that is the
observed baseline, not a fault.

## Missing denominators

Null GNI, government revenue, population or need mass renders as *unavailable*:
never substituted, never silently zero, never dropped without a count. On the
current release 11 of 141 recipients lack GNI and 12 lack government revenue.
Yemen and South Sudan are among them and are material. Use
`ODAModel.partitionByDenominator()` and put `ODAModel.nShownText()` in the notes.

## Verification

The house QA gate is ported to Python, because Node is not available on the
authoring machine. The audits and pass criteria are identical to the Node original;
only the runner differs.

```
python -m pip install playwright
python -m playwright install chromium

python qa/verify.py                       # SKILL.md §F steps 1-3, all figures
python qa/exercise_f1_f4.py               # F1–F4 states and screenshots
python qa/exercise.py f5-fiscal-loss.html # §F steps 2, 4, 5 for one figure
python qa/exercise_f6_f8.py               # F6–F8 states and independent checks
python qa/exercise_f9_f12.py              # F9–F12 states and independent checks
python qa/exercise_f13_f15.py             # F13–F15 states and independent checks
python qa/exercise_f16.py                 # F16 solver, states and independent checks
python qa/exercise_f17.py                  # F17 responsive/state exercise
python qa/audit_mobile.py                  # phone/tablet usability audit, all figures
```

`qa/verify.py` serves the repo over HTTP rather than using `file://` URLs, because
these figures fetch a binary payload and `fetch()` is blocked on `file://`. Pages
marked `data-cgd-harness="true"` are skipped: they are development harnesses with
no chart marks. `.github/workflows/verify.yml` runs both on every pull request.

### What the gate waits for, and why it matters

**Every figure must set `window.CGD_READY`** — `false` while a render is in
flight, `true` once the render completes or a fail state is shown. The gate waits
for `=== true`, not merely "not false".

This is load-bearing. An earlier gate waited on `window.CGD_READY !== false` and
asserted marks with `document.querySelector('svg *')`. Both are satisfied before
any data loads, by the **fullscreen button's icon `<path>`**, which is in the
static HTML of every figure. Nine figures did not set the flag at all, so the
gate was auditing an empty page and reporting a pass — including on a figure that
was rendering a fail state. Marks are now looked for inside the chart containers
only.

The control audit also checks **every** `.controls` row rather than the first,
tests each control against its nearest clipping ancestor rather than only its own
box, and includes the pairwise group-intersection check the house standard
requires.

`qa/exercise.py` writes screenshots to `qa/shots/`.

## Marshall Islands baseline caveat

Figure 5's very large Marshall Islands value is not a front-end percentage error.
The published payload contains US$676.0m of gross and grant-equivalent bilateral
ODA in 2024, including US$637.8m of US general budget support. The underlying US
ForeignAssistance.gov transactions contain large 2024 Compact payments, and the
US Department of the Interior independently reported US$372m of Compact funding
in 2024, including a US$200m trust-fund contribution. The comparison is therefore
arithmetically correct, but 2024 is an exceptional spike rather than a normal
annual aid level. Figure 5 now states this on its face.

## Dependencies

The figures have no build step or framework. Figures 1, 2, 4, 5, 6 and 17 are plain
HTML/CSS/JS with local assets. Figures 3 and 7–16 additionally pin D3 7.9.0;
Figure 3 also pins
TopoJSON Client 3.1.0 and World Atlas 2.0.2 from jsDelivr for published world
geometry and map projection. `qa/` needs Python and Playwright for the automated
gate only.

Every pinned `<script>` carries a real Subresource Integrity hash and
`crossorigin="anonymous"`:

| Dependency | `integrity` |
|---|---|
| d3 7.9.0 | `sha384-CjloA8y00+1SDAUkjs099PVfnY2KmDC2BZnws9kh8D/lX1s46w6EPhpXdqMfjK6i` |
| topojson-client 3.1.0 | `sha384-Ukv1p/xTma6P4/2bY5KzWBw+ydSpXmhCMtyciIQVDJ1RmOxtCYNMF1uXT9T63H67` |

**World Atlas 2.0.2 has no SRI**, and cannot: Figure 3 fetches it with `d3.json`,
and SRI applies to `<script>`/`<link>`, not to `fetch`. The URL is version-pinned.
If that is not acceptable, vendor the 110m geometry into `data/`.
