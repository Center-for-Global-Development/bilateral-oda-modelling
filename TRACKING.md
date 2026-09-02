# Tracking — bilateral ODA interactive figures

Status, payload dependencies and decisions per figure. Definitions of done are in
`../ACCEPTANCE_CRITERIA.md`; this file records where each figure has got to and what
it is built against.

**Update this in the same change as the code.** A figure quietly still built against
a superseded array is the failure this file exists to prevent.

Analytics: none sent yet. When the first figure ships, record its
`data-cgd-interactive-name` and its `interactive_engagement` action types here.

## Release currently targeted

`static-v2.2.9-swe-exit-scope` — schema 1.1.0, content root `ac963a3cfc579c80`,
50 donors, 141 recipients, 21 sectors, 225 blobs.

Release-bump procedure: copy the new payload into `data/`, change `RELEASE` in
`shared/oda-payload.js`, re-run the gate, update the table below, delete the
superseded `data/` directory in the same commit.

## Shared layer

| Component | Status | Verified against |
|---|---|---|
| `shared/oda-payload.js` | Built, verified in browser | v2.2.8 live payload |
| `shared/oda-model.js` | Built, verified in browser | v2.2.8 live payload |
| `shared/oda-ui.js` | Built, verified in browser | n/a |
| `shared/oda-figure.css` | Built | n/a |
| `qa/verify.py` | Built, replaces the Node gate | v2.2.8 |
| `qa/exercise.py` | Built | v2.2.8 |
| CGD frozen layer (5 files) | Copied unchanged from the skill | skill `templates/shared/` |
| `shared/set-config.js` | Project configuration extended with income groups | skill template + project domain |

### Verification record — 28 August 2026

Harness: `shared-layer-check.html`, served from `python -m http.server`, loaded in
the in-app browser.

* 20 of 20 contract checks pass, including live axis-hash verification of all six
  axes, blob `sha256_raw` verification, and 2024-cube support verification.
* Machine audits clean at **320, 768 and 1200px**:
  `controls {outside: 0, intersections: [], clippedText: []}`,
  `svgText {clipped: [], overlaps: []}`, page horizontal overflow `0px`,
  minimum editable input font size `16px` at 320px.
* No console errors on a fresh load.
* State exercise: measure toggle reflects both directions; scenario tip tracks the
  selection; year stepper bounds correct with the slider tracking it; selection
  persists across a scenario change; sort re-selects rather than reorders; notes
  collapsed by default; `document.body` height grows and shrinks (1402 → 2002 → 1402).

**Not run, and why:**

* The iframe grow/shrink and origin contract in the **real production parent**
  (`references/06` §6.3–§6.5). A direct-child test cannot verify the origin
  allowlist or that the parent applies the height. Outstanding for every figure.
* Whether GitHub Pages serves `.bin.gz` without `Content-Encoding: gzip`. Correct
  on Python's `http.server`; unverified on the production host.

**Superseded:** the earlier note that the automated gate could not run. Node is
still unavailable, but the gate was ported to Python (`qa/verify.py`) and now runs.
The in-app browser cannot render these figures at all — it reports
`document.visibilityState === 'hidden'`, so `requestAnimationFrame` never fires and
nothing paints. Use Playwright for anything that needs a rendered page.

### Bugs found and fixed during verification

| Bug | Effect if shipped |
|---|---|
| Axis hash joined on a space, not U+0000 | Every figure would have refused to load |
| Literal NUL byte in source | Breaks diffs, editors and some tooling |
| `makeStore` callback passed as `undefined` | Any state change threw |
| Scenario tooltip created but never appended | The tooltip general rule silently unmet |
| Controls wrote state without reflecting it | Stale control state — the defect the house standard calls out |
| UI module invented class names | Would have drifted from the CGD look across the set |


## Review fixes — 30 August 2026

A full review against `SCOPE.md`, the visualisation briefs and the house standard.
Every item below is verified by `qa/verify.py` plus the per-figure exercise
scripts, both re-run green after the change.

### The QA gate was passing vacuously

The gate reported 51/51 clean while figures had visible defects. Two causes:

* `hasChart` used `document.querySelector('svg *')`, matched by the **fullscreen
  button's icon `<path>`** in every figure's static HTML;
* the wait condition was `window.CGD_READY !== false`, which `undefined`
  satisfies — and nine of seventeen figures never set the flag.

So for those nine the gate audited a page with no controls and no chart, then
passed. F16 was rendering a **fail state** under it and still passing, from a race
where the size observer ran before the first scenario blob was awaited.

Fixed: all seventeen figures set `CGD_READY`; the gate waits for `=== true` and
looks for marks inside chart containers only; it audits every `.controls` row
rather than the first; it tests controls against their nearest clipping ancestor
rather than their own box; and it adds the pairwise group-intersection check the
house standard requires but the Python port had omitted.

Defects this surfaced and fixed: F8 Measure group overflowing the panel by 32px
at 1200px and its unit label clipped; F3 "Per capita" clipped at 320px; F17 the
mobile "Show" label collapsed to 2px because `.mobile-controls` is itself a
`.controls` grid and its nested row was squeezed into one of two columns; F2 and
F6 end-anchored final axis tick overflowing by 1px; F4 x-tick labels running back
under the y-axis labels and `US$0m` shown for a sub-US$1m log tick.

### Colour was not distinguishable

`CGDSet.stableColourFor` hashed each key into eight colours with no collision
avoidance. Measured on real data: F6 gave the United Kingdom and "Other cutting
donors" the same grey and Germany and Canada the same teal; F8 collided four
times in nine bands; F13 gave humanitarian aid, health and energy one slate.
F10 additionally used the hash for income groups, so it ignored the pinned income
ramp and rendered "Not classified" in the brightest colour on the chart.

Replaced with `CGDSet.assignColours(keys)`. See `README.md` for the three rules.
Income groups, all 21 sectors and the 20 largest providers are now pinned.

### `nan` income groups

Four recipients carry the literal string `"nan"` — Venezuela, Saint Helena,
Tokelau, Wallis and Futuna. F3, F4, F5 and F11 read the field raw, so `"nan"`
reached a tooltip and those recipients were coloured off the ramp and absent from
the legend. All reads now go through `ODAModel.incomeGroup()`.

### Brief departures corrected

| Figure | Was | Now |
|---|---|---|
| F10, F15 | Point-in-time orphan count | Cumulative, per the brief; recoveries reported in the notes |
| F12 | Sector popup normalised each row to its own min-max, so a 1pp and a 60pp spread looked identical | One shared axis across all sectors, with the row's own range printed beside it |
| F15 | A reduced copy of F10's drill-down: unpaginated plain text, no dots | `ODAUI.orphanDrilldown`, shared verbatim; the sub-dialog stacks on its parent |
| F12–F15 | Scenarios labelled `S1`…`S7` with no full name | Full name on every scenario label, axis tick and mark |
| F13 | Native `<title>` only, while the subtitle told phone readers to "tap a segment" | A real tooltip, reachable by pointer, keyboard and tap |
| F17 | Gross/GE toggle shown on ratio and percentage metrics | Hidden unless the displayed metric is in US$ |
| F17 | Need filter an always-visible checkbox | Behind "Advanced" on desktop, visible on mobile, one state key |
| F17 | No row animation | Rows animate between prioritisation groups, respecting `prefers-reduced-motion` |
| F16 | X axis derived by rescaling the **gross** series to the envelope | Reads `donor_recipient_year__ge`, which sums to `tool/envelope_ge` exactly |
| F6 | No Marshall Islands caveat, though it is the top row at 160% of GNI | Caveat stated, as in F5 |
| F10, F12, F14, F15 | Missing income-group and GNI footnotes required by the general rules | Named from the data via `incomeGroupNote` / `denominatorNote` |

### House-standard items

* Real SRI hashes on all pinned CDN scripts; World Atlas documented as unhashable
  because it is fetched, not scripted.
