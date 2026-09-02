#!/usr/bin/env python
"""
CGD interactive QA gate — deterministic, no LLM. Headless Chromium only.

Python port of qa/verify.mjs, for machines without Node. The audits are the same
SKILL.md §F checks and the pass criteria are identical; only the runner differs.

Two deliberate differences from the Node original:

  1. Figures are served over HTTP from a local static server rather than opened as
     file:// URLs, because these figures fetch a binary payload and fetch() is
     blocked on file:// by CORS.
  2. Pages whose <html> carries data-cgd-harness="true" are skipped. They are
     development harnesses, not figures, and have no chart marks to check.

Usage
  python qa/verify.py                      # every top-level *.html in the repo
  python qa/verify.py f5-fiscal-loss.html  # explicit files

Setup (once)
  python -m pip install playwright
  python -m playwright install chromium

Exit code 0 = clean, 1 = at least one check failed, 2 = nothing to verify.
"""
from __future__ import annotations

import contextlib
import functools
import http.server
import socket
import socketserver
import sys
import threading
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sys.exit("playwright is not installed. Run:\n"
             "  python -m pip install playwright\n"
             "  python -m playwright install chromium")

REPO = Path(__file__).resolve().parent.parent
WIDTHS = (320, 768, 1200)

# The audit that runs INSIDE the page. Mirrors chart-core.js CGDCore.audit and
# verify.mjs::inPageAudit; keep the three in step.
IN_PAGE_AUDIT = r"""
(width) => {
  const out = { failures: [] };
  const fail = m => out.failures.push(m);

  /* Chart marks must be looked for INSIDE the chart, not anywhere in the
     document. Every figure ships a fullscreen button whose icon is an inline
     <svg><path>, present in the static HTML before any data loads, so
     'svg *' was satisfied at load time and this assertion never bit. */
  const hasChart = document.querySelector(
      '.panel svg *, .chart-area svg *, .plot-wrap svg *, .map-shell svg *, ' +
      '.scatter-wrap svg *, .treemap-wrap svg *, .area-wrap svg *') ||
    document.querySelector('table.matrix tbody td');
  if (!hasChart) fail('no chart marks rendered (empty svg / table)');

  if (typeof window.CGDTracking === 'undefined')
    fail('cgd-embed.js did not load (window.CGDTracking missing)');

  /* EVERY controls row, not just the first: figures carry a second selection
     row (F3), an advanced row (F5) and mobile rows (F17), and defects were
     sitting in the rows this never looked at. */
  const panels = [...document.querySelectorAll('.controls')]
    .filter(n => getComputedStyle(n).display !== 'none' && n.getClientRects().length);
  const shown = n => getComputedStyle(n).display !== 'none' &&
                     getComputedStyle(n).visibility !== 'hidden' &&
                     n.getClientRects().length > 0;

  for (const panel of panels) {
    const pb = panel.getBoundingClientRect();
    const groups = [...panel.children].filter(shown);
    const outside = groups.filter(n => {
      const b = n.getBoundingClientRect();
      return b.left < pb.left - 1 || b.right > pb.right + 1 ||
             b.top < pb.top - 1 || b.bottom > pb.bottom + 1;
    }).map(n => n.textContent.trim().slice(0, 40));
    if (outside.length)
      fail('control group overflows the controls panel: ' + outside.join(' | '));

    /* Pairwise overlap between control groups. This is the `intersections`
       check the house standard requires; the earlier port omitted it. */
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const a = groups[i].getBoundingClientRect(), b = groups[j].getBoundingClientRect();
        if (a.left < b.right - 1 && a.right > b.left + 1 &&
            a.top < b.bottom - 1 && a.bottom > b.top + 1) {
          fail('control groups intersect: "' + groups[i].textContent.trim().slice(0, 30) +
               '" / "' + groups[j].textContent.trim().slice(0, 30) + '"');
        }
      }
    }

    /* Text is clipped by an ANCESTOR with overflow:hidden, not by the control's
       own box — a segmented button grows to fit its wrapped label while the
       .segmented wrapper crops it. Comparing a node only with itself, as the
       earlier port did, cannot see that. */
    for (const node of [...panel.querySelectorAll('button, label, output, .control-label')]) {
      if (!shown(node)) continue;
      if (node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1) {
        fail('clipped control text: ' + node.textContent.trim().slice(0, 40));
        continue;
      }
      const box = node.getBoundingClientRect();
      for (let p = node.parentElement; p && p !== document.body; p = p.parentElement) {
        const style = getComputedStyle(p);
        if (style.overflow === 'visible' && style.overflowX === 'visible' &&
            style.overflowY === 'visible') continue;
        const pbox = p.getBoundingClientRect();
        if (box.right > pbox.right + 1 || box.left < pbox.left - 1 ||
            box.bottom > pbox.bottom + 1 || box.top < pbox.top - 1) {
          fail('control text clipped by ancestor: ' + node.textContent.trim().slice(0, 40));
        }
        break;
      }
    }
  }

  const nodes = [...document.querySelectorAll('svg text')]
    .filter(n => n.ownerSVGElement && getComputedStyle(n).visibility !== 'hidden');
  const boxes = nodes.map(n => {
    const r = n.getBoundingClientRect(), s = n.ownerSVGElement.getBoundingClientRect();
    return { t: n.textContent.trim(), l: r.left, r: r.right, tp: r.top, b: r.bottom,
             sl: s.left, sr: s.right, st: s.top, sb: s.bottom };
  });
  if (boxes.some(x => x.l < x.sl - 1 || x.r > x.sr + 1 || x.tp < x.st - 1 || x.b > x.sb + 1))
    fail('svg text clipped outside its viewBox');
  outer:
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (a.l < b.r - 1 && a.r > b.l + 1 && a.tp < b.b - 1 && a.b > b.tp + 1) {
        fail(`svg text overlap: "${a.t}" / "${b.t}"`);
        break outer;
      }
    }
  }

  const overflow = document.documentElement.scrollWidth -
                   document.documentElement.clientWidth;
  if (overflow > 1) fail('page-level horizontal overflow: ' + overflow + 'px');

  if (width <= 520) {
    const small = [...document.querySelectorAll(
      'input:not([type=checkbox]):not([type=radio]):not([type=range]), textarea, ' +
      '[role="combobox"] input, .search-select input')]
      .filter(n => parseFloat(getComputedStyle(n).fontSize) < 16)
      .map(n => n.id || n.name || n.className);
    if (small.length)
      fail('editable input < 16px on phone (iOS zoom): ' + small.join(', '));
  }
  return out;
}
"""


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):  # keep the gate output clean
        pass


