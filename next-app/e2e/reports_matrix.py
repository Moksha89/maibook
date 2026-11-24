import os,subprocess
from playwright.sync_api import sync_playwright
BASE="http://localhost:3200"
Q=lambda s:subprocess.check_output(["psql","postgresql://ibook_dev:devpass@localhost:5432/ibook_dev","-Atc",s]).decode().strip()
subprocess.run(["bash","e2e/localclean.sh"])
types=["Company ledger","Agent ledger","Settlements","Profit distribution","Upline entries","Agent balance summary"]
fmts=["PDF","PNG image","CSV","Text","Print view"]; ok=bad=0
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,channel="chrome",args=["--no-sandbox"]); ctx=b.new_context(viewport={"width":1366,"height":900}); pg=ctx.new_page()
    pg.goto(BASE+"/login"); pg.fill("input[name=identifier]","9182982174"); pg.fill("input[name=password]","LocalDevPass12345"); pg.click("button[type=submit]"); pg.wait_for_url("**/dashboard")
    for t in types:
        for f in fmts:
            pg.goto(BASE+"/reports"); pg.wait_for_timeout(500)
            before=int(Q("select count(*) from generated_reports"))
            pg.get_by_role("button",name="Generate report",exact=True).first.click(); d=pg.locator("[role=dialog]").first; d.wait_for()
            d.locator("select[name=companyId]").select_option(label="Money 4fcabd"); d.locator("select[name=type]").select_option(label=t)
            if t=="Agent ledger": d.locator("select[name=agentId]").select_option(index=1)
            d.locator("select[name=format]").select_option(label=f); pg.wait_for_timeout(300)
            d.locator("button[type=submit]").last.click(); pg.wait_for_timeout(1800)
            after=int(Q("select count(*) from generated_reports")); rid=Q("select id from generated_reports order by generated_at desc limit 1")
            r=ctx.request.get(f"{BASE}/api/reports/{rid}/download"); body=r.body(); ct=r.headers.get("content-type","")
            sig={"PDF":body[:4]==b"%PDF","PNG image":body[:4]==b"\x89PNG","CSV":b"," in body[:400] or len(body)<5,"Text":len(body)>0,"Print view":True}[f]
            if f=="Print view": sig = r.status==200
            good=after==before+1 and r.status==200 and sig
            ok+=good; bad+=not good
            print("PASS" if good else "FAIL",t,f,r.status,ct[:24],len(body))
            if not good: pg.screenshot(path=f"/tmp/e2e/rm_fail_{t[:4]}_{f[:3]}.png")
            rv=ctx.request.get(f"{BASE}/api/reports/{rid}/download?inline=1&as=png") if f!="PNG image" else None
            if rv is not None and (rv.status!=200 or rv.body()[:4]!=b"\x89PNG"): print("FAIL preview png",t,f,rv.status); bad+=1
print("OK",ok,"FAIL",bad)
