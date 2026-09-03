# Acceptance criteria: interactive visualisations for the 2026 bilateral ODA paper

Derived from `Visualisation briefs.docx`. This file states what "done" means for each figure. It does not restate design rationale — the brief holds that.

**Precedence.** `SCOPE.md` governs what the product is and is not. The `cgd-interactive-visualisations` skill (`~/.claude/skills/`) governs house build standards. This file governs per-figure completeness. Where this file and `SCOPE.md` disagree, `SCOPE.md` wins and this file is wrong and must be corrected.

**Payload version.** Arrays are named as they appear in `manifest.blobs` in the active
`static-v2.2.9-swe-exit-scope` release. The EU-integration additions have landed and
were verified with the rest of the payload. The adjacent v2.2.7 directory is retained
only as the previous release.

`<SC>` means each of the ten scenarios: S1, S2A, S2B, S3A, S3B, S4, S5, S6A, S6B, S7.

---

## Part 0 — Shared layer

Every general rule in the brief is shared-layer behaviour. Implement once in `shared/`; do not reimplement per figure. No figure is accepted until the shared layer passes.

### 0.1 Payload client

- [ ] Fetches `.bin.gz`, inflates via `DecompressionStream`, wraps in typed arrays.
- [ ] Resolves the payload root from **one** constant or a `web/data/latest.json` pointer. No figure hard-codes a release name.
- [ ] Verifies every axis hash before indexing. On any mismatch, refuses to render and shows a fail state. Never guesses, never partially renders.
- [ ] Handles a corrupt, truncated or missing blob as a fail state, not an exception.
- [ ] Handles a payload with no manifest as a refusal (an interrupted promotion leaves exactly this state by design).

### 0.2 Missing denominators

- [ ] Null GNI, government revenue, population or need mass renders as *unavailable*. Never substituted, never silently zero, never dropped without a count.
- [ ] Any figure whose row count changes with a control shows `n shown`.
- [ ] Known absences in v2.2.8: 11 of 141 recipients lack GNI, 12 lack government revenue, 6 lack population and 6 lack INFORM. Yemen and South Sudan lack GNI and are material.

### 0.3 Controls and conventions

- [ ] Scenario selector carries scenario-specific tooltips.
- [ ] Gross vs GE toggle appears **only** when displayed figures are in US$.
- [ ] Changing the sorting method **re-selects** the displayed set, not merely reorders it.
- [ ] Donor/recipient selection persists across a scenario change.
- [ ] Popups close on click outside.
- [ ] Every figure has a real title; the descriptive headings in the brief are not titles.
- [ ] Where income group filters results, affected recipients are named in the footnote; where it is tooltip-only, `N/A` in the tooltip suffices.

### 0.3b Colour

- [ ] Every series shown together is **perceptually distinguishable**. A stable entity-to-colour map is not sufficient on its own: it does not stop an unpinned entity colliding with a pinned one, or two unpinned entities colliding with each other. Use `CGDSet.assignColours(keys)`, which assigns across the whole key set and enforces a minimum perceptual distance.
- [ ] Residual categories — `Other`, `Other cutting donors`, `Not classified` — take the reserved residual grey, which is held out of the categorical ramp. **No real series may take that grey**, or the reader cannot tell a named donor from the remainder.
- [ ] Income groups are a *sequential* ramp, poorest darkest, and are exempt from the distance guard: adjacent steps are supposed to be close. `Not classified` is not a step on that ramp.
- [ ] Income group, sector and provider colours are pinned in `shared/set-config.js` and identical across every figure that uses them.
- [ ] One diverging loss/gain ramp across the set: neutral `#F3F6F7`, loss `#D15553`, gain `#006970`.

### 0.4 Footnotes

**Revised 2 September 2026 on CGD instruction.** The previous rule — numerous
notes rendered as a collapsible `Notes` block, collapsed by default — produced
up to nine footnotes per figure, several of them describing the model's
internals, and is superseded. Notes are now cut to the minimum and set as one
running paragraph. See *Notes* in `README.md`.