* Per-figure `#controls` overrides removed from six figures; the two genuine
  exceptions are classes in `oda-figure.css`.
* `↗` text fullscreen glyphs replaced with the shared SVG icon pair; F9's missing
  `icon-compress` restored.
* One diverging loss/gain ramp across the set, replacing three variants.
* Off-palette hex (`#007377`, `#d55e00`, `#26834a`, `#c4463b`, `#D65A52`,
  `#007C78`) replaced with brand tokens.
* `aria-modal` dialogs now actually trap focus (`ODAUI.trapFocus`) and return it
  to the trigger.
* F16: Escape closes a pinned tooltip; label placement avoids marks, not just
  axis text; `fmtUsd` defers to the shared formatter.

### F16 sector diagnostic — 1 September 2026

Selecting a recipient bubble in F16 now opens a sector drill-down: one dot per
sector in which the focus donor already funded that recipient in 2024, with the
change in **every other donor’s** combined gross ODA to that recipient–sector
across the axis and the donor’s own 2024 share of its spending in that recipient up
it. Bubble size is the 2024 amount. Sectors to the left are ones peers are leaving.

**It is descriptive, and the methodology is untouched.** That is not a hedge, it is
the constraint that shaped the chart. The tool solves at recipient level and imputes
sectors from the observed 2024 mix (methodology ¶¶1047–1049), so the donor’s own
percentage change is *identical across every sector within a recipient*. The
originally proposed y-axis — the donor’s own change — would therefore have drawn a
horizontal line, and a chart that appears to show a sector effect the model does not
compute is worse than no chart. What the model does support is the diagnostic: where
the donor already works, and where its peers are pulling out. The dialog says so in
its own footnote, and so does the Notes list.

Data was the easy part: the cube is already donor × recipient × sector × year and
F7 reads it, so the drill-down lazy-loads `cube/{scenario}__gross` (~260KB gzipped)
and `cube/baseline__gross` (~70KB) on the first click. The tool’s initial load is
unchanged.

The dialog says a single line of its own — what a dot is and what its size means
— because the two axis titles already name both axes and the axis ends already say
which direction is a cut. The descriptive framing sits in the figure’s Notes rather
than in the dialog, so a reader opening the drill-down twenty times does not scroll
past it twenty times; the exercise asserts it there, not merely that it left the
popup. Chart text uses the house classes — `axis` on the axis GROUP (the house rule
is `.axis text`, so putting the class on the text nodes matched nothing and left the
ticks a size and colour of their own) and `small-text` on the dot and direction
labels, which is what F16’s own outlier labels use.

Two honesty guards, both following patterns already in the set: sectors whose peer
funding more than trebled from a small 2024 base sit at the right-hand edge and are
**named** in a footnote rather than quietly moved, and sectors with no 2024 peer
funding are named as unplotted rather than dropped. Peer figures are gross, as peer
coverage is throughout the tool, and the footnote says that too.

Selecting a mark used to pin the tooltip. It now opens the dialog, which is the
sticky state the drill-down figures in the set already use, so `pinnedTooltip` and
`dismissTooltip` are gone along with the guards that read them and a comment that
had stopped being true. `poss()` handles the possessive: "United States’", not
"United States’s".

Covered by `qa/exercise_f16.py` — which has to await the lazy load, because a
tooltip-style synchronous read would pass against an empty dialog — and shot as
`f16-sector-diagnostic-1200`.

### F7 label ink: the same cascade trap, twice — 1 September 2026

The white-on-dark cell ink was never reaching the page. `.cell-label` and
`.cell-value` both set `fill` in CSS, and **any** CSS rule beats a `fill`
presentation attribute, so every label rendered dark whatever `inkFor` returned.
Inline `style` wins over both. This is the second time in two days the same trap
has bitten — the F1 bars went through `--bar-fill` for exactly this reason — so
it is worth stating plainly: **an SVG presentation attribute is the weakest thing
in the cascade, not the strongest.** If a class sets a paint property, setting the
same property as an attribute does nothing, silently. 22 of 44 labels are now
light; before the fix, none were.

While there, `inkFor` was a luminance threshold, which picks a side rather than
the better side. It now compares the WCAG contrast ratio of both inks against the
fill and takes the higher. Same answer across most of the palette, and the right
answer on the mid-tones where a threshold is arbitrary.

Cell volumes carry a dollar sign (`$17.7bn`) and the footnote states the basis
once: "All values in constant 2024 US$."

### Measured label fitting, a smaller checkbox, and a tooltip that threw — 1 September 2026

**The checkbox is 15px again and the LABEL carries the target.** 24px met the WCAG
2.2 minimum by making the control twice the height of its text, which is not what
the rule is for: WCAG counts the label as part of the target wherever clicking the
label activates the control. The box now lives **inside** the label, so there is one
element, one target and one alignment. Aligning them as siblings could not be made
to work — whatever the container's `align-items`, the box sat two pixels below the
text, because a label's box and its line box are not the same height — and nesting
removes the question rather than tuning it. `accent-color` keeps the checked state
on-brand without restyling the control. Applies to F5, F6 and F17.

`qa/audit_mobile.py` measures a checkbox target as the union of the box and its
label, which is the real target, rather than the box alone.

**F7 cell labels are fitted by measurement, not estimate.** A
characters-times-constant guess has to assume the widest plausible character or it
overflows, so at 10.5px it was rejecting labels with 15% of the cell still empty —
and, worse, accepting five that were overflowing, because bold tabular figures are
wider than the constant assumed. `getComputedTextLength` is exact. Combined with
dropping the repeated `US$` (said once, in the footnote) and setting the volume in
regular rather than bold tabular figures, a number now appears in **37 of 89 cells
at 1200px**, against 31 fitting honestly before. The name may be truncated; the
volume never is, because half a number is a wrong number. Contrast was already
handled: `inkFor` puts white type on a dark cell.

**F7's tooltip carries the full cell** — what it is, which entity the treemap is
focused on, both years, the change, its share of the focus total, and for a pooled
cell how many cells it stands for. The two lines naming the sector and the partner
came straight back out: the heading already reads "EU Institutions — General budget
support", and three lines saying one thing is not detail.

**F10's drill-down heading is a sentence**: "Low income recipients’ ‘orphaned’
sectors by 2026" when the breakdown is by income group, "‘Orphaned’ Health pairs by
2026" when it is by sector. **The mid-dot separator is gone from the whole set** —
F10 and F15's drill-down titles and F16's policy-held marker were the three uses.
It sits at letter height and reads as punctuation inside a word.

**A bug that would have shipped.** F7's new tooltip read `rows` for the focus total.
`rows` is a parameter of `draw()`, not a module binding, so every hover threw
`rows is not defined` and the tooltip silently never appeared. Neither the render
gate nor the exercise suite caught it, because both check what renders, and a
tooltip only exists after a pointer event. The total is now a module-level value set
by `draw()`. **Lesson for the next tooltip change: hover it in a real browser
event and read `textContent`, not `innerText`** — `innerText` returns '' for an
element with the `hidden` attribute, which is exactly the state a tooltip is in when
it has failed to open, so the check that looks most obviously right reports nothing
wrong.

### Treemap volumes, a screenshot rebuild, and two bugs the tidying exposed — 1 September 2026

**`qa/shots` is rebuilt from scratch, not updated in place.** The directory had
accumulated shots from three different days, including several of views that no
longer exist, and stale pictures were being read as current — twice in review, a
fixed problem was reported as outstanding because the screenshot predated the fix.
`qa/rebuild_shots.py` deletes every PNG and re-shoots: 17 figures ×
320/390/768/1200, plus eight interaction states (F1 indexed, F6 drill-down and
outlier exclusion, F7 with a non-default focus country, F10 drill-down, F16
humanitarian and blend). 76 files, one timestamp. **Regenerate the whole directory
after any change; never patch individual files into it.**

