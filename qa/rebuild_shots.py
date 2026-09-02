"""Rebuild qa/shots from scratch: every figure at four widths, plus the
interaction states that are worth a picture. Deletes the directory contents first,
so nothing stale can survive a rename or a removed view."""
import threading, functools, http.server, socketserver, pathlib, glob, os
from playwright.sync_api import sync_playwright

H = functools.partial(http.server.SimpleHTTPRequestHandler, directory='.')
socketserver.TCPServer.allow_reuse_address = True
srv = socketserver.TCPServer(('127.0.0.1', 8853), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()

OUT = pathlib.Path('qa/shots')
OUT.mkdir(parents=True, exist_ok=True)
removed = 0
for f in glob.glob(str(OUT / '*.png')):
    os.remove(f); removed += 1
print('removed', removed, 'old shots')

FIGURES = [
    'f1-donor-headline-cuts', 'f2-traceable-oda', 'f3-flows-and-losses-map',
    'f4-recipient-sector-losses', 'f5-fiscal-loss', 'f6-donor-attributed-losses',
    'f7-oda-treemap', 'f8-donor-oda-over-time', 'f9-poverty-share-allocation',
    'f10-orphaned-recipient-sector-pairs', 'f11-top-donor-reliance',
    'f12-recipient-losses-across-scenarios', 'f13-donor-flows-by-scenario',
    'f14-priority-flows-across-scenarios', 'f15-orphaning-across-scenarios',
    'f16-interactive-allocations-tool', 'f17-recipient-scenarios-table',
]
WIDTHS = (320, 390, 768, 1200)

def shoot(b, fig, w, out, after=None, wait=1400):
    pg = b.new_page(viewport={'width': w, 'height': 900})
    pg.goto(f'http://127.0.0.1:8853/{fig}.html')
    try:
        pg.wait_for_function("window.CGD_READY===true", timeout=30000)
    except Exception:
        print('NEVER READY', out); pg.close(); return False
    pg.wait_for_timeout(600)
    if after:
        try:
            after(pg)
        except Exception as e:
            print('interaction failed', out, type(e).__name__); pg.close(); return False
        pg.wait_for_timeout(wait)
    pg.screenshot(path=str(OUT / f'{out}.png'), full_page=True)
    pg.close()
    return True

def click(sel):
    return lambda pg: pg.click(sel)

def pick(sel, text):
    def go(pg):
        pg.evaluate("""([sel, text]) => {
          const s = document.querySelector(sel);
          const o = [...s.options].find(o => o.text === text);
          if (!o) throw new Error('no option ' + text);
          s.value = o.value; s.dispatchEvent(new Event('change'));
        }""", [sel, text])
    return go

STATES = [
    # F1: the indexed scale, which is the answer to small donors on a shared axis
    ('f1-donor-headline-cuts', 1200, 'f1-indexed-1200', click('#scaleToggle button[data-scale="index"]')),
    ('f1-donor-headline-cuts', 390, 'f1-indexed-390', click('#scaleToggle button[data-scale="index"]')),
    # F6: the drill-down, and the advanced outlier exclusion
    ('f6-donor-attributed-losses', 1200, 'f6-drilldown-1200', click('.loss-name')),
    ('f6-donor-attributed-losses', 1200, 'f6-outliers-excluded-1200',
     lambda pg: (pg.click('#advancedBtn'), pg.check('#excludeOutliers'))),
    # F7: a focus country other than the Ukraine default, where the portfolio is
    # not one cell taking half the canvas
    ('f7-oda-treemap', 1200, 'f7-ethiopia-1200', pick('#focusSelect', 'Ethiopia')),
    # F10: the band drill-down and its donor sub-drill-down
    ('f10-orphaned-recipient-sector-pairs', 1200, 'f10-drilldown-1200',
     lambda pg: pg.locator('#chart path.band').first.click(force=True)),
    # F16: the two objective states that exercise the tool
    ('f16-interactive-allocations-tool', 1200, 'f16-humanitarian-1200',
     click('[data-objective="humanitarian"]')),
    ('f16-interactive-allocations-tool', 1200, 'f16-blend-1200',
     click('#objectiveButtons button:last-child')),
    # F16: the sector diagnostic, opened on the largest recipient bubble
    ('f16-interactive-allocations-tool', 1200, 'f16-sector-diagnostic-1200',
     lambda pg: (pg.evaluate("""() => {
       const cs=[...document.querySelectorAll('#chart circle.current')];
       cs.sort((a,b)=>(+b.getAttribute('r'))-(+a.getAttribute('r')));
       cs[0].dispatchEvent(new MouseEvent('click',{bubbles:true}));
     }"""), pg.wait_for_selector('#popupHost circle.dot', timeout=20000))),
]

with sync_playwright() as pw:
    b = pw.chromium.launch()
    n = 0
    for fig in FIGURES:
        for w in WIDTHS:
            n += shoot(b, fig, w, f'{fig}-{w}')
    for fig, w, out, after in STATES:
        n += shoot(b, fig, w, out, after)
    b.close()
srv.shutdown()
print('wrote', n, 'shots')