- [ ] One running paragraph, not a stack of lines, and no collapsible block.
      Each entry is a complete sentence ending in its own full stop.
- [ ] As few sentences as the figure can bear: only what stops it being misread.
      Nothing describing the emitter, the solver's internals, winsorising
      thresholds, or per-figure drawing caps.
- [ ] Every figure carries constant 2024 US$. The unallocable-ODA note is
      carried only where a figure's denominator or coverage makes it material,
      not on all seventeen.
- [ ] Counts, never rosters: a note gives the NUMBER of affected recipients and
      never a comma-separated list of their names.
- [ ] No fact that already appears in the figure's own summary line.
- [ ] Conditional statements that explain an otherwise-broken-looking state
      surface on the face of the figure, in their own paragraph above the notes.
- [ ] The notes OPEN with `Source: CGD modelling.` and no figure varies it. The
      release name does not appear on the face of a figure.
- [ ] No `title` attribute or SVG `<title>` carries information a reader needs:
      it is delayed, invisible on touch, and limited to one line. Use the
      figure's own tooltip panel or `ODAUI.hoverTip`.
- [ ] A count that introduces a clause agrees with its verb. Use
      `ODAModel.countPhrase`, not an inline plural.
- [ ] Every reference into `shared/` carries a `?v=` stamp, and the stamp is
      bumped in the same change as any edit to `shared/`. A stale stamp serves
      readers a mixture of old and new behaviour.

### 0.4a F16 allocation semantics

**Added 2 September 2026 on CGD instruction; supersedes any earlier description
of the tool's anchor.**

- [ ] The x axis is the audited projection for the selected year, including all
      pins, floors and caps, consistent with every other figure.
- [ ] The recommendation is a reallocation OF THAT PROJECTION, so the y axis is
      a change from it and intensity 0 reproduces it (bar the viability floor).
- [ ] The focus donor holds one corridor only: Ukraine, at its projected value.
      No other announced allocation or floor constrains the focus donor.
- [ ] Peer donors follow the full projection, including all of their own held
      corridors. The peer-funding gap is computed from that.
- [ ] Recipients are allocated in proportion to unmet peer-funding gap in US$,
      not to the winsorised 0-1 score, which discards magnitude.
- [ ] The reallocatable pool is the projection over recipients the donor funded
      in 2024. Projected spend outside that set is reported, never absorbed.
- [ ] The share of that pool the objective may move is the reader's choice,
      defaulting to 100%, and is stated whenever it is not the default.
- [ ] Grain is recipient, not recipient-sector.

### 0.5 Responsive and accessible

- [ ] Works at desktop and mobile widths, reformatting reliably.
- [ ] Full-screen on desktop only; never on mobile.
- [ ] No behaviour depends on hover alone; every hover affordance has a tap path.
- [ ] Keyboard path and screen-reader path tested per the house standard.
- [ ] Light and dark rendering both checked.

---

## Part 1 — Figures

### F1. Donors' headline (total) ODA cuts

Paper section: *Context: cuts at the headline (total) ODA level*

**Payload**

- `static/total_oda_ge__donor_year` — dims donor x total-ODA year, 2024–2028, GE only
- `donor_meta` — names and sovereign/GNI applicability flags

**Settled universe.** Provider rows include all 50 allocation providers, including EU
Institutions. Any summed headline reports the 49 sovereign providers only: US$232.5bn
in 2024 to US$173.2bn in 2028, constant 2024 prices. The EU is excluded from that sum
to avoid double counting member-state contributions. No forward gross total-ODA series
is available: the envelope is GE and the documented cell-level gross conversion cannot
validly convert its regional, core-multilateral and other components.

**Accepted when**

