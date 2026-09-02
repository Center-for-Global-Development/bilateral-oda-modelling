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

## Checkboxes

The box goes **inside** its label, and the label carries the 24px WCAG 2.2 target.
The box itself is 15px, which is what a checkbox should look like next to 12px text.
Aligning box and label as siblings does not work at any container setting — a
label's box and its line box differ in height, so the box lands two pixels low —
so nest rather than tune. `shared/oda-figure.css` styles `.advanced-line label` and
`.advanced-panel label`; a figure needs no rule of its own.

## Number formatting

`ODAModel.trimZeros` strips decimal zeros that carry no information, and the
decimal point with them: `24.0%` becomes `24%`, `US$15.0bn` becomes `US$15bn`,
`0.10%` becomes `0.1%`. Significant zeros are untouched (`0.01%` keeps both). It
runs inside `usd()` and `percent()`, so every figure formatting through those gets
it; figures whose axes format through d3 (F9, F14, F16) call it explicitly.

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
