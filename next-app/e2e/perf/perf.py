import os,sys,json,time,subprocess
from playwright.sync_api import sync_playwright
BASE=os.environ.get("BASE","http://localhost:3200"); PW=os.environ.get("PW","LocalDevPass12345"); THROTTLE=os.environ.get("THROTTLE","0")=="1"; AUTH=os.environ.get("AUTH","1")=="1"
if BASE.startswith("http://localhost"): subprocess.run(["bash","/tmp/localclean.sh"])
PAGES=["/dashboard","/companies","/agents","/ledger","/identifiers","/settlements","/reports","/whatsapp","/owners","/audit"]
INIT="""
window.__lcp=0; new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});
window.__cls=0; new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__cls+=e.value}).observe({type:'layout-shift',buffered:true});
"""
def metrics(pg):
    return pg.evaluate("""()=>{const n=performance.getEntriesByType('navigation')[0];const r=performance.getEntriesByType('resource');
    const by={};let tot=0,dec=0;for(const e of r){const t=e.initiatorType;const k=/\\.css/.test(e.name)?'css':/\\.js/.test(e.name)?'js':/font|woff/.test(e.name)?'font':(/\\.(png|jpg|svg|ico|webp)/.test(e.name)?'img':'other');by[k]=by[k]||{n:0,b:0,d:0};by[k].n++;by[k].b+=e.transferSize||0;by[k].d+=e.decodedBodySize||0;tot+=e.transferSize||0;dec+=e.decodedBodySize||0}
    const fcp=performance.getEntriesByName('first-contentful-paint')[0];
    return {ttfb:Math.round(n.responseStart),dcl:Math.round(n.domContentLoadedEventEnd),load:Math.round(n.loadEventEnd),fcp:Math.round(fcp?fcp.startTime:0),lcp:Math.round(window.__lcp),cls:+window.__cls.toFixed(3),reqs:r.length+1,html:n.transferSize,bytes:tot+n.transferSize,decoded:dec,by}}""")
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,channel="chrome",args=["--no-sandbox"])
    ctx=b.new_context(viewport={"width":1366,"height":900}); ctx.add_init_script(INIT); pg=ctx.new_page()
    cdp=ctx.new_cdp_session(pg)
    if THROTTLE:
        cdp.send("Network.enable"); cdp.send("Network.emulateNetworkConditions",{"offline":False,"latency":120,"downloadThroughput":int(1.6*1024*1024/8*1.0),"uploadThroughput":int(0.75*1024*1024/8)})
        cdp.send("Emulation.setCPUThrottlingRate",{"rate":4})
    out={}
    t=time.time(); pg.goto(BASE+"/login",wait_until="load"); pg.wait_for_timeout(1200); out["/login (cold)"]=metrics(pg)
    if AUTH:
        pg.fill("input[name=identifier]","9182982174"); pg.fill("input[name=password]",PW); t=time.time(); pg.click("button[type=submit]"); pg.wait_for_url("**/dashboard",timeout=60000); pg.wait_for_load_state("networkidle"); out["login submit -> dashboard ms"]=int((time.time()-t)*1000)
        for path in PAGES:
            t=time.time(); pg.goto(BASE+path,wait_until="load"); pg.wait_for_load_state("networkidle"); m=metrics(pg); m["wall"]=int((time.time()-t)*1000); out[path+" (hard load)"]=m
        # SPA transitions through sidebar links
        pg.goto(BASE+"/dashboard"); pg.wait_for_load_state("networkidle"); pg.wait_for_timeout(500)
        nav={}
        for path in PAGES[1:]:
            link=pg.locator(f"a[href='{path}']").first
            t=time.time(); link.click(); pg.wait_for_url("**"+path,timeout=30000); 
            # wait until main has content and network quiet
            pg.wait_for_load_state("networkidle"); nav[path]=int((time.time()-t)*1000)
        out["spa_nav_ms"]=nav
    json.dump(out,open(os.environ.get("OUT","/tmp/e2e/perf_out.json"),"w"),indent=1)
    def line(k,m): print(f"{k:34s} reqs={m['reqs']:3d} KB={m['bytes']/1024:7.1f} dec={m['decoded']/1024:7.1f} ttfb={m['ttfb']:5d} fcp={m['fcp']:5d} lcp={m['lcp']:5d} load={m['load']:5d} cls={m['cls']} js={m['by'].get('js',{}).get('n',0)}/{m['by'].get('js',{}).get('b',0)//1024}KB css={m['by'].get('css',{}).get('b',0)//1024}KB font={m['by'].get('font',{}).get('b',0)//1024}KB")
    for k,v in out.items():
        if isinstance(v,dict) and "reqs" in v: line(k,v)
        else: print(k,v)