- [ ] Horizontal dumbbell, one row per donor, a dot for each year 2024–2028.
- [ ] Light-to-dark sequential ramp across years; year identifiable without hover.
- [ ] Right-hand column shows 2028 ODA as % of 2024, and is sortable.
- [ ] Default set: top 20 donors by volume of difference; arrows page to further donors.
- [ ] Sorting by the % column re-selects the top 20 (see 0.3).
- [ ] Overlapping dots (flat-ODA donors) remain legible.
- [ ] No aggregate total on the chart — explicitly not wanted.
- [ ] Values are GE only; no gross/GE toggle is shown for this figure.
- [ ] Footnote names the seventeen static donors (ARE, AZE, BGR, CYP, HRV, ISR, KAZ, KWT, LIE, MCO, MLT, QAT, ROU, SAU, THA, TUR, TWN) and states their collective ODA rises 15.5% because their 2024 ODA/GNI ratio is held.

### F2. How much of each donor's bilateral ODA can be traced to a recipient and sector?

Paper section: *The challenge of data quality*

**Payload**

- `static/specification_split__donor` — donor x 4 categories, 2024 gross CRS disbursements
- `donor_meta`

**Current-data note.** The four-way split is delivered for all 50 providers. The
`country_without_purpose` category is structurally present but has zero value in the
current CRS extract; the interface should retain the category without implying missing
data. This source supports a gross view only.

**Accepted when**

- [ ] Title is the question above.
- [ ] Y-axis donor, X-axis US$ billion or %, toggleable.
- [ ] Four stacked segments: recipient-and-sector specified; recipient specified, sector missing; region-only; wholly unspecified.
- [ ] Gross vs GE toggle present only on the US$ view, and omitted entirely if the wholly-unspecified segment has no GE values.
- [ ] Top 20 donors with paging; sort order changeable and re-selecting.
- [ ] Footnote: earmarked multilateral contributions are counted as bilateral; core multilateral contributions are not.

### F3. Map of flows and losses

Paper section: *Findings from modelled projections*
Reference: `Documents/GitHub/CGD-bilateral-remittances-matrix-update/4-remittances-map.html`

**Payload**

- `scenarios/<SC>/recipient_sector_year__{ge,gross}`, `static/baseline_*__recipient_sector`
- `scenarios/<SC>/donor_recipient_year__{ge,gross}`, `static/baseline_*__donor_recipient`
- `cube/<SC>__{ge,gross}` + `cube/support__*` (donor and sector both selected)
- `cube/baseline__{ge,gross}` + `cube/support2024__*`
- `recipient_meta.population`, `recipient_geometry_key`

**Accepted when**

- [ ] Controls: year slider 2024–2028 (start 2028); scenario; sector (default all); toggle % vs total vs per capita; a search dropdown with a small toggle switching the search between donors and recipients.
- [ ] Per capita affects recipient shading only.
- [ ] Recipients shaded by losses vs 2024; donors a single uniform colour clearly distinct from any recipient shade.
- [ ] Default shading is all-donor losses. Selecting a donor re-bases shading to that donor's losses. Selecting a recipient returns shading to all-donor losses.
- [ ] Flows appear only when a donor or recipient is selected; flows are ODA US$.
- [ ] Every recipient with non-zero ODA resolves to a map feature, or is listed as undrawable with its ODA volume. Kosovo (`XKV`) is the approved exception: retain it in totals and non-map charts, but do not shade it until the map bundle supplies a stable feature.
- [ ] Shading scale handles a one-sided distribution: only 7 of 141 recipients gain.

### F4. Recipient-sector losses versus 2024

**Payload** — `scenarios/<SC>/recipient_sector_year__{ge,gross}`, `static/baseline_*__recipient_sector`, `sector_meta`, `recipient_meta`

**Accepted when**

- [ ] X-axis 2024 US$ on a log scale; Y-axis % lost vs 2024 for the selected year.
- [ ] Controls: year (start 2028); scenario; sector dropdown; recipient dropdown.
- [ ] `all` permitted in either dropdown but never both: selecting `all` in one greys out `all` in the other.
- [ ] Dot colour: income group when dots are recipients; distinct CGD colours per sector when dots are sectors.
- [ ] Zero reference line present, since some cells gain.
- [ ] Overplotting handled where a dropdown is set to `all` (~2,600 points).

