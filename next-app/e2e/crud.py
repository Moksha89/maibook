import os,time,uuid
from playwright.sync_api import sync_playwright
BASE=os.environ.get("BASE","http://localhost:3200"); PW=os.environ["PW"]; tag=uuid.uuid4().hex[:5]
import subprocess; subprocess.run(["bash","e2e/localclean.sh"])
ok=[];bad=[]
def check(n,c,x=""): (ok if c else bad).append(n); print(("PASS " if c else "FAIL ")+n,x)
def fill(d,t,label=""):
    for el in d.locator("input:visible, select:visible, textarea:visible").all():
        ty=(el.get_attribute("type") or el.evaluate("e=>e.tagName.toLowerCase()")); nm=el.get_attribute("name") or ""
        try:
            if ty in("hidden","checkbox","radio","file","submit","button"): continue
            if el.evaluate("e=>e.tagName")=="SELECT":
                n=el.locator("option").count()
                if n>1 and not el.input_value(): el.select_option(index=1)
                continue
            if el.input_value(): continue
            if ty=="number": el.fill("5")
            elif ty=="tel" or "phone" in nm.lower() or "mobile" in nm.lower(): el.fill("9876543210")
            elif ty=="email": el.fill(f"t{tag}@example.com")
            elif ty=="password": el.fill("LocalDevPass12345x")
            elif ty=="date": el.fill("2026-11-20")
            else: el.fill(f"{t}{tag}"[:30])
        except Exception as e: pass
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,channel="chrome",args=["--no-sandbox"])
    for label,vp in [("desktop",{"width":1366,"height":900}),("mobile",{"width":390,"height":844})]:
        subprocess.run(["bash","e2e/localclean.sh"]); ctx=b.new_context(viewport=vp,is_mobile=label=="mobile",has_touch=label=="mobile"); pg=ctx.new_page(); dlg=pg.locator("[role=dialog]")
        pg.goto(BASE+"/login"); pg.fill("input[name=identifier]","9182982174"); pg.fill("input[name=password]",PW); pg.click("button[type=submit]"); pg.wait_for_url("**/dashboard",timeout=30000)
        for path,btn in [("/companies","Add company"),("/agents","Add agent"),("/identifiers","Add ID"),("/settlements","Add settlement"),("/ledger","Add entry"),("/users","Add user"),("/owners","Add owner"),("/reports","Add template"),("/upline-groups","Add group"),("/manual-distribution","New distribution")]:
            pg.goto(BASE+path); pg.wait_for_timeout(600)
            pg.get_by_role("button",name=btn,exact=True).first.click(); 
            try: dlg.first.wait_for(timeout=5000)
            except Exception: check(f"{label} {btn} opens dialog",False); continue
            try:
              d=dlg.first; box=d.bounding_box(); ov=pg.evaluate("document.documentElement.scrollWidth-window.innerWidth")
              sub=d.locator("button[type=submit]").last
              check(f"{label} {btn}: dialog fits viewport", box and box["x"]>=-1 and box["x"]+box["width"]<=vp["width"]+1 and ov<=1, f"box={box and (int(box['x']),int(box['width']))} ovf={ov}")
              fill(d,btn.split()[-1]); pg.wait_for_timeout(500)
              sub.scroll_into_view_if_needed(); sb=sub.bounding_box()
              check(f"{label} {btn}: submit reachable", sb and sb["y"]+sb["height"]<=vp["height"]+1 and sb["y"]>=0, f"y={sb and int(sb['y'])}")
              if label=="mobile":
                  pg.keyboard.press("Escape"); pg.wait_for_timeout(400); check(f"mobile {btn}: Esc closes", dlg.count()==0); continue
              en=sub.is_enabled(); 
              if not en: check(f"desktop {btn}: submit enabled after fill", False, "needs manual fields"); pg.keyboard.press("Escape"); continue
              sub.click(); pg.wait_for_timeout(2500)
              closed=dlg.count()==0; msg="" if closed else d.inner_text()[-160:].replace("\n"," ")
              check(f"desktop {btn}: submit closes dialog", closed, msg)
              if not closed: pg.keyboard.press("Escape")

            except Exception as e:
                check(f"{label} {btn}: script error",False,str(e)[:100].replace("\n"," ")); pg.keyboard.press("Escape")
        ctx.close()
print("OK",len(ok),"FAIL",len(bad)); print(bad)
