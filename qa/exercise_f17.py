#!/usr/bin/env python
"""Driven responsive and state checks for Figure 17."""
from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from verify import REPO, serve

WIDTHS = (320, 768, 1200)


def main() -> int:
    findings: list[str] = []
    shots = REPO / "qa" / "shots"
    shots.mkdir(parents=True, exist_ok=True)
    with serve(REPO) as port, sync_playwright() as pw:
        browser = pw.chromium.launch()
        url = f"http://127.0.0.1:{port}/f17-recipient-scenarios-table.html"

        for width in WIDTHS:
            page = browser.new_page(viewport={"width": width, "height": 900})
            page.goto(url, wait_until="load")
            page.wait_for_selector("table.matrix tbody tr", state="attached")
            page.screenshot(path=str(shots / f"f17-recipient-scenarios-table-{width}.png"),
                            full_page=True)
            page.close()

        page = browser.new_page(viewport={"width": 1200, "height": 900})
        errors: list[str] = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(url, wait_until="load")
        page.wait_for_selector(".desktop-table table.matrix tbody tr")
        result = page.evaluate(r"""
        async () => {
          const wait = () => new Promise(r => setTimeout(r, 450));
          const state = window.ODA_F17.state;
          const count = () => Number(document.getElementById('chartSummary').textContent.match(/^\d+/)[0]);
          const out = {
            defaultMetric: state.get().layer + ':' + state.get().objective,
            defaultYear: state.get().year,
            defaultCount: count(),
            tableCount: document.querySelectorAll('table.matrix').length,
            firstGroupOpen: document.querySelector('.desktop-table .group-toggle').getAttribute('aria-expanded'),
            notesCollapsed: !document.querySelector('#notes details').open
          };

          document.querySelector('#desktopPrimary [data-measure="ge"]').click();
          await wait();
          out.measure = state.get().measure;

          // Exact selectors: the layer control and the ODA-metric control both carry a
          // data-value of "oda", so scope by the state key each one writes.
          document.querySelector('[data-key="layer"][data-value="oda"]').click();
          document.querySelector('[data-key="odaMetric"][data-value="oda_pc"]').click();
          await wait();
          out.odaMetric = state.get().odaMetric;
          out.subtitle = document.getElementById('vizSub').textContent;

          const threshold = document.getElementById('needThreshold');
          threshold.checked = true; threshold.dispatchEvent(new Event('change'));
          await wait();
          out.thresholdCount = count();

          // Mobile controls are another rendering of the same state.
          out.mobileShow = document.getElementById('mobileShow').value;
          out.mobileFirstColumns = [...document.querySelectorAll('.mobile-table thead th')]
            .slice(0, 3).map(th => th.textContent.trim());
          return out;
        }
        """)
        page.close()

        mobile = browser.new_page(viewport={"width": 320, "height": 900})
        mobile.goto(url, wait_until="load")
        mobile.wait_for_selector(".mobile-table table.matrix tbody tr")
        mobile_result = mobile.evaluate(r"""
        async () => {
          const wait = () => new Promise(r => setTimeout(r, 450));
          const out = {};
          const show = document.getElementById('mobileShow');
          show.value = 'ratio_humanitarian'; show.dispatchEvent(new Event('change'));
          await wait();
          out.metric = window.ODA_F17.state.get().objective;
          out.unclassified = [...document.querySelectorAll('.mobile-table .group-toggle')]
            .some(x => x.textContent.includes('Not classified'));
          document.querySelector('#mobileYear button').click(); await wait();
          out.year = window.ODA_F17.state.get().year;
          out.noPageOverflow = document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
          out.innerScroll = document.querySelector('.mobile-table .table-scroll').scrollWidth >
                            document.querySelector('.mobile-table .table-scroll').clientWidth;
          return out;
        }
        """)
        mobile.close()
        browser.close()

    if errors:
        findings.append("page errors: " + "; ".join(errors))
    if result["defaultMetric"] != "ratio:poverty" or result["defaultYear"] != 2028:
        findings.append("default metric/year is wrong")
    if result["tableCount"] != 2 or result["firstGroupOpen"] != "true":
        findings.append("desktop/mobile table render or default grouping is wrong")
    if result["measure"] != "ge" or result["odaMetric"] != "oda_pc":
        findings.append("measure or metric control did not update state")
    if result["thresholdCount"] >= result["defaultCount"]:
        findings.append("need threshold did not reduce the recipient population")
    if result["mobileShow"] != "oda_pc":
        findings.append("mobile metric rendering did not sync with desktop state")
    if result["mobileFirstColumns"] != ["Recipient", "Average", "Range"]:
        findings.append("mobile summary columns do not lead")
    if not result["notesCollapsed"]:
        findings.append("notes are not collapsed by default")
    if mobile_result["metric"] != "humanitarian" or not mobile_result["unclassified"]:
        findings.append("humanitarian grouping or explicit unclassified group is missing")
    if mobile_result["year"] != 2027:
        findings.append("mobile year stepper did not move to 2027")
    if not mobile_result["noPageOverflow"] or not mobile_result["innerScroll"]:
        findings.append("mobile horizontal scrolling is not contained within the table")

    print(json.dumps({"desktop": result, "mobile": mobile_result}, indent=2))
    if findings:
        print("FINDINGS:")
        for finding in findings:
            print("  - " + finding)
        return 1
    print("Figure 17 state exercise clean.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
