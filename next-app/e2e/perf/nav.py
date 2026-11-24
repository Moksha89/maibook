import os,subprocess,json,statistics
from playwright.sync_api import sync_playwright
BASE=os.environ.get("BASE","http://localhost:3300")
subprocess.run(["bash","/tmp/localclean.sh"])
PAGES=["/companies","/agents","/ledger","/identifiers","/settlements","/reports","/whatsapp","/owners","/audit","/dashboard"]
JS="""(path)=>new Promise(res=>{const m=document.querySelector('main')||document.body;const t0=performance.now();const start=m.innerText;let first=null,last=null;
 const obs=new MutationObserver(()=>{const n=performance.now()-t0;if(first===null)first=n;last=n});obs.observe(m,{childList:true,subtree:true,characterData:true});
 document.querySelector(`a[href='${path}']`).click();
 const chk=()=>{const n=performance.now()-t0; if(last!==null&&n-last>600){obs.disconnect();res({first,last,url:location.pathname});} else if(n>8000){obs.disconnect();res({first,last,url:location.pathname,timeout:true})} else setTimeout(chk,100)};setTimeout(chk,100)})"""
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,channel="chrome",args=["--no-sandbox"]); ctx=b.new_context(viewport={"width":1366,"height":900}); pg=ctx.new_page()
    pg.goto(BASE+"/login"); pg.fill("input[name=identifier]","9182982174"); pg.fill("input[name=password]","LocalDevPass12345"); pg.click("button[type=submit]"); pg.wait_for_url("**/dashboard"); pg.wait_for_load_state("networkidle"); pg.wait_for_timeout(2500)
    out={}
    for rnd in (1,2):
        for path in PAGES:
            r=(pg.hover(f"a[href='{path}']"), pg.wait_for_timeout(int(os.environ.get("HOVER","0"))), pg.evaluate(JS,path))[2]; out.setdefault(path,[]).append((int(r['first'] or -1),int(r['last'] or -1))); pg.wait_for_timeout(600)
    for k,v in out.items(): print(f"{k:14s} round1 first/last={v[0]}  round2 (revisit)={v[1]}")
    print("median round1 last", statistics.median(v[0][1] for v in out.values()), "round2 last", statistics.median(v[1][1] for v in out.values()))
