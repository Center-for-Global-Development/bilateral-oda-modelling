"""Responsive screenshots, interactions and raw-payload checks for F13-F15."""
from __future__ import annotations
import gzip, json, math, struct
from pathlib import Path
from playwright.sync_api import sync_playwright
from verify import REPO, serve

RELEASE=REPO/'data'/'static-v2.2.9-swe-exit-scope'
FIGURES=['f13-donor-flows-by-scenario.html','f14-priority-flows-across-scenarios.html','f15-orphaning-across-scenarios.html']
def blob(m,name):
    s=m['blobs'][name]; raw=gzip.decompress((RELEASE/s['file']).read_bytes()); return struct.unpack(f"<{s['count']}f",raw)
def expected():
    m=json.loads((RELEASE/'manifest.json').read_text(encoding='utf-8')); ds=m['axes']['donor']['values']; rs=m['axes']['recipient']['values']; ss=m['axes']['sector']['values']; ys=m['axes']['year']['values']; di=ds.index('USA'); yi=ys.index(2028); nd,nr,ns,ny=len(ds),len(rs),len(ss),len(ys)
    f13=blob(m,'scenarios/S1/donor_sector_year__gross'); total=sum(f13[(di*ns+si)*ny+yi] for si in range(ns))
    base=blob(m,'static/baseline_gross__recipient'); cur=blob(m,'scenarios/S1/recipient_year__gross'); ldc0=sum(base[i] for i,r in enumerate(rs) if m['recipient_meta'][r]['ldc']==1)/sum(base); ldc1=sum(cur[i*ny+yi] for i,r in enumerate(rs) if m['recipient_meta'][r]['ldc']==1)/sum(cur[i*ny+yi] for i in range(nr))
    brs=blob(m,'static/baseline_gross__recipient_sector'); crs=blob(m,'scenarios/S1/recipient_sector_year__gross')
    # Cumulative, matching the figure: counted from the first year it crosses.
    orphan=sum(1 for ri in range(nr) for si in range(ns)
               if (b:=brs[ri*ns+si])>0
               and any((b-crs[(ri*ns+si)*ny+y])/b>=.5 for y in range(yi+1)))
    return {'f13_total':total,'f14_base':ldc0,'f14_s1':ldc1,'f15_pairs':sum(x>0 for x in brs),'f15_s1':orphan}
def main():
    exp=expected(); findings=[]; shots=REPO/'qa'/'shots'; shots.mkdir(exist_ok=True)
    with serve(REPO) as port,sync_playwright() as pw:
        b=pw.chromium.launch()
        for fig in FIGURES:
            for width in (320,768,1200):
                p=b.new_page(viewport={'width':width,'height':900}); p.goto(f'http://127.0.0.1:{port}/{fig}'); p.wait_for_function('() => window.CGD_READY === true',timeout=20000); p.screenshot(path=str(shots/f'{Path(fig).stem}-{width}.png'),full_page=True); p.close()
        p=b.new_page(viewport={'width':1200,'height':900}); p.goto(f'http://127.0.0.1:{port}/{FIGURES[0]}'); p.wait_for_function('() => window.CGD_READY === true'); f13=p.evaluate("""async()=>{const out={total:ODA_F13.rows()[0].total,cube:performance.getEntriesByType('resource').some(x=>x.name.includes('/cube/'))};document.querySelector('[data-unit="pct"]').click();await new Promise(r=>setTimeout(r,800));out.pct={hidden:document.getElementById('measureToggle').closest('.control-group').hidden,rects:document.querySelectorAll('#chart rect').length};document.getElementById('splitSelect').value='region';document.getElementById('splitSelect').dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,800));out.region=ODA_F13.rows()[0].map.size;return out}"""); p.close()
        p=b.new_page(viewport={'width':1200,'height':900}); p.goto(f'http://127.0.0.1:{port}/{FIGURES[1]}'); p.wait_for_function('() => window.CGD_READY === true'); f14=p.evaluate("""async()=>{const vals=ODA_F14.rows(),out={base:ODA_F14.baseline(),s1:vals.find(x=>x.scenario==='S1').value,dots:document.querySelectorAll('#chart circle').length,hidden:document.getElementById('measureToggle').closest('.control-group').hidden};const s=document.getElementById('metricSelect');s.value='poverty';s.dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,800));out.povertyVisible=!document.getElementById('measureToggle').closest('.control-group').hidden;return out}"""); p.close()
        p=b.new_page(viewport={'width':1200,'height':900}); p.goto(f'http://127.0.0.1:{port}/{FIGURES[2]}'); p.wait_for_function('() => window.CGD_READY === true'); f15=p.evaluate("""async()=>{const out={pairs:ODA_F15.pairs().length,s1:ODA_F15.series()[0].values.at(-1).count,lines:document.querySelectorAll('path.series').length};document.getElementById('modeSelect').value='deviation';document.getElementById('modeSelect').dispatchEvent(new Event('change'));document.getElementById('unitSelect').value='pct';document.getElementById('unitSelect').dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,800));out.ref=ODA_F15.series()[0].values.every(x=>Math.abs(x.value)<1e-9);document.querySelector('path.series').dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:900}));await new Promise(r=>setTimeout(r,100));out.popup=!!document.querySelector('.oda-modal-card');out.popupRows=document.querySelectorAll('.oda-rank-row').length;document.querySelector('.oda-rank-row button').click();await new Promise(r=>setTimeout(r,900));out.stacked=document.querySelectorAll('.oda-modal-card').length;return out}"""); p.close(); b.close()
    if not math.isclose(f13['total'],exp['f13_total'],rel_tol=2e-6) or f13['cube'] or not f13['pct']['hidden'] or f13['pct']['rects']==0 or f13['region']==0: findings.append('F13 aggregate total, no-cube, unit, measure or split check failed')
    if not math.isclose(f14['base'],exp['f14_base'],rel_tol=2e-6) or not math.isclose(f14['s1'],exp['f14_s1'],rel_tol=2e-6) or f14['dots']!=10 or not f14['hidden'] or not f14['povertyVisible']: findings.append('F14 baseline, S1, dot or measure-visibility check failed')
    if f15['pairs']!=exp['f15_pairs'] or f15['s1']!=exp['f15_s1'] or f15['lines']!=10 or not f15['ref'] or not f15['popup'] or not f15['popupRows'] or f15.get('stacked')!=2: findings.append(f"F15 denominator, cumulative orphan count, comparison or shared drill-down failed: {f15} vs s1={exp['f15_s1']}")
    print(json.dumps({'expected':exp,'f13':f13,'f14':f14,'f15':f15,'findings':findings},indent=2)); return 1 if findings else 0
if __name__=='__main__': raise SystemExit(main())
