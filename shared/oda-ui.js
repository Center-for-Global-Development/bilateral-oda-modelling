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

  /* --- notes (Part 0.4) -----------------------------------------------------
     Brief and succinct; collapsible when numerous, collapsed by default.
     Conditional statements that would otherwise make a figure look broken are
     passed as `visible` and stay on the face. */

  const STANDARD_NOTES = {
    prices: 'All values are in constant 2024 US dollars.',
    unallocable: 'A share of bilateral ODA cannot be allocated to a recipient country, ' +
      'and is not represented here.',
    imputedSectors: 'Sector shares are imputed from the donor’s observed 2024 sector mix.',
    peersFixed: 'Peer donors are projected under the selected allocation rule and then held fixed.',
    baselineYear: '2024 is observed rather than modelled, so it is identical under every ' +
      'allocation rule.',
    /* Used by the figures whose measure is defined against 2024, or whose whole
       subject is variation between allocation rules. Both are degenerate at
       2024 — zero loss, or ten identical columns — so those figures offer the
       projection years and say so, rather than showing an empty comparison. */
    projectionYears: 'The year control covers the projection years 2025–2028. 2024 is the ' +
      'observed baseline this figure measures against, and is identical under every ' +
      'allocation rule, so it is not a selectable year here.'
  };

  /**
   * @param {object}   options
   * @param {string[]} options.visible lines that stay on the face of the figure
   * @param {string[]} options.notes   lines inside the collapsible block
   * @param {string}  [options.source] source line, always last
   */
  function notes({ visible = [], notes: hidden = [], source } = {}) {
    const root = element('div', { className: 'notes' });

    for (const line of visible) {
      root.append(element('p', { text: line }));
    }

    const inside = hidden.slice();
    if (source) inside.push(source);
    if (!inside.length) return root;

    if (inside.length === 1) {
      root.append(element('p', { text: inside[0] }));
      return root;
    }

    const details = element('details');
    details.append(element('summary', { text: 'Notes' }));
    for (const line of inside) details.append(element('p', { text: line }));
    root.append(details);
    return root;
  }

  /* --- popups ---------------------------------------------------------------
     The general rules require a popup to close on an outside click; Escape and a
     focus return are added because the house accessibility floor needs them. */

  function attachDismiss(popup, onClose, { returnFocusTo } = {}) {
    function onPointerDown(event) { if (!popup.contains(event.target)) close(); }
    function onKeyDown(event) {
      if (event.key === 'Escape') { event.stopPropagation(); close(); }
    }
    function close() {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
      if (returnFocusTo && returnFocusTo.isConnected) returnFocusTo.focus();
      onClose();
    }
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
      body.replaceChildren(...items.slice(page * pageSize, (page + 1) * pageSize).map(renderRow));
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
  function rankRow(labelText, ratio, onClick) {
    const track = element('div', { className: 'oda-track' });
    const dot = element('i');
    dot.style.left = `calc(${Math.max(0, Math.min(100, ratio * 100))}% - 4px)`;
    track.append(dot);
    const cut = element('small', { text: `${Math.round((1 - ratio) * 100)}% of 2024 lost` });
    const head = onClick
      ? element('button', { text: labelText, attributes: { type: 'button' } })
      : element('span', { text: labelText });
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
  function orphanDrilldown({ payload, host, title, pairs, scenario, year, returnFocusTo }) {
    const P = window.ODAPayload;
    const dialog = modal(title, { host, returnFocusTo });
    dialog.card.append(element('p', {
      className: 'notes',
      text: 'Each dot is the share of the recipient-sector’s 2024 bilateral ODA still ' +
            `projected in ${year}. Select one to see which donors moved.`
    }), trackAxis());

    const listHost = element('div');
    dialog.card.append(listHost);
    pagedList(listHost, pairs, pair => rankRow(
      `${payload.recipientName(pair.recipient)} — ${payload.sectorName(pair.sector)}`,
      pair.ratio,
      event => openDonors(pair, event.currentTarget)
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
          .map(row => ({ ...row, ratio: row.now / row.base }))
          .sort((a, b) => Math.abs(1 - b.ratio) - Math.abs(1 - a.ratio));

        body.replaceChildren();
        if (!ranked.length) {
          body.append(element('p', { className: 'notes',
            text: 'No donor funded this recipient-sector in 2024.' }));
          return;
        }
        body.append(element('p', { className: 'notes',
          text: `Donors ranked by how far their support moved between 2024 and ${year}.` }),
          trackAxis());
        const rowsHost = element('div');
        body.append(rowsHost);
        pagedList(rowsHost, ranked, row => rankRow(payload.donorName(row.donor), row.ratio, null));
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
    sortSelect, applySort, pager, notes, STANDARD_NOTES, attachDismiss,
    modal, trapFocus, pagerRow, pagedList, rankRow, trackAxis, orphanDrilldown
  };
})();
