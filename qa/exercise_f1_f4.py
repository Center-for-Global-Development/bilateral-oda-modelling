#!/usr/bin/env python
"""Driven responsive and state checks for Figures 1–4."""
from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from verify import REPO, serve

WIDTHS = (320, 768, 1200)
FIGURES = (
    "f1-donor-headline-cuts.html",
    "f2-traceable-oda.html",
    "f3-flows-and-losses-map.html",
    "f4-recipient-sector-losses.html",
)


def main() -> int:
    shots = REPO / "qa" / "shots"
    shots.mkdir(parents=True, exist_ok=True)
    findings: list[str] = []
    results: dict[str, object] = {}
    with serve(REPO) as port, sync_playwright() as pw:
        browser = pw.chromium.launch()

        for figure in FIGURES:
            for width in WIDTHS:
                page = browser.new_page(viewport={"width": width, "height": 900})
                page.goto(f"http://127.0.0.1:{port}/{figure}", wait_until="load")
                page.wait_for_function("() => document.querySelector('svg *')")
                page.wait_for_timeout(550)
                page.screenshot(path=str(shots / f"{Path(figure).stem}-{width}.png"),
                                full_page=True)
                page.close()

        # F1: sorting re-selects the set and paging works.
        page = browser.new_page(viewport={"width": 1200, "height": 900})
        page.goto(f"http://127.0.0.1:{port}/{FIGURES[0]}", wait_until="load")
        page.wait_for_selector(".donor-row")
        f1 = page.evaluate(r"""
        async () => {
          const wait=()=>new Promise(r=>setTimeout(r,250));
          const first=()=>document.querySelector('.donor-name').textContent;
          const names=()=>Array.from(document.querySelectorAll('.donor-name'),d=>d.textContent);
          const out={rows:document.querySelectorAll('.donor-row').length,
            first:first(), names:names(), measureToggle:!!document.getElementById('measureToggle'),
            page:document.querySelector('#pageControl output').textContent};
          document.getElementById('ratioSort').click(); await wait();
          out.afterRatio={first:first(),sort:window.ODA_F1.state.get().sort,
            page:window.ODA_F1.state.get().page,names:names()};
          document.querySelector('#pageControl .segmented button:last-child').click(); await wait();
          out.afterPage={first:first(),page:window.ODA_F1.state.get().page,
            summary:document.getElementById('chartSummary').textContent};
          return out;
        }
        """)
        page.close()

        # F2: unit and sort controls update both state and the selected population.
        page = browser.new_page(viewport={"width": 1200, "height": 900})
        page.goto(f"http://127.0.0.1:{port}/{FIGURES[1]}", wait_until="load")
        page.wait_for_selector(".trace-row")
        f2 = page.evaluate(r"""
        async()=>{const wait=()=>new Promise(r=>setTimeout(r,250));const first=()=>document.querySelector('.trace-name').textContent;
          const out={rows:document.querySelectorAll('.trace-row').length,first:first(),legend:document.getElementById('legend').textContent,measureToggle:!!document.getElementById('measureToggle')};
          document.querySelector('[data-unit="usd"]').click();await wait();out.usd={unit:window.ODA_F2.state.get().unit,sub:document.getElementById('vizSub').textContent};
          const sort=document.getElementById('sortSelect');sort.value='unspecified';sort.dispatchEvent(new Event('change'));await wait();out.sorted={first:first(),sort:window.ODA_F2.state.get().sort,page:window.ODA_F2.state.get().page};return out;}
        """)
        page.close()

        # F3: selection creates flows, persists across scenario, and donor+sector
        # invokes the verified sparse-cube path.
        page = browser.new_page(viewport={"width": 1200, "height": 900})
        map_errors: list[str] = []
        page.on("pageerror", lambda e: map_errors.append(str(e)))
        page.goto(f"http://127.0.0.1:{port}/{FIGURES[2]}", wait_until="load")
        page.wait_for_selector("path.country")
        f3 = page.evaluate(r"""
        async()=>{const wait=()=>new Promise(r=>setTimeout(r,900));const out={features:document.querySelectorAll('path.country').length,flows:document.querySelectorAll('.flow-hit').length,measureHidden:document.getElementById('measureToggle').hidden};
          const search=document.getElementById('countrySearch');search.value='UKR';search.dispatchEvent(new Event('change'));await wait();out.recipient={selected:window.ODA_F3.state.get().selected,flows:document.querySelectorAll('.flow-hit').length};
          const scenario=document.getElementById('scenarioSelect');scenario.value='S7';scenario.dispatchEvent(new Event('change'));await wait();out.persisted=window.ODA_F3.state.get().selected;
          document.querySelector('[data-type="donor"]').click();await wait();search.value='USA';search.dispatchEvent(new Event('change'));await wait();
          const sector=document.getElementById('sectorSelect');sector.value='120';sector.dispatchEvent(new Event('change'));await wait();out.cube={selected:window.ODA_F3.state.get().selected,sector:window.ODA_F3.state.get().sector,flows:document.querySelectorAll('.flow-hit').length};
          document.querySelector('[data-metric="total"]').click();await wait();out.total={metric:window.ODA_F3.state.get().metric,measureHidden:document.getElementById('measureToggle').hidden};
          return out;}
        """)
        page.close()

        # Force the first cube value request to fail; it must become a visible refusal.
        page = browser.new_page(viewport={"width": 1200, "height": 900})
        cube_errors: list[str] = []
        page.on("pageerror", lambda e: cube_errors.append(str(e)))
        page.route("**/cube/S1__ge.bin.gz", lambda route: route.fulfill(status=503, body="test"))
        page.goto(f"http://127.0.0.1:{port}/{FIGURES[2]}", wait_until="load")
        page.wait_for_selector("path.country")
        page.evaluate(r"""
        async()=>{const wait=()=>new Promise(r=>setTimeout(r,500));document.querySelector('[data-metric="total"]').click();await wait();document.querySelector('#measureToggle [data-measure="ge"]').click();await wait();document.querySelector('[data-type="donor"]').click();await wait();const search=document.getElementById('countrySearch');search.value='USA';search.dispatchEvent(new Event('change'));await wait();const sector=document.getElementById('sectorSelect');sector.value='120';sector.dispatchEvent(new Event('change'));}
        """)
        page.wait_for_selector(".oda-failstate", timeout=20000)
        cube_failure_visible = page.locator(".oda-failstate").is_visible()
        page.close()

        # F4: mutual-All rule, colour mode, year and measure paths.
        page = browser.new_page(viewport={"width": 1200, "height": 900})
        page.goto(f"http://127.0.0.1:{port}/{FIGURES[3]}", wait_until="load")
        page.wait_for_selector("#scatterSvg circle")
        f4 = page.evaluate(r"""
        async()=>{const wait=()=>new Promise(r=>setTimeout(r,450));const marks=()=>document.querySelectorAll('#scatterSvg circle').length;
          const sector=document.getElementById('sectorSelect'),recipient=document.getElementById('recipientSelect');const out={marks:marks(),sectorAllDisabled:sector.querySelector('option[value="ALL"]').disabled,recipientAllDisabled:recipient.querySelector('option[value="ALL"]').disabled};
          recipient.value='UKR';recipient.dispatchEvent(new Event('change'));await wait();sector.value='ALL';sector.dispatchEvent(new Event('change'));await wait();out.sectors={marks:marks(),recipient:window.ODA_F4.state.get().recipient,sector:window.ODA_F4.state.get().sector,recipientAllDisabled:recipient.querySelector('option[value="ALL"]').disabled};
          document.querySelector('#measureToggle [data-measure="ge"]').click();await wait();out.measure=window.ODA_F4.state.get().measure;
          const year=document.querySelector('#yearControl input[type="range"]');year.value='0';year.dispatchEvent(new Event('input'));await wait();out.year={value:window.ODA_F4.state.get().year,marks:marks()};return out;}
        """)
        page.close()
        browser.close()

    results.update(f1=f1, f2=f2, f3=f3, f4=f4,
                   cube_failure_visible=cube_failure_visible)
    if f1["rows"] != 20 or f1["measureToggle"] or f1["afterRatio"]["sort"] != "ratio" or f1["afterPage"]["page"] != 1:
        findings.append("F1 ranking, GE-only control set, sorting or paging failed")
    if set(f1["afterRatio"]["names"]) == set(f1["names"]):
        findings.append("F1 ratio sort did not re-select the visible set")
    if f2["rows"] != 20 or f2["measureToggle"] or "Recipient specified; sector missing" not in f2["legend"]:
        findings.append("F2 rows, gross-only control set or four-category legend failed")
    if f2["usd"]["unit"] != "usd" or f2["sorted"]["sort"] != "unspecified" or f2["sorted"]["page"] != 0:
        findings.append("F2 unit/sort state or re-selection failed")
    if map_errors or f3["features"] < 170 or f3["flows"] != 0 or f3["recipient"]["flows"] == 0:
        findings.append("F3 geometry, default no-flow state or recipient-flow state failed")
    if f3["persisted"] != "UKR" or f3["cube"]["selected"] != "USA" or f3["cube"]["sector"] != "120" or f3["cube"]["flows"] == 0:
        findings.append("F3 selection persistence or donor-sector cube state failed")
    if f3["total"]["measureHidden"] or not cube_failure_visible or cube_errors:
        findings.append("F3 measure visibility or cube failure handling failed")
    if not f4["sectorAllDisabled"] or f4["recipientAllDisabled"]:
        findings.append("F4 initial mutual-All option rule failed")
    if f4["sectors"]["sector"] != "ALL" or not f4["sectors"]["recipientAllDisabled"] or f4["measure"] != "ge" or f4["year"]["value"] != 2024:
        findings.append("F4 sector mode, GE path or 2024 path failed")

    print(json.dumps(results, indent=2))
    if findings:
        print("FINDINGS:")
        for finding in findings:
            print("  - " + finding)
        return 1
    print("Figures 1–4 state exercise clean.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
