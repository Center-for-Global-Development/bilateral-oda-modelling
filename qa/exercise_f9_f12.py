"""Interaction, responsive screenshot and independent raw-payload checks for F9-F12."""
from __future__ import annotations
import gzip, json, math, struct
from pathlib import Path
from playwright.sync_api import sync_playwright
from verify import REPO, serve

RELEASE = REPO / "data" / "static-v2.2.9-swe-exit-scope"
FIGURES = ["f9-poverty-share-allocation.html", "f10-orphaned-recipient-sector-pairs.html", "f11-top-donor-reliance.html", "f12-recipient-losses-across-scenarios.html"]

def blob(manifest, name):
    spec = manifest["blobs"][name]; raw = gzip.decompress((RELEASE / spec["file"]).read_bytes())
    fmt = {"float32":"f", "uint8":"B", "uint16":"H", "uint32":"I"}[spec["dtype"]]
    return struct.unpack(f"<{spec['count']}{fmt}", raw)

def expected():
    m=json.loads((RELEASE/"manifest.json").read_text(encoding="utf-8")); rec=m["axes"]["recipient"]["values"]; sec=m["axes"]["sector"]["values"]; years=m["axes"]["year"]["values"]; nr,ns,ny=len(rec),len(sec),len(years)
    need=blob(m,"tool/need_poverty"); base_r=blob(m,"static/baseline_gross__recipient"); total_need=sum(x for x in need if math.isfinite(x) and x>0); total_oda=sum(base_r[i] for i,x in enumerate(need) if math.isfinite(x) and x>0 and base_r[i]>0)
    probe=next(i for i,x in enumerate(need) if math.isfinite(x) and x>0 and base_r[i]>0)
    base_rs=blob(m,"static/baseline_gross__recipient_sector"); cur_rs=blob(m,"scenarios/S1/recipient_sector_year__gross"); yi=years.index(2028)
    def crossed_by(ri, si, upto):
        b = base_rs[ri * ns + si]
        if not b > 0:
            return False
        # 2024 itself can never cross: the baseline is its own comparator.
        return any((b - cur_rs[(ri * ns + si) * ny + y]) / b >= .5 for y in range(upto + 1))
    orphan = sum(1 for ri in range(nr) for si in range(ns) if crossed_by(ri, si, yi))
    # F11's default is the alphabetically first sector name.
    names=m["sector_meta"]
    default_sec=sorted(sec,key=lambda x:names.get(str(x),str(x)))[0]; si=sec.index(default_sec); donors=m["axes"]["donor"]["values"]
    def top_shares(prefix,value_name,year_index=None):
        di=blob(m,prefix+"donor_index"); ri=blob(m,prefix+"recipient_index"); sj=blob(m,prefix+"sector_index"); vals=blob(m,value_name); yj=blob(m,prefix+"year_index") if year_index is not None else None; sums={}
        for i,v in enumerate(vals):
            if sj[i]!=si or (yj is not None and yj[i]!=year_index): continue
            key=ri[i]; row=sums.setdefault(key,{}); row[di[i]]=row.get(di[i],0)+v
        return {rec[k]:max(v.values())/sum(v.values()) for k,v in sums.items() if sum(v.values())>0}
    f11a=top_shares("cube/support2024__","cube/baseline__gross"); f11b=top_shares("cube/support__","cube/S1__gross",yi)
    return {"f9_iso":rec[probe],"f9_x":need[probe]/total_need,"f9_y":base_r[probe]/total_oda,"f10":orphan,"f11_sector":default_sec,"f11a":f11a,"f11b":f11b}

