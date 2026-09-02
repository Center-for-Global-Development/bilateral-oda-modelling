#!/usr/bin/env python
"""Responsive, interaction and independent raw-payload checks for Figure 16."""
from __future__ import annotations

import gzip
import json
import math
import struct
from pathlib import Path

from playwright.sync_api import sync_playwright

from verify import REPO, serve

RELEASE = REPO / "data" / "static-v2.2.9-swe-exit-scope"
FIGURE = "f16-interactive-allocations-tool.html"
LAMBDA = 2.3
EPS = 1e-7


def load_blob(manifest: dict, name: str) -> tuple[float, ...] | tuple[int, ...]:
    spec = manifest["blobs"][name]
    raw = gzip.decompress((RELEASE / spec["file"]).read_bytes())
    codes = {"float32": "f", "uint16": "H"}
    return struct.unpack(f"<{spec['count']}{codes[spec['dtype']]}", raw)


def quantile_r7(values: list[float], q: float) -> float:
    ordered = sorted(values)
    if not ordered:
        return 1.0
    h = (len(ordered) - 1) * q
    lo = int(math.floor(h))
    hi = int(math.ceil(h))
    return ordered[lo] + (ordered[hi] - ordered[lo]) * (h - lo)


def allocate_desired(anchor: list[float], score: list[float], target: float) -> list[float]:
    total = sum(anchor)
    if abs(target - total) <= EPS:
        return anchor[:]
    if target > total:
        weights = [v * math.exp(LAMBDA * q) for v, q in zip(anchor, score)]
        denom = sum(weights)
        return [v + (target - total) * w / denom for v, w in zip(anchor, weights)]
    cut = total - target
    weights = [v * math.exp(-LAMBDA * q) for v, q in zip(anchor, score)]
    result = anchor[:]
    active = set(range(len(anchor)))
    while cut > EPS and active:
        denom = sum(weights[i] for i in active)
        proposed = {i: cut * (weights[i] / denom if denom > EPS else 1 / len(active)) for i in active}
        closing = [i for i in active if proposed[i] >= result[i] - EPS]
        if not closing:
            for i in active:
                result[i] -= proposed[i]
            cut = 0
        else:
            for i in closing:
                cut -= result[i]
                result[i] = 0
                active.remove(i)
    return [0 if x < EPS else x for x in result]


def project_box(desired: list[float], target: float, closed: set[int]) -> list[float]:
    floor = max(target / max(len(desired), 1) * 1e-4, 1e-8)
    scale = [max(x, floor) for x in desired]

    def allocate(mu: float) -> list[float]:
        return [0 if i in closed else max(0, d + mu * scale[i]) for i, d in enumerate(desired)]

    at_zero = sum(allocate(0))
    lo = hi = 0.0
    if at_zero > target:
        lo = -1.0
        while sum(allocate(lo)) > target:
            lo *= 2
    else:
        hi = 1.0
        while sum(allocate(hi)) < target:
            hi *= 2
    for _ in range(200):
        mid = (lo + hi) / 2
        if sum(allocate(mid)) < target:
            lo = mid
        else:
            hi = mid
        if hi - lo <= 1e-15 * max(1.0, abs(hi)):
            break
    return allocate((lo + hi) / 2)


