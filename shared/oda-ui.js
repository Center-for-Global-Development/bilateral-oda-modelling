/* =============================================================================
   ODA shared UI — the controls and notes conventions from the visualisation
   brief's General rules, built once so a set of figures cannot drift.

   Covers ACCEPTANCE_CRITERIA.md Part 0.3 (controls and conventions) and 0.4
   (footnotes). All presentation comes from the CGD layer: this file emits the
   house markup (.controls / .control-group / .control-label / .plain-select /
   .segmented / .notes) and adds no styles of its own.

   Requires shared/dom.js, shared/chart-core.js and shared/oda-model.js.
   Exposes window.ODAUI.
   ========================================================================== */
(() => {
  'use strict';

  const { element } = window.CGDDom;
  const M = window.ODAModel;

  /* --- state ----------------------------------------------------------------
     One frozen state object per figure; every render derives from it. Wraps
     CGDCore.makeStore so figures share the reset-on-change discipline that stops
     stale selections (skill §C-4).

     `dependents` names the keys that reset when a key changes. Donor and
     recipient selection deliberately do NOT depend on `scenario`: the general
     rules require a selection to persist across a scenario change. */

  function createState(defaults, { dependents = {}, onChange } = {}) {
    /* Subscribers are how a control keeps itself consistent with the state it
       writes to. Without this a control updates state but does not reflect it
       until the figure happens to re-render — the stale-control half of the
       stale-state defect the house standard calls out. */
    const subscribers = new Set();
    const notify = next => {
      for (const fn of subscribers) fn(next);
      if (onChange) onChange(next);
    };
    /* CGDCore.makeStore calls its callback unconditionally, so it always gets one. */
    const store = window.CGDCore.makeStore(defaults, notify);

    return {
      get: store.get,
      set(patch) {
        const before = store.get();
        const reset = {};
        for (const key of Object.keys(patch)) {
          if (patch[key] === before[key]) continue;
          for (const dep of dependents[key] || []) reset[dep] = defaults[dep];
        }
        store.set({ ...reset, ...patch });
      },
      reset() { store.reset(); },
      /** Register a listener; returns an unsubscribe function. */
      subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); }
    };
  }

  /** Wire a control's own sync() to the state it writes to. */
  function selfSync(state, group) {
    if (typeof group.sync === 'function') state.subscribe(() => group.sync());
    return group;
  }

  /* --- controls -------------------------------------------------------------
     Native elements first, per the house standard. Each returns a .control-group
     for placement inside a .controls row, and exposes .sync() where the control
     has state to reflect. */

  function controlGroup(labelText, control, { id, extraClass } = {}) {
    if (id) control.id = id;
    const label = element('div', { className: 'control-label', text: labelText });
    if (id) label.setAttribute('for', id);
    const className = extraClass ? `control-group ${extraClass}` : 'control-group';
    return element('div', { className }, [label, control]);
  }

  /**
   * Scenario selector, carrying the scenario-specific tooltip the general rules
   * require. The description is both the option's `title` and a live hint below,
   * because `title` alone is unreachable by keyboard and invisible on touch.
   */
  function scenarioSelect(state, { id = 'scenarioSelect', label = 'Allocation rule' } = {}) {
    /* "S2A — Sector prioritisation by donor portfolio" is the longest option text
       in the set, so this control has its own tier rather than sharing the wide
       one and clipping. */
    const select = element('select', { className: 'plain-select oda-select-rule' });
    for (const scenario of Object.keys(M.SCENARIOS)) {
      const info = M.scenarioInfo(scenario);
      select.append(element('option', {
        text: `${info.label} — ${info.name}`,
        attributes: { value: scenario, title: info.tip }
      }));
    }
    select.value = state.get().scenario;

    /* No live hint line under the selector. The option text already carries
       "S2A — Sector prioritisation by donor portfolio", and the per-option title
       carries the longer description, which satisfies the general rules' scenario
       tooltip. A restated sentence below every scenario control cost a line of
       vertical space on every figure and told the reader nothing the option had
       not already said. */
    select.addEventListener('change', () => state.set({ scenario: select.value }));

    const group = controlGroup(label, select, { id });
    group.sync = () => { select.value = state.get().scenario; };
    return selfSync(state, group);
  }

  /**
   * Gross vs grant-equivalent toggle, shown only where the displayed figures are
   * in US$. `unitOf(state)` returns the current unit; the control hides itself
   * whenever it would be unusable rather than sitting there inert.
   */
  function measureToggle(state, unitOf, { id = 'measureToggle', label = 'Measure' } = {}) {
    const group = element('div', {
      className: 'segmented',
      attributes: { role: 'group', 'aria-label': 'ODA measure' }
    });
    const buttons = {};
    for (const value of ['gross', 'ge']) {
      /* Both labels are in the DOM and CSS shows whichever fits, so a resize needs
         no re-render and the accessible name never changes. */
      const button = element('button', {
        attributes: {
          type: 'button', 'aria-pressed': 'false', 'data-measure': value,
          'aria-label': M.MEASURE_LABEL[value]
        }
      }, [
        element('span', { className: 'oda-measure-long', text: M.MEASURE_LABEL[value] }),
        element('span', { className: 'oda-measure-short', text: M.MEASURE_LABEL_SHORT[value] })
      ]);
      button.addEventListener('click', () => state.set({ measure: value }));
      buttons[value] = button;
      group.append(button);
    }

    const wrapper = controlGroup(label, group, { id, extraClass: 'metric-control' });
    wrapper.sync = () => {
      const current = state.get();
      wrapper.hidden = !M.measureApplies(unitOf(current));
      for (const [value, button] of Object.entries(buttons)) {
        button.setAttribute('aria-pressed', String(value === current.measure));
      }
    };
    wrapper.sync();
    return selfSync(state, wrapper);
  }

  /**
   * Year control: a slider with prev/next buttons, both writing the same state
   * key. Years come from ODAModel.displayYears, so observed 2024 sits in front of
   * the projection axis without each figure re-deriving that.
   */
  function yearControl(state, years, { id = 'yearControl', label = 'Year' } = {}) {
    const output = element('output', { text: String(state.get().year) });

    const slider = element('input', {
      attributes: {
        type: 'range', min: '0', max: String(years.length - 1), step: '1',
        value: String(Math.max(0, years.indexOf(state.get().year))),
        'aria-label': `${label}, ${years[0]} to ${years[years.length - 1]}`
      }
    });

    const back = element('button', {
      text: '←',
      attributes: { type: 'button', 'aria-label': 'Previous year' }
    });
    const forward = element('button', {
      text: '→',
      attributes: { type: 'button', 'aria-label': 'Next year' }
    });

    const setIndex = i => {
      const bounded = Math.min(years.length - 1, Math.max(0, i));
      state.set({ year: years[bounded] });
      group.sync();
    };
    slider.addEventListener('input', () => setIndex(Number(slider.value)));
    back.addEventListener('click', () => setIndex(years.indexOf(state.get().year) - 1));
    forward.addEventListener('click', () => setIndex(years.indexOf(state.get().year) + 1));

    /* Two renderings of one state key. The stepper is the phone control, where a
       five-position slider is too fiddly at thumb width; the slider is the
       desktop control, where the arrows add nothing. oda-figure.css shows
       exactly one of them, so both stay in the DOM and in sync and a resize
       needs no re-render. */
    const stepper = element('div', { className: 'segmented oda-year-stepper' }, [back, forward]);
    const sliderWrap = element('div', { className: 'oda-year-slider' }, [slider]);
    const row = element('div', { className: 'limit-control oda-year' },
                        [stepper, output, sliderWrap]);
    const group = controlGroup(label, row, { id });

    group.sync = () => {
      const i = Math.max(0, years.indexOf(state.get().year));
      slider.value = String(i);
      output.textContent = String(years[i]);
      back.disabled = i === 0;
      forward.disabled = i === years.length - 1;
    };
    group.sync();
    return selfSync(state, group);
  }

  /**
   * Sort control. The general rules require a sort change to RE-SELECT the
   * displayed set rather than reorder the set chosen under the previous rule, so
   * applySort sorts the full population and only then truncates.
   */
  function applySort(rows, { compare, limit }) {
    const sorted = rows.slice().sort(compare);
    return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
  }

  function sortSelect(state, options, { id = 'sortSelect', label = 'Sort by' } = {}) {
    /* Sort labels are always sentences ("Highest fully specified share"), so this
       control takes the wide tier rather than each figure remembering to. */
    const select = element('select', { className: 'plain-select oda-select-wide' });
    for (const option of options) {
      select.append(element('option', { text: option.label, attributes: { value: option.value } }));
    }
    select.value = state.get().sort;
    select.addEventListener('change', () => state.set({ sort: select.value }));
    const group = controlGroup(label, select, { id });
    group.sync = () => { select.value = state.get().sort; };
    return selfSync(state, group);
  }

  /** Compact previous/next pager shared by ranked figures. */
  function pager(state, totalPagesOf, { key = 'page', id = 'pageControl', label = 'Page' } = {}) {
    const back = element('button', { text: '←', attributes: { type: 'button', 'aria-label': 'Previous page' } });
    const forward = element('button', { text: '→', attributes: { type: 'button', 'aria-label': 'Next page' } });
    const output = element('output');
    const controls = element('div', { className: 'limit-control' }, [
      element('div', { className: 'segmented' }, [back, forward]), output
    ]);
    const group = controlGroup(label, controls, { id });
    function pages() { return Math.max(1, Number(totalPagesOf(state.get())) || 1); }
    function move(delta) {
      const next = Math.max(0, Math.min(pages() - 1, state.get()[key] + delta));
      state.set({ [key]: next });
    }
    back.addEventListener('click', () => move(-1));
    forward.addEventListener('click', () => move(1));
    group.sync = () => {
      const total = pages(), page = Math.max(0, Math.min(total - 1, state.get()[key]));
      output.textContent = `${page + 1} of ${total}`;
      back.disabled = page === 0; forward.disabled = page === total - 1;
    };
    group.sync();
    return selfSync(state, group);
  }

  /* --- hover tip ------------------------------------------------------------
     A small immediate tooltip for controls and legend keys, as distinct from a
     figure's own data tooltip.

     `title` was doing this job and doing it badly: browsers delay it about a
     second, it never appears on touch at all, and it cannot be styled. A legend
     key whose description arrives a second after the pointer has moved on has
     not described anything. One shared element, created once, so seventeen
     figures cannot grow seventeen variants. */

  let tipNode = null;

  function tipElement() {
    if (!tipNode || !tipNode.isConnected) {
      tipNode = element('div', { className: 'oda-hovertip', attributes: { role: 'tooltip' } });
      tipNode.hidden = true;
      document.body.append(tipNode);
    }
    return tipNode;
  }

  function hideHoverTip() {
    if (tipNode) tipNode.hidden = true;
  }

  /**
   * Show `textOf()` beside `el` on hover, focus and tap.
   * @param {Element} el
   * @param {function|string} textOf
   */
  function hoverTip(el, textOf) {
    const read = () => (typeof textOf === 'function' ? textOf() : textOf);

    function show() {
      const text = read();
      if (!text) return;
      const tip = tipElement();
      tip.textContent = text;
      tip.hidden = false;
      /* Positioned in viewport coordinates against a fixed element, then
         clamped to the viewport so a key at the right-hand end of a legend does
         not push its description off-screen (skill §C-6). */
      const box = el.getBoundingClientRect();
      const width = tip.offsetWidth, height = tip.offsetHeight;
      const left = Math.min(window.innerWidth - width - 6, Math.max(6, box.left));
      const above = box.top - height - 6;
      tip.style.left = `${left}px`;
      tip.style.top = `${above >= 6 ? above : box.bottom + 6}px`;
    }

    el.addEventListener('pointerenter', show);
    el.addEventListener('focus', show);
    el.addEventListener('pointerleave', hideHoverTip);
    el.addEventListener('blur', hideHoverTip);
    return el;
  }

  /* --- filter legend --------------------------------------------------------
     A legend whose keys are also the filter. Four figures asked for the same
     thing (F4, F5, F9, F11) and F12 replaces a whole redundant dropdown with
     it, so it is built once here.

     The hidden set is carried in state as a '|'-joined string rather than an
     array or a Set. createState compares patch values with === to decide what
     to reset; a fresh array is never === the previous one, so an array would
     make every legend click look like a change to every dependent key and
     reset the reader's page and selection. */

  function hiddenSet(value) {
    return new Set(String(value || '').split('|').filter(Boolean));
  }

  function hiddenValue(set) {
    return [...set].sort().join('|');
  }

  /**
   * Render a clickable legend into `host`, rebuilt on each figure render.
   *
   * @param {object}   options
   * @param {Element}  options.host
   * @param {string[]} options.keys      keys present in the current view, in order
   * @param {object}   options.state
   * @param {string}  [options.stateKey] state key holding the hidden set
   * @param {function} options.colourOf  key -> colour
   * @param {function} [options.labelOf] key -> label (defaults to the key)
   * @param {function} [options.tipOf]   key -> hover description
   */
  function filterLegend({ host, keys, state, stateKey = 'hidden',
                          colourOf, labelOf = k => k, tipOf = null }) {
    host.replaceChildren();
    const hidden = hiddenSet(state.get()[stateKey]);
    const visibleCount = keys.filter(k => !hidden.has(String(k))).length;

    for (const rawKey of keys) {
      const key = String(rawKey);
      const off = hidden.has(key);
      /* The last visible key cannot be switched off. Allowing it would leave an
         empty chart, which reads as "no data for this selection" — a different
         and wrong claim (skill §C-3). */
      const isLastVisible = !off && visibleCount === 1;

      const swatch = element('span', { className: 'swatch' });
      swatch.style.background = colourOf(rawKey);
      const button = element('button', {
        className: off ? 'legend-item muted' : 'legend-item',
        attributes: {
          type: 'button',
          'aria-pressed': String(!off),
          'aria-label': `${labelOf(rawKey)}${off ? ', hidden' : ', shown'}`
        }
      }, [swatch, element('span', { text: String(labelOf(rawKey)) })]);

      if (isLastVisible) button.setAttribute('aria-disabled', 'true');

      button.addEventListener('click', () => {
        const next = hiddenSet(state.get()[stateKey]);
        if (next.has(key)) next.delete(key);
        else if (!isLastVisible) next.add(key);
        else return;
        state.set({ [stateKey]: hiddenValue(next) });
      });

      if (tipOf) {
        hoverTip(button, () => {
          const description = tipOf(rawKey);
          const action = off ? 'Hidden — select to show.' : 'Select to hide.';
          return description ? `${description} ${action}` : action;
        });
      }

      host.append(button);
    }
    return host;
  }

  /* --- notes (Part 0.4) -----------------------------------------------------
     Brief and succinct, and set as ONE paragraph opening with the shared source
     line -- the collapsible block this used to describe is gone; see `notes()`.
     Conditional statements that would otherwise make a figure look broken are
     passed as `visible` and keep their own paragraph on the face. */

  /** The one source line for the whole set; `notes()` puts it first. */
  const SOURCE = 'Source: CGD modelling.';

  const STANDARD_NOTES = {
    prices: 'All values are in constant 2024 US dollars.',
    unallocable: 'Some bilateral ODA cannot be allocated to a recipient country and is not shown.',
    imputedSectors: 'Sector shares are imputed from the donor’s 2024 sector mix.',
    peersFixed: 'Other donors are held at the selected allocation rule.',
    baselineYear: '2024 is observed, not modelled, so it is the same under every allocation rule.',
    /* Used by the figures whose measure is defined against 2024, or whose whole
       subject is variation between allocation rules. Both are degenerate at
       2024 — zero loss, or ten identical columns — so those figures offer the
       projection years only. */
    projectionYears: 'Years shown are 2025–2028, measured against observed 2024.'
  };

  /**
   * Notes as ONE running paragraph, plus the source.
   *
   * These used to be a stack of separate <p> lines behind a collapsed "Notes"
   * disclosure — up to seven of them per figure, several restating the model's
   * internals ("winsorised at the 95th percentile", "structurally zero in the
   * current CRS extract", "at most 12 groups are drawn individually"). A reader
   * of a CGD digital note is not debugging the emitter, and a seven-line
   * footnote block reads as a warning that the figure cannot be trusted.
   *
   * So each figure now carries the fewest sentences that stop it being
   * misread, set as a single block. `visible` stays its own paragraph because
   * those are live statements about the current view (which recipients could
   * not be drawn, and why) rather than standing footnotes; merging them into
   * the footnote block would bury a caveat that changes as the reader clicks.
   *
   * @param {object}   options
   * @param {string[]} options.visible live statements about the current view
   * @param {string[]} options.notes   standing notes, joined into one paragraph
   * @param {string}  [options.attribution] extra credit, appended last
   */
  function notes({ visible = [], notes: standing = [], attribution } = {}) {
    const root = element('div', { className: 'notes' });

    /* Sentences are joined with a space, so each entry must be a complete
       sentence ending in its own full stop — which is how they are all written. */
    const join = lines => lines.map(line => String(line).trim()).filter(Boolean).join(' ');

    const live = join(visible);
    if (live) root.append(element('p', { text: live }));

    /* SOURCE leads, and it is the same five words on every figure. Each figure
       used to end its notes with its own variant — "CGD modelling and poverty
       need inputs, static-v2.2.9-swe-exit-scope.", "CGD analysis of 2024 CRS
       disbursements, static-v2.2.9-swe-exit-scope." — so the release name and a
       different provenance phrase closed seventeen figures in five different
       ways. The release is recorded in the repository, not on the face of a
       published figure.

       `attribution` is for a credit that is not the source and cannot be
       dropped: F3's map geometry is the only case. */
    const body = join([SOURCE, ...standing, attribution].filter(Boolean));
    if (body) root.append(element('p', { text: body }));

    return root;
  }

  /* --- popups ---------------------------------------------------------------
     The general rules require a popup to close on an outside click; Escape and a
     focus return are added because the house accessibility floor needs them. */

  /* Open dismissables, innermost last. Only the innermost responds to an outside
     click or to Escape.

     Without the stack, dismissing a STACKED drill-down closed the whole stack.
     Each dialog listened for a pointerdown outside its own card, and the inner
     dialog's backdrop covers the outer card, so a click meant for "go back to
     the list" landed on the inner backdrop — which is outside BOTH cards. Both
     listeners fired, and the reader was returned to the chart having lost their
     place in a paged list they had navigated to. Only the top of the stack now
     acts, so one click closes one layer. */
  const dismissStack = [];

  function attachDismiss(popup, onClose, { returnFocusTo } = {}) {
    const entry = { popup };

    function isTop() { return dismissStack[dismissStack.length - 1] === entry; }
    function onPointerDown(event) {
      if (!isTop()) return;
      if (!popup.contains(event.target)) close();
    }
    function onKeyDown(event) {
      if (event.key !== 'Escape' || !isTop()) return;
      event.stopPropagation();
      close();
    }
    function close() {
      const at = dismissStack.indexOf(entry);
      if (at >= 0) dismissStack.splice(at, 1);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
      hideHoverTip();
      if (returnFocusTo && returnFocusTo.isConnected) returnFocusTo.focus();
      onClose();
    }

    dismissStack.push(entry);
    /* Deferred, so the click that opened the popup does not immediately close it. */
    requestAnimationFrame(() => {
      document.addEventListener('pointerdown', onPointerDown, true);
      document.addEventListener('keydown', onKeyDown, true);
    });
    return close;
  }

  /* --- modal ----------------------------------------------------------------
     One drill-down implementation for the whole set. Each figure used to carry
     its own copy; they had drifted in markup, in dismissal behaviour and in
     whether focus was managed at all.

     `aria-modal` is a promise to the reader that focus is inside the dialog and
     stays there, so this actually moves focus in, traps Tab, and returns focus
     to the trigger on close. */

  /**
   * Move focus into a dialog and keep Tab inside it until released.
   *
   * `aria-modal="true"` is a promise that focus is contained. A panel that sets
   * it without doing this tells a screen-reader user they are inside a dialog
   * while Tab walks them out into the page behind it.
   *
   * @returns {function} release, which stops trapping.
   */
  function trapFocus(container) {
    function focusables() {
      return [...container.querySelectorAll(
        'button, [href], select, input, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter(n => !n.disabled && n.offsetParent !== null);
    }
    function onKeyDown(event) {
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
    container.addEventListener('keydown', onKeyDown);
    container.focus();
    return () => container.removeEventListener('keydown', onKeyDown);
  }

  function modal(title, { host, returnFocusTo } = {}) {
    const parent = host || document.body;
    const close = element('button', {
      className: 'oda-modal-close', text: '×',
      attributes: { type: 'button', 'aria-label': 'Close' }
    });
    const heading = element('h2', { text: title });
    const card = element('section', {
      className: 'oda-modal-card',
      attributes: { role: 'dialog', 'aria-modal': 'true', tabindex: '-1' }
    }, [element('div', { className: 'oda-modal-top' }, [heading, close])]);
    const backdrop = element('div', { className: 'oda-modal-backdrop' }, [card]);

    /* The trigger is captured BEFORE the dialog is inserted: an SVG mark that
       was clicked never took focus, so document.activeElement at close time is
       usually <body> and focus would be dropped to the top of the page. */
    const trigger = returnFocusTo && returnFocusTo.isConnected ? returnFocusTo : null;

    /* Appended, not replaced, so a sub-drill-down STACKS on its parent. Closing
       the inner dialog returns the reader to the list they opened it from,
       rather than dismissing both and losing their place. */
    parent.append(backdrop);
    const releaseTrap = trapFocus(card);

    const dismiss = attachDismiss(card, () => {
      releaseTrap();
      backdrop.remove();
      if (trigger && trigger.isConnected) trigger.focus();
    });
    close.addEventListener('click', () => dismiss());

    return { card, close: dismiss, setTitle: text => { heading.textContent = text; } };
  }

  /* --- paged list -----------------------------------------------------------
     The ranked drill-downs all show ten rows with prev/next. Built once so the
     bounds, the disabled states and the "n of m" wording cannot diverge. */

  /**
   * The pagedList pager, for a drill-down that renders its own rows and keeps its
   * page in figure state. Same markup and styling as every other drill-down pager
   * in the set, so a popup does not carry a control bank of its own.
   */
  function pagerActions(state, totalPagesOf, { key = 'page', label = 'page' } = {}) {
    const back = element('button', { text: '\u2190', attributes: { type: 'button', 'aria-label': `Previous ${label}` } });
    const forward = element('button', { text: '\u2192', attributes: { type: 'button', 'aria-label': `Next ${label}` } });
    const output = element('output');
    const row = element('div', { className: 'oda-modal-actions oda-pager-actions' }, [back, output, forward]);
    const pages = () => Math.max(1, Number(totalPagesOf(state.get())) || 1);
    function move(delta) {
      const next = Math.max(0, Math.min(pages() - 1, (Number(state.get()[key]) || 0) + delta));
      state.set({ [key]: next });
      row.sync();
    }
    back.addEventListener('click', () => move(-1));
    forward.addEventListener('click', () => move(1));
    row.sync = () => {
      const page = Math.min(Number(state.get()[key]) || 0, pages() - 1);
      output.textContent = `${page + 1} of ${pages()}`;
      back.disabled = page <= 0;
      forward.disabled = page >= pages() - 1;
    };
    row.sync();
    return selfSync(state, row);
  }

  function pagedList(container, items, renderRow, { pageSize = 10, label = 'page' } = {}) {
    const body = element('div');
    const back = element('button', { text: '←', attributes: { type: 'button', 'aria-label': `Previous ${label}` } });
    const forward = element('button', { text: '→', attributes: { type: 'button', 'aria-label': `Next ${label}` } });
    const output = element('output');
    const actions = element('div', { className: 'oda-modal-actions' }, [back, output, forward]);
    let page = 0;

    function pages() { return Math.max(1, Math.ceil(items.length / pageSize)); }
    function draw() {
      page = Math.max(0, Math.min(pages() - 1, page));
      const rows = items.slice(page * pageSize, (page + 1) * pageSize).map(renderRow);
      /* The last page is padded to a full page of rows. A short final page made
         the dialog shrink as the reader paged into it and grow again on the way
         back, which moves the pager buttons out from under the cursor mid-click
         and, in the phone layout where the card is anchored to the top of the
         frame, resizes the iframe on every page turn. The spacers are inert:
         hidden from assistive technology and holding only a non-breaking space
         so they take exactly one row's height. */
      const shortfall = items.length > pageSize ? pageSize - rows.length : 0;
      for (let i = 0; i < shortfall; i += 1) {
        const spacer = element('div', {
          className: 'oda-rank-row oda-rank-spacer',
          attributes: { 'aria-hidden': 'true' }
        }, [element('span', { text: ' ' })]);
        rows.push(spacer);
      }
      body.replaceChildren(...rows);
      output.textContent = `${page + 1} of ${pages()}`;
      back.disabled = page === 0;
      forward.disabled = page >= pages() - 1;
    }
    back.addEventListener('click', () => { page -= 1; draw(); });
    forward.addEventListener('click', () => { page += 1; draw(); });

    container.append(body, actions);
    draw();
    return { draw, body };
  }

  /**
   * One ranked row: a label, a dot on a shared 0-100% track, and the cut.
   * `ratio` is the value as a share of 2024, so the track is comparable between
   * rows — it is never rescaled to a row's own range.
   */
  function rankRow(labelText, ratio, onClick, { lost = null, lostDomain = null } = {}) {
    const track = element('div', { className: 'oda-track' });
    const dot = element('i');
    const position = Math.max(0, Math.min(100, ratio * 100));

    /* Where `lost` is supplied the dot is SIZED by the US$ volume lost, so the
       row carries both facts a reader needs: how much of the 2024 total went
       (position on the track) and how much money that is (size). Two pairs can
       both have lost 90% while one is US$40m and the other US$0.03m, and the
       track position alone made those identical.

       The size is on a LOG scale, and the tooltip says so. Losses here span more
       than four orders of magnitude — the same range that puts F4's and F6's
       axes on logs — and area-proportional sizing over that range is useless in
       practice: with a US$500m maximum, a US$0.03m loss came out at 7.08px
       against a 7px floor, so a whole page of small pairs was a row of
       identical dots. On a log scale every page separates, and the exact figure
       is in the tooltip and in the row's own text, which is where a reader takes
       a value from anyway. */
    let size = 8;
    if (Number.isFinite(lost) && lost > 0 && lostDomain) {
      const [low, high] = lostDomain;
      if (high > 0 && low > 0 && high > low) {
        const t = (Math.log10(lost) - Math.log10(low)) / (Math.log10(high) - Math.log10(low));
        size = 7 + 11 * Math.max(0, Math.min(1, t));
      } else {
        size = 12;
      }
    }
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.top = `${9 - size / 2}px`;
    dot.style.left = `calc(${position}% - ${size / 2}px)`;

    if (Number.isFinite(lost)) {
      const text = `${M.usd(lost)} lost, ${M.percent(1 - ratio, { decimals: 1 })} of its 2024 total. `
        + 'Dot size shows the amount lost, on a log scale.';
      dot.setAttribute('aria-label', text);
      hoverTip(dot, text);
    }

    track.append(dot);
    const cut = element('small', { text: `${Math.round((1 - ratio) * 100)}% of 2024 lost` });
    /* The label is clamped to two lines (see .oda-rank-label in oda-figure.css)
       and carries its full text on hover. A pair name runs to things like
       "Democratic Republic of the Congo — Population policies/programmes and
       reproductive health", which wrapped to three or four lines and made the
       row — and so the whole dialog — a different height on every page. */
    const head = onClick
      ? element('button', { className: 'oda-rank-label', text: labelText, attributes: { type: 'button' } })
      : element('span', { className: 'oda-rank-label', text: labelText });
    head.setAttribute('title', labelText);
    hoverTip(head, labelText);
    if (onClick) head.addEventListener('click', onClick);
    return element('div', { className: 'oda-rank-row' }, [head, track, cut]);
  }

  /** The 0% / 100% scale caption that makes the shared track readable. */
  function trackAxis() {
    return element('div', { className: 'oda-track-axis' }, [
      element('span', { text: '0% of 2024 remains' }),
      element('span', { text: '100%' })
    ]);
  }

  /* --- orphan drill-down ----------------------------------------------------
     F10 and F15 are required to share this, so the drill-down behaves
     identically in both. F15 previously carried a reduced copy: an unpaginated
     list of plain text without the dot rows. */

  /**
   * @param {object}   options
   * @param {object}   options.payload
   * @param {Element}  options.host       element the modal is rendered into
   * @param {string}   options.title
   * @param {Array}    options.pairs      [{recipient, sector, ratio}], pre-sorted
   * @param {string}   options.scenario   for the donor sub-drill-down
   * @param {number}   options.year
   * @param {Element} [options.returnFocusTo]
   */
  /** [smallest positive loss, largest loss] — the log domain for dot sizing. */
  function lostRange(rows) {
    const positive = rows.map(row => row.lost).filter(v => Number.isFinite(v) && v > 0);
    if (!positive.length) return null;
    return [Math.min(...positive), Math.max(...positive)];
  }

  function orphanDrilldown({ payload, host, title, pairs, scenario, year, returnFocusTo }) {
    const P = window.ODAPayload;
    const dialog = modal(title, { host, returnFocusTo });
    dialog.card.append(element('p', {
      className: 'notes',
      text: 'Each dot sits at the share of the recipient-sector’s 2024 bilateral ODA still ' +
            `projected in ${year}; its size shows the amount lost, on a log scale. ` +
            'Select one to see which donors moved.'
    }), trackAxis());

    /* One domain across the whole list, so dot sizes are comparable between
       rows and between pages. Scaling each page to its own range would make the
       largest loss on every page look the same size. */
    const lostDomain = lostRange(pairs);

    const listHost = element('div');
    dialog.card.append(listHost);
    pagedList(listHost, pairs, pair => rankRow(
      `${payload.recipientName(pair.recipient)} — ${payload.sectorName(pair.sector)}`,
      pair.ratio,
      event => openDonors(pair, event.currentTarget),
      { lost: pair.lost, lostDomain }
    ));

    async function openDonors(pair, trigger) {
      const inner = modal(
        `${payload.recipientName(pair.recipient)} — ${payload.sectorName(pair.sector)}`,
        { host, returnFocusTo: trigger });
      const body = element('div', { text: 'Loading donor detail…' });
      inner.card.append(body);
      try {
        const [before, after] = await Promise.all([
          M.cubeCells(payload, { scenario, measure: 'gross', year: M.BASELINE_YEAR,
                                 recipient: pair.recipient, sector: pair.sector }),
          M.cubeCells(payload, { scenario, measure: 'gross', year,
                                 recipient: pair.recipient, sector: pair.sector })
        ]);
        const rows = new Map();
        for (const cell of before) rows.set(cell.donor, { donor: cell.donor, base: cell.value, now: 0 });
        for (const cell of after) {
          const row = rows.get(cell.donor) || { donor: cell.donor, base: 0, now: 0 };
          row.now = cell.value; rows.set(cell.donor, row);
        }
        const ranked = [...rows.values()]
          .filter(row => row.base > 0)
          .map(row => ({ ...row, ratio: row.now / row.base, lost: row.base - row.now }))
          .sort((a, b) => Math.abs(1 - b.ratio) - Math.abs(1 - a.ratio));
        const donorDomain = lostRange(ranked);

        body.replaceChildren();
        if (!ranked.length) {
          body.append(element('p', { className: 'notes',
            text: 'No donor funded this recipient-sector in 2024.' }));
          return;
        }
        /* No trackAxis here. The scale caption belongs to the first layer, where
           the reader meets the track for the first time; repeating "0% of 2024
           remains … 100%" inside the donor layer restates a scale they have
           already read and costs two lines at the top of a stacked dialog. */
        body.append(element('p', { className: 'notes',
          text: `Donors ranked by how far their support moved between 2024 and ${year}.` }));
        const rowsHost = element('div');
        body.append(rowsHost);
        pagedList(rowsHost, ranked, row => rankRow(payload.donorName(row.donor), row.ratio, null,
          { lost: row.lost, lostDomain: donorDomain }));
      } catch (error) {
        P.renderFailState(body, error);
      }
    }

    return dialog;
  }

  /**
   * Host row for a pager, placed under a figure's panel and above its notes.
   * Returns the row so the caller can append the pager group to it.
   */
  function pagerRow(afterElement) {
    const row = element('div', { className: 'oda-pager-row' });
    afterElement.insertAdjacentElement('afterend', row);
    return row;
  }

  window.ODAUI = {
    pagerActions,
    createState, selfSync, controlGroup, scenarioSelect, measureToggle, yearControl,
    sortSelect, applySort, pager, notes, SOURCE, STANDARD_NOTES, attachDismiss,
    hoverTip, hideHoverTip, filterLegend, hiddenSet,
    modal, trapFocus, pagerRow, pagedList, rankRow, trackAxis, orphanDrilldown
  };
})();