def main():
    exp=expected(); findings=[]; shots=REPO/"qa"/"shots"; shots.mkdir(exist_ok=True)
    with serve(REPO) as port, sync_playwright() as pw:
        browser=pw.chromium.launch()
        for fig in FIGURES:
            for width in (320,768,1200):
                p=browser.new_page(viewport={"width":width,"height":900}); p.goto(f"http://127.0.0.1:{port}/{fig}"); p.wait_for_function("() => window.CGD_READY === true",timeout=20000); p.screenshot(path=str(shots/f"{Path(fig).stem}-{width}.png"),full_page=True); p.close()
        p=browser.new_page(viewport={"width":1200,"height":900}); p.goto(f"http://127.0.0.1:{port}/{FIGURES[0]}"); p.wait_for_function("() => window.CGD_READY === true"); f9=p.evaluate("""async()=>{const r=ODA_F9.rows().find(x=>x.iso==='"""+exp["f9_iso"]+"""');const c=document.querySelector('circle.point');c.dispatchEvent(new PointerEvent('pointerenter',{bubbles:true}));await new Promise(q=>setTimeout(q,200));return{r,path:document.getElementById('trajectory').getAttribute('d'),controls:document.querySelectorAll('.controls>.control-group').length}}"""); p.close()
        p=browser.new_page(viewport={"width":1200,"height":900}); p.goto(f"http://127.0.0.1:{port}/{FIGURES[1]}"); p.wait_for_function("() => window.CGD_READY === true"); f10=p.evaluate("""async()=>{const s=ODA_F10.state.get();const n=ODA_F10.rows().filter(r=>ODA_F10.isOrphanBy(r,2028,s)).length;document.querySelector('path.band').dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:1100}));await new Promise(q=>setTimeout(q,150));const first=!!document.querySelector('.oda-modal-card');const rows=document.querySelectorAll('.oda-rank-row').length;
/* Drill through to the donor detail and confirm the sub-dialog STACKS on its
   parent rather than replacing it, so closing it returns to the ranked list. */
document.querySelector('.oda-rank-row button').click();await new Promise(q=>setTimeout(q,900));const stacked=document.querySelectorAll('.oda-modal-card').length;
return{n,popup:first,rows,stacked}}"""); p.close()
        p=browser.new_page(viewport={"width":1200,"height":900}); p.goto(f"http://127.0.0.1:{port}/{FIGURES[2]}"); p.wait_for_function("() => window.CGD_READY === true"); f11=p.evaluate("""async()=>{const s=ODA_F11.state.get(),r=ODA_F11.rows().find(x=>x.key in {})||ODA_F11.rows()[0];document.querySelector('circle.point').dispatchEvent(new MouseEvent('click',{bubbles:true}));await new Promise(q=>setTimeout(q,100));return{s,r,popup:!!document.querySelector('.oda-modal-card'),donors:document.querySelectorAll('.oda-rank-row').length}}"""); p.close()
        p=browser.new_page(viewport={"width":1200,"height":900}); p.goto(f"http://127.0.0.1:{port}/{FIGURES[3]}"); p.wait_for_function("() => window.CGD_READY === true"); f12=p.evaluate("""async()=>{const out={legend:document.querySelectorAll('#legend button').length,rows:ODA_F12.shown().length,pctHidden:document.getElementById('measureToggle').closest('.control-group').hidden};const m=document.getElementById('metricSelect');m.value='usd';m.dispatchEvent(new Event('change'));await new Promise(q=>setTimeout(q,1200));out.usdVisible=!document.getElementById('measureToggle').closest('.control-group').hidden;document.querySelector('#chart circle').dispatchEvent(new MouseEvent('click',{bubbles:true}));await new Promise(q=>setTimeout(q,1200));out.popup=!!document.querySelector('.popup-card');out.popupMetric=!!document.getElementById('popupMetric');return out}"""); p.close(); browser.close()
    r=f9["r"]
    if not r or not math.isclose(r["x"],exp["f9_x"],rel_tol=2e-6) or not math.isclose(r["y"],exp["f9_y"],rel_tol=2e-6) or not f9["path"] or f9["controls"]!=3: findings.append("F9 raw shares, trajectory, or control count failed")
    if f10["n"]!=exp["f10"] or not f10["popup"] or not f10["rows"] or f10["stacked"]!=2: findings.append(f"F10 cumulative orphan count or drill-down failed: {f10} vs expected {exp['f10']}")
    probe=f11["r"]; iso=probe["key"]
    if f11["s"]["selected"]!=exp["f11_sector"] or not math.isclose(probe["x"],exp["f11a"][iso],rel_tol=2e-5) or not math.isclose(probe["y"],exp["f11b"][iso],rel_tol=2e-5) or not f11["popup"]: findings.append("F11 raw top-donor shares, default, or popup failed")
    if f12!={"legend":10,"rows":15,"pctHidden":True,"usdVisible":True,"popup":True,"popupMetric":True}: findings.append(f"F12 controls, legend, paging or popup failed: {f12}")
    print(json.dumps({"f9":f9,"f10":f10,"f11":{"state":f11["s"],"probe":probe,"popup":f11["popup"]},"f12":f12,"findings":findings},indent=2)); return 1 if findings else 0

if __name__=="__main__": raise SystemExit(main())
