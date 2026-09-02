# Scope: interactive visualisations for the 2026 bilateral ODA paper

**Settled 19 August 2026; release contract updated 27 August 2026.** This document is
authoritative on what the interactive product is and is not. Where `README.md`, the
methodology, the implementation notes or the draft paper disagree with it, they are
superseded and should be corrected.

It exists because the scope was substantially reduced after the 19 August independent
review, and because the previous design left the same claim stated three different ways
in three documents. One canonical statement, and everything else conforms to it.

## The decision

**No reader-facing controls over forecast-model assumptions.** The coordination tool
does expose reader-controlled objective weights, so it is a modelling tool in its own
right; what is withdrawn is any control over the assumptions behind the published
projections. Earlier designs let readers switch the Ukraine
assumption, the sector-recipient viability floor, the priority tilt (lambda) and the
bilateral/multilateral channel split. All four are withdrawn.

The model behaviour does not change. The viability floor still operates at the 10th
percentile, the Ukraine assumption still applies, lambda stays central, and channel
shares stay as the bucket ledger produces them. Readers simply cannot alter them.

### Why

* Withdrawing the toggles removes the public-product causes of F01 (the multilateral
  control did not do what it claimed) and F02 (mixed per-donor views could not be
  composed from the payload), retires the affected metadata in F16, and substantially
  reduces the configuration surface covered by F06 and F07. It does **not** touch
  provenance (F09), emitter validation (F07's core), the binary contract (F17), the
  regional-universe question (F15), documentation (F18) or the missing deployment gate
  (F08). An earlier draft claimed every non-solver finding came from the toggles; that
  was false.
* Each toggle's analytical content is a **single number**, which is more useful stated
  than delegated. A reader handed a switch has no basis on which to choose; a reader
  handed "the viability floor accounts for X of the orphan count" learns something. The
  methodology already treats uncertainty this way, as "required sensitivities".
* 504 configurations was 504 opportunities to find a preferred number. That
  reader-degrees-of-freedom risk was flagged at the outset of the work and then built
  anyway.
* The coordination tool is the genuinely novel contribution. The complexity budget
  belongs there.

## What readers control

| Control | Values | Notes |
| --- | --- | --- |
| Scenario | 10: S1, S2A/B, S3A/B, S4, S5, S6A/B, S7 | These *are* objective functions; "choose an objective" is largely this selector |
| Measure | grant-equivalent or gross | Display switch only. **Not** the withdrawn counterfactual that altered the GE:gross ratio |
| Year | 2025, 2026, 2027, 2028 | The cumulative view is derived from the four; each year is itself one of them |
| Navigation | donor, recipient, sector | Not a modelling choice |
| Coordination tool | focal donor, year, objective weights | Uses the same scenario selector as the figures: the focal donor's envelope and the peer projections always come from one scenario. See below. |

## Reported as stated sensitivities, not controls

Computed once with the analysis fork and written into the paper:

* the volume and count of activity closed by the sector-recipient viability floor, and
  what the strict (25th percentile) variant would change;
* what the Ukraine assumption contributes, by donor and recipient;
* how much allocation the priority tilt redistributes at weak, central and strong
  settings, per scenario, since it varies four-fold across scenarios;
* the effect of a system-wide channel-mix shift, if the paper makes a claim needing it.

## Data architecture

### Figure payload: 2.23 MB eager, plus the cube on demand

Ten scenarios of chart-ready aggregates, Float32, shipped pre-compressed as `.bin.gz`
and inflated in the browser with `DecompressionStream`:

    donor_year               [donor][year]                     GE, gross
    recipient_year           [recipient][year]                 GE, gross
    sector_year              [sector][year]                    GE, gross
    donor_recipient_year     [donor][recipient][year]          GE, gross
    recipient_sector_year    [recipient][sector][year]         GE, gross

`donor_recipient_year` gross is required by the coordination tool, which needs
peer-only recipient support. Dimension order, axis lists and recipient denominators
ship once in `manifest.json`. The 2024 baseline is invariant across every control and
is stored once, enforced by a build-time test.

**The full four-way cube** `[donor][recipient][sector][year]` is also published, because
the aggregate grains cannot serve a donor's sectoral composition or a recipient's
donor-by-sector detail. In v2.2.8 it is 592,200 possible cells per scenario, with
79,845 cells in the union support (13.5%), so it is stored **sparse over one shared
support index**:

    cube/support__donor_index      uint8  [79845]   sorted donor-major
    cube/support__recipient_index  uint8  [79845]
    cube/support__sector_index     uint8  [79845]
    cube/support__year_index       uint8  [79845]
    cube/support__donor_offsets    int32  [51]      exact CSR boundaries for 50 providers
    cube/<scenario>__ge            float32 [79845]
    cube/<scenario>__gross         float32 [79845]

Observed 2024 uses a separate 19,940-cell `cube/support2024__*` index and
`cube/baseline__{ge,gross}` values. The projection support and its hashes therefore
remain unambiguous: `axes.year` contains 2025–2028 only.

The encoding was chosen by measurement, not preference. Dense gzips to 282 KB per measure
against sparse's 252 KB, so transfer barely differs -- 87% zeros cost gzip almost nothing.
Sparse wins on **memory**: 0.30 MB of ArrayBuffer per array against 2.34 MB, which across
twenty arrays is 6 MB against 47 MB. In an iframe on a CGD page that is the binding
constraint. Byte-plane shuffling the values would save a further 16% but would oblige every
consumer to de-shuffle, breaking the rule that a blob can be wrapped in a typed array and
indexed directly; not taken.

**The cube is not part of the first load.** The 195 non-cube blobs total **2.23 MB**
gzipped. A chart that needs the cube fetches the 14.7 KB projection support and one
scenario, about 535 KB gzipped for grant-equivalent and gross together. The complete
225-blob payload is 7.77 MB gzipped, but a session should not fetch every cube.

A value array is meaningless without the index it was built against, and a float array shows
no sign of a misalignment, so `verify_payload.py` reconciles the cube by summation against
all five aggregate grains, for every scenario and both measures -- 100 reconciliation checks,
worst margin under 5e-3 US$m, which is float32 storage on both sides with differing
summation order.

Closure information carries **two** reasons only:

* `viability` — closed because funding fell below the viable level, including closures
  carried forward from a prior year, which are the same mechanism persisting;
* `announcement` — zero because a donor announcement requires it.

`floor_overridden_by_policy` is **not** a closure and must never be labelled as one. It
marks a cell *funded below* its viability floor because a commitment protects it: 275
cells across CZE, GBR, HUN, KOR, LVA, POL and USA in S3A, all funded, none closed.

### Coordination tool, about 56 KB, solved live in the browser

Per the methodology's "Interactive tool on donor coordination", **as amended by the
decisions of 19 August 2026 recorded below**. The methodology text needs updating to
match; where the two differ, this section governs.

The tool asks what a donor *should* do, not what it *will* do. That single change of
framing is what makes it tractable.

#### The focal donor's problem

Solved at **donor-recipient** grain, because that is the grain of the objective: the
peer-coverage gap `G(k,d,r,t) = max[0, pi(k,r) * A(-d,t) - A(-d,r,t)]` is indexed by
recipient, and all three need masses -- poverty headcount, population x INFORM,
population x fiscal vulnerability -- are country-level quantities. There is no sector
term anywhere in the objective.

| Element | Treatment |
| --- | --- |
| Envelope | The focal donor's projected matrix (M) envelope for the selected year and scenario, from the audited run. Fixed; the user does not change it. |
| Policy-held recipients | **Pinned to their audited projected value.** This covers Ukraine for every provider, any provider-recipient covered by an exit-family constraint, and any executable country-scope zero pin. 96 provider-recipient pairs in total. |
| Other policy overlays | **Dropped.** Country floors and sector or channel commitments do not bind, because binding the tool to a donor's announced *allocations* would reduce it to asking where a donor should cut given it has already decided where to cut. |
| Support set | **Fixed to the 2024 observed portfolio.** No new donor-recipient-sector flows may be opened. Cells absent from 2024 stay at zero. |
| Upper bounds | **None** on free recipients. There is no no-increase cap. |
| Lower bounds | Zero on free recipients. |
| Viability | Retained, using the country floor with the same relative guard the model applies at cell grain (see below). |
| Peers | Projected under the selected scenario with the full audited rule set, then held fixed. Never re-optimised. |

**Pins, not translated constraints.** A component-scope rule cannot be expressed as a
recipient-total cap: Belgium's `ENABEL_G2G`, Poland's `CSO` and `DIRECT_PUBLIC` and the
UK's FCDO components each restrict part of a corridor, so a recipient-level cap would be
either too restrictive or would fail to preserve the component. Rather than translating
them, the tool adopts their **realised effect**: every policy-held donor-recipient is
fixed to the value the audited model produced, and only untouched recipients are
optimised.

That means Ukraine and announced exits are handled identically, the representation is
exact at recipient grain, no component dimension is needed, and the free problem is pure
box **by construction** rather than by measurement. The earlier claim that exits "come
along correctly" as recipient caps was not established and is withdrawn.

Consequently the tool never contradicts an announced exit or the Ukraine assumption. It
may recommend levels that differ from a donor's announced *allocations* -- country floors
and sector commitments -- and that is the intended normative content.

**Units.** The methodology's dual ledger is preserved. Allocation and the envelope are in
**grant-equivalent** terms; the protection score is computed from **gross** peer support,
because it measures recipient coverage; and viability is tested on **gross** after
converting the GE allocation with the donor-year's realised gross-per-GE ratio, exactly
as the audited model does. The score is a dimensionless weight, so its unit need not
match the allocation's.

**Why the no-increase cap was removed.** Beyond the argument above, it is arithmetically
unsatisfiable for most donors. The median donor's projected matrix envelope exceeds its
2024 observed total (1.04x by 2028) and 30 of 50 providers exceed 1.0. Capping every cell
at its 2024 value would put the sum of caps below the envelope, which is the
`infeasible_upper_bounds_below_envelope` failure class. Only the United States (0.41x)
and the United Kingdom (0.51x) fall far enough for a cap to be non-binding.

#### Why this is solvable in the browser

With policy-held recipients pinned and the remainder unconstrained, each donor's free
problem is **pure box**: an envelope equality over the free support, per-recipient bounds
of `[0, +inf)`, and the viability cascade. The continuous step is a single-scalar
bisection on `mu` in `x_r = clip(d_r + mu*s_r, lower_r, upper_r)`, which is the model's
own `_chi_square_box_projection`.

**Precisely what is claimed.** For each support set produced by the documented viability
cascade, the continuous box projection is solved to numerical tolerance by scalar
bisection. That is not a claim of global optimality for the disjunctive problem
`allocation = 0 or allocation >= floor`; the cascade is deterministic and reproducible,
not provably optimal. The audited model makes the same kind of claim, so the tool and the
figures are consistent in what they assert. An earlier draft said "exactly solvable",
which overstated it.

**Feasibility is tested, not argued.** An earlier draft asserted feasibility because "the
sum of lower bounds is zero". That was wrong: Ukraine is positively pinned, and exits add
further fixed allocations. `build/measure_tool_feasibility.py` tests all 2,000
donor-scenario-year combinations (`qa/tool_feasibility.csv`):

* pinned allocations exceed the envelope: **0 cases**
* residual to place with no free recipient: **0 cases**
* residual smaller than a single country floor: **80 cases**, all Bulgaria and Greece,
  resolved by the relative floor guard below

**Four donors have no discretionary allocation at all.** For EST, LTU, LVA and POL the
pins consume the entire envelope in all 40 scenario-year combinations each: their
bilateral matrix is Ukraine plus exit-affected countries. Sixteen donors have more than
half their envelope pinned. The interface must show an explicit "no discretionary
allocation under this scenario" state for these donors rather than rendering an empty
tool, which would read as a fault.

**The country viability floor takes the model's relative guard.** `abs_floor_country_gross`
is bounded to USD 500k-10m in absolute terms with no relative cap, unlike the cell floor,
which the model caps at `min(abs_floor, 0.30 x baseline)`. Without a guard the floor
reaches 76% of Greece's entire envelope and 66% of Bulgaria's, and seven donors have a
country floor exceeding 10% of their whole envelope. The tool therefore uses the same
construction the model already uses at cell grain:

    country_floor = max(0.05 x recipient_2024_baseline,
                        min(abs_floor_country_gross, 0.30 x recipient_2024_baseline))

This is the model's own formula rather than a patch, and it resolves all 80 cases, because
a floor bounded at 30% of a recipient's own baseline cannot exceed the money available to
that recipient.

**The protection score, and the payload.** The score is computed in the browser and is
exact: `G(k,d,r,t) = max[0, pi(k,r) * A(-d,t) - A(-d,r,t)]` needs only peer sums from
`donor_recipient_year` gross plus three static per-recipient need vectors. Gaps are
normalised by the unweighted 95th percentile of positive eligible-recipient gaps and
capped at one.

Blends apply to the **normalised protection scores**, never to raw need masses or raw
indicators, with weights non-negative and summing to one. **If a selected objective has no
need mass for a recipient in scope, the interface blocks that weight combination and names
the missing component.** It does not impute a value, drop the recipient, or renormalise the
remaining weights -- each of those would silently change the question being asked.

There is therefore **no precomputed weight grid**: objective weights are continuous, the
response is immediate, and the tool's own payload is about 56 KB -- per donor, the 2024
observed recipient totals, the country viability floor, the pinned values per year and the
envelope per year. Peer sums come from the figure payload.

#### Reporting at recipient-sector grain

The solve is recipient-level, but results are also presented at recipient-sector, by
decomposing each recipient's allocation across that donor's **observed 2024 sector mix**
within that recipient. The methodology already uses this device: a wholly new recipient
corridor "uses the donor's observed 2024 sector distribution".

The cell viability floor is then applied iteratively: decompose, close cells below
`cell_floor_gross_usd_mn`, redistribute the closed amounts across that recipient's
surviving sectors on the observed mix, repeat to convergence. Recipient totals therefore
remain exactly as the optimisation set them, while closures are reported at the same
grain and threshold as the published figures.

**If every sector of a recipient would close.** The redistribution can in principle
drive all of a recipient's imputed sector allocations below the cell floor, leaving no
survivor to receive the redistributed amount. The rule is: **allocate the recipient's
whole total to its largest observed 2024 sector and waive the cell floor for that one
cell**, recording the waiver. Closing the recipient instead would contradict the
recipient-level solve that had just funded it, and spreading below the floor would
contradict the viability rule. The relative floor guard above makes this rare, since a
recipient funded at or above its country floor can usually support at least one sector,
but it is not impossible where a donor's cell floor is high relative to its country
floor.

**What may not be claimed.** The tool does not choose sectors. With a recipient-level
objective, any sector answer is imputed from the donor's existing pattern, and must be
labelled as such. Half of donor-recipient pairs have three or fewer sectors and a third
are effectively single-sector (HHI above 0.9), so for many pairs the imputation is
near-determinate -- but the median pair spans four sectors with an HHI of 0.55, so the
split is doing visible work and its provenance matters.

Giving the tool genuine sector choice would require a sector term in the objective, that
is peer undercoverage by recipient-sector. That is computable from the same data but is a
methodology change, not an implementation one, and is not in scope.

#### Labelling obligations

The tool will produce allocations that contradict announced policy -- it may recommend a
donor fund a country that donor has announced exit from. That is the intended
consequence of asking a normative question. The methodology's existing line, that the
tool "requires an explicit objective function and is not neutral advice", therefore
becomes load-bearing rather than decorative, and the interface must:

* state that policy commitments other than Ukraine are deliberately not applied;
* label the sector split as imputed from the observed 2024 mix;
* show the growth multiple where a programme is increased, since there is no cap;
* note that the tool's viability threshold is the country floor while the published
  figures use the cell floor. Both are 10th-percentile constructions from the same 2024
  distributions, so they are methodologically consistent, but the numbers differ.

## Data verification queue: zeros that may be reporting absences

Not scope decisions, but publication risks of the same class: a missing value read as
zero and then hardened into a binding constraint or a published figure. Fourteen
executable constraints are pinned to exactly zero; these are the ones whose provenance
is an *observation* rather than an announcement or an assumption.

| Case | What it asserts | Status |
| --- | --- | --- |
| **ISR-UKR** | `complete_observed_recipient_margin` = 0 for 2025, carried to 2028 by the non-US Ukraine freeze as a constant-dollar floor. Binds as an exact total, the strongest constraint type in the model, so it forbids any Israeli Ukraine spending through 2028. | **Accepted by owner decision for this release.** Retained here as an explicit zero-value assumption rather than an unresolved gate. |
| **TWN core multilateral** | Zero, with `fallback_flag = 1` and the note "DAC1 total equals bilateral and no multilateral row is published". | **Accepted for this release as a documented fallback, not as evidence that the true value is zero.** Footnote Taiwan wherever the multilateral split is shown. |
| ARE-UKR, ROU-UKR | `complete_observed_humanitarian_subline` = 0 for 2025 only. | Unverified, lower risk: 2025 only and sub-line scope. |
| AUS-UKR, HUN-UKR | Same construction. | **Already reviewed** on 2 August 2026 and confirmed as deliberate explicit zeros. |

The pattern to watch is `complete_*` treatments built on observed data: they bind as
exact totals, so a blank source cell becomes an assertion that nothing was spent. An
absent value should be non-executable, not binding.

## The analysis fork is not a publication pipeline

`build/build_sweep_scenarios.py` retains all four toggles and stays, because it answers
the sensitivity questions above and would be tedious to recreate.

**Hard rule: fork outputs never enter `web/data`.** They produce numbers for the paper.
This needs a build-time check, not a note in a document: the review demonstrated how
readily documentation and reality diverge here.

The fork must be re-verified against the release default whenever the release changes.
`--verify-default` does this and currently passes with zero cell movement across all ten
scenarios.

## Hosting

GitHub Pages from a separate deployment repository, embedded in the CGD page by iframe.
Free for public repositories. Assets are pre-compressed `.bin.gz`.

Pages' limits are soft and there is no paid tier behind them: about 1 GB of site content
and 100 GB of bandwidth a month. At roughly 1 MB a view that is comfortable. The whole
payload is about 7 MB, so nothing needs lazy fetching for size reasons, though the
per-scenario arrays are naturally fetched on selection.

## Review findings that remain open

Withdrawing the toggles closes F01, F02 and F16. F04, F05, F07, F09, F10, F11, F15 and
F17 were implemented on 19 August 2026; section 13 of `AUDIT_TRAIL.md` records what each
change was and what was measured. Still outstanding:

| Finding | Substance |
| --- | --- |
| F08 | The front end does not exist. Fail-closed asset loading, corrupt and stale asset handling, missing-denominator behaviour and accessibility testing are all outstanding |

### Closed on 27 August 2026

| Finding | How it was closed |
| --- | --- |
| F18 | The paper, full methodology, plain-language companion, model-input specification and visualisation brief were updated to the EU-integrated release and current data contract. |
| F19 | `apply_us_observed_composition` now walks parent directories to the project root rather than assuming the release script is exactly one directory below it. A nested-path helper test passes. |


### Closed on 19 August 2026

| Finding | How it was closed |
| --- | --- |
| F09 | A deterministic content root over schema, model build, axis hashes, all 225 blob hashes, the release input and script hashes, the emitter hash and the environment; an identical rebuild reproduces it. `requirements_static_scenarios.txt` completed with the two missing pins, `openpyxl` and `osqp` |
| F04 | A `solve_certification` column replaces the blanket `optimal`. 1,650 solves certified by OSQP, 130 exact by the box path, 150 not optimised at all, and **30 feasible after an L1 polish with optimality not certified** — 180 rows previously carried a claim the run did not support |
| F05 | Contradictory bounds are recorded and fail the build, with `--allow-contradictory-bounds` to reproduce the old widening for scanning. An exhaustive scan of the production configuration found **none** |
| F06 | `verify_payload.py` gates the ten configurations with 1,737 checks and no skips: axis hashes, per-blob hashes and byte counts, spot values at named coordinates, cross-grain totals, closure reconciliation, the guarded floor formula, pins against source, envelope balance, NaN semantics, 2024 support, EU metadata and map resolution |
| F07 | Promotion builds into a staging directory and self-checks every blob against the manifest before publishing. Because directory renames are unreliable under OneDrive, the guarantee is at the contract: the manifest is removed first and written last, so an interrupted promotion leaves a payload with no manifest and a consumer must refuse it. `test_promotion.py` proves this by interrupting a promotion |
| F10 | Presolve reduction 3 now compares coefficient vectors as well as index support. The defect was real and is demonstrated — `test_solver_properties.py` fails this check against published v2.2.5 — but an exhaustive scan found **no** occurrence in the production configuration |
| F11 | `test_solver_properties.py` is self-contained and gating: 17 checks over the three presolve reductions, closure separation, the analytic interior optimum, envelope balance with a bound active, and F05. It fails on v2.2.5 and passes on the candidate. The three pickle-dependent investigation scripts are records, not gates |
| F15 | The allocation universe now contains all 50 CRS reporters, including EU Institutions, so the former all-reporter/model-universe comparison has disappeared. The common universe is 58.05% country specified, 33.63% wholly unspecified and 8.32% regional in 2024 gross bilateral CRS disbursements. Including the EU raises the country-specified share relative to the former 49-provider model, so the earlier claim that exclusion strengthened the data-quality conclusion no longer applies. |
| F17 | The manifest states schema version, byte order, element order, compression, axis hashes, per-blob dtype, shape, byte counts and SHA-256, units, NaN semantics, the gross >= GE tolerance, and the rule that a consumer must verify every axis hash before indexing and refuse to render on mismatch |

**All of these are live in the current release.** `static-v2.2.9-swe-exit-scope` was
promoted on 27 August 2026 and emitted as
`web/data/static-v2.2.9-swe-exit-scope`. It contains 50 allocation providers, 141
recipients, 21 sectors, four projection years, ten scenarios and 225 blobs. Its content
root is `5700320b00bb69f4`; `verify_payload.py` passes 1,737 checks. The adjacent v2.2.7
directory is retained only as the previous release. `BUILD_ACTION_LOG.md` in
`Model output CSVs (static)` carries the release record.

**F05 and F10 change no published figure.** Both were fixed as safety nets against a
future constraint set, not as corrections. `compare_candidate_to_published.py` over all ten
scenarios: zero unmatched keys, zero cells moved beyond 1e-6, zero closure flips, identical
path mix, identical objectives on all 1,960 pre-EU solves and an identical 11,977 outer iterations. The EU-integrated release is separately verified over 2,000 solves.

F03, F12, F13 and F14 are closed, the last three in both code and narrative. F03's
outcome reversed: at the declared 1e-6 comparison tolerance, 30 solves improve, none
worsen materially and 1,930 are unchanged, with the largest positive difference 2.28e-07,
below tolerance. Evidence is retained in
`qa/f03_objective_comparison_v223_vs_v225.csv`.

**F01 is repaired, not merely withdrawn.** `shift_ledger_channel_share` in the analysis
fork operates on the realised ledger: O is held in 196 of 196 donor-years, total ODA is
fixed, and realised movement equals the certified feasible movement to 1.25e-16. So the
system-wide channel-mix sensitivity can be reported from the fork without reintroducing
the original semantic defect.

**The ISR-UKR zero and Taiwan core-multilateral zero are re-accepted for this release**
rather than treated as release gates. They remain recorded in the verification queue so
the acceptance is explicit and traceable.

## What was retired, and where it went

Scripts, the configuration manifest, the QA matrix and all 504 `meta.json` files are in
`../Audit backups/retired_toggle_machinery_20260819/` (about 7 MB, retained in the
project). The 504-configuration payload itself, 125 MB, was moved to
`C:/oda-build/retired_payload_20260819` -- off OneDrive rather than deleted, because it is
not byte-reproducible (the fork has changed since it was built) and the independent
review cites it as evidence.