**F7 cells carry their ODA volume.** Two lines where there is room — sector name
then volume — and the volume alone where there is not: a reader looking at a cell
wants to know how much money it is, and the sector is recoverable from the legend
colour in a way that a number is not. Labels are cut to the room the cell gives
them and dropped below about eight characters, where a truncation carries less than
the ellipsis costs; a cell whose volume rounds to zero prints nothing rather than
"US$0m". Note the gate's overlap check is measuring SVG **em boxes**, not ink: two
10.5px lines 12px apart overlap by a fraction of a pixel and read as two labels on
top of each other. 15px between baselines.

**F10 and F15 put ‘orphaned’ in quotes throughout** — title, tagline, axis title,
tooltip, drill-down heading, summary and notes. It is a term of art the figures
define themselves, and unquoted it reads as a description of the recipient rather
than of a modelling threshold. F15 is included because it shares the sentence
verbatim; only the analytics identifier and the JS symbols keep the bare word.

**F8's two rules under the chart** were an empty summary paragraph: the house
`.notes` rule carries a `border-top`, so a line with nothing to say still draws a
rule and claims 17px above the notes disclosure. `.viz-wrapper .notes:empty
{ display: none }` handles it set-wide, and F8's now-unused element is gone.

**F17 drops Korea, Dem. People's Rep.** It receives no modelled bilateral
allocations at all, so every cell in its row was 0% and the row carried no
information. It is dropped from the DISPLAYED population only: `ratioValues` still
sums need and ODA over the full recipient axis, because that sum is the denominator
every other recipient's prioritisation ratio is measured against, and dropping a
country from it would silently change every published number in the table. The
Range column is now in percentage points, which is what a difference of two
percentages is.

Smaller: F9's x-axis says "share of **global** population in extreme poverty",
which is what the series is; F12's summary line is gone (it restated the pager and
the tagline) and "Click a row for sector detail." moved into the tagline, with the
exclusion caveat kept for the case where something is actually excluded.

Two bugs the tidying exposed, both pre-existing:

* **F12's pager read "1 of 1" on load.** Its page count closes over `raw`, which
  `draw()` fills and no state change touches, so `selfSync` never fired after the
  data arrived. The old summary line happened to print the real page number
  alongside it, which is why nobody saw it; removing that line left the wrong
  number on its own. `draw()` now re-syncs the pager. No other paged figure has
  this shape — F1 and F6 recompute their populations inside the callback, and F2's
  is a constant.
* **F15's notes told the reader the lines were "deliberately neutral grey"**, which
  stopped being true when they were coloured by family in the previous pass. The
  note now says what the colouring is and what it does and does not imply:
  recipient-need rules ‘orphan’ more pairs than most donor-portfolio rules, but the
  highest count of all is a donor-portfolio rule, so family does not determine the
  outcome.

One item reported as outstanding was already done: F16's Kosovo note has been
inside the collapsed Notes since the previous pass. Worth recording how that was
confirmed, because the obvious check lies: in headless Chromium a child of a
**closed** `<details>` still reports a non-zero `getBoundingClientRect`, a
`display: block` computed style and a truthy `offsetParent`. Only the rendered
screenshot settles it.

### F1 as bars, bolder shading, and a set-wide tick rule — 1 September 2026

**No axis prints a zero it does not need.** `ODAModel.trimZeros` strips decimal
zeros that carry no information, and the decimal point with them: an axis reading
"23.5%, 24.0%, 24.5%" now reads "23.5%, 24%, 24.5%". Significant zeros survive —
0.01% keeps both, 0.10% loses only the second. It is applied inside `usd()` and
`percent()`, so every figure that formats through them gets it, and exported for
F9, F14 and F16, whose axes format through d3.

**F1 is a bar chart.** Five dots on a shared axis occlude each other whenever two
years sit within about eight pixels, which on this axis is most donors: the reader
saw a smudge and could not count five marks, let alone order them. One thin bar per
year, each in its own horizontal band, cannot occlude — all five are always
separately visible, they share a baseline, and a small year-on-year change reads as
a staircase. Same row space as the dot strip, one row taller. Note the CSS trap: the
house `.bar` rule reads `--bar-fill`, and **any** CSS rule beats a `fill`
presentation attribute, so setting `fill` on the rect silently painted every bar
house teal. The year colour goes through the token.

**F3's shading was almost uniformly pale**, because the house diverging ramp is
linear in value and the scale is capped at the 95th percentile, which puts most
recipients in its lower half. The endpoints are unchanged — they are brand tokens
— but the ramp is gamma-corrected at 0.5, which gives mid-range losses real colour
and leaves the ordering exact.

**F7 lost its colour-by control and three of its eight phone rows** (eight to
five). Cells are always coloured by composition: change over time is what the year
control is for. The nesting order reads "Donor first" / "Sector first" rather than
"Donor → sector", which took it off the wide tier so it can share a row.

**F14's redesign carried a hover bug**: a `<title>` on a `<g>` is not a reliable
hover target for its children, and the row had no filled area to hover in any case.
Each row now has a transparent full-width hit rect carrying the full scenario name,
and so does the dot.

**F15's lines are coloured by scenario family**, as elsewhere in the set, with S1
still the emphasised reference line and the end labels carrying each rule's
identity. It reads as a finding rather than a tangle: recipient-need rules orphan
more pairs than most donor-portfolio rules, and S2A orphans more than any.

**F16.** New tagline; the disclaimer line removed; the panel title is now "Change
by recipient under allocation objective function"; the fixed-envelope caveat and
the committed share follow the movement sentence in one paragraph under the chart;
the no-priority (Kosovo) note moved inside Notes. The ternary blend selector is half
the linear size, so a quarter of the area, with its corner names moved out to the
weights list beside it — three full phrases cannot be legible around a 186px
triangle, and single letters keyed to that list can.

Smaller: F2's tooltip carries the donor's total 2024 bilateral ODA and its DAC
status; F4, F7 and F8 lost redundant subtitles and F8 its "top eight donors are
selected" line, which moved into Notes; F5's and F9's recipient lists moved into
Notes with the counts left visible; F9's reference-line note said "this donor
over-weights" when the line is about recipients, and now says so; F6's drill-down
pager sits under the rows it pages, in the same markup as every other drill-down
pager in the set; F10's two clipping dropdowns got the width they ask for; F17's
Average and Range are leftmost at every width.

**Control-bank mechanics added in this pass**

* A third dropdown tier, `--oda-select-rule` at 274px, for the allocation-rule
  select alone: "S2A — Sector prioritisation by donor portfolio" is the longest
  option text in the set and was being cut at the shared wide width. No figure
  carries both it and F15's four-control bank, so widening it costs no other figure
  a row.
* `.oda-pair`, for two controls that should share a row wherever the bank wraps.
  It exists because the phone rule gave the gross/GE toggle a row of its own; a
  pair takes the toggle out of that rule (it is no longer a direct child of
  `.controls`) and puts both on one row at every width. Used by F8, F13 and F15.
* The gross/GE toggle has a short label, `GE`, shown below 760px. Both labels are
  in the DOM and CSS picks one, so a resize needs no re-render and the accessible
  name always carries the long form. That is what let the toggle stop taking a
  phone row of its own.
* Floors, because flex will crush whatever is most compressible: `.oda-pair` at
  300px, its members at 96px (a select needs about 44px of well and padding before
  any option text shows — at 320px "Count" was being cut to "Co"), and the year
  control at 172px, which had shrunk below its own label.
