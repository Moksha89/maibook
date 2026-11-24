import os,subprocess,time,json
from playwright.sync_api import sync_playwright
BASE="http://localhost:3200"
subprocess.run(["bash","/tmp/localclean.sh"])
PAGES=["/dashboard","/companies","/agents","/ledger","/identifiers","/settlements","/reports","/whatsapp","/owners","/audit","/users","/settings"]
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,channel="chrome",args=["--no-sandbox"]); ctx=b.new_context(); pg=ctx.new_page()
    pg.goto(BASE+"/login"); pg.fill("input[name=identifier]","9182982174"); pg.fill("input[name=password]","LocalDevPass12345"); pg.click("button[type=submit]"); pg.wait_for_url("**/dashboard"); pg.wait_for_load_state("networkidle")
    rq=ctx.request
    for path in PAGES:
        ts=[]
        for i in range(5):
            t=time.time(); r=rq.get(BASE+path); r.body(); ts.append(int((time.time()-t)*1000))
        print(path,"html ms",ts, "bytes", len(r.body()))
