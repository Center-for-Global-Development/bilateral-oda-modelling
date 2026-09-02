/* =============================================================================
   Safe DOM + CSV helpers (references/15 §15.5, references/10 §10.12).
   Never build data-driven content with innerHTML. Exposes window.CGDDom.
   ============================================================================= */
(() => {
  /* Build an element with text + attributes + children. Uses textContent only. */
  function element(tag, options = {}, children = []) {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text != null) node.textContent = String(options.text);
    for (const [name, value] of Object.entries(options.attributes || {})) {
      node.setAttribute(name, String(value));
    }
    for (const child of children) node.append(child);
    return node;
  }

  /* SVG-namespaced element with attributes (charts need this). */
  function svgEl(tag, attrs = {}) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [name, value] of Object.entries(attrs)) {
      node.setAttribute(name, String(value));
    }
    return node;
  }

  function csvCell(value) {
    if (value == null) return '';
    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }

  /* columns: [{key, label}]; rows: [{key: value}]. Downloads current scope only. */
  function downloadCsv(filename, columns, rows) {
    const lines = [
      columns.map(c => csvCell(c.label)).join(','),
      ...rows.map(row => columns.map(c => csvCell(row[c.key])).join(','))
    ];
    const blob = new Blob(['﻿' + lines.join('\r\n')], {
      type: 'text/csv;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  window.CGDDom = { element, svgEl, csvCell, downloadCsv };
})();