### F5. The fiscal meaning of bilateral ODA loss

**Recommended pilot figure.** Build first; it exercises most of the shared layer.

**Payload** — `scenarios/<SC>/recipient_year__{ge,gross}`, `static/baseline_*__recipient`, `recipient_meta` (`gni_usd`, `gov_revenue_usd`, `population`, `income_group`)

**Accepted when**

- [ ] X-axis ODA lost in US$; Y-axis ODA lost as % of GNI or of government revenue.
- [ ] Controls: year (start 2028); scenario; toggle GNI vs government revenue.
- [ ] Advanced control excludes microstates, defined as population under 1 million.
- [ ] Dots coloured by income group.
- [ ] Footnote notes that some small high-ODA states lose very high percentages, and carries `n shown`, which changes between the GNI and revenue denominators.
- [ ] Recipients with a null denominator are shown as unavailable, not dropped silently. Yemen (US$2.46bn) and South Sudan (US$1.23bn) lack GNI and must be accounted for.

### F6. ODA losses as % of GNI by partner country, attributed by donor

**Payload** — `scenarios/<SC>/donor_recipient_year__{ge,gross}`, `static/baseline_*__donor_recipient`, `recipient_meta.gni_usd`, `donor_meta`

**Accepted when**

- [ ] X-axis ODA lost as % GNI (2028 vs 2024); Y-axis recipient. Scenario dropdown.
- [ ] Bars split by cutting donor: the top five global cutting donors, then "ODA cut by other countries", following Figure 5 of the CGD aid-cuts blog.
- [ ] Segment order is **fixed globally across all rows**, largest first, "Other" always right-most. Not per-bar.
- [ ] Top 10 recipients by lost ODA as % GNI, arrows to see more.
- [ ] Popup on a recipient bar: connected-dot plot of change in bilateral ODA as % GNI, 2024 versus 2028, by donor; top 10 donors with paging.

### F7. Treemap of per-donor / per-recipient bilateral ODA by sector

**Payload** — `cube/<SC>__{ge,gross}` + `cube/support__*`, `cube/baseline__{ge,gross}` + `cube/support2024__*`, `sector_meta`, `donor_meta`

**Accepted when**

- [ ] Controls: year (start 2028); scenario; focus toggle donor/recipient; focus dropdown; partner dropdown defaulting to `all`; nesting-order control.
- [ ] Nesting labels adapt to the focus: "recipient to sector" / "sector to recipient" when the focus is a recipient; "donor to sector" / "sector to donor" when it is a donor.
- [ ] The nesting control vanishes when a specific partner is selected.
- [ ] Size = level. Colour = **composition** by default — the leaf dimension, so the same sector (or the same partner) carries one colour across every group — with a toggle to % change vs 2024. *The brief was updated to match on 31 August 2026. The reason: one cell is 63% of the canvas and the top three are 79%, so colouring the dominant cell by a near-zero change left the figure reading as a blank rectangle.*
- [ ] Colour uses a quantile or symlog scale, or is winsorised, with a minimum 2024 baseline below which cells are not coloured. Cell-level ratios reach roughly 7,000x.
- [ ] At most 12 groups and 8 cells within each are drawn individually; the tail is pooled into an Other cell carrying its own total and change and naming how many cells it covers. A recipient can have several hundred funded donor-sector cells and drawing all of them leaves none readable.
- [ ] Group headings are drawn above the cells, in a distinct weight and colour, so a group name and a cell name cannot be confused. Cell labels flip to white on dark fills.
- [ ] Layout ordering fixed across years so cells do not reflow.

### F8. Bilateral ODA by donor over time for a selected recipient

Reference: Figure 7 of the CGD aid-cuts blog.

**Payload** — `scenarios/<SC>/donor_recipient_year__{ge,gross}`, `static/baseline_*__donor_recipient`; sector mode additionally requires `cube/<SC>__*` and `cube/baseline__*`

