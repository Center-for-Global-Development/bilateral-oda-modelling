#!/usr/bin/env python
"""Responsive, state, lazy-failure and independent payload checks for F6–F8."""
from __future__ import annotations

import gzip
import json
import math
import struct
from pathlib import Path

from playwright.sync_api import sync_playwright

from verify import REPO, serve

WIDTHS = (320, 768, 1200)
FIGURES = (
    "f6-donor-attributed-losses.html",
    "f7-oda-treemap.html",
    "f8-donor-oda-over-time.html",
)
RELEASE = REPO / "data" / "static-v2.2.9-swe-exit-scope"


def read_float_blob(manifest: dict, name: str) -> tuple[float, ...]:
    spec = manifest["blobs"][name]
    raw = gzip.decompress((RELEASE / spec["file"]).read_bytes())
    return struct.unpack(f"<{spec['count']}f", raw)


def independent_values() -> dict[str, float | str]:
    manifest = json.loads((RELEASE / "manifest.json").read_text(encoding="utf-8"))
    donors, recipients, years = (manifest["axes"][k]["values"] for k in ("donor", "recipient", "year"))
    nr, ny = len(recipients), len(years)
    base = read_float_blob(manifest, "static/baseline_gross__donor_recipient")
    current = read_float_blob(manifest, "scenarios/S1/donor_recipient_year__gross")

    def b(di: int, ri: int) -> float:
        return base[di * nr + ri]

    def c(di: int, ri: int, yi: int = 3) -> float:
        return current[(di * nr + ri) * ny + yi]

    ranked: list[tuple[float, str]] = []
    for ri, iso in enumerate(recipients):
        gni = manifest["recipient_meta"][iso].get("gni_usd")
        if not gni:
            continue
        share = sum(max(0.0, b(di, ri) - c(di, ri)) for di in range(len(donors))) / (gni / 1e6)
        if share > 0:
            ranked.append((share, iso))
    ranked.sort(reverse=True)

    ukr = recipients.index("UKR")
    ukr_2028 = sum(c(di, ukr) for di in range(len(donors)))
    recipient_series = read_float_blob(manifest, "scenarios/S1/recipient_year__gross")
    ukr_aggregate = recipient_series[ukr * ny + 3]
    return {
        "f6_top_iso": ranked[0][1], "f6_top_share": ranked[0][0],
        "ukr_donor_sum_2028": ukr_2028, "ukr_recipient_aggregate_2028": ukr_aggregate,
    }