* Slack goes mostly to the dropdowns (`flex-grow: 3` against a toggle's 1). A
  two-button toggle stretched across 400px of a wrapped row is filled space but not
  neat space; a dropdown given the same 400px is showing more of its option text.

Two defects found in this pass, both mine and both caught by the gate:

* The sparse-bank rule was written `:has(> .control-group:nth-child(4))`, which
  counts only control groups. Introducing `.oda-pair` — a child of `.controls`
  that is not a `.control-group` — made four-control banks read as three, so they
  kept the house `nowrap` and overflowed the panel instead of wrapping. It now
  counts any child.
* F16's two new sentences were declared in `render` and used in `renderSummary`,
  and F15's family colours were used by the legend builder above their own `const`.
  Both threw on load. The gate caught both; nothing else would have.

### Control banks that fill their rows, and four figure fixes — 31 August 2026

**The control bank now has no blank space at any width, by construction.** The
previous pass gave every dropdown one of two widths and got the bank down to one
row on most figures, but it left ragged ends: a wrapped row stopped where its
controls stopped, and on phones the house two-column grid left an empty cell
whenever the control count was odd. Both are now handled by one mechanism rather
than per figure.

* A control group's width tier is carried as a `flex-basis` **and** a `min-width`
  on the group, not as a fixed `width` on the select. `flex-grow` then hands any
  slack on a row back to the controls sitting on it. The `min-width` matters:
  a percentage-width select contributes its own content width to the row's
  `max-content`, not its basis, so without it a bank that hugs came out narrower
  than the tier it asked for and clipped its own options (this is what was cutting
  F14's "Least developed countries" and F7's "Donor → sector").
* Growing is switched **off** for banks of three controls or fewer, which also keep
  the house `nowrap`. Such a bank hugs its contents, so there is no slack to
  absorb, and enabling grow let a sub-pixel rounding difference cascade: the first
  control grew into the whole width, which pushed the second onto a row of its own,
  which then grew too. F1 was rendering two rows for two controls because of this.
* On phones the house two-column grid is replaced, set-wide, by the same
  grow-to-fill flex row. The grid is right for the two-control figures it was
  tuned on and wrong for five: it left an empty cell on an odd count, and it
  crushed the gross/GE toggle into an 88px column where it clipped itself to
  "Grant-equivalen". The gross/GE toggle keeps its own full-width row, which is
  the house intent restated in flex terms.
* Entity pickers (recipient, sector, donor, partner) came **off** the wide tier.
  With grow-to-fill a smaller basis is strictly better: more controls share a row
  and the row hands the slack back. The wide tier is now only for controls whose
  options are sentences — allocation rule, sort, metric, F15's sector filter, and
  F7's nesting order.

**F1** gained a donor-group filter (all / DAC / non-DAC, beside the year legend,
using the release's own `dac_member` flag) and a scale toggle. 2024 now takes its
own hue instead of the pale end of the ramp, where it was a near-white fill behind
a white stroke. Axis ticks land on round values and gridlines repeat in every row.
The scale toggle is the real answer to dots clustering on a phone: on a shared US$
axis a donor spending a fraction of a percent of the largest donor's total occupies
a few pixels, so **no** mark shape can show its change — thinner bars included,
which is why the bar-chart alternative was considered and rejected. Rebasing every
donor to its own 2024 = 100 keeps one shared comparable axis and makes every
donor's change the same size on screen.

**F2**'s final column read 100% for every donor in the share view, because it was
totalling the four shares. It is now "Fully specified" — the share specified to
both a recipient and a sector — and is the same number in both display units.

**F5**'s three paragraphs of recipient lists moved inside Notes. The counts stay
visible, because they qualify the "N of 141 shown" line immediately above them.

**F7**'s empty white stripe above some groups was a group heading band: the layout
reserves one for every group, and the heading was skipped when the label would not
fit, leaving the band bare. The band is now always drawn and the label is fitted to
it, with the full name on hover.

**F14 was redesigned.** Ten dots dodged vertically on a single axis sat within
about three percentage points of each other: four of the ten labels collided, one
covered a dot, the dodge — which carries no meaning — was the most conspicuous
thing on the chart, and the reference connectors read as series lines. It is now
one row per allocation rule on the same shared axis, ordered most to least
protective, with the value printed at the right. The brief has been updated.

**F17**'s Average and Range columns moved to the left of the scenario block at
every width, matching what the mobile layout already did; the separator rule moved
with them. The Advanced disclosure had a control row to itself at every width and
is now reparented into whichever bank is on screen.

Two QA defects were found and fixed in the process, both of which had been making
checks pass vacuously:

* `qa/audit_mobile.py` globs `f*.html` from the working directory, so running it
  from inside `qa/` audits nothing and reports zero issues. Run it from the repo
  root.
* The new blank-space check grouped controls into rows by rounded `top`. The house
  control row is `align-items: flex-start`, so a two-line label pushes its control
  down and every tall control read as a row of its own — which produced a dozen
  phantom findings. Rows are now grouped by vertical overlap.

Checkbox sizing moved out of F17 and into the shared layer at 24px, the WCAG 2.2
minimum. The 18px box inside a 32px clickable line was the one standing audit
exception; there are now none.

### Control-bank compaction — 31 August 2026

**Every figure is now one control row, 68px tall at desktop.** It was one to three
rows and 68-260px. What changed:

* **Two dropdown widths, not a variety.** The house `.plain-select` is
  `width:100%`, so a two-option control came out as wide as the 141-recipient one
  and most dropdowns sat half empty. Standard is 152px; the wide tier is 252px and
  is opted into for allocation-rule, entity and sort controls, whose labels are
  sentences or long names. `scenarioSelect` and `sortSelect` take the wide tier in
  the shared layer, so no figure has to remember.
* **Sparse rows shrink to their contents** above 760px, instead of presenting a
  full-width empty panel for one control.
* **Paging moved out of the control bank** in F1, F2, F6 and F12, to a row beneath
  the panel and above the notes (`ODAUI.pagerRow`). Paging is not a view setting,
  and it was costing a control group at the top of four figures.
* **Advanced disclosures folded into the main row** in F5 and F6, and F17's two
  desktop rows merged into one. Each had been its own panel: a second border, a
  second lot of padding, a whole row, for one link and one checkbox.
* **F13's year control is now the shared slider**, matching every other figure —
  slider above the phone breakpoint, stepper below.
* **Range thumbs are CGD teal**, via `accent-color`, rather than the browser's
  bright blue, which was the most saturated thing on several figures.

**F1's year ramp.** The old ramp put 2024 and 2025 fifty-four apart on the
perceptual metric and gave 2024 a near-white fill with a white stroke, so the
first dot was invisible. The new ramp is still a single-hue light-to-dark
sequence, per the brief, but every adjacent pair is at least 155 apart.

**F16's text above the chart** is down to the title, the subtitle and the
one-line "not a recommendation" note the brief requires to be persistent. The
committed-envelope, no-discretionary-allocation and no-priority notes moved to
just above the collapsible notes, which is in fact where the brief asks for them
("visible above the collapsible notes section"). The chart now starts 250px down
a 1200px view instead of well below it.

### Two defects this surfaced

**Native selects clip their own option text silently** — no overflow, no
scrollWidth, just an unreadable label — so neither the render gate nor the
audit could see it, and narrowing the dropdowns risked introducing exactly that.
`qa/audit_mobile.py` now measures the selected option against the control's inner
width and flags anything where less than 60% survives. Some truncation is
unavoidable (at 320px nothing shows "Democratic Republic of the Congo", and a
native select still shows full text when opened), so the threshold is set at loss
of identity rather than at any clipping. It found and fixed: F1's and F2's sort
controls, F17's mobile metric dropdown, and every wide-tier control at phone
widths, which now spans the row rather than showing a third of its label.

**Two segmented controls in F17 both emitted `data-value="oda"`** — the
metric-family control and the ODA-metric control. Harmless while they sat in
separate `.controls` containers; once merged into one row, a selector scoped to
that row hit the wrong button, which is how the merge broke the mobile-sync
check. Every option now carries `data-key` as well, so a selector can be exact.

### F7 colouring, and two bugs found with it — 31 August 2026

**F7 now colours by composition, not by change.** The brief previously specified
"Colour = % change vs 2024; Size = level", so the earlier build followed it.
**The brief was updated on 31 August 2026** and now reads: colour = composition
by default, being the leaf dimension of the nesting, with a toggle to % change
vs 2024; size = level. The scale guidance was scoped to the change view and
carries the reason. Code and brief now agree.

The reason is measurable. One cell — EU Institutions' general budget support to
Ukraine — is **63% of the canvas**, and the top three are **79%**. Spending the
strongest visual channel on a change value that is near zero for most cells left
the largest object on the chart carrying the least signal, and the figure read as
a large blank rectangle. Colouring by the leaf dimension instead means the same
sector, or the same partner, carries one colour across every group, which is the
comparison a treemap exists to support.

Change is not lost: a `Colour` toggle switches to the diverging change scale,
with the winsorisation and the below-baseline grey exactly as the brief
specifies, and the tooltip gives the 2024 value, the selected year and the
percentage change in both modes. The plot is also taller on phones, because a
treemap needs area rather than width.

**F15's series appeared to plunge or soar after 2028.** They did not: those were
the end-label leader lines. Labels had been distributed evenly down the whole
plot height regardless of where each line actually finished, and each was joined
back to its endpoint by a leader in the same grey and the same weight as the
series — so ten lines seemed to diverge past the last data point. Labels now sit
at their own line's end value and are pushed apart only on collision; the six
leaders that remain are hairline dotted in a lighter grey, and can no longer be
read as data.

**The cut-threshold select was blank.** The state holds the threshold as a number
(`0.5`) while the options carried the string `.5`, so `String(0.5)` matched no
option: F15's control was empty from load, and F10's went empty as soon as any
other control fired the shared subscriber. Neither the render gate nor the
mobile audit could see it — a blank select is a perfectly well-laid-out select —
so `qa/audit_mobile.py` now asserts that every visible select has a selected
option.

### Editorial and mobile pass, 30 August 2026

**Documents.** The methodology (both the main text and the plain-language
companion) and the brief now describe the LDC-based missing-need-mass rule the
tool implements, rather than an unconditional block. The brief's "seven
unclassifiable" under the humanitarian objective was also corrected to six:
INFORM covers 135 of 141.

**Scenario hint line removed.** `ODAUI.scenarioSelect` no longer prints a
restatement of the selected rule beneath the control. The option text already
reads "S2A — Sector prioritisation by donor portfolio" and the per-option title
carries the longer description, which satisfies the general rules' scenario
tooltip. It cost a line of vertical space on nine figures.

**Year control is one state key with two renderings.** The stepper shows only at
760px and below, where a five-position slider is too fiddly at thumb width; the
slider shows only above it, where the arrows added nothing. Both stay in the DOM
and in sync, so a resize needs no re-render. Enforced by `oda-figure.css`, and
the mobile audit asserts exactly one is visible at every width.

**Controls condensed.** Panel padding 9px→6px, gap 8px→6px, label margin 4px→2px,
and F3 and F7 merged their two control rows into one. F7's control block fell
from 260px to 175px at 320px, which is the difference between the chart being
below the fold and above it.

**Colour: income groups are now distinct hues, not a one-hue ramp.** The
poorest-darkest sequential ramp was correct in principle and unreadable in
practice — four teals, which on F9's bubble scatter were essentially one colour.
Now gold for low income (the most salient colour, for the category the figures
are about), deep teal for lower middle, mid blue for upper middle, muted
teal-grey for high income, residual grey for not classified. Minimum perceptual
separation across the set is 138, against a guard threshold of 80. The
sequential-ramp exemption in `assignColours` is gone with it.

**F13** now carries one "Reallocated, %" column heading with right-aligned
values, instead of repeating the word on all ten rows.

**F7 was unusable and is now readable.** Ukraine has 389 funded donor-sector
cells and the United States 1,190; drawing every one in a 700x450 box gave an
average cell under 1,000 square pixels, and slice-dice tiling turned that into a
mush of slivers. Now squarified, capped at 12 groups and 8 cells within each,
with the tail pooled into an Other cell that carries its own total and change and
says how many cells it covers — 89 leaves in 12 groups for Ukraine, and the
summary reports the 312 pooled. Group headings were also being painted over by
the leaf rectangles, so the reader saw donor and sector names mixed with no way
to tell which was which; they are now drawn last, in their own band, in a
distinct weight and colour, and cell labels flip to white on dark fills.

### Mobile audit

A standing audit at 320/390/430/768/900px over all seventeen figures, checking
five things the render gate does not: painted boxes escaping the frame, text
clipped by a clipping ancestor, control groups overlapping each other, tap
targets under 24px, and SVG marks drawn outside their own viewBox. Deliberate
scroll regions and ellipsis truncation are excluded.

It found and fixed:

* **F9 drew three recipients off-canvas.** `d3.scaleLog` does not clamp, and the
  1e-6 domain floor sat above the smallest poverty share in the data, so Bhutan,
  Saint Lucia and Tuvalu were painted at negative x — outside the plot — while
  the count still claimed to show them. The scale now clamps, the tick format
  adapts to the decade (a fixed `.1%` printed 0.0001%, 0.001% and 0.01% all as
  "0.0%"), and the ten recipients resting on the axis floor are named beneath the
  chart.
* **F3 and F8 overflowed the frame between 761px and about 900px**, where the
  shared two-column phone grid has stopped applying and the house
  `flex-wrap: nowrap` row has nowhere to go. The project layer now wraps.
* **F7's focus select** forced its grid column wider than a 320px phone.
* **F12's scenario legend buttons** (22px), **F6's recipient row buttons** (17px),
  **F17's column sort buttons** (17px), its **recipient name buttons** and its
  **need-threshold checkbox** were all below a usable tap size.

One item is left as-is: F17's need-threshold checkbox is 18px, inside a 32px
clickable line with its label. That is a standard control and the line is the
target; the audit's flat 24px floor is what is wrong there.

### Follow-ups closed, 30 August 2026

**The brief's 2,534 is corrected.** `Visualisation briefs.docx` now reads 2,562,
matching the released payload. The previous file is kept beside it as
`Visualisation briefs.docx.bak-2026-08-30`.

**F16 no longer blocks two of its three objectives.** The published methodology
already rules on a missing need mass, and the rule turns on LDC status:

* a least developed country with no computable composite takes an imputation
  from the observed LDC distribution — the 80th percentile of their composites,
  or the median of that worst-off quintile at an INFORM percentile of 0.90 or
  above;
* a recipient that is **not** a least developed country is **not** imputed high
  vulnerability. It "receives no special Scenario 5 priority by default and is
  flagged for review, consistent with the treatment of missing humanitarian
  scores in Scenario 6A".

Every recipient missing a humanitarian or fiscal need mass in this release is a
non-LDC: Montserrat, Niue, Saint Helena, Tokelau, Wallis and Futuna and Kosovo.
The second branch therefore governs, and the tool now follows it — those
recipients stay in the portfolio, stay fundable, and simply take no priority from
that objective, with the affected names stated on the face of the figure. That
unblocks humanitarian risk and fiscal vulnerability for the 36 donors whose
portfolios include one of the six, the United States among them.

The LDC branch is still blocked, because it needs the observed composite
distribution and INFORM percentiles, which the browser payload does not carry.
Approximating it would publish a number that is not the audited one. No recipient
is in that state today.

*This supersedes the methodology's "Objective weights and missing data" clause and
the brief's matching sentence, both of which say the interface blocks on any
missing need mass. Both need one sentence updated to point at the LDC rule.*

**F6 is on a logarithmic axis** with an advanced option to exclude recipients
losing more than 50% of GNI, which recomputes the domain for the remaining set.
Excluding the two — Marshall Islands and Micronesia — brings the top of the scale
from 160% to 41% and makes the donor composition of every row legible; Tonga,
Nauru and Samoa previously showed as slivers. The axis floor is 0.01% of GNI, and
segment boundaries rather than widths carry the values, which the notes state.
`ODAModel.percent` was also fixed: it had only 0-place and 1-place formatters, so
a caller asking for two decimals silently got one — which the attributed-cuts
tooltip and total column had been doing.

### Still open

* **The methodology and the brief still say the tool blocks on any missing need
  mass.** The tool now follows the methodology's own LDC rule instead. One
  sentence in each document needs updating to match.
* `Implementation notes- browser engine and data contract.docx` still describes
  the superseded in-browser-engine premise.

## Figures

Payload columns list the arrays each figure consumes, from
`../ACCEPTANCE_CRITERIA.md` Part 1. All arrays exist in v2.2.8; nothing is
data-blocked.

| # | Figure | Status | Notes |
|---|---|---|---|
| F1 | Donors' headline total ODA cuts | **Built and verified** | GE only; no valid forward gross series exists |
| F2 | Traceability of bilateral ODA | **Built and verified** | Gross only; `recipient_specified_sector_missing` is structurally zero |
| F3 | Map of flows and losses | **Built and verified** | Kosovo has no map feature; approved exception |
| F4 | Recipient-sector losses vs 2024 | **Built and verified** | Mutual-All rule follows the brief |
| F5 | Fiscal meaning of ODA loss | **Built and verified** | `f5-fiscal-loss.html`. See the record below. |
| F6 | Losses as % GNI attributed by donor | **Built and verified** | Gross only because the displayed metric is a percentage of GNI |
| F7 | Treemap by sector | **Built and verified** | Sparse cube loaded and verified on demand |
| F8 | ODA by donor over time | **Built and verified** | Aggregate by default; sparse cube only for sector detail |
| F9 | ODA share vs poverty share | **Built and verified** | Gross allocable bilateral ODA; hovered trajectory only |
| F10 | Orphaned recipient-sectors by year | **Built and verified** | Aggregate at load; sparse cube only for donor sub-popup |
| F11 | Concentration on the top donor | **Built and verified** | Sparse cube on load; top donor re-identified in each year |
| F12 | Recipient losses across scenarios | **Built and verified** | All scenarios together; sector aggregates lazy-loaded for popup |
| F13 | Donor flows by scenario | **Built and verified** | Aggregate payload only; no cube fetch at load |
| F14 | Poverty/fiscal shares across scenarios | **Built and verified** | Scenario-family colour; zoomed and dodged dot plot |
| F15 | Orphaning across scenarios | **Built and verified** | Emphasis colouring, deliberately unlike F12/F14 |
| F16 | Interactive allocations tool | **Built and verified** | Live continuous-weight solve; system-wide rule is the only lazy fetch |
| F17 | Recipient × scenario table | **Test build complete** | Distinct desktop/mobile forms backed by one state object; full QA record below. |

## F1–F4 — first visualisation set

Files: `f1-donor-headline-cuts.html`, `f2-traceable-oda.html`,
`f3-flows-and-losses-map.html`, `f4-recipient-sector-losses.html`.

### Verification, 29 August 2026

* `python qa/verify.py` passes all four figures at 320, 768 and 1200px with no
  console errors, horizontal overflow, clipped controls or SVG text conflicts.
* `python qa/exercise_f1_f4.py` exercises F1 sorting and paging; F2 unit and sort
  changes; F3 recipient/donor selection, scenario persistence, aggregate and
  sparse-cube paths; and F4 year, measure and recipient/sector modes. It also
  forces a sparse-cube HTTP failure and confirms that F3 renders a visible
  fail-closed state. Screenshots are in `qa/shots/`.
* Screenshot review corrected defects the machine audit did not detect: F1 and
  F2 axes had been aspect-ratio squeezed, and their right columns clipped at
  320px. Both now use container-relative coordinates and three mobile ticks.

### Payload and decisions

| Figure | Payload consumed | Decisions and caveats |
|---|---|---|
| F1 | `static/total_oda_ge__donor_year` | Grant-equivalent only because the release contains no valid 2025–2028 gross total-ODA series. Shows 20 of 50 providers per page; changing the sort reselects the ranked set. The 17 held-static donors and their 15.5% collective rise are stated in the notes. |
| F2 | `static/specification_split__donor` | Gross 2024 bilateral ODA only; a GE switch would imply a payload distinction that does not exist. The zero recipient-known/sector-missing category remains explicit, and earmarked/core multilateral treatment is stated. |
| F3 | recipient-sector and donor-recipient aggregates, plus verified sparse cubes only after donor + sector selection | Recipient selection persists across scenarios; flows render only after a donor or recipient selection and are limited to the 40 largest drawable links with coverage stated. Donor countries use a uniform overlay. Kosovo remains in totals/search but has no polygon in the pinned world atlas. Gross/GE is shown only for total and per-capita metrics. |
| F4 | recipient-sector aggregates, gross and GE | Defaults to all recipients × Health. `All recipients` and `All sectors` cannot both be selected, following the explicit brief. This conflicts with the acceptance line referring to roughly 2,600 simultaneous cells; that line is treated as stale because it would require the prohibited all-by-all state. Recipient dots use income-group colours; sector dots use the common sector palette. |

All four figures state constant-2024-US-dollar and unallocable-flow conventions in
their collapsed notes. Dark-mode-specific work and an expanded screen-reader pass
are intentionally out of scope following the commissioning decision; native
controls, semantic labels and keyboard tooltip access remain in place.

## F6–F8 — attribution, portfolios and donor mix

Files: `f6-donor-attributed-losses.html`, `f7-oda-treemap.html`,
`f8-donor-oda-over-time.html`.

### Verification, 29 August 2026

* `python qa/verify.py` passes the entire repository at 320, 768 and 1200px.
* `python qa/exercise_f6_f8.py` exercises F6 paging, popup and scenario
  persistence; F7 focus, partner, nesting, measure and lazy-cube failure states;
  and F8 unit, measure visibility, sector detail, selection persistence and
  lazy-cube failure states. Screenshots are in `qa/shots/`.
* The exercise independently inflates the raw Float32 blobs. It reproduces F6's
  top ranked recipient (Marshall Islands, 160.5288% of GNI); reconciles F7's
  default Ukraine cube sum (US$29,514.690m) to the recipient aggregate
  (US$29,514.691m); and independently reproduces F8's 2028 Ukraine donor sum.
  The sub-US$0.002m differences are consistent with Float32 summation order.

### Payload and decisions

| Figure | Payload consumed | Decisions and caveats |
|---|---|---|
| F6 | 2024 and scenario donor-recipient gross aggregates; recipient GNI | A donor-recipient reduction is floored at zero before attribution, so an increase from another donor does not net away a named donor's cut. The top five cutting donors and their fixed segment order are recomputed globally for the selected scenario. Gross is fixed because the chart reports a percentage of GNI and the general brief says not to show the gross/GE control for percentage figures. Yemen and South Sudan are explicitly excluded for missing GNI. |
| F7 | Verified 2024 and selected-scenario sparse cubes | Size is the selected year's level. Hierarchy order is fixed by 2024 baseline amounts. Cells below a US$0.1m baseline are neutral; remaining percentage changes are winsorised at the 95th percentile of absolute change. The brief's nesting labels describe the selected focus rather than the varying partner dimension; the implementation uses the analytically explicit labels `donor → sector` for a selected recipient and `recipient → sector` for a selected donor. |
| F8 | Donor-recipient aggregates; selected scenario cube only when a sector is chosen | The top eight are computed within the selected recipient and sector from their combined 2024–2028 level. Their order is fixed largest-to-smallest with Other at the top. Gross/GE is available only in the US$ view and hidden in the percentage view. |

Donor colours use a deterministic canonical-key mapping in `shared/set-config.js`,
so a donor retains its colour when rankings cause it to enter figures in a different
order. Figures 7 and 8 use pinned D3 7.9.0 from jsDelivr; this dependency therefore
needs the same first-deployment check as Figure 3.

## F9–F12 — allocation, orphaning, reliance and scenario spread

Files: `f9-poverty-share-allocation.html`,
`f10-orphaned-recipient-sector-pairs.html`, `f11-top-donor-reliance.html` and
`f12-recipient-losses-across-scenarios.html`.

### Verification, 29 August 2026

* `python qa/verify.py` passes all four figures at 320, 768 and 1200px with no
  control overflow, page overflow, clipped SVG text, SVG text collision or console
  error. The slower cube and ten-scenario views expose `window.CGD_READY` so the
  gate audits the completed render rather than a loading frame.
* `python qa/exercise_f9_f12.py` exercises Figure 9’s hovered trajectory; Figure
  10’s ranked band popup; Figure 11’s donor popup; and Figure 12’s metric-sensitive
  gross/GE control, ten-entry legend and sector popup. It writes all twelve
  responsive screenshots to `qa/shots/`.
* The exercise independently inflates the binary payload. It reproduces the
  default poverty and allocable-ODA shares for Afghanistan, the S1 2028 count of
  **276** pairs cut by at least 50%, and the 2024/2028 top-donor shares for a
  recipient in Figure 11’s default sector.
* Visual inspection found native select values were truncated in the initial
  two-column phone controls. Figures 10–12 now use one mobile control column;
  their final screenshots show complete labels and no overlap.

### Decisions, with reasons

| Figure | Decision | Reason |
|---|---|---|
| F9 | Gross only; denominator is allocable recipient ODA | It is a share view, so gross/GE is not a displayed US$ choice. Unallocable bilateral ODA has no recipient and cannot enter either recipient numerator. |
| F9 | Only the hovered or tapped recipient gets a trajectory | Drawing all 141 trajectories would obscure the cross-section and is explicitly excluded by the brief. |
| F10 | A pair is counted **cumulatively**, from the first year it crosses the threshold, and stays counted | *Reversed 30 August 2026.* The earlier build counted only pairs meeting the threshold in that year, reading “cumulative” as the total across breakdown categories. Both briefs say cumulative-ever incidence, and that reading was confirmed. F10 and F15 now share the definition, and the notes report how many pairs recover above the threshold but remain counted, rather than asserting in the abstract that recovery is rare. |
| F10 | Recipient-sector aggregates at load; cube only in donor detail | The main chart and first popup do not require donor-sector cells. This keeps the initial payload proportionate and preserves a visible fail-closed state for the lazy donor drill-down. |
| F11 | Largest donor is recomputed separately for 2024 and 2028 | This measures contemporaneous concentration; holding the 2024 donor fixed would answer a different question. |
| F12 | Gross/GE appears only for US$ lost | The general rules restrict the measure toggle to views whose displayed values are monetary. Percentage-of-2024 and percentage-of-GNI views retain state but hide the inapplicable control. |
| F12 | Sorting reselects from all 141 recipients before paging | Reordering only the current page would present the wrong top 15 under the new criterion. |

## F13–F15 — donor portfolios, priority flows and scenario orphaning

Files: `f13-donor-flows-by-scenario.html`,
`f14-priority-flows-across-scenarios.html` and
`f15-orphaning-across-scenarios.html`.

### Verification, 29 August 2026

* `python qa/verify.py` passes these three figures at 320, 768 and 1200px with no
  control intersections, control clipping, page overflow, SVG text conflicts or
  console errors. Their phone layouts use one control column.
* `python qa/exercise_f13_f15.py` exercises Figure 13's measure, split and year
  states; Figure 14's metric and measure-dependent controls; and Figure 15's
  threshold, denominator, deviation, filter, ranked-pair popup and lazy donor
  drill-down. It also confirms Figure 13 does not fetch the sparse cube at load.
* Independent raw-payload checks reproduce Figure 13's default donor total
  (US$13,913.9208m), Figure 14's 2024 reference (26.3769%) and S1 2028 value
  (23.6896%), and Figure 15's S1 2028 count of **276** pairs cut by at least 50%.
* Screenshots at all three widths are in `qa/shots/`. Visual review confirms
  complete control labels, wrapped legends and contained chart labels. Figure
  15's right-edge labels are vertically dodged and connected to their endpoints
  to remain readable without overlap.

### Decisions and caveats

| Figure | Decision | Reason |
|---|---|---|
| F13 | Use donor-sector or donor-recipient aggregates; never the sparse cube | The displayed portfolio shares and cell-level reallocation are fully determined by aggregates, and the acceptance criterion explicitly prohibits a cube fetch at load. |
| F13 | Keep a fixed category order with the six largest 2024 categories plus Other | It makes reallocations comparable across all ten scenario bars; re-ranking each bar would confound movement with order. |
| F14 | Use scenario-family colours, a zoomed value axis and vertical dot dodging | All ten scenarios must be distinguishable despite close values. A zero-based axis would hide the differences; the 2024 reference remains explicit. |
| F15 | Emphasise S1 in teal and render the other scenarios in grey | This is the deliberate emphasis treatment requested by the brief, unlike the family-colour comparison in Figure 14. Hover restores a clear path to every scenario. |
| F15 | Count **2,562** positive-baseline recipient-sector pairs | The acceptance brief says 2,534, but both gross and grant-equivalent baseline payload arrays contain 2,562 strictly positive cells. An independent raw-blob count confirms the released payload. The figure states the live denominator; the brief should be corrected rather than forcing a stale constant. |
| F15 | Load the sparse cube only after a ranked pair is selected for donor detail | The main chart and pair ranking use recipient-sector aggregates. Lazy loading keeps the default payload proportionate and preserves a visible fail-closed boundary for donor drill-down. |

## F16 — interactive allocations tool

File: `f16-interactive-allocations-tool.html`, analytics name
`oda-f16-interactive-allocations-tool`.

**Question.** How could a donor allocate its fixed projected bilateral ODA envelope
differently if it prioritised poverty, humanitarian risk, fiscal vulnerability or a
continuous blend of those objectives?

**Default state.** S1, United States, 2028, poverty only, percentage-change view.
The allocation and envelope are fixed to grant-equivalent terms; peer coverage and
viability are evaluated in gross terms. There is deliberately no gross/GE control.

### Verification, 29 August 2026

* `python qa/verify.py f16-interactive-allocations-tool.html` passes at 320, 768
  and 1200px with no control intersections, page overflow, clipped SVG text,
  SVG text collisions or console errors. Controls form one column on phones;
  optional outlier labels are measured and removed when they collide.
* `python qa/exercise_f16.py` independently inflates the raw payload and
  reimplements the continuous objective tilt, scalar box projection and country
  viability cascade in Python. For the default state, both implementations return
  a US$13,913.9209m envelope, US$834.5667m held allocation, US$13,079.3542m
  discretionary envelope, 130 supported recipients, exact envelope balance and
  the same Ethiopia recommendation (US$1,255.0376m).
* The exercise verifies that policy-held allocations have exactly zero movement;
  the projected comparison and recommendation both balance to the envelope; the
  humanitarian preset and a continuous three-way blend solve for a donor with
  complete inputs; missing objective components are blocked and named; and the
  four fully held donors show a specific no-discretionary-allocation state.
* Only changing the system-wide allocation rule fetches another scenario blob.
  Donor, year, objective, continuous blend, chart view and comparison changes
  reuse verified data already in memory. URL state includes the objective blend
  and pinned comparison weights.
* Screenshots cover the default view at all three widths and a desktop advanced
  blend with the pinned-allocation overlay. Visual review corrected an HTML/SVG
  namespace defect that the initial numerical checks could not see, then removed
  optional labels that collided at the plot edges.

### Construction and decisions

| Element | Implementation and reason |
|---|---|
| Protection score | For each objective, the peer-coverage gap is calculated from the selected scenario's gross donor-recipient projections, divided by the unweighted 95th percentile of positive gaps and capped at one. Blend weights apply to these normalised scores, never to raw need masses. |
| Objective response | Continuous weights feed the central fixed priority tilt, lambda = 2.3. The reader cannot change lambda or any other forecast-model assumption. The free allocation is solved live by the model's single-scalar chi-square box projection after each deterministic viability closure. No weight grid is precomputed. |
| Envelope and pins | The selected scenario/year supplies a fixed grant-equivalent envelope. Ukraine, exit-affected corridors and executable country zero pins stay at their audited projected grant-equivalent values and cannot be disabled. The remaining envelope is allocated only across the donor's positive 2024 support set. |
| Projected comparison | The available scenario donor-recipient array is gross because it is also the peer-coverage input. For the X-axis comparison, free-recipient gross proportions are converted with the realised donor-year gross/GE ratio and rescaled to the exact discretionary GE envelope; policy-held GE values are inserted exactly. This preserves the audited projected recipient distribution, the fixed envelope and zero movement for held recipients without claiming recipient-specific GE ratios that the payload does not contain. |
| Viability | Recommendations are tested in gross using the realised donor-year ratio and the guarded country floor. The iterative cascade closes the lowest-score, lowest-allocation sub-floor recipient and reprojects; this is deterministic and reproducible, not a claim of global optimality for the disjunctive closure problem. |
| Missing objectives | Any positive weight on a component missing for a recipient in the selected donor's observed portfolio is blocked. The component and affected recipients are named; values are not imputed, dropped or silently renormalised. |
| Ternary blend | Poverty, humanitarian risk and fiscal vulnerability presets are corners of the same three-weight state as the draggable triangle. All weights remain non-negative and sum to one. |
| Comparison | Pinning stores one objective state as hollow rings; the current state remains filled and is joined by faint connectors. Changing donor, year or system-wide rule clears the comparison because those contexts are not comparable on one axis. |
| Sector scope | The solve is recipient-level and the interface contains no sector control or axis. Were sector output added later, it would be an imputation from observed 2024 sector shares rather than a sector choice. |

The face of the tool states the committed amount and that the result is not a
recommendation. The collapsed notes disclose excluded policy commitments, fixed
peers, country-versus-cell viability, fixed units, sector imputation and standard
constant-price/unallocable-flow conventions. The word “optimal” does not appear.

## F5 — the fiscal meaning of bilateral ODA loss

`f5-fiscal-loss.html`, analytics name `oda-f5-fiscal-loss`.

**Question.** Which recipients lose an amount of aid that is large relative to the
economy that has to absorb it?
**Default state.** 2028, even proportional cuts (S1), measured against GNI,
microstates included.

**Payload consumed.** `static/baseline_gross__recipient`,
`static/baseline_ge__recipient`, `scenarios/<SC>/recipient_year__gross`,
`scenarios/<SC>/recipient_year__ge`, `recipient_meta` (`gni_usd`,
`gov_revenue_usd`, `population`, `income_group`).

### Verification, 28 August 2026

* `python qa/verify.py` — pass at 320, 768 and 1200px; no console errors.
* `python qa/exercise.py f5-fiscal-loss.html` — state exercise clean. Screenshots
  in `qa/shots/`. 115 marks render at every width.
* Hand-checks against an independent Python computation straight from the payload
  blobs: Marshall Islands US$584.0m lost, 160.43% of GNI; Ukraine US$5,658.4m,
  2.66%; Somalia US$696.9m, 5.38%. All three match the rendered values and the
  mark `aria-label`s exactly.
* State: scenario S1 to S7 changes marks 115 to 113; the GNI to government-revenue
  switch changes `n shown` from 115 to 112; the microstate exclusion drops it to
  93 and restores; year bounds disable correctly; tooltip pins on click and
  dismisses on an outside click; notes collapsed by default; body height grows and
  shrinks.
* Keyboard: tab order is fullscreen, scenario, year stepper, year slider,
  denominator, advanced, then the marks. Focusing a mark reveals its detail, so
  the tooltip is not the sole carrier.
* Gross/grant-equivalent control exercises both payloads and updates visible text.
* A forced HTTP 503 on the first lazy grant-equivalent request produces the
  visible fail-closed state with no unhandled page error.
* Tooltip explicitly labels the recipient income group.

### Decisions, with reasons

| Decision | Reason |
|---|---|
| Both axes logarithmic | Losses span US$0.10m to US$5,658m, more than four orders of magnitude, and shares run from about 0.001% to 160%. A linear axis compresses almost every recipient against the origin. Stated in the notes. |
| Year control offers 2025–2028, not 2024 | The measure is loss *against* 2024, which is zero at 2024 by construction. Offering it would offer an empty chart. |
| Recipients projected to gain are named, not dropped | They cannot sit on a log axis, but they are not missing data. 15 under S1 at 2028, 17 under S7; listed in a visible note. |
| Recipients without the denominator are named | 11 lack GNI, 12 lack government revenue. Yemen and South Sudan are material. Listed in a visible note, with `n shown`. |
| Marks are individually focusable | 115 tab stops is more than ideal but well short of the "thousands" the house standard warns against, and it gives every point a keyboard route. Revisit if a later figure has many more marks. |
| Income-group colours pinned in `shared/set-config.js` | Income group carries colour in F4, F5, F9, F11 and F12. Pinning it in the shared map is what stops the set drifting; the file invites exactly this edit. |
| Marshall Islands caveat stays visible | The 160% result is driven by exceptional 2024 Compact payments, including a trust-fund contribution, and must not read as a fall from normal annual ODA. |

### Bugs found during verification

| Bug | Effect if shipped |
|---|---|
| Share stored as a fraction but formatted as if a percentage | Marshall Islands would have read 1.60% instead of 160%, understating every value by 100× |
| 2024 selectable on a loss-versus-2024 measure | An empty chart with no explanation |
| Log domains clamped to a floor below the data minimum | Marks drew outside the plot area, colliding with the axis title |
| Long `.panel-title` against the house `white-space: nowrap` | Title and legend both clipped at 320px |
| Tick formatter rounded small shares to `0.00%` | A meaningless axis label |
| "Share of GNI" in the option text under a "Measured against" label | Truncated to "Share of (" at 320px, and duplicated the label |

The last four were invisible to the automated gate and were found only by looking
at the screenshots: the control-overflow audit covers `.controls`, not
`.panel-header`, and the SVG-text audit checks text nodes, not marks drawn outside
the plot area. Worth remembering when reviewing later figures — the gate is
necessary, not sufficient.

## F17 — recipient outcomes across allocation rules

`f17-recipient-scenarios-table.html`, analytics name
`oda-f17-recipient-scenarios-table`.

**Default state.** 2028, gross ODA, poverty prioritisation ratio, all recipients.

**Payload consumed.** Gross and grant-equivalent `recipient_year` aggregates for
all ten scenarios, both recipient baselines, recipient metadata, and the three
tool need vectors. The sparse cube is never fetched.

### Verification, 28 August 2026

* `python qa/verify.py` passes at 320, 768 and 1200px with no page-level overflow,
  clipped controls, SVG conflicts or console errors.
* `python qa/exercise_f17.py` confirms the default state, gross/GE and metric
  changes, the need threshold (141 to 86 recipients), mobile year stepper,
  explicit humanitarian “Not classified” group, contained horizontal scrolling,
  Average/Range leading on mobile, and collapsed notes.
* Screenshots are in `qa/shots/`. Visual review led to three further fixes:
  Average/Range now fit at a typical desktop article width; mobile names no longer
  inherit native button chrome; and the mobile GE label no longer clips.
* Collapsed group summaries use medians per scenario. The brief permits means or
  medians; medians remain interpretable when small need denominators create very
  large ratio outliers.

## Open decisions

| Decision | Owner | Note |
|---|---|---|
| How the payload reaches the deployment repo | — | Currently committed in full. 8.2 MB per release; history grows unless superseded releases are deleted in the same commit. Git LFS is the alternative. |
| Kosovo on the map | — | `XKV` has no ISO/M49 code and no feature in `countries-110m`. Retained in totals and non-map charts; unshaded on the map. |
| Whether EU Institutions is selectable as the tool's focus donor | — | It has no GNI; `donor_meta` carries applicability flags. |