def reference_default() -> dict:
    manifest = json.loads((RELEASE / "manifest.json").read_text(encoding="utf-8"))
    donors = manifest["axes"]["donor"]["values"]
    recipients = manifest["axes"]["recipient"]["values"]
    years = manifest["axes"]["year"]["values"]
    di, yi, si = donors.index("USA"), years.index(2028), manifest["scenarios"].index("S1")
    nd, nr, ny = len(donors), len(recipients), len(years)
    base_ge = load_blob(manifest, "tool/baseline_recipient_ge")
    floors = load_blob(manifest, "tool/country_floor_gross")
    needs = load_blob(manifest, "tool/need_poverty")
    envelope_blob = load_blob(manifest, "tool/envelope_ge")
    pin_donor = load_blob(manifest, "tool/pinned_donor_index")
    pin_recipient = load_blob(manifest, "tool/pinned_recipient_index")
    pin_ge = load_blob(manifest, "tool/pinned_ge")
    gross = load_blob(manifest, "scenarios/S1/donor_recipient_year__gross")
    envelope = envelope_blob[(si * nd + di) * ny + yi]
    pins: dict[int, float] = {}
    for pi, (pdi, pri) in enumerate(zip(pin_donor, pin_recipient)):
        if pdi == di:
            pins[pri] = pin_ge[(si * len(pin_donor) + pi) * ny + yi]
    support = [ri for ri in range(nr) if base_ge[di * nr + ri] > 0]
    free = [ri for ri in support if ri not in pins]
    pinned_total = sum(pins.values())
    target = envelope - pinned_total
    peer = [sum(gross[(dj * nr + ri) * ny + yi] for dj in range(nd) if dj != di) for ri in range(nr)]
    focal = [gross[(di * nr + ri) * ny + yi] for ri in range(nr)]
    need_total = sum(max(0, x) for x in needs if math.isfinite(x))
    peer_total = sum(peer[ri] for ri, value in enumerate(needs) if math.isfinite(value))
    gaps = [max(0, max(0, needs[ri]) / need_total * peer_total - peer[ri]) for ri in range(nr)]
    p95 = quantile_r7([x for x in gaps if x > 0], 0.95)
    scores = [min(1, gaps[ri] / p95) for ri in free]
    anchor = [base_ge[di * nr + ri] for ri in free]
    desired = allocate_desired(anchor, scores, target)
    ratio = sum(focal) / envelope
    closed: set[int] = set()
    allocation = desired[:]
    while True:
        allocation = project_box(desired, target, closed) if closed else desired[:]
        candidates = [i for i, ri in enumerate(free)
                      if i not in closed and allocation[i] > EPS
                      and allocation[i] * ratio + EPS < floors[di * nr + ri]]
        if not candidates:
            break
        close = min(candidates, key=lambda i: (scores[i], allocation[i], recipients[free[i]]))
        closed.add(close)
    recommended = {recipients[ri]: pins[ri] if ri in pins else allocation[free.index(ri)] for ri in support}
    sample = max(recommended, key=lambda iso: recommended[iso])
    return {
        "envelope": envelope,
        "pinned_total": pinned_total,
        "discretionary": target,
        "support_count": len(support),
        "closed_count": len(closed),
        "sum_recommended": sum(recommended.values()),
        "sample_iso": sample,
        "sample_value": recommended[sample],
    }