**Accepted when**

- [ ] Controls: recipient; scenario; sector (default all); toggle absolute US$ vs % of ODA.
- [ ] X-axis 2024–2028; Y-axis label follows the toggle.
- [ ] Top 8 donors coloured, then "Other"; the top 8 is computed within the selected recipient and sector, not globally.
- [ ] Band order fixed: largest by total across 2024–2028 at the bottom, "Other" pinned to the top. Bands never reorder between years.
- [ ] Hover shows a donor's rank in the hovered year.

### F9. Donors' ODA share versus recipients' share of population in poverty

**Payload** — `scenarios/<SC>/donor_recipient_year__{ge,gross}`, `scenarios/<SC>/recipient_year__*` (All donors), `tool/need_poverty`, `recipient_meta.population`, `recipient_meta.income_group`

**Accepted when**

- [ ] X-axis: recipient's share of total population in extreme poverty across all recipients (%). Y-axis: % share of the selected donor's bilateral ODA. Log-log.
- [ ] y = x reference line, labelled "above the line, this donor over-weights relative to poverty share".
- [ ] Bubbles are recipients; size = poverty rate (%); colour = income group.
- [ ] Controls: scenario; donor, including an "All donors" option; year slider starting 2024.
- [ ] Hovering a bubble threads that bubble's trajectory across years as a faint curve. Trajectories are not drawn for unhovered bubbles.

### F10. Orphaned recipient-sector pairs, by year

**Payload** — `scenarios/<SC>/recipient_sector_year__{ge,gross}`, `static/baseline_*__recipient_sector`, `recipient_meta.income_group`, `sector_meta`; sub-popup additionally requires `cube/<SC>__*` and `cube/baseline__*`

**Accepted when**

- [ ] Tagline displayed: "A recipient-sector is counted as orphaned once total bilateral ODA to it has fallen by a high proportion versus 2024."
- [ ] X-axis year 2024–2028; Y-axis cumulative count of orphaned recipient-sectors.
- [ ] Controls: scenario; threshold toggle 50% vs 75%; toggle income groups vs sectors, which sets the band breakdown.
- [ ] Popup on a band: ranked list of recipient-sector pairs orphaned within that band up to the selected year, as dot plots, top 10 by % change, with paging. Dots sit on a **shared** 0-100% track, never rescaled per row.
- [ ] The drill-down is `ODAUI.orphanDrilldown`, shared verbatim with F15, and the sub-dialog stacks on its parent so closing it returns to the ranked list.
- [ ] Sub-popup on a pair: connected dot plot of % change in bilateral ODA across all donors to that recipient-sector, top 10 with paging.
- [ ] The count is **cumulative**: a pair is counted from the first year it crosses the threshold and stays counted thereafter.
- [ ] Footnote reports how many pairs rise back above the threshold in a later year but remain counted, rather than asserting in the abstract that this is rare.

### F11. Changing concentration of reliance on the top bilateral donor

**Payload** — `cube/<SC>__{ge,gross}` + `cube/support__*`, `cube/baseline__{ge,gross}` + `cube/support2024__*`, `recipient_meta.income_group`, `sector_meta`

**Accepted when**

- [ ] X-axis: % of bilateral ODA contributed by the largest single donor in 2024. Y-axis: the same in 2028. The largest donor is re-identified in each year.
- [ ] Controls: scenario; toggle sector view vs recipient view; the corresponding sector or recipient dropdown, defaulting to the first alphabetical entry.
- [ ] Sector view shows recipient bubbles; recipient view shows sector bubbles.
- [ ] Colour: income group in sector view; distinct CGD colour per sector in recipient view.
- [ ] Popup: connected dot plot of change in % contribution, top 10 with paging. Recipient view gives donor contributions to the clicked sector within the selected recipient. Sector view gives donor contributions to the clicked recipient within the selected sector.
- [ ] Footnote records that a change of top donor between 2024 and 2028 does not matter here; the chart measures dependence on the top donor at the time.