@contextlib.contextmanager
def serve(directory: Path):
    """Serve `directory` on an ephemeral localhost port for the life of the block."""
    handler = functools.partial(QuietHandler, directory=str(directory))
    with socketserver.TCPServer(("127.0.0.1", 0), handler) as httpd:
        httpd.allow_reuse_address = True
        port = httpd.socket.getsockname()[1]
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        try:
            yield port
        finally:
            httpd.shutdown()


def is_harness(path: Path) -> bool:
    head = path.read_text(encoding="utf-8", errors="ignore")[:2000]
    return 'data-cgd-harness="true"' in head


def discover(args: list[str]) -> list[Path]:
    if args:
        return [Path(a).resolve() for a in args if a.endswith(".html")]
    return sorted(p for p in REPO.glob("*.html") if not is_harness(p))


def main() -> int:
    figures = [p for p in discover(sys.argv[1:]) if p.is_file()]
    if not figures:
        print("No figures found to verify. Pass .html paths, or add a figure to the repo root.")
        return 2

    failed = 0
    with serve(REPO) as port, sync_playwright() as pw:
        browser = pw.chromium.launch()
        for figure in figures:
            rel = figure.relative_to(REPO).as_posix()
            url = f"http://127.0.0.1:{port}/{rel}"
            for width in WIDTHS:
                page = browser.new_page(viewport={"width": width, "height": 900})
                problems: list[str] = []
                page.on("pageerror", lambda e: problems.append(f"pageerror: {e}"))
                page.on("console", lambda m: problems.append(f"console: {m.text}")
                        if m.type == "error" else None)
                try:
                    page.goto(url, wait_until="load")
                    # window.CGD_READY must be OBSERVED, not merely "not false":
                    # a figure that never sets it used to satisfy this at load,
                    # and the marks test below was satisfied by the fullscreen
                    # button's icon <path>. Both were checked before any data had
                    # been fetched. Every figure now sets CGD_READY.
                    page.wait_for_function(
                        "() => window.CGDCore && window.CGD_READY === true && "
                        "(document.querySelector('.panel svg *, .chart-area svg *') || "
                        " document.querySelector('table.matrix tbody td'))",
                        timeout=20000)
                    page.evaluate("() => document.fonts && document.fonts.ready")
                    page.wait_for_timeout(600)  # let fonts and one render frame settle
                    result = page.evaluate(IN_PAGE_AUDIT, width)
                    errors = list(result["failures"]) + problems
                except Exception as exc:  # noqa: BLE001 — the gate reports, never raises
                    errors = [str(exc).splitlines()[0]] + problems
                finally:
                    page.close()

                if errors:
                    failed += 1
                    print(f"FAIL  {rel} @ {width}px")
                    for error in errors:
                        print(f"        - {error}")
                else:
                    print(f"pass  {rel} @ {width}px")
        browser.close()

    widths = "/".join(str(w) for w in WIDTHS)
    print(f"\nFAILED: {failed} figure/width check(s) failed."
          if failed else f"\nPASS: all figures clean at {widths}px.")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
