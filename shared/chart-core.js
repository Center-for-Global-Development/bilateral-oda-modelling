/* =============================================================================
   CGD chart core — the CONSISTENCY ENGINE for a set of figures.

   Every figure calls the SAME getLayout(), the SAME formatters, the SAME width
   observer. That is why margins, tick counts, number formats and breakpoints are
   identical across a series instead of being re-invented per figure. Import this
   once per figure; do not fork getLayout or the formatters locally.

   Sources: references/08 §8.4/§8.5/§8.8.1, §8.13; references/11 §11.3; §8.6.
   Exposes window.CGDCore.
   ============================================================================= */
(() => {
  /* ---- Responsive layout modes (references/08 §8.5) — THE shared decision ----
     Pinned so a set is uniform. Margins are safe starting points; a figure may
     WIDEN a margin after measuring its own longest label (see measureText), but
     must not silently pick different tick targets or column counts. */
  function getLayout(width) {
    if (width < 400) {
      return { name: 'compact', margin: { top: 16, right: 12, bottom: 44, left: 48 },
               tickTarget: 4, labelMode: 'priority', controlColumns: 1 };
    }
    if (width < 700) {
      return { name: 'medium', margin: { top: 18, right: 16, bottom: 46, left: 56 },
               tickTarget: 5, labelMode: 'priority', controlColumns: 2 };
    }
    return { name: 'wide', margin: { top: 20, right: 24, bottom: 48, left: 64 },
             tickTarget: 7, labelMode: 'direct', controlColumns: 3 };
  }

  /* ---- Number formatting (references/11 §11.3) — one shared set ----
     Store numbers as numbers; store proportions as fractions; format at display. */
  const formatters = {
    integer: new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }),
    oneDecimal: new Intl.NumberFormat('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    compact: new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 }),
    percent: new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 1 })
  };
  function formatValue(value, kind = 'oneDecimal') {
    return Number.isFinite(value) ? formatters[kind].format(value) : 'N/A';
  }

  /* ---- Text measurement (fixes defect #1: label overlap after fonts load) ----
     Measure with the ACTUAL rendered font so margins fit real labels. Always
     call after document.fonts.ready. */
  let _ctx = null;
  function measureText(text, { fontSize = 12, fontWeight = 400 } = {}) {
    if (!_ctx) _ctx = document.createElement('canvas').getContext('2d');
    const family = getComputedStyle(document.body).fontFamily ||
      '"Sofia Pro", Inter, sans-serif';
    _ctx.font = `${fontWeight} ${fontSize}px ${family}`;
    return _ctx.measureText(String(text)).width;
  }
  /* Widest label in a list, in px — use to size a left axis/label gutter. */
  function widestLabel(labels, opts) {
    return labels.reduce((max, l) => Math.max(max, measureText(l, opts)), 0);
  }

  /* ---- Tick thinning (references/08 §8.8.1) ---- */
  function thinTicks(ticks, maximum = 4) {
    if (ticks.length <= maximum) return ticks;
    const indices = new Set([0, ticks.length - 1]);
    for (let i = 1; i < maximum - 1; i += 1) {
      indices.add(Math.round(i * (ticks.length - 1) / (maximum - 1)));
    }
    return ticks.filter((_, index) => indices.has(index));
  }

  /* ---- Fresh, accessible SVG sized to the container (references/08 §8.6) ---- */
  function createSvg(container, width, height, label) {
    container.replaceChildren();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', String(height));
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', label);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    container.append(svg);
    return svg;
  }

  /* ---- Width observer (references/08 §8.4) ---- One render per frame; capped at
     the visual viewport so an iOS iframe can't select a desktop layout. */
  function observeInlineSize(element, render) {
    let lastWidth = -1;
    let frame = 0;
    function visibleViewportWidth() {
      const values = [
        window.visualViewport?.width,
        document.documentElement.clientWidth,
        window.innerWidth
      ].filter(v => Number.isFinite(v) && v > 0);
      return values.length ? Math.min(...values) : Infinity;
    }
    function schedule(width) {
      const nextWidth = Math.floor(Math.min(width, visibleViewportWidth()));
      if (nextWidth <= 0 || nextWidth === lastWidth) return;
      lastWidth = nextWidth;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => render(nextWidth));
    }
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(entries => schedule(entries[0].contentRect.width));
      observer.observe(element);
      return () => { cancelAnimationFrame(frame); observer.disconnect(); };
    }
    function onResize() { schedule(element.getBoundingClientRect().width); }
    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    onResize();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }

  /* ---- iOS iframe compact-mode fallback (references/08 §8.4) ---- */
  function syncViewportMode() {
    const widths = [
      window.visualViewport?.width,
      document.documentElement.clientWidth,
      window.innerWidth
    ].filter(v => Number.isFinite(v) && v > 0);
    const width = Math.min(...widths);
    document.documentElement.classList.toggle('cgd-mobile-embed', width <= 600);
  }

  /* ---- Tiny state store (references/10 §10.1) ---- Render from state+width only. */
  function makeStore(defaults, onChange) {
    const DEFAULTS = Object.freeze({ ...defaults });
    let state = { ...DEFAULTS };
    return {
      get: () => state,
      set(patch) { state = { ...state, ...patch }; onChange(state); },
      reset() { state = { ...DEFAULTS }; onChange(state); }
    };
  }

  /* ---- In-page audits (references/08 §8.13) ---- Run these in the verify loop.
     window.CGDCore.audit.controls('.controls') and .svgText('.axis text, .row-label')
     Return objects that must be empty/zero at every phone width. */
  const audit = {
    controls(selector = '.controls') {
      const panel = document.querySelector(selector);
      if (!panel) return { error: 'no controls panel found' };
      const panelBox = panel.getBoundingClientRect();
      const groups = [...panel.children]
        .filter(n => getComputedStyle(n).display !== 'none')
        .map(n => ({ node: n, box: n.getBoundingClientRect() }));
      const outside = groups.filter(({ box }) =>
        box.left < panelBox.left - 1 || box.right > panelBox.right + 1 ||
        box.top < panelBox.top - 1 || box.bottom > panelBox.bottom + 1);
      const intersections = [];
      for (let i = 0; i < groups.length; i += 1) {
        for (let j = i + 1; j < groups.length; j += 1) {
          const a = groups[i].box, b = groups[j].box;
          if (a.left < b.right - 1 && a.right > b.left + 1 &&
              a.top < b.bottom - 1 && a.bottom > b.top + 1) intersections.push([i, j]);
        }
      }
      const clippedText = [...panel.querySelectorAll('button, label')]
        .filter(n => n.scrollWidth > n.clientWidth + 1 || n.scrollHeight > n.clientHeight + 1)
        .map(n => n.textContent.trim());
      return { outside: outside.length, intersections, clippedText };
    },
    svgText(selector = '.axis text, .row-label, .bar-label') {
      const nodes = [...document.querySelectorAll(selector)]
        .filter(n => n.ownerSVGElement && getComputedStyle(n).visibility !== 'hidden');
      const boxes = nodes.map(n => {
        const r = n.getBoundingClientRect();
        const s = n.ownerSVGElement.getBoundingClientRect();
        return { text: n.textContent.trim(), l: r.left, r: r.right, t: r.top, b: r.bottom,
                 sl: s.left, sr: s.right, st: s.top, sb: s.bottom };
      });
      const clipped = boxes.filter(x => x.l < x.sl - 1 || x.r > x.sr + 1 || x.t < x.st - 1 || x.b > x.sb + 1)
        .map(x => x.text);
      const overlaps = [];
      for (let i = 0; i < boxes.length; i += 1) {
        for (let j = i + 1; j < boxes.length; j += 1) {
          const a = boxes[i], b = boxes[j];
          if (a.l < b.r - 1 && a.r > b.l + 1 && a.t < b.b - 1 && a.b > b.t + 1) {
            overlaps.push([a.text, b.text]);
          }
        }
      }
      return { clipped, overlaps };
    },
    pageOverflow() {
      const root = document.documentElement;
      return root.scrollWidth - root.clientWidth;
    }
  };

  window.CGDCore = {
    getLayout, formatters, formatValue, measureText, widestLabel,
    thinTicks, createSvg, observeInlineSize, syncViewportMode, makeStore, audit
  };
})();
