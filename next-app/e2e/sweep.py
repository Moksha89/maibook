import os,sys,time,json,subprocess
from playwright.sync_api import sync_playwright
BASE=os.environ.get("BASE","http://localhost:3200"); PW=os.environ["PW"]
Q=lambda s:subprocess.check_output(["psql","postgresql://ibook_dev:devpass@localhost:5432/ibook_dev","-Atc",s]).decode().strip()
subprocess.run(["bash","e2e/localclean.sh"])
cid=Q("select id from companies order by created_at limit 1"); aid=Q("select id from agents order by created_at limit 1")
extra=[f"/companies/{cid}",f"/companies/{cid}?tab=shareholders",f"/companies/{cid}?tab=upline",f"/companies/{cid}?tab=agents",f"/agents/{aid}",f"/ledger?companyId={cid}",f"/upline-groups?companyId={cid}"]
res=[]
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,channel="chrome",args=["--no-sandbox"])
    for label,vp in [("desktop",{"width":1366,"height":900}),("mobile",{"width":390,"height":844})]:
        ctx=b.new_context(viewport=vp,is_mobile=(label=="mobile"),has_touch=(label=="mobile")); pg=ctx.new_page()
        errs=[]; pg.on("console",lambda m: errs.append(m.text[:160]) if m.type=="error" else None); pg.on("pageerror",lambda e: errs.append("PAGEERR "+str(e)[:160]))
        pg.goto(BASE+"/login"); pg.fill("input[name=identifier]","9182982174"); pg.fill("input[name=password]",PW); pg.click("button[type=submit]"); pg.wait_for_url("**/dashboard",timeout=30000)
        hrefs=pg.evaluate("[...document.querySelectorAll('a[href^=\"/\"]')].map(a=>a.getAttribute('href').split('#')[0])")
        paths=[]
        for h in hrefs+extra:
            if h and not h.startswith("/api") and h not in paths and "logout" not in h: paths.append(h)
        for path in paths:
            errs.clear(); t=time.time()
            r=pg.goto(BASE+path); pg.wait_for_load_state("networkidle",timeout=20000); dt=int((time.time()-t)*1000)
            ov=pg.evaluate("document.documentElement.scrollWidth-window.innerWidth")
            wide=pg.evaluate("""()=>{const w=window.innerWidth;return [...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();if(!r.width||r.right<=w+1)return false;let p=e.parentElement;while(p&&p!==document.body){const s=getComputedStyle(p);if(/(auto|scroll|hidden)/.test(s.overflowX))return false;p=p.parentElement}return true}).slice(0,3).map(e=>e.tagName+'.'+(e.className||'').toString().slice(0,40))}""")
            txt=pg.inner_text("body")[:2000]
            bad500="Something went wrong" in txt or (r and r.status>=500)
            res.append(dict(vp=label,path=path,status=r.status if r else None,ms=dt,overflow=ov,wide=wide,err=errs[:3],bad500=bad500))
            flag="!!" if (bad500 or ov>1 or errs) else "ok"
            print(flag,label,path,r.status if r else None,dt,"ms","ovf",ov,wide if ov>1 else "",errs[:2] if errs else "")
            if label=="mobile": pg.screenshot(path=f"/tmp/e2e/m_{path.strip('/').replace('/','_').replace('?','_').replace('=','')[:50] or 'root'}.png")
        ctx.close()
json.dump(res,open("/tmp/e2e/sweep.json","w"))