def main() -> int:
    expected = independent_values()
    shots = REPO / "qa" / "shots"
    shots.mkdir(parents=True, exist_ok=True)
    findings: list[str] = []
    results: dict[str, object] = {"independent": expected}

    with serve(REPO) as port, sync_playwright() as pw:
        browser = pw.chromium.launch()
        for figure in FIGURES:
            for width in WIDTHS:
                page = browser.new_page(viewport={"width": width, "height": 900})
                page.goto(f"http://127.0.0.1:{port}/{figure}", wait_until="load")
                page.wait_for_function("() => document.querySelector('svg *')")
                page.wait_for_timeout(700)
                page.screenshot(path=str(shots / f"{Path(figure).stem}-{width}.png"), full_page=True)
                page.close()

        page = browser.new_page(viewport={"width": 1200, "height": 900})
        page.goto(f"http://127.0.0.1:{port}/{FIGURES[0]}", wait_until="load")
        page.wait_for_selector(".loss-row")
        f6 = page.evaluate(r"""
        async()=>{const wait=()=>new Promise(r=>setTimeout(r,500)),rows=window.ODA_F6.rows();
          const out={count:rows.length,topIso:rows[0].iso,topShare:rows[0].total,
            rowCount:document.querySelectorAll('.loss-row').length,
            legend:Array.from(document.querySelectorAll('.legend-key'),d=>d.textContent)};
          document.querySelector('.loss-name').click();await wait();out.popup={open:!document.getElementById('detailPopup').hidden,rows:document.querySelectorAll('.dot-row').length,selected:window.ODA_F6.state.get().selected};
          const scenario=document.getElementById('scenarioSelect');scenario.value='S7';scenario.dispatchEvent(new Event('change'));await wait();out.persisted=window.ODA_F6.state.get().selected;
          return out;}
        """)
        page.screenshot(path=str(shots / "f6-donor-attributed-losses-popup-1200.png"), full_page=True)
        page.click("#popupClose")
        page.close()

        page = browser.new_page(viewport={"width": 1200, "height": 900})
        page.goto(f"http://127.0.0.1:{port}/{FIGURES[1]}", wait_until="load")
        page.wait_for_selector("#treemapSvg rect[role=img]")
        f7 = page.evaluate(r"""
        async()=>{const wait=()=>new Promise(r=>setTimeout(r,1200)),out={};
          let rows=await window.ODA_F7.buildData();out.default={cells:rows.length,sum:rows.reduce((a,b)=>a+b.value,0),focus:window.ODA_F7.state.get().focus,measureHidden:document.getElementById('measureToggle').closest('.control-group').hidden};
          const scenario=document.getElementById('scenarioSelect');scenario.value='S7';scenario.dispatchEvent(new Event('change'));await wait();out.persisted=window.ODA_F7.state.get().focus;
          const partner=document.getElementById('partnerSelect');partner.value=partner.options[1].value;partner.dispatchEvent(new Event('change'));await wait();out.specific={partner:window.ODA_F7.state.get().partner,nestHidden:document.getElementById('nestSelect').parentElement.hidden};
          document.querySelector('[data-focus-type="donor"]').click();await wait();out.donor={type:window.ODA_F7.state.get().focusType,focus:window.ODA_F7.state.get().focus,marks:document.querySelectorAll('#treemapSvg rect[role=img]').length};return out;}
        """)
        page.close()

        page = browser.new_page(viewport={"width": 1200, "height": 900})
        page.route("**/cube/S1__gross.bin.gz", lambda route: route.fulfill(status=503, body="test"))
        page.goto(f"http://127.0.0.1:{port}/{FIGURES[1]}", wait_until="load")
        page.wait_for_selector(".oda-failstate", timeout=20000)
        f7_failure = page.locator(".oda-failstate").is_visible()
        page.close()

        page = browser.new_page(viewport={"width": 1200, "height": 900})
        page.goto(f"http://127.0.0.1:{port}/{FIGURES[2]}", wait_until="load")
        page.wait_for_selector("#areaSvg path.band")
        f8 = page.evaluate(r"""
        async()=>{const wait=()=>new Promise(r=>setTimeout(r,1300)),out={paths:document.querySelectorAll('#areaSvg path.band').length,recipient:window.ODA_F8.state.get().recipient};
          let model=await window.ODA_F8.buildData();out.total2028=model.data[4].total;
          document.querySelector('[data-unit="pct"]').click();await wait();out.percent={unit:window.ODA_F8.state.get().unit,measureHidden:document.getElementById('measureToggle').closest('.control-group').hidden,paths:document.querySelectorAll('#areaSvg path.band').length};
          document.querySelector('[data-unit="usd"]').click();await wait();const sector=document.getElementById('sectorSelect');sector.value='120';sector.dispatchEvent(new Event('change'));await wait();out.sector={value:window.ODA_F8.state.get().sector,paths:document.querySelectorAll('#areaSvg path.band').length};
          const scenario=document.getElementById('scenarioSelect');scenario.value='S7';scenario.dispatchEvent(new Event('change'));await wait();out.persisted=window.ODA_F8.state.get().recipient;return out;}
        """)
        page.close()

        page = browser.new_page(viewport={"width": 1200, "height": 900})
        page.route("**/cube/S1__gross.bin.gz", lambda route: route.fulfill(status=503, body="test"))
        page.goto(f"http://127.0.0.1:{port}/{FIGURES[2]}", wait_until="load")
        page.wait_for_selector("#areaSvg path.band")
        page.select_option("#sectorSelect", "120")
        page.wait_for_selector(".oda-failstate", timeout=20000)
        f8_failure = page.locator(".oda-failstate").is_visible()
        page.close()
        browser.close()

    results.update(f6=f6, f7=f7, f8=f8, f7_failure=f7_failure, f8_failure=f8_failure)
    if f6["topIso"] != expected["f6_top_iso"] or not math.isclose(f6["topShare"], expected["f6_top_share"], rel_tol=2e-6):
        findings.append("F6 top recipient/share differs from an independent raw-payload computation")
    if f6["rowCount"] != 10 or len(f6["legend"]) != 6 or not f6["popup"]["open"] or f6["popup"]["rows"] != 10 or f6["persisted"] != f6["popup"]["selected"]:
        findings.append("F6 paging, fixed donor legend, popup or scenario persistence failed")
    if not math.isclose(f7["default"]["sum"], expected["ukr_recipient_aggregate_2028"], rel_tol=2e-5, abs_tol=0.02):
        findings.append("F7 default cube sum does not reconcile to the recipient aggregate")
    if f7["default"]["measureHidden"] or f7["persisted"] != f7["default"]["focus"] or not f7["specific"]["nestHidden"] or f7["donor"]["type"] != "donor" or f7["donor"]["marks"] == 0 or not f7_failure:
        findings.append("F7 measure, selection, partner, donor-focus or lazy-failure state failed")
    if not math.isclose(f8["total2028"], expected["ukr_donor_sum_2028"], rel_tol=2e-6, abs_tol=0.01):
        findings.append("F8 default annual total differs from the independent donor-recipient sum")
    if f8["paths"] != 9 or f8["percent"]["unit"] != "pct" or not f8["percent"]["measureHidden"] or f8["sector"]["paths"] == 0 or f8["persisted"] != f8["recipient"] or not f8_failure:
        findings.append("F8 bands, unit, measure visibility, sector, persistence or lazy-failure state failed")

    print(json.dumps(results, indent=2))
    if findings:
        print("FINDINGS:")
        for finding in findings:
            print("  - " + finding)
        return 1
    print("Figures 6-8 state and independent payload exercise clean.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