def main() -> int:
    expected = reference_default()
    findings: list[str] = []
    shots = REPO / "qa" / "shots"
    shots.mkdir(parents=True, exist_ok=True)
    with serve(REPO) as port, sync_playwright() as pw:
        browser = pw.chromium.launch()
        url = f"http://127.0.0.1:{port}/{FIGURE}"
        for width in (320, 768, 1200):
            page = browser.new_page(viewport={"width": width, "height": 900})
            page.goto(url)
            page.wait_for_function("() => window.CGD_READY === true", timeout=20000)
            page.screenshot(path=str(shots / f"{Path(FIGURE).stem}-{width}.png"), full_page=True)
            page.close()

        page = browser.new_page(viewport={"width": 1200, "height": 900})
        errors: list[str] = []
        page.on("pageerror", lambda exc: errors.append(str(exc)))
        page.goto(url)
        page.wait_for_function("() => window.CGD_READY === true", timeout=20000)
        result = page.evaluate(
            """async expectedIso => {
              const wait = async () => { await new Promise(r => setTimeout(r, 500)); };
              const state = ODA_F16.state;
              const current = () => ODA_F16.derive(state.get(), {poverty:state.get().poverty,humanitarian:state.get().humanitarian,fiscal:state.get().fiscal});
              const first = current();
              const out = {
                default: {
                  scenario: state.get().scenario, donor: state.get().donor, year: state.get().year,
                  weights: [state.get().poverty,state.get().humanitarian,state.get().fiscal],
                  rows: ODA_F16.rows().length, envelope:first.solution.envelope,
                  pinned:first.solution.pinnedTotal, discretionary:first.solution.discretionary,
                  total:[...first.solution.recommended.values()].reduce((a,b)=>a+b,0),
                  projectedTotal:first.rows.reduce((a,b)=>a+b.projected,0),
                  heldMaxChange:Math.max(...first.rows.filter(x=>x.held).map(x=>Math.abs(x.change)),0),
                  closed:first.solution.closed.size,
                  sample:first.solution.recommended.get(expectedIso),
                  resources:performance.getEntriesByType('resource').filter(x=>x.name.includes('/scenarios/')).map(x=>x.name),
                  availability:document.getElementById('objectiveAvailability').textContent,
                  presetsEnabled:[...document.querySelectorAll('[data-objective]')].every(b=>!b.disabled),
                  humanitarianNote:await (async()=>{document.querySelector('[data-objective="humanitarian"]').click();await new Promise(q=>setTimeout(q,1200));const t=document.getElementById('noPriorityNote').textContent;document.querySelector('[data-objective="poverty"]').click();await new Promise(q=>setTimeout(q,1200));return t})(),
                  notesCollapsed:!document.querySelector('#notes details').open,
                  notesText:document.getElementById('notes').textContent,
                  noMeasure:!document.getElementById('measureToggle'),
                  noOptimal:!document.body.textContent.toLowerCase().includes('optimal')
                }
              };

              state.set({year:2027}); await wait();
              out.yearResources=performance.getEntriesByType('resource').filter(x=>x.name.includes('/scenarios/')).length;

              const donor=document.getElementById('donorSelect'); donor.value='BEL'; donor.dispatchEvent(new Event('change')); await wait();
              document.querySelector('[data-objective="humanitarian"]').click(); await wait();
              out.humanitarian={donor:state.get().donor,weight:state.get().humanitarian,rows:ODA_F16.rows().length};

              document.querySelector('[aria-controls="blendPanel"]').click();
              out.blendAccepted=ODA_F16.setWeights({poverty:.5,humanitarian:.25,fiscal:.25}); await wait();
              out.blend={weights:[state.get().poverty,state.get().humanitarian,state.get().fiscal],visible:!document.getElementById('blendPanel').hidden};

              document.querySelector('[data-view="abs"]').click(); await wait();
              document.getElementById('pinButton').click(); await wait();
              document.querySelector('[data-objective="poverty"]').click(); await wait();
              out.compare={view:state.get().view,rings:document.querySelectorAll('#chart circle[stroke="var(--cgd-blue)"]').length,lines:document.querySelectorAll('#chart line[stroke="var(--cgd-blue)"]').length,url:location.search};

              const scenario=document.getElementById('scenarioSelect'); scenario.value='S7'; scenario.dispatchEvent(new Event('change')); await wait();
              out.scenario={state:state.get().scenario,resources:performance.getEntriesByType('resource').filter(x=>x.name.includes('/scenarios/')).map(x=>x.name),comparisonCleared:!ODA_F16.comparison()};

              donor.value='EST'; donor.dispatchEvent(new Event('change')); await wait();
              out.none={visible:!document.getElementById('discretionNote').hidden,pinDisabled:document.getElementById('pinButton').disabled,summary:document.getElementById('summary').textContent};

              const mark=document.querySelector('#chart circle.current');
              mark.dispatchEvent(new PointerEvent('pointerenter',{bubbles:true,clientX:400,clientY:350}));
              out.tooltip=document.getElementById('tooltip').textContent;

              // The sector diagnostic loads the cube on demand, so it is async: click,
              // wait, then read. A tooltip-style check would pass on an empty dialog.
              const big=[...document.querySelectorAll('#chart circle.current')]
                .sort((a,b)=>(+b.getAttribute('r'))-(+a.getAttribute('r')))[0];
              big.dispatchEvent(new MouseEvent('click',{bubbles:true}));
              for (let i=0;i<40;i++){
                await new Promise(r=>setTimeout(r,150));
                if(document.querySelector('#popupHost circle.dot'))break;
              }
              const card=document.querySelector('#popupHost .oda-modal-card');
              out.sector={open:!!card,
                title:card?card.querySelector('h2').textContent:'',
                dots:card?card.querySelectorAll('circle.dot').length:0,
                caveat:card?[...card.querySelectorAll('.foot')].map(n=>n.textContent).join(' '):''};
              if(card)card.querySelector('.oda-modal-close').click();
              out.sector.closed=!document.querySelector('#popupHost .oda-modal-card');
              return out;
            }""",
            expected["sample_iso"],
        )
        page.evaluate("""async()=>{const wait=()=>new Promise(r=>setTimeout(r,500));const s=ODA_F16.state;s.set({scenario:'S1',donor:'BEL',year:2027,poverty:1,humanitarian:0,fiscal:0,view:'abs'});await wait();if(document.getElementById('blendPanel').hidden)document.querySelector('[aria-controls="blendPanel"]').click();if(ODA_F16.comparison())document.getElementById('pinButton').click();document.getElementById('pinButton').click();ODA_F16.setWeights({poverty:.5,humanitarian:.25,fiscal:.25});await wait();document.getElementById('tooltip').hidden=true} """)
        page.screenshot(path=str(shots / "f16-interactive-allocations-tool-exercised-1200.png"), full_page=True)
        page.close()
        browser.close()

    default = result["default"]
    if errors:
        findings.append("page errors: " + "; ".join(errors))
    for key in ("envelope", "pinned_total", "discretionary", "sum_recommended"):
        actual_key = {"pinned_total": "pinned", "sum_recommended": "total"}.get(key, key)
        if not math.isclose(default[actual_key], expected[key], rel_tol=2e-6, abs_tol=2e-5):
            findings.append(f"default {key} does not match the independent raw-payload solve")
    if default["rows"] != expected["support_count"] or default["closed"] != expected["closed_count"]:
        findings.append("support or viability-closure count does not match the reference solve")
    if not math.isclose(default["sample"], expected["sample_value"], rel_tol=2e-6, abs_tol=2e-5):
        findings.append("named recipient recommendation does not match the reference solve")
    if not math.isclose(default["projectedTotal"], expected["envelope"], rel_tol=2e-6, abs_tol=2e-5) or default["heldMaxChange"] > 2e-5:
        findings.append("projected comparison misses the envelope or moves a policy-held recipient")
    if default["weights"] != [1, 0, 0] or default["scenario"] != "S1" or default["donor"] != "USA" or default["year"] != 2028:
        findings.append("default state is wrong")
    # Two blobs per scenario: gross for the peer score, grant-equivalent for the axis.
    if len(default["resources"]) != 2 or result["yearResources"] != 2:
        findings.append("a non-scenario control fetched scenario data, or the initial scenario fetch is wrong")
    # A non-LDC with no need mass is a documented no-priority case, not a block:
    # every preset stays usable and the affected recipient is named on the face.
    if not default["presetsEnabled"] or default["availability"].strip():
        findings.append("a non-LDC need-mass gap wrongly blocked an objective")
    note = default["humanitarianNote"]
    if "Kosovo" not in note or "no priority" not in note or "not a least developed country" not in note:
        findings.append(f"the no-priority recipient is not named on the face: {note!r}")
    if not default["notesCollapsed"] or not default["noMeasure"] or not default["noOptimal"]:
        findings.append("notes, fixed units or framing contract failed")
    if result["humanitarian"] != {"donor": "BEL", "weight": 1, "rows": 89}:
        findings.append("valid humanitarian preset did not solve for Belgium")
    if not result["blendAccepted"] or result["blend"]["weights"] != [0.5, 0.25, 0.25] or not result["blend"]["visible"]:
        findings.append("advanced blend did not update the continuous shared weight state")
    if result["compare"]["view"] != "abs" or not result["compare"]["rings"] or not result["compare"]["lines"] or "pp=" not in result["compare"]["url"]:
        findings.append("absolute view, pinned overlay or URL state failed")
    if result["scenario"]["state"] != "S7" or len(result["scenario"]["resources"]) != 4 or not result["scenario"]["comparisonCleared"]:
        findings.append("scenario fetch or stale comparison reset failed")
    if not result["none"]["visible"] or not result["none"]["pinDisabled"] or "No allocation can move" not in result["none"]["summary"]:
        findings.append("no-discretionary-allocation state failed")
    if "Income group" not in result["tooltip"]:
        findings.append("tooltip does not include income group")
    sector = result.get("sector") or {}
    if not sector.get("open") or not sector.get("dots"):
        findings.append("sector diagnostic did not open with plotted sectors")
    if "gross" not in sector.get("caveat", ""):
        findings.append("sector diagnostic does not state the peer measure basis")
    # The descriptive framing is a standing caveat, so it lives in the figure's
    # Notes rather than in the dialog. Assert it is still somewhere the reader
    # can find it, not merely that it was removed from the popup.
    if "descriptive only" not in default.get("notesText", ""):
        findings.append("notes do not state that the sector drill-down is descriptive")
    if not sector.get("closed"):
        findings.append("sector diagnostic did not close")

    print(json.dumps({"expected": expected, "browser": result, "findings": findings}, indent=2))
    return 1 if findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
