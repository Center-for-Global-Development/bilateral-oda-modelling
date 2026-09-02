/* =============================================================================
   OPTIONAL — only for a SET of figures that must match each other.
   A single figure does not need this. Load it AFTER chart-core.js.

   It provides the consistency decisions that cgd-figure.css/chart-core.js cannot
   make for you because they depend on your specific entities and layout:

     1) a STABLE entity -> colour map, so an income group, sector or donor is the
        same colour in every figure of the set (the Our World in Data pattern);
     2) DISTINCTNESS within a single chart, which a stable map alone does not
        give you: see assignColours() below;
     3) an optional PINNED left margin / plot width, so figures stacked in one
        article share an axis position instead of each measuring its own gutter.

   Keep ONE copy at shared/ and edit the maps here once for the whole set. Do not
   fork per figure. Exposes window.CGDSet.
   ============================================================================= */
(() => {
  const C = window.CGDCore;
  if (!C) throw new Error('Load chart-core.js before set-config.js.');

  /* ---- 0. The residual colour ----
     Held OUT of every categorical ramp. "Other", "Other cutting donors" and
     "Not classified" are residual categories, not series: they must be visually
     recedent, and no real series may ever be given this colour, or the reader
     cannot tell a named donor from the remainder. */
  const RESIDUAL = '#DFE0E2';
  const RESIDUAL_KEYS = new Set(['Other', 'OTHER', 'Not classified',
                                 'Other cutting donors', 'Other donors']);

  /* ---- 1. The categorical ramp ----
     Ordered for adjacent contrast, all drawn from the CGD brand tokens in
     cgd-figure.css. RESIDUAL is deliberately absent. Used only as a FALLBACK for
     entities that are not pinned below. */
  const CATEGORICAL = ['#0B4C5B', '#FFB52C', '#2D99B5', '#00896C', '#D15553',
                       '#85A5AD', '#1A272A', '#C98F0A', '#6FBACB', '#006970',
                       '#394649', '#3FA98F', '#FEE8BF', '#8A5E00', '#BFDEE0'];

  /* ---- 2. Pinned entity -> colour ----
     Every entity that carries colour in more than one figure is pinned here, so
     it cannot drift between figures. Nothing here is RESIDUAL except the
     residual categories themselves. */
  const ENTITY_COLOUR = {
    /* World Bank regions (F13 region split). */
    'East Asia & Pacific':        '#2D99B5',
    'Europe & Central Asia':      '#0B4C5B',
    'Latin America & Caribbean':  '#FFB52C',
    'Middle East & North Africa': '#006970',
    'North America':              '#85A5AD',
    'South Asia':                 '#1A272A',
    'Sub-Saharan Africa':         '#00896C',

    /* Income groups: they carry colour in F4, F5, F9, F10, F11, F12 and F13, so
       they must not drift. DISTINCT HUES, not a sequential ramp: these are read
       as categories on scatters and stacked areas, and a poorest-darkest ramp of
       one hue left them nearly indistinguishable — four teals on F9's bubbles.
       Gold is given to low income because it is the most salient colour on the
       brand ramp and low income is the category the figures are about. High
       income is deliberately the muted teal-grey: those recipients are marginal
       here and should not shout. 'Not classified' takes the residual grey,
       because a missing income group is not a low value. */
    'Low income':                 '#FFB52C',
    'Lower middle income':        '#0B4C5B',
    'Upper middle income':        '#2D99B5',
    'High income':                '#85A5AD',
    'Not classified':             RESIDUAL,

    /* Residual categories. */
    'Other':                      RESIDUAL,
    'OTHER':                      RESIDUAL,
    'Other donors':               RESIDUAL,
    'Other cutting donors':       RESIDUAL,

    /* CRS sector codes (F4, F7, F10, F11, F13). Grouped by DAC family so the
       families read apart at a glance, with lightness steps inside each family.
       Keys are strings because the axis ships them as numbers and figures index
       them as strings; sectorColour() below normalises. */
    '110': '#0B4C5B',
    '120': '#006970',
    '130': '#2D99B5',
    '140': '#6FBACB',
    '150': '#85A5AD',
    '160': '#BFDEE0',

    '210': '#1A272A',
    '220': '#394649',
    '230': '#5C6E72',
    '240': '#8C9A9D',
    '250': '#C2CBCD',

    '310': '#00896C',
    '320': '#3FA98F',
    '331': '#7BC4B1',
    '332': '#B6DFD3',

    '410': '#8A5E00',
    '430': '#C98F0A',
    '510': '#FFB52C',
    '520': '#FFD27A',
    '530': '#FEE8BF',

    '700': '#D15553',

    /* Providers (F6, F8). Pinned in rough order of 2024 bilateral ODA and of how
       often they appear in a top-N, so the biggest cutters are furthest apart.
       None may equal RESIDUAL: F6 stacks named donors against "Other cutting
       donors" and the two must never be confusable. */
    'USA': '#0B4C5B', 'GBR': '#FFB52C', 'DEU': '#2D99B5', 'FRA': '#D15553',
    '4EU001': '#00896C', 'JPN': '#1A272A', 'CAN': '#85A5AD', 'NLD': '#C98F0A',
    'SWE': '#6FBACB', 'NOR': '#8A5E00', 'AUS': '#394649', 'ITA': '#3FA98F',
    'ESP': '#E08A8A', 'KOR': '#006970', 'CHE': '#BFDEE0', 'DNK': '#FEE8BF',
    'TUR': '#5C6E72', 'SAU': '#B6DFD3', 'ARE': '#7BC4B1', 'BEL': '#C2CBCD'
  };

  const _fallback = new Map();

  /** Stable colour for one entity, independent of what else is on the chart. */
  function colourFor(entity) {
    const key = String(entity);
    if (ENTITY_COLOUR[key]) return ENTITY_COLOUR[key];
    if (RESIDUAL_KEYS.has(key)) return RESIDUAL;
    if (!_fallback.has(key)) {
      _fallback.set(key, CATEGORICAL[_fallback.size % CATEGORICAL.length]);
    }
    return _fallback.get(key);
  }

  /**
   * Colour a SET of keys shown together, guaranteeing they are distinguishable.
   *
   * A stable entity->colour map alone does not do this: an unpinned entity can
   * collide with a pinned one, and two unpinned entities can collide with each
   * other. A chart where two stacked segments share a fill is unreadable, so
   * within-chart distinctness wins over cross-chart stability when they conflict.
   *
   * Pinned keys keep their pinned colour. Unpinned keys take the first ramp
   * colour not already used on this chart. Residual keys always take the grey.
   *
   * @param   {Iterable<string|number>} keys  in the order they should be ranked
   * @returns {Map<string,string>} key -> hex, keyed by String(key)
   */
  /* Perceptual distance, so "not the identical hex" is not mistaken for
     "tells apart". Weighted-RGB (the "redmean" approximation) is crude next to
     CIEDE2000 but needs no colour-space conversion and is more than good enough
     to reject two slate blue-greys sitting next to each other in a legend. */
  function rgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function distance(a, b) {
    const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b);
    const rm = (r1 + r2) / 2, dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
    return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
  }
  const MIN_DISTANCE = 80;
  function farEnough(colour, used) {
    for (const other of used) if (distance(colour, other) < MIN_DISTANCE) return false;
    return true;
  }

  function assignColours(keys, { residual = [] } = {}) {
    const list = [...keys].map(String);
    const extra = residual.map(String);
    const isResidual = k => RESIDUAL_KEYS.has(k) || extra.includes(k);
    const out = new Map(), used = new Set();
    /* The income groups are now distinct hues rather than a ramp, so the guard
       applies uniformly and no key set needs an exemption. */
    const acceptable = (colour, taken) => farEnough(colour, taken);

    /* A pinned colour is kept only if it is far enough from everything already
       taken. Two members of the same sector family (a teal and a deeper teal)
       are pinned for cross-figure stability, but if a chart happens to draw both
       at once the second gives up its pin and takes a ramp colour instead:
       within-chart legibility outranks cross-chart stability. */
    for (const key of list) {
      if (isResidual(key)) { out.set(key, RESIDUAL); continue; }
      const pinned = ENTITY_COLOUR[key];
      if (pinned && pinned !== RESIDUAL && !used.has(pinned) && acceptable(pinned, used)) {
        out.set(key, pinned); used.add(pinned);
      }
    }
    for (const key of list) {
      if (out.has(key)) continue;
      const free = CATEGORICAL.find(c => !used.has(c) && acceptable(c, used)) ||
                   CATEGORICAL.find(c => !used.has(c));
      /* More keys than the ramp has colours. Fall back to the ramp by position
         rather than dropping the key: the caller has asked for more categories
         than can be told apart, which is a chart-design problem, not a bug here.
         Figures in this set cap their categories below this. */
      const colour = free || CATEGORICAL[out.size % CATEGORICAL.length];
      out.set(key, colour); used.add(colour);
    }
    return out;
  }

  /** Sector codes arrive as numbers or strings depending on the grain. */
  function sectorColour(code) { return colourFor(String(code)); }

  /* ---- 3. Optional pinned geometry for aligned axes across figures ----
     Set PINNED.left to a fixed px value once you know the widest label across
     the WHOLE set (measure with CGDCore.widestLabel over the union of labels).
     Leave null to let each figure size its own gutter. When pinned, every
     figure should use getSharedMargin() instead of layout.margin directly. */
  const PINNED = { left: null }; // e.g. 96

  function getSharedMargin(width) {
    const m = { ...C.getLayout(width).margin };
    if (PINNED.left != null) m.left = PINNED.left;
    return m;
  }

  /* Helper: compute a good pinned left margin from the union of all labels in
     the set. Call once during set setup, log the number, then hard-code it into
     PINNED.left so it is deterministic and identical across figures. */
  function suggestPinnedLeft(allLabels, { fontSize = 12, pad = 14, min = 48, max = 160 } = {}) {
    const w = C.widestLabel(allLabels, { fontSize });
    return Math.round(Math.min(Math.max(w + pad, min), max));
  }

  window.CGDSet = { colourFor, assignColours, sectorColour, ENTITY_COLOUR,
                    CATEGORICAL, RESIDUAL, PINNED, getSharedMargin, suggestPinnedLeft };
})();