### F12. How recipients' losses vary across scenarios

Paper section: *Variations in outcomes across scenarios*

**Payload** — `scenarios/<SC>/recipient_year__{ge,gross}` for all ten, `static/baseline_*__recipient`, `recipient_meta.gni_usd`; popup additionally `scenarios/<SC>/recipient_sector_year__*`

**Accepted when**

- [ ] Y-axis recipient; X-axis 2028 ODA as % of 2024, with a toggle to % of GNI and to US$ lost. Ten dots per row, one per scenario, coloured by scenario family.
- [ ] Sort by spread by default; alternatives by 2024 volume and by median loss; sorting re-selects the displayed set.
- [ ] Top 15 by spread with paging.
- [ ] Toggle absolute value vs deviation from Scenario 1.
- [ ] A highlight dropdown highlights one scenario across all rows. If a legend is shown, it carries ten entries even though only two colours are used.
- [ ] Popup on a recipient: the same dot strip by sector for that recipient, with a % of 2024 / US$ lost toggle.
- [ ] Footnote: row width is the range of outcomes consistent with different plausible donor behaviour; small high-ODA states lose very high percentages; `n shown`.

### F13. Variation in donors' bilateral ODA flows by scenario

**Payload** — `scenarios/<SC>/donor_recipient_year__*` (region and income splits), `scenarios/<SC>/donor_sector_year__{ge,gross}` (sector split), `static/reallocation_vs_s1__scenario_donor_year`, `recipient_meta`, `donor_meta`, `sector_meta`

**Accepted when**

- [ ] Ten horizontal stacked bars, one per scenario. X-axis US$ ODA or % ODA, toggleable; Y-axis scenario.
- [ ] Segment order fixed across all bars; "Other" right-most.
- [ ] Controls: donor dropdown; split toggle sector / region / income group; year, default 2028.
- [ ] Each bar carries "% of budget reallocated vs proportional cuts", computed at the recipient-sector cell level and therefore invariant to the split toggle.
- [ ] Footnote: the US$ size of bilateral ODA scarcely moves across scenarios, and moves at all only through variation in the GE-to-gross ratio; and the reallocation figure is computed at cell level.
- [ ] Does not fetch the cube at load.

### F14. Flows to poverty-affected and fiscally constrained countries across scenarios

**Payload** — `scenarios/<SC>/recipient_year__{ge,gross}` for all ten, `static/baseline_*__recipient`, `recipient_meta` (`ldc`, `income_group`, `gni_usd`, `gov_revenue_usd`), `tool/need_poverty`

**Accepted when**

- [ ] Ten dots on a single horizontal axis, coloured by scenario family, with a labelled vertical reference line at the 2024 value.
- [ ] A connecting line runs from each dot to the reference line: red below, green above. For the UMIC/HIC metric the colouring is reversed.
- [ ] Metric toggle: share of bilateral ODA to LDCs / to low-income countries / to countries with government revenue below 15% of GNI / to UMICs and HICs / US$ per person in poverty.
- [ ] Axis zoomed to the data range; footnote states the axis does not start at zero and gives the 2024 value.
- [ ] Dots that would overlap are dodged vertically, and the footnote states that vertical position carries no meaning.

### F15. Variation in orphaning outcomes across scenarios

**Payload** — as F10, for all ten scenarios

**Accepted when**

- [ ] Tagline as F10.
- [ ] X-axis year 2024–2028; Y-axis cumulative orphaned recipient-sector pairs.
- [ ] One line per scenario with emphasis colouring: Scenario 1 highlighted and drawn heavier as the reference, all others grey until hovered.
- [ ] End labels at the right edge; hover isolates one line and dims the rest.
- [ ] Toggles: 50% vs 75% threshold; absolute count vs deviation from Scenario 1; Y-axis as count or as % of all recipient-sector pairs.
- [ ] Optional filter to a single income group or sector, reusing F10's breakdown.
- [ ] Click reuses F10's popup and sub-popup, applied to the clicked scenario.
- [ ] Footnote records the denominator: **2,562** recipient-sector pairs received bilateral ODA in 2024 under v2.2.8, verified from `static/baseline_gross__recipient_sector`. The brief was corrected from 2,534 on 30 August 2026.
- [ ] The departure from the family colouring used in F12 and F14 is deliberate and recorded, because orphaning does not track the family split.

