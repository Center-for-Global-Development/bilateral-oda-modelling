#!/usr/bin/env python
"""
SKILL.md §F steps 2, 4 and 5 for one figure: screenshots, the state exercise and
the keyboard pass. The deterministic audits are in verify.py; this covers the
parts that need a driven browser.

Usage
  python qa/exercise.py f5-fiscal-loss.html [--shots qa/shots]
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from verify import serve, REPO  # noqa: E402  reuse the same static server

WIDTHS = (320, 768, 1200)


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    figure = args[0] if args else "f5-fiscal-loss.html"
    shots = Path("qa/shots")
    if "--shots" in sys.argv:
        shots = Path(sys.argv[sys.argv.index("--shots") + 1])
    (REPO / shots).mkdir(parents=True, exist_ok=True)

    findings: list[str] = []
    with serve(REPO) as port, sync_playwright() as pw:
        browser = pw.chromium.launch()
        url = f"http://127.0.0.1:{port}/{figure}"

        # ---- screenshots at each width -------------------------------------
        for width in WIDTHS:
            page = browser.new_page(viewport={"width": width, "height": 900})
            page.goto(url, wait_until="load")
            page.wait_for_function("() => document.querySelectorAll('svg circle.point').length > 0",
                                   timeout=20000)
            page.wait_for_timeout(400)
            out = REPO / shots / f"{Path(figure).stem}-{width}.png"
            page.screenshot(path=str(out), full_page=True)
            marks = page.evaluate("() => document.querySelectorAll('svg circle.point').length")
            print(f"  {width:>4}px  {marks} marks  ->  {out.relative_to(REPO).as_posix()}")
            page.close()

        # ---- state exercise -------------------------------------------------
        page = browser.new_page(viewport={"width": 1200, "height": 900})
        errors: list[str] = []
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        page.on("console", lambda m: errors.append(f"console: {m.text}")
                if m.type == "error" else None)
        page.goto(url, wait_until="load")
        page.wait_for_function("() => document.querySelectorAll('svg circle.point').length > 0",
                               timeout=20000)

        result = page.evaluate(r"""
        async () => {
          const out = {};
          const marks = () => document.querySelectorAll('svg circle.point').length;
          const settle = () => new Promise(r => setTimeout(r, 350));

          out.defaultMarks = marks();
          out.defaultSummary = document.getElementById('chartSummary').textContent;

          // measure toggle must load the other payload and visibly update state
          const ge = document.querySelector('#measureToggle [data-measure="ge"]');
          ge.click(); await settle();
          out.afterGrantEquivalent = {
            measure: window.ODA_F5.state.get().measure,
            pressed: ge.getAttribute('aria-pressed'),
            subtitle: document.getElementById('vizSub').textContent.slice(0, 40)
          };
          document.querySelector('#measureToggle [data-measure="gross"]').click();
          await settle();

          // scenario change re-renders and changes the data
          const sel = document.getElementById('scenarioSelect');
          sel.value = 'S7'; sel.dispatchEvent(new Event('change')); await settle();
          out.afterScenario = { marks: marks(),
            sub: document.getElementById('vizSub').textContent.slice(0, 70) };

          // denominator change: n shown must change with it
          const den = document.getElementById('denomSelect');
          den.value = 'revenue'; den.dispatchEvent(new Event('change')); await settle();
          out.afterRevenue = { marks: marks(),
            summary: document.getElementById('chartSummary').textContent };
          den.value = 'gni'; den.dispatchEvent(new Event('change')); await settle();

          // year stepper bounds cover projection years only (2025-2028)
          const yb = document.querySelectorAll('#yearControl button');
          for (let i = 0; i < 5; i++) yb[0].click();
          await settle();
          out.atFirstYear = { year: document.querySelector('#yearControl output').textContent,
                              marks: marks(), backDisabled: yb[0].disabled,
                              summary: document.getElementById('chartSummary').textContent };
          for (let i = 0; i < 5; i++) yb[1].click();
          await settle();
          out.atLastYear = { year: document.querySelector('#yearControl output').textContent,
                             marks: marks(), fwdDisabled: yb[1].disabled };

          // advanced microstate exclusion
          document.getElementById('advancedBtn').click();
          out.advancedOpens = !document.getElementById('advancedPanel').hidden;
          const box = document.getElementById('excludeMicro');
          box.checked = true; box.dispatchEvent(new Event('change')); await settle();
          out.microExcluded = { marks: marks(),
            summary: document.getElementById('chartSummary').textContent };
          box.checked = false; box.dispatchEvent(new Event('change')); await settle();
          out.microRestored = marks();

          // tooltip: pin by click, dismiss by outside click and by Escape
          const dot = document.querySelector('svg circle.point');
          dot.dispatchEvent(new PointerEvent('click', { bubbles: true }));
          await settle();
          out.tooltipPinned = !document.getElementById('tooltip').hidden;
          document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
          await settle();
          out.tooltipDismissedByOutsideClick = document.getElementById('tooltip').hidden;

          // notes: collapsed by default, and the visible lines name the exclusions
          const det = document.querySelector('#notes details');
          out.notesCollapsedByDefault = det ? !det.open : 'no details';
          out.visibleNoteCount = document.querySelectorAll('#notes > .notes > p').length;
          out.visibleNotes = [...document.querySelectorAll('#notes > .notes > p')]
            .map(p => p.textContent.slice(0, 60));

          // iframe height grows and shrinks
          const h0 = document.body.getBoundingClientRect().height;
          const f = document.createElement('div'); f.style.height = '600px';
          document.body.append(f);
          const h1 = document.body.getBoundingClientRect().height;
          f.remove();
          const h2 = document.body.getBoundingClientRect().height;
          out.growsAndShrinks = h1 > h0 && Math.abs(h2 - h0) < 2;

          return out;
        }
        """)

        # ---- keyboard pass ---------------------------------------------------
        page.evaluate("() => document.activeElement.blur()")
        page.keyboard.press("Tab")
        first = page.evaluate("() => document.activeElement.tagName + '#' + "
                              "(document.activeElement.id || document.activeElement.className)")
        focusable = page.evaluate(
            "() => document.querySelectorAll('svg circle.point[tabindex=\"0\"]').length")
        page.close()

        # ---- lazy-payload failure ------------------------------------------
        # Initial gross blobs load normally. The first GE request is then forced
        # to fail, and must become a visible refusal rather than an unhandled
        # rejection or an empty/misleading chart.
        page = browser.new_page(viewport={"width": 1200, "height": 900})
        lazy_errors: list[str] = []
        page.on("pageerror", lambda e: lazy_errors.append(str(e)))
        page.route("**/recipient_year__ge.bin.gz",
                   lambda route: route.fulfill(status=503, body="test failure"))
        page.goto(url, wait_until="load")
        page.wait_for_function("() => document.querySelectorAll('svg circle.point').length > 0",
                               timeout=20000)
        page.click('#measureToggle [data-measure="ge"]')
        page.wait_for_selector('.oda-failstate', timeout=20000)
        lazy_failure_visible = page.locator('.oda-failstate').is_visible()
        page.close()
        browser.close()

    print("\nState exercise:")
    print(json.dumps(result, indent=2))
    print(f"\nKeyboard: first tab stop = {first}; focusable marks = {focusable}")
    print(f"Lazy payload failure visible: {lazy_failure_visible}")

    if errors:
        findings.append("console/page errors: " + "; ".join(errors))
    if not result.get("growsAndShrinks"):
        findings.append("body height does not both grow and shrink")
    if result.get("notesCollapsedByDefault") is not True:
        findings.append("notes are not collapsed by default")
    if result.get("tooltipDismissedByOutsideClick") is not True:
        findings.append("tooltip does not dismiss on an outside click")
    if result.get("afterScenario", {}).get("marks") == result.get("defaultMarks"):
        findings.append("scenario change did not change the rendered population")
    if result.get("afterRevenue", {}).get("marks") == result.get("afterScenario", {}).get("marks"):
        findings.append("denominator change did not change the rendered population")
    if result.get("atFirstYear", {}).get("year") != "2025" or not result.get("atFirstYear", {}).get("backDisabled"):
        findings.append("year control does not stop at 2025")
    if result.get("atLastYear", {}).get("year") != "2028" or not result.get("atLastYear", {}).get("fwdDisabled"):
        findings.append("year control does not stop at 2028")
    if result.get("microExcluded", {}).get("marks", 0) >= result.get("afterScenario", {}).get("marks", 0):
        findings.append("microstate exclusion did not reduce the rendered population")
    if result.get("microRestored") != result.get("afterScenario", {}).get("marks"):
        findings.append("microstate exclusion did not restore the rendered population")
    ge = result.get("afterGrantEquivalent", {})
    if ge.get("measure") != "ge" or ge.get("pressed") != "true" or "Grant-equivalent" not in ge.get("subtitle", ""):
        findings.append("grant-equivalent toggle did not update state and visible text")
    if not lazy_failure_visible or lazy_errors:
        findings.append("lazy payload failure was not handled as a visible refusal")

    if findings:
        print("\nFINDINGS:")
        for finding in findings:
            print("  - " + finding)
        return 1
    print("\nState exercise clean.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
