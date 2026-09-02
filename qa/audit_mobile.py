import threading,functools,http.server,socketserver,json,glob,sys
from playwright.sync_api import sync_playwright
H=functools.partial(http.server.SimpleHTTPRequestHandler,directory='.')
socketserver.TCPServer.allow_reuse_address=True
srv=socketserver.TCPServer(('127.0.0.1',8835),H)
threading.Thread(target=srv.serve_forever,daemon=True).start()
figs=sorted(f[:-5] for f in glob.glob('f*.html'))
AUDIT=r"""()=>{
 const bad=[];
 const shown=n=>{const cs=getComputedStyle(n);return cs.display!=='none'&&cs.visibility!=='hidden'&&n.getClientRects().length>0;};
 const scrollableAncestor=n=>{for(let p=n.parentElement;p&&p!==document.body;p=p.parentElement){
   const o=getComputedStyle(p);if(/auto|scroll/.test(o.overflowX)||/auto|scroll/.test(o.overflow))return true;}return false;};
 const clipAncestor=n=>{for(let p=n.parentElement;p&&p!==document.body;p=p.parentElement){
   const o=getComputedStyle(p);if(o.overflow!=='visible'||o.overflowX!=='visible'||o.overflowY!=='visible')return p;}return null;};
 const vw=document.documentElement.clientWidth;
 // painted box escaping the frame, ignoring deliberate scroll regions and SVG internals
 for(const n of document.querySelectorAll('.viz-wrapper *')){
   if(n.ownerSVGElement)continue;
   if(!shown(n)||scrollableAncestor(n))continue;
   const b=n.getBoundingClientRect(); if(!b.width&&!b.height)continue;
   if(b.right>vw+1||b.left<-1)bad.push({t:'escapes frame',el:n.tagName+'.'+String(n.className).slice(0,24),right:Math.round(b.right),vw,txt:(n.textContent||'').trim().slice(0,26)});
 }
 // text actually cut off by a clipping ancestor, excluding deliberate ellipsis
 for(const n of document.querySelectorAll('.viz-wrapper button,.viz-wrapper label,.viz-wrapper .control-label,.viz-wrapper output,.viz-wrapper select')){
   if(!shown(n)||scrollableAncestor(n))continue;
   if(getComputedStyle(n).textOverflow==='ellipsis')continue;
   const anc=clipAncestor(n);
   const selfClip=getComputedStyle(n).overflow!=='visible'&&(n.scrollWidth>n.clientWidth+1||n.scrollHeight>n.clientHeight+1);
   let ancClip=false;
   if(anc){const a=n.getBoundingClientRect(),p=anc.getBoundingClientRect();
     ancClip=a.right>p.right+1||a.left<p.left-1||a.bottom>p.bottom+1||a.top<p.top-1;}
   if(selfClip||ancClip)bad.push({t:'clipped control text',el:n.tagName,txt:n.textContent.trim().slice(0,30)});
 }
 // overlapping control groups
 for(const p of document.querySelectorAll('.controls')){
   if(!shown(p))continue;const kids=[...p.children].filter(shown);
   for(let i=0;i<kids.length;i++)for(let j=i+1;j<kids.length;j++){
     const a=kids[i].getBoundingClientRect(),b=kids[j].getBoundingClientRect();
     if(a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1)
       bad.push({t:'controls overlap',a:kids[i].textContent.trim().slice(0,20),b:kids[j].textContent.trim().slice(0,20)});}}
 // tap targets on things that open or change something
 for(const n of document.querySelectorAll('.viz-wrapper button,.viz-wrapper select,.viz-wrapper input[type=checkbox]')){
   if(!shown(n))continue;
   let b=n.getBoundingClientRect();
   // WCAG 2.2 counts the label as part of the target where clicking the label
   // activates the control. A 15px checkbox on a 24px line is a 24px target; a 15px
   // checkbox with no label is not. Measure the union, not the box.
   if(n.type==='checkbox'){
     const lab=(n.id&&document.querySelector(`label[for="${n.id}"]`))||n.closest('label');
     if(lab&&shown(lab)){const l=lab.getBoundingClientRect();
       b={height:Math.max(b.bottom,l.bottom)-Math.min(b.top,l.top)};}
   }
   if(b.height>0&&b.height<24)bad.push({t:'tap target <24px',txt:(n.textContent||n.id||n.type).trim().slice(0,22),h:Math.round(b.height)});}
 // SVG marks drawn outside their own viewBox
 for(const svg of document.querySelectorAll('svg')){
   const vb=svg.viewBox&&svg.viewBox.baseVal; if(!vb||!vb.width)continue;
   for(const c of svg.querySelectorAll('circle,rect.bar,path.band,path.series')){
     const cx=+c.getAttribute('cx'),cy=+c.getAttribute('cy');
     if(Number.isFinite(cx)&&(cx<vb.x-1||cx>vb.x+vb.width+1))bad.push({t:'mark outside plot',cx:Math.round(cx),label:c.getAttribute('aria-label')||''});
     if(Number.isFinite(cy)&&(cy<vb.y-1||cy>vb.y+vb.height+1))bad.push({t:'mark outside plot (y)',cy:Math.round(cy),label:c.getAttribute('aria-label')||''});}}
 // A native <select> clips its option text silently: no scrollWidth, no
 // overflow, just an unreadable label. Measure the selected option against the
 // select's inner width (minus the arrow well and padding).
 const cv=document.createElement('canvas').getContext('2d');
 for(const sel of document.querySelectorAll('select')){
   if(!shown(sel))continue;
   const cs=getComputedStyle(sel);
   cv.font=`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
   const txt=sel.selectedOptions[0]?sel.selectedOptions[0].text:'';
   const inner=sel.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
   const w=cv.measureText(txt).width;
   // Some truncation is unavoidable: at 320px no control can show
   // "Democratic Republic of the Congo", and a native select still shows the full
   // text when opened. Flag only where so little survives that the reader cannot
   // tell what is selected.
   if(txt&&w>0&&inner/w<0.6)bad.push({t:'select option text severely clipped',id:sel.id||'?',txt:txt.slice(0,34),visibleFraction:+(inner/w).toFixed(2),needs:Math.round(w),has:Math.round(inner)});
 }
 // A select whose value matches no option shows BLANK: the reader cannot see
 // what is selected, and nothing else about the page looks wrong. This is how
 // the cut-threshold control in F10 and F15 was silently empty.
 for(const sel of document.querySelectorAll('select')){
   if(!shown(sel))continue;
   if(sel.selectedIndex===-1)bad.push({t:'select shows no selected option',id:sel.id||sel.getAttribute('aria-label')||'?',value:sel.value});
 }
 // Trailing blank space on a control row. Every row of the bank should be filled
 // by the controls on it: a wrapped row that stops short leaves a bare stripe of
 // panel, which reads as a missing control rather than as spare room.
 for(const p of document.querySelectorAll('.controls')){
   if(!shown(p))continue;
   const cs=getComputedStyle(p),box=p.getBoundingClientRect();
   const right=box.right-parseFloat(cs.paddingRight),left=box.left+parseFloat(cs.paddingLeft);
   // Controls on one row do not share a top: the house row is align-items:flex-start
   // and a two-line label pushes its control down. Group by vertical OVERLAP, not by
   // a rounded top, or every tall control reads as a row of its own.
   const lines=[];
   for(const k of [...p.children].filter(shown)){
     const b=k.getBoundingClientRect(); if(!b.height)continue;
     const line=lines.find(l=>b.top<l.bottom-4&&b.bottom>l.top+4);
     if(line){line.top=Math.min(line.top,b.top);line.bottom=Math.max(line.bottom,b.bottom);line.r=Math.max(line.r,b.right);}
     else lines.push({top:b.top,bottom:b.bottom,r:b.right});
   }
   for(const v of lines){
     const slack=right-v.r;
     if(slack>48&&right-left>200)bad.push({t:'blank space on control row',slack:Math.round(slack),rowWidth:Math.round(right-left)});
   }
 }
 const yc=document.querySelector('.oda-year');
 if(yc){const vis=x=>x&&getComputedStyle(x).display!=='none';
   const st=vis(yc.querySelector('.oda-year-stepper')),sl=vis(yc.querySelector('.oda-year-slider'));
   if(st===sl)bad.push({t:'year control shows both or neither',stepper:st,slider:sl});}
 if(document.querySelector('[id$="-tip"]'))bad.push({t:'scenario hint line still present'});
 return {bad,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
   controlsH:Math.round([...document.querySelectorAll('.controls')].filter(shown).reduce((z,n)=>z+n.getBoundingClientRect().height,0))};
}"""
issues=0
with sync_playwright() as pw:
    b=pw.chromium.launch()
    for f in figs:
        rep=[]
        for w in (320,390,430,768,900):
            pg=b.new_page(viewport={'width':w,'height':900})
            pg.goto(f'http://127.0.0.1:8835/{f}.html')
            try: pg.wait_for_function("window.CGD_READY===true",timeout=25000)
            except Exception: rep.append(f'  {w}: NEVER READY'); pg.close(); issues+=1; continue
            pg.wait_for_timeout(700)
            r=pg.evaluate(AUDIT)
            if r['bad'] or r['overflow']>1:
                seen=set();uniq=[]
                for i in r['bad']:
                    k=json.dumps(i,sort_keys=True)[:70]
                    if k not in seen: seen.add(k);uniq.append(i)
                rep.append(f'  {w}px  overflow={r["overflow"]} controlsH={r["controlsH"]}')
                for i in uniq[:5]: rep.append('     '+json.dumps(i))
                issues+=len(uniq)
            pg.close()
        print(f+('' if rep else '   clean'))
        print('\n'.join(rep))
    b.close()
srv.shutdown()
print('\nTOTAL ISSUES:',issues)