### F16. Interactive allocations tool

Paper section: *How should donors allocate bilateral ODA?*
Governing spec: `SCOPE.md`, "Coordination tool".

**Payload** — all of `tool/*`; `scenarios/<SC>/donor_recipient_year__gross` for peer sums; manifest field `donors_without_discretionary_allocation`; sector reporting additionally requires `cube/baseline__*`

**Accepted when — construction**

- [ ] Solved live in the browser; weights continuous; no precomputed weight grid. Scenario switching is the only control that fetches or shows a loading state.
- [ ] Units are fixed and not exposed: allocation and envelope in grant-equivalent; protection score from gross peer support; viability tested on gross. The general-rules gross/GE toggle does not appear.
- [ ] Envelope fixed; policy-held pairs pinned and not switchable.
- [ ] Controls: scenario; focus donor; year 2025–2028 default 2028; objective selector.

**Accepted when — chart**

- [ ] Scatter. X-axis the donor's projected bilateral ODA to that recipient in the selected year, US$m, log. Y-axis the change implied by the objective, log-ratio geometry with tick labels as percentage change (0.2x = -80%, 1x = 0%, 5x = +400%). A linear percentage axis is not acceptable.
- [ ] Horizontal reference line at 0% change labelled "no change".
- [ ] Bubbles are recipients; size = the peer coverage gap, square-root scaled; diverging colour for more/less, redundant with vertical position.
- [ ] Pinned recipients render as dashed hollow markers on the 0% line in a neutral colour.
- [ ] Toggle: percentage change (default) vs absolute change in US$m on a symlog scale.
- [ ] Labels on hover; permanent labels only for extreme outliers, capped at 8–9 desktop and 4 mobile. Point counts run from 1 to 132 (median 45), and log axes have fixed floors so a two-point chart does not autoscale absurdly.
- [ ] Tooltip: recipient; projected allocation; % change; recommended allocation; peer funding gap; income group.
- [ ] Pin-and-overlay comparison: pinned state hollow, current filled, faint connector.
- [ ] One generated sentence beneath the chart in place of a tile row, updating with the controls.
- [ ] State encoded in the URL. No share button.

**Accepted when — objective selector**

- [ ] Three presets (poverty, humanitarian risk, fiscal vulnerability) plus an advanced button opening the blend control. Default: the poverty corner.
- [ ] Presets and blend are two views of one state.
- [ ] Blend is a ternary triangle with a draggable point; weights shown as three percentages summing to 100; clicking a corner reproduces the preset.
- [ ] Weights are non-negative, sum to one, and apply to normalised protection scores — never to raw need masses or indicators.
- [ ] A weight combination consuming a missing need mass is **blocked**, naming the missing component. No imputation, no dropping, no renormalising. INFORM is the binding case at 135 of 141 recipients.
- [ ] No objectives for own-portfolio concentration, relative contribution, or gap-filling.

**Accepted when — notes**

- [ ] Visible on the face: the committed amount ("US$X of this donor's US$Y projected envelope is already committed and cannot move"); and, only when it applies, the no-discretionary-allocation state.
- [ ] In collapsed Notes: policy commitments other than Ukraine are deliberately not applied and the tool may recommend funding a country the donor has announced exit from; the sector split is imputed from the observed 2024 mix and the tool does not choose sectors; the tool's viability threshold is the country floor while published figures use the cell floor; peers are projected then held fixed and never re-optimised; plus the standard items.
- [ ] Title is a question. The word "optimal" does not appear. A persistent one-line note states this is not a recommendation. No composite score is ever displayed.

**Out of scope — must not be added**

