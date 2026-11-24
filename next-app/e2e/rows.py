import os,subprocess,uuid
from playwright.sync_api import sync_playwright
BASE="http://localhost:3200"; tag=uuid.uuid4().hex[:4]
Q=lambda s:subprocess.check_output(["psql","postgresql://ibook_dev:devpass@localhost:5432/ibook_dev","-Atc",s]).decode().strip()
subprocess.run(["bash","e2e/localclean.sh"]); ok=[];bad=[]
def check(n,c,x=""): (ok if c else bad).append(n); print(("PASS " if c else "FAIL ")+n,x)
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,channel="chrome",args=["--no-sandbox"]); ctx=b.new_context(viewport={"width":1366,"height":900}); pg=ctx.new_page(); dlg=pg.locator("[role=dialog]")
    errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)[:120]))
    pg.goto(BASE+"/login"); pg.fill("input[name=identifier]","9182982174"); pg.fill("input[name=password]","LocalDevPass12345"); pg.click("button[type=submit]"); pg.wait_for_url("**/dashboard")
    pg.on("dialog",lambda d:d.accept())
    for path,table,col,key in [("/companies","companies","name","Edit"),("/agents","agents","name","Edit")]:
        # create
        pg.goto(BASE+path); pg.wait_for_timeout(500)
        pg.get_by_role("button",name="Add company" if path=="/companies" else "Add agent",exact=True).first.click(); d=dlg.first; d.wait_for()
        nm=f"Row{tag}{path[1:4]}"; d.locator("input[name=name]").fill(nm)
        for el in d.locator("input:visible, select:visible").all():
            ty=el.get_attribute("type") or ""; nm_=el.get_attribute("name") or ""
            if el.evaluate("e=>e.tagName")=="SELECT":
                if not el.input_value() and el.locator("option").count()>1: el.select_option(index=1)
            elif ty in("hidden","checkbox","radio") or el.input_value() or nm_=="name": continue
            elif ty=="number": el.fill("1")
            elif ty=="tel" or "phone" in nm_ or "mobile" in nm_: el.fill("9876543210")
            elif ty=="email": el.fill(f"r{tag}@example.com")
            else: el.fill("x"+tag)
        print("fields",[ (e.get_attribute("name"), e.input_value()) for e in d.locator("input:visible").all()][:8])
        pg.wait_for_timeout(300); d.locator("button[type=submit]").last.click(); dlg.wait_for(state="detached",timeout=10000); pg.wait_for_timeout(600)
        check(f"{path} create persisted", Q(f"select count(*) from {table} where {col}='{nm}'")=="1")
        row=pg.locator("tr,li,article,div").filter(has_text=nm).last
        pg.get_by_text(nm,exact=True).first.scroll_into_view_if_needed()
        # locate row container for the name
        cont=pg.locator(f"xpath=//*[normalize-space(text())='{nm}']/ancestor::*[self::tr or self::li or self::article][1]").first
        cont.get_by_role("button",name="Edit",exact=True).first.click() if cont.get_by_role("button",name="Edit",exact=True).count() else cont.get_by_role("link",name="Edit",exact=True).first.click()
        d=dlg.first; d.wait_for(); d.locator("input[name=name]").fill(nm+"E"); pg.wait_for_timeout(900); (d.get_by_role("button",name="Save changes",exact=True).first if d.get_by_role("button",name="Save changes",exact=True).count() else d.locator("button[type=submit]").last).click(); pg.wait_for_timeout(1500)
        if dlg.count(): pg.keyboard.press("Escape"); pg.wait_for_timeout(500)
        check(f"{path} edit saved", Q(f"select count(*) from {table} where {col}='{nm}E'")=="1")
        cont=pg.locator(f"xpath=//*[normalize-space(text())='{nm}E']/ancestor::*[self::tr or self::li or self::article][1]").first
        cont.get_by_role("button",name="Deactivate",exact=True).first.click(); pg.wait_for_timeout(1500)
        st=Q(f"select status from {table} where {col}='{nm}E'")
        check(f"{path} deactivate", st!="ACTIVE", st)
        cont=pg.locator(f"xpath=//*[normalize-space(text())='{nm}E']/ancestor::*[self::tr or self::li or self::article][1]").first
        cont.get_by_role("button",name="Remove",exact=True).first.click(); pg.wait_for_timeout(1500)
        check(f"{path} remove (soft delete)", Q(f"select deleted_at is not null from {table} where {col}='{nm}E'")=="t")
        check(f"{path} no page error", "Something went wrong" not in pg.inner_text("body"))
    check("no uncaught page errors", not errs, str(errs[:2]))
print("OK",len(ok),"FAIL",len(bad),bad)
