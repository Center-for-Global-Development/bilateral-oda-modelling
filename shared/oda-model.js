/* =============================================================================
   ODA domain model — the semantics every figure must share.

   Covers ACCEPTANCE_CRITERIA.md Part 0.2 (missing denominators) and the parts of
   0.3 that are data rather than UI: the 2024 year convention, measure selection,
   and number formatting.

   Requires shared/oda-payload.js. Exposes window.ODAModel.
   ========================================================================== */
(() => {
  'use strict';

  /* --- the 2024 convention --------------------------------------------------
     manifest.axes.year holds projection years only (2025-2028). Observed 2024 is
     served by static/baseline_* and cube/baseline__*. Every figure that plots
     "2024-2028" therefore has to special-case 2024, so it is done once here. */

  const BASELINE_YEAR = 2024;

  /** Full display year range for a figure: 2024 plus the projection axis. */
  function displayYears(payload) {
    return [BASELINE_YEAR, ...payload.axes.year];
  }

  function isBaselineYear(year) {
    return Number(year) === BASELINE_YEAR;
  }

  /**
   * Resolve which blob answers a (grain, scenario, measure, year) request, so a
   * caller never has to remember that 2024 lives somewhere else.
   *
   * grain: 'donor' | 'recipient' | 'sector' | 'donor_recipient' | 'recipient_sector'
   * returns { name, coords } where coords omits `year` for baseline reads.
   */
  function seriesBlob(grain, { scenario, measure = 'gross', year }) {
    if (isBaselineYear(year)) {
      return { name: `static/baseline_${measure}__${grain}`, baseline: true };
    }
    return { name: `scenarios/${scenario}/${grain}_year__${measure}`, baseline: false };
  }

  /** Every blob a figure needs to cover 2024-2028 at one grain, for preloading. */
  function seriesBlobNames(grain, { scenario, measure = 'gross' }) {
    return [
      `static/baseline_${measure}__${grain}`,
      `scenarios/${scenario}/${grain}_year__${measure}`
    ];
  }

  /**
   * Read one value at a grain, transparently handling 2024.
   * coords uses axis values, e.g. {recipient:'KEN'} or {donor:'GBR', recipient:'KEN'}.
   */
  function valueAt(payload, grain, { scenario, measure = 'gross', year }, coords) {
    const { name, baseline } = seriesBlob(grain, { scenario, measure, year });
    return payload.at(name, baseline ? coords : { ...coords, year: Number(year) });
  }

  /**
   * Read a filtered slice of the sparse donor-recipient-sector cube. The support
   * hash is verified before any value is paired with an index. Figures should
   * use aggregate blobs unless donor AND sector detail is genuinely required.
   */
  async function cubeCells(payload, {
    scenario, measure = 'gross', year, donor = null, recipient = null, sector = null
  }) {
    const baseline = isBaselineYear(year);
    const which = baseline ? 'cube2024' : 'cube';
    const prefix = baseline ? 'cube/support2024__' : 'cube/support__';
    const valueName = baseline ? `cube/baseline__${measure}` : `cube/${scenario}__${measure}`;
    const supportAxes = baseline ? ['donor', 'recipient', 'sector']
                                 : ['donor', 'recipient', 'sector', 'year'];
    await payload.verifySupport(which);
    await payload.blobs([...supportAxes.map(axis => `${prefix}${axis}_index`), valueName]);

    const arrays = Object.fromEntries(supportAxes.map(axis =>
      [axis, payload._blobs.get(`${prefix}${axis}_index`)]));
    const values = payload._blobs.get(valueName);
    const wanted = {
      donor: donor == null ? null : payload.indexOf('donor', donor),
      recipient: recipient == null ? null : payload.indexOf('recipient', recipient),
      sector: sector == null ? null : payload.indexOf('sector', sector),
      year: baseline || year == null ? null : payload.indexOf('year', year)
    };
    const rows = [];
    for (let i = 0; i < values.length; i += 1) {
      if (supportAxes.some(axis => wanted[axis] != null && arrays[axis][i] !== wanted[axis])) continue;
      const value = values[i];
      if (!Number.isFinite(value) || value === 0) continue;
      rows.push({
        donor: payload.axes.donor[arrays.donor[i]],
        recipient: payload.axes.recipient[arrays.recipient[i]],
        sector: payload.axes.sector[arrays.sector[i]],
        year: baseline ? BASELINE_YEAR : payload.axes.year[arrays.year[i]],
        value
      });
    }
    return rows;
  }

  /* --- missing denominators (Part 0.2) --------------------------------------
     Null GNI / government revenue / population / need mass must render as
     unavailable: never substituted, never silently zero, never dropped without a
     count. A single Denominator shape makes that hard to get wrong. */

  const DENOMINATORS = {
    gni: { field: 'gni_usd', label: 'GNI' },
    revenue: { field: 'gov_revenue_usd', label: 'government revenue' },
    population: { field: 'population', label: 'population' }
  };

  /**
   * @returns {{available: boolean, value: number|null, label: string}}
   */
  function denominator(payload, iso, kind) {
    const spec = DENOMINATORS[kind];
    if (!spec) throw new Error(`Unknown denominator "${kind}".`);
    const raw = payload.recipientMeta[iso]?.[spec.field];
    const ok = raw != null && Number.isFinite(Number(raw)) && Number(raw) > 0;
    return { available: ok, value: ok ? Number(raw) : null, label: spec.label };
  }

  /** Need masses live in tool/need_*, where NaN means unavailable (never zero). */
  const NEEDS = { poverty: 'tool/need_poverty', humanitarian: 'tool/need_humanitarian',
                  fiscal: 'tool/need_fiscal' };

  function needMass(payload, iso, kind) {
    const name = NEEDS[kind];
    if (!name) throw new Error(`Unknown need mass "${kind}".`);
    const value = payload.at(name, { recipient: iso });
    const ok = Number.isFinite(value);
    return { available: ok, value: ok ? value : null, label: kind };
  }

  /* --- missing need mass ----------------------------------------------------
     The methodology's "Recipients with missing fiscal data" section already
     rules on this, and the rule turns on LDC status:

       * A least developed country with no computable composite is placed among
         the more fiscally vulnerable LDCs — the 80th percentile of observed LDC
         composites, or the median of that worst-off quintile where the INFORM
         risk percentile is at or above 0.90. Treating it as a low score would be
         substantively wrong, because a data gap is not evidence of fiscal
         strength.
       * A recipient that is NOT a least developed country and has no computable
         composite is NOT imputed high vulnerability. It "receives no special
         Scenario 5 priority by default and is flagged for review, consistent
         with the treatment of missing humanitarian scores in Scenario 6A".

     In the current release every recipient missing a humanitarian or fiscal need
     mass is a non-LDC — Montserrat, Niue, Saint Helena, Tokelau, Wallis and
     Futuna and Kosovo — so the second branch is the live one. Those recipients
     stay in the donor's portfolio and stay fundable; the objective simply does
     not push money toward them. They are named on the face of the figure,
     because an unprotected recipient and a recipient that needs no protection
     look identical otherwise.

     The LDC branch needs the observed composite distribution and INFORM
     percentiles, which the browser payload does not carry, so it cannot be
     reproduced here faithfully. It is therefore reported as unavailable rather
     than approximated. No recipient currently takes that branch. */

  const NEED_STATUS = { OBSERVED: 'observed', NO_PRIORITY: 'no_priority',
                        NEEDS_IMPUTATION: 'needs_imputation' };

  function isLDC(payload, iso) {
    return Number(payload.recipientMeta[iso]?.ldc) === 1;
  }

  /**
   * @returns {{status: string, value: number|null, ldc: boolean}}
   *   `no_priority`      — score contribution is zero, per the methodology.
   *   `needs_imputation` — an LDC whose imputation cannot be made in the browser.
   */
  function needStatus(payload, iso, kind) {
    const { available, value } = needMass(payload, iso, kind);
    if (available) return { status: NEED_STATUS.OBSERVED, value, ldc: isLDC(payload, iso) };
    const ldc = isLDC(payload, iso);
    return {
      status: ldc ? NEED_STATUS.NEEDS_IMPUTATION : NEED_STATUS.NO_PRIORITY,
      value: null, ldc
    };
  }

  /**
   * Partition a recipient list by whether a denominator is available.
   * Returns the shown set plus the excluded ISO codes, so a figure can render
   * `n shown` and name the affected recipients in its notes rather than dropping
   * them silently.
   */
  function partitionByDenominator(payload, isoList, kind) {
    const shown = [], missing = [];
    for (const iso of isoList) {
      (denominator(payload, iso, kind).available ? shown : missing).push(iso);
    }
    return { shown, missing, total: isoList.length };
  }

  /** "128 of 141 recipients shown" — the standard phrasing for the notes line. */
  function nShownText(partition, noun = 'recipients') {
    return `${partition.shown.length} of ${partition.total} ${noun} shown`;
  }

  /**
   * The standard notes line naming the recipients a denominator is missing for.
   * The general rules require GNI gaps to be named wherever GNI drives results.
   * Empty string when nothing is missing.
   */
  /* Reports the COUNT, not the roster. This used to end with a comma-separated
     list of every affected recipient — thirteen names in one sentence for GNI —
     which is a debugging aid printed on the face of a published figure. The
     count is what tells a reader how much of the picture is missing; a reader
     who needs to know which ones can select them. */
  function denominatorNote(payload, kind, isoList = payload.axes.recipient) {
    const { missing, label } = { ...partitionByDenominator(payload, isoList, kind),
                                 label: DENOMINATORS[kind].label };
    if (!missing.length) return '';
    const n = missing.length;
    return `${n} recipient${n === 1 ? ' has' : 's have'} no ${label} figure in the model ` +
      `inputs and ${n === 1 ? 'is' : 'are'} not shown.`;
  }

  /* --- income group ---------------------------------------------------------
     recipient_meta carries the literal string "nan" for four recipients, because
     the emitter writes a pandas NaN through JSON. Every figure that reads
     income_group must normalise it, or "nan" appears in a tooltip or a legend
     and the recipient is coloured off the pinned ramp. Done once here so no
     figure can forget. */

  const INCOME_GROUPS = ['Low income', 'Lower middle income',
                         'Upper middle income', 'High income', 'Not classified'];
  const NOT_CLASSIFIED = 'Not classified';

  function incomeGroup(payload, iso) {
    const raw = payload.recipientMeta[iso]?.income_group;
    if (raw == null) return NOT_CLASSIFIED;
    const text = String(raw).trim();
    if (!text || text === 'nan' || text === 'NaN' || text === 'None') return NOT_CLASSIFIED;
    return INCOME_GROUPS.includes(text) ? text : NOT_CLASSIFIED;
  }

  /**
   * Recipients with no World Bank income group, as display names.
   * The general rules require these to be named in the notes wherever income
   * group is a control that changes what the chart shows.
   */
  function recipientsWithoutIncomeGroup(payload, isoList = payload.axes.recipient) {
    return isoList.filter(iso => incomeGroup(payload, iso) === NOT_CLASSIFIED)
                  .map(iso => payload.recipientName(iso)).sort();
  }

  /** The standard notes line, as a count rather than a roster (see denominatorNote). */
  function incomeGroupNote(payload, isoList) {
    const n = recipientsWithoutIncomeGroup(payload, isoList).length;
    if (!n) return '';
    return `${n} recipient${n === 1 ? ' has' : 's have'} no World Bank income group and ` +
      `${n === 1 ? 'is' : 'are'} shown as not classified.`;
  }

  /* --- DAC membership -------------------------------------------------------
     The EU is a full member of the OECD Development Assistance Committee, and
     has been since the DAC was founded. `donor_meta` in the payload records
     EU Institutions as `dac_member: 0` with `eu_institution: 1`, which put the
     largest non-sovereign provider in the model under "Non-DAC providers" on
     F1 and called it a "Non-DAC provider" in F2's tooltip. Both were wrong.

     Corrected here rather than in the payload: the payload is emitted upstream
     and every blob is hash-verified in the browser, so the figure layer cannot
     edit it. `eu_institution` is the flag that identifies the case, so the
     correction is expressed in terms of that rather than hard-coding a donor
     code. The upstream `dac_member` field should be fixed in the emitter; until
     it is, every figure must read membership through here and none may read
     `donor_meta.dac_member` directly. */

  function isDacMember(payload, code) {
    const meta = payload.donorMeta[code];
    if (!meta) return false;
    return Number(meta.dac_member) === 1 || Number(meta.eu_institution) === 1;
  }

  /** "DAC member" / "Non-DAC provider", so the two figures cannot word it differently. */
  function dacLabel(payload, code) {
    return isDacMember(payload, code) ? 'DAC member' : 'Non-DAC provider';
  }

  /* --- sector order ---------------------------------------------------------
     The sector axis is in CRS code order, which groups sectors by DAC family
     (social, then economic, then production, and so on). That order is
     meaningful to someone who knows the CRS and arbitrary to everyone else: a
     reader looking for "Humanitarian aid" in a 21-item dropdown has no way to
     guess it sits last. Every sector list a reader picks from is therefore
     ordered by name.

     Sector COLOURS are pinned in set-config.js by code, so reordering the list
     does not repaint anything. */

  /* Three CRS sector names are long enough to set the width of any control they
     appear in: "Population policies/programmes and reproductive health" is 54
     characters, which is wider than the whole control bank's share for one
     dropdown. Shortened here rather than in each figure -- F13 carried its own
     copy of these three replacements -- so a reader meets the same shortening
     wherever it is used, and the full name stays available from sectorName(). */
  const SECTOR_SHORT = {
    'Population policies/programmes and reproductive health': 'Population & reproductive health',
    'Government and civil society': 'Government & civil society',
    'General environment protection': 'Environmental protection',
    'Other social infrastructure and services': 'Other social infrastructure',
    'Industry, mining and construction': 'Industry & construction',
    'Agriculture, forestry and fishing': 'Agriculture & fishing',
    'Trade policies and regulations': 'Trade policy & regulation',
    'Development food assistance': 'Food assistance',
    'Other commodity assistance': 'Other commodity aid',
    'Water supply and sanitation': 'Water & sanitation'
  };

  function sectorShortName(payload, code) {
    const full = payload.sectorName(code);
    return SECTOR_SHORT[full] || full;
  }

  function sectorsAlphabetical(payload, codes = payload.axes.sector) {
    return codes.slice().sort((a, b) =>
      payload.sectorName(a).localeCompare(payload.sectorName(b), 'en'));
  }

  /* --- formatting -----------------------------------------------------------
     One formatter set, so chart, tooltip, table and download agree (skill §C-12).
     Model values are US$ millions, constant 2024 prices. */

  const nf = {
    usdMillions: new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }),
    usdMillions2: new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }),
    usdBillions1: new Intl.NumberFormat('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 2 }),
    integer: new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }),
    percent0: new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }),
    percent1: new Intl.NumberFormat('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  };

  const MISSING_TEXT = 'not available';

  /* --- trailing zeros -------------------------------------------------------
     A fixed number of decimal places is right for a set of values and wrong for
     any one of them that happens to be round: an axis reading "23.5%, 24.0%,
     24.5%" spends a character telling the reader that 24 is 24. Strip zeros that
     carry no information, and the decimal point with them if nothing is left.
     Significant zeros are untouched: 0.01% keeps both, 0.10% loses only the
     second. Applied inside usd() and percent(), and exported for the figures
     whose axes format through d3 rather than through these. */
  function trimZeros(text) {
    return String(text)
      .replace(/(\.\d*?)0+(?=\D|$)/g, '$1')
      .replace(/\.(?=\D|$)/g, '');
  }

  /* --- precision -------------------------------------------------------------
     Whole millions were hiding real flows. A US$0.3m recipient-sector flow — an
     ordinary size for a small sector in a small country — formatted as "US$0m",
     so F3's flow tooltips read "US$0" for every line into Angola's
     communications sector and the reader could not tell a small flow from no
     flow at all. That is the missing-data-rendered-as-zero defect wearing a
     rounding costume.

     So: one more decimal place everywhere, and a real value NEVER formats as
     zero. Sub-0.005m values, where even two places round away, get an explicit
     "<US$0.01m" rather than a figure that reads as nothing. trimZeros then takes
     the uninformative places back off, so a round total stays "US$15bn" rather
     than becoming "US$15.00bn". */

  /** US$ millions in, display string out. Null/NaN becomes "not available". */
  function usd(valueMillions, { unit = 'auto' } = {}) {
    if (valueMillions == null || !Number.isFinite(valueMillions)) return MISSING_TEXT;
    const abs = Math.abs(valueMillions);
    const useBn = unit === 'bn' || (unit === 'auto' && abs >= 1000);
    if (useBn) return `US$${trimZeros(nf.usdBillions1.format(valueMillions / 1000))}bn`;
    if (abs === 0) return 'US$0m';
    /* Below a million, one decimal place is not enough to keep a real flow
       visible, so spend a second one — and only there. */
    if (abs < 1) {
      if (abs < 0.005) return `${valueMillions < 0 ? '>-' : '<'}US$0.01m`;
      return `US$${trimZeros(nf.usdMillions2.format(valueMillions))}m`;
    }
    return `US$${trimZeros(nf.usdMillions.format(valueMillions))}m`;
  }

  /** Proportions are stored as fractions; only display multiplies by 100. */
  const percentFormatters = new Map();
  function percentFormatter(decimals) {
    const places = Math.max(0, Math.min(6, Math.round(decimals)));
    if (!percentFormatters.has(places)) {
      percentFormatters.set(places, new Intl.NumberFormat('en-GB', {
        minimumFractionDigits: places, maximumFractionDigits: places
      }));
    }
    return percentFormatters.get(places);
  }

  /* Honours the decimals asked for. It previously had only a 0-place and a
     1-place formatter, so a caller asking for 2 silently got 1 — which is what
     the attributed-cuts tooltip and total column were doing. */
  /* The default is one decimal place, not zero. trimZeros means a round value is
     unaffected — "24%" stays "24%", and an axis of round ticks stays clean — so
     the extra place shows up only where it carries information. */
  function percent(fraction, { decimals = 1 } = {}) {
    if (fraction == null || !Number.isFinite(fraction)) return MISSING_TEXT;
    return `${trimZeros(percentFormatter(decimals).format(fraction * 100))}%`;
  }

  /**
   * "1 sector has", "3 sectors have" — count, noun and verb agreeing.
   * Built because two F16 caveats read "1 sector have no 2024 peer funding … and
   * are not plotted". Anywhere a count introduces a clause, the verb has to agree
   * with it, and doing that inline is where it gets forgotten.
   * @param {number} n
   * @param {string} noun      singular form; 's' is appended when n !== 1
   * @param {string} [verbs]   'has/have' — singular and plural, slash-separated
   */
  function countPhrase(n, noun, verbs) {
    const plural = n !== 1;
    const word = `${count(n)} ${noun}${plural ? 's' : ''}`;
    if (!verbs) return word;
    const [one, many] = String(verbs).split('/');
    return `${word} ${plural ? many : one}`;
  }

  function count(value) {
    if (value == null || !Number.isFinite(value)) return MISSING_TEXT;
    return nf.integer.format(value);
  }

  /* --- scenarios ------------------------------------------------------------
     Short labels plus the tooltip text the general rules require. Families exist
     because several figures colour by them; F15 deliberately does not. */

  /* Each rule carries three names, for three different jobs. `label` is the axis
     key ('S2A'). `name` is the full editorial name, used in dropdowns and
     tooltips. `short` is for a chart's own label column, where the full name
     does not fit: seven of the ten begin 'Prioritisation of' or 'Prioritisation
     by', so in F14's label column every row truncated to
     'S5 - Prioritisation of macroeconomic...' and the reader could tell the
     rules apart only by their codes. Dropping the shared prefix is what makes
     the distinguishing half of the name visible. */
  const SCENARIOS = {
    S1:  { label: 'S1',  short: 'Even proportional cuts', family: 'donor',     name: 'Even proportional allocations',
           tip: 'Donors distribute cuts or increases proportionately across all existing donor-recipient-sector cells.' },
    S2A: { label: 'S2A', short: 'Sectors by donor portfolio', family: 'donor',     name: 'Sector prioritisation by donor portfolio',
           tip: 'Donors protect sectors that make up a large share of their own bilateral portfolio.' },
    S2B: { label: 'S2B', short: 'Sectors by global contribution', family: 'donor',     name: 'Sector prioritisation by relative contribution',
           tip: 'Donors protect sectors for which they provide a large share of total modelled bilateral ODA globally.' },
    S3A: { label: 'S3A', short: 'Largest country programmes', family: 'donor',     name: 'Prioritisation of largest country programmes',
           tip: 'Donors protect countries that account for a large share of their own bilateral portfolio.' },
    S3B: { label: 'S3B', short: 'Most important country programmes', family: 'donor',     name: 'Prioritisation by importance of country programmes',
           tip: 'Donors protect recipients to which they provide a large share of total modelled bilateral ODA.' },
    S4:  { label: 'S4',  short: 'Comparative advantage', family: 'donor',     name: 'Prioritisation of comparative advantage',
           tip: 'Donors protect recipient-sector pairs to which they contribute a large share of support.' },
    S5:  { label: 'S5',  short: 'Macroeconomic vulnerability', family: 'recipient', name: 'Prioritisation of macroeconomically vulnerable recipients',
           tip: 'Donors protect recipients least able to replace lost aid from domestic resources.' },
    S6A: { label: 'S6A', short: 'High humanitarian risk', family: 'recipient', name: 'Prioritisation of high humanitarian-risk recipients',
           tip: 'Donors protect recipients facing high humanitarian risk, measured by the INFORM Risk Index.' },
    S6B: { label: 'S6B', short: 'Humanitarian sector spend', family: 'recipient', name: 'Prioritisation of humanitarian sector spend',
           tip: 'Donors protect humanitarian and emergency-response spending wherever it occurs.' },
    S7:  { label: 'S7',  short: 'Under-covered poverty', family: 'recipient', name: 'Prioritisation of under-covered poverty',
           tip: 'Donors protect recipients whose share of the world’s extreme poor exceeds the share of projected bilateral ODA they receive.' }
  };

  function scenarioInfo(id) {
    return SCENARIOS[id] || { label: id, short: id, family: 'donor', name: id, tip: '' };
  }

  /** The scenario keys in published order: S1, S2A, S2B, S3A, S3B, S4, S5, S6A, S6B, S7. */
  const SCENARIO_ORDER = Object.keys(SCENARIOS);
  function scenarioRank(id) {
    const i = SCENARIO_ORDER.indexOf(id);
    return i < 0 ? SCENARIO_ORDER.length : i;
  }

  /* --- measure --------------------------------------------------------------
     The gross/GE toggle appears only where displayed figures are in US$. A view
     declares its unit; the control asks this. */

  function measureApplies(unit) { return unit === 'usd'; }

  const MEASURE_LABEL = { gross: 'Gross', ge: 'Grant-equivalent' };
  /* 'Grant-equivalent' is fourteen characters wider than the phone column it has
     to sit in, and clipping it to 'Grant-equivalen' tells the reader nothing. The
     short form is shown only where the long one does not fit; the accessible name
     always carries the long one. */
  const MEASURE_LABEL_SHORT = { gross: 'Gross', ge: 'GE' };

  window.ODAModel = {
    BASELINE_YEAR, displayYears, isBaselineYear, seriesBlob, seriesBlobNames, valueAt, cubeCells,
    DENOMINATORS, denominator, needMass, needStatus, NEED_STATUS, isLDC,
    partitionByDenominator, nShownText,
    denominatorNote,
    INCOME_GROUPS, NOT_CLASSIFIED, incomeGroup, recipientsWithoutIncomeGroup, incomeGroupNote,
    isDacMember, dacLabel, sectorsAlphabetical, sectorShortName,
    usd, percent, count, countPhrase, trimZeros, MISSING_TEXT,
    SCENARIOS, SCENARIO_ORDER, scenarioInfo, scenarioRank, measureApplies, MEASURE_LABEL, MEASURE_LABEL_SHORT
  };
})();