- [ ] No reader control over forecast-model assumptions.
- [ ] No sector control or sector axis. No envelope editing. No toggle to disable pins.
- [ ] No per-cell manual editing; no altering peers except through the scenario selector.

### F17. Table comparing recipients' ODA received across scenarios

**Payload** — `scenarios/<SC>/recipient_year__{ge,gross}` for all ten, `static/baseline_*__recipient`, `tool/need_poverty`, `tool/need_humanitarian`, `tool/need_fiscal`, `recipient_meta`

**Accepted when — structure**

- [ ] Rows recipients; columns the ten scenarios, then Average (mean of the ten displayed values), then Range (highest minus lowest scenario, units following the metric).
- [ ] Year slider 2024–2028, starting 2028.
- [ ] Grouped by average prioritisation ratio: significantly underprioritised (<50%), underprioritised (50–100%), overprioritised (>100%), plus "not classified" for recipients with no need mass, hidden when empty.
- [ ] Groups collapsible; underprioritised and overprioritised collapsed by default. A collapsed group shows its count and a summary row of the ten scenario means.
- [ ] When the metric is an ODA measure, grouping uses the last-used objective's average ratio, named in the group header and the tagline, defaulting to poverty.
- [ ] Row movement between groups as the year changes is animated.
- [ ] Sorting: within group, by the Average column descending; column headers click-to-sort.

**Accepted when — metric and colour**

- [ ] Ratio = (bilateral ODA per person in extreme poverty in recipient r) divided by (total bilateral ODA divided by total people in extreme poverty across all recipients), generalising to humanitarian and fiscal as ODA per unit of need mass over the same global mean.
- [ ] ODA measures: US$ ODA; US$ ODA per person in extreme poverty; US$ ODA cut vs 2024; % ODA cut vs 2024.
- [ ] Colour: sequential for US$ ODA and per-person ODA; diverging centred on zero for both cut measures; diverging centred on 100% for the ratio.
- [ ] For the displayed metric, a **single** colour domain spans the ten scenario columns, the Average column, and all four projection years. Never per column, never per year.
- [ ] Range column has its own sequential scale with a visual separator.
- [ ] Ratios above 999% display as ">999%" and the ratio colour scale is winsorised. Marshall Islands reaches roughly 1,857,000%.
- [ ] Sticky recipient column with horizontal scroll.

**Accepted when — 2024 and the benchmark**

- [ ] At 2024 all ten columns are identical and Range is zero. A footnote states this is the observed baseline, not a fault.
- [ ] Footnote states the ratio is relative to each year's own average, which falls from about US$118 to US$91 per person in extreme poverty between 2024 and 2028, so a constant ratio means a constant share rather than constant funding.

**Accepted when — mobile**

- [ ] Below roughly 700px, the two toggle rows are replaced by a single "Show" dropdown of the seven end-states, driven by the same state object.
- [ ] Year becomes a compact stepper. The advanced need-mass filter stays as one toggle.
- [ ] Column order becomes Recipient, Average, Range, then the ten scenario columns.
- [ ] A visible scroll affordance (shadow or fade) on the sticky column's right edge.
- [ ] Only the first group expanded by default; group headers at least 44px tall; 11px font floor; names truncate with full name on tap.
- [ ] Colour domain unchanged from desktop; not recomputed from visible rows.

---

## Part 2 — Definition of done, every figure

- [ ] Renders correctly at desktop and mobile widths, in light and dark.
- [ ] Passes the shared-layer checks in Part 0.
- [ ] Axis-hash refusal path tested by deliberately corrupting a hash.
- [ ] Missing-denominator path tested with a recipient known to lack the denominator.
- [ ] All footnote items present and correctly collapsed or surfaced.
- [ ] Title written; brief heading not reused as the title.
- [ ] Render-and-verify loop completed per the `cgd-interactive-visualisations` skill.
- [ ] Entry in `TRACKING.md` updated with status, payload arrays consumed, and any departure from this file with its justification.
