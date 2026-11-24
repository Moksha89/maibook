import os,subprocess,uuid
from playwright.sync_api import sync_playwright
BASE="http://localhost:3200"; tag=uuid.uuid4().hex[:4]
def Q(s): return subprocess.check_output(["psql","postgresql://ibook_dev:devpass@localhost:5432/ibook_dev","-Atc",s]).decode().strip()
subprocess.run(["bash","e2e/localclean.sh"]); ok=[];bad=[]
def check(n,c,x=""): (ok if c else bad).append(n); print(("PASS " if c else "FAIL ")+n,x)
cn=f"Flow{tag}"
Q(f"insert into companies (id,name,normalized_name,slug,updated_at) values (gen_random_uuid(),'{cn}','{cn.lower()}','{cn.lower()}',now())")
cid=Q(f"select id from companies where name='{cn}'")
for a in ("A1","A2"):
    Q(f"insert into agents (id,name,normalized_name,updated_at) values (gen_random_uuid(),'{a}{tag}','{a.lower()}{tag}',now())")
    Q(f"insert into company_agents (company_id,agent_id,opening_balance,current_balance,assigned_at) select '{cid}',id,0,0,now() from agents where name='{a}{tag}'")
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,channel="chrome",args=["--no-sandbox"]); ctx=b.new_context(viewport={"width":1366,"height":900}); pg=ctx.new_page(); dlg=pg.locator("[role=dialog]")
    errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)[:120])); pg.on("dialog",lambda d:d.accept())
    pg.goto(BASE+"/login"); pg.fill("input[name=identifier]","9182982174"); pg.fill("input[name=password]","LocalDevPass12345"); pg.click("button[type=submit]"); pg.wait_for_url("**/dashboard")
    def open_(path,btn): pg.goto(BASE+path); pg.wait_for_timeout(500); pg.get_by_role("button",name=btn,exact=True).first.click(); dlg.first.wait_for(); pg.wait_for_timeout(300); return dlg.first
    def sub(d,name=None): pg.wait_for_timeout(400); (d.get_by_role("button",name=name,exact=True) if name else d.locator("button[type=submit]").last).click(); pg.wait_for_timeout(1800)
    bal=lambda a: Q(f"select current_balance from company_agents ca join agents g on g.id=ca.agent_id where g.name='{a}{tag}'")
    # ID create/edit/deactivate/remove
    d=open_("/identifiers","Add ID"); d.locator("select[name=companyId]").select_option(label=cn); pg.wait_for_timeout(400)
    d.locator("select[name=agentId]").select_option(label=f"A1{tag}"); d.locator("input[name=value]").fill(f"ID-{tag}"); d.locator("input[name=percentageRate]").fill("20"); sub(d,"Create ID")
    check("ID created", Q(f"select count(*) from agent_ids where value='ID-{tag}'")=="1" and dlg.count()==0)
    idrow=pg.locator(f"xpath=//*[contains(normalize-space(text()),'ID-{tag}')]/ancestor::tr[1]").first
    idrow.get_by_role("button",name="Edit",exact=True).first.click(); d=dlg.first; d.wait_for(); pg.wait_for_timeout(300)
    r=d.locator("input[name=percentageRate]"); r.fill("30"); pg.wait_for_timeout(400); d.locator("button[type=submit]").first.click(); pg.wait_for_timeout(1800)
    check("ID edited (rate 30)", Q(f"select percentage_rate from agent_ids where value='ID-{tag}'").startswith("30"))
    # settlement via UI then reverse
    d=open_("/settlements","Add settlement"); d.locator("select[name=companyId]").select_option(label=cn); pg.wait_for_timeout(500)
    d.locator("select[name=identifierId]").select_option(index=1); d.locator("input[name=amount]").fill("100"); sub(d,"Post settlement")
    check("settlement posted", Q(f"select count(*) from settlements where company_id='{cid}'")=="1" and dlg.count()==0, f"agent balance {bal('A1')}")
    check("agent balance +30 (rate 30)", bal("A1").startswith("30"), bal("A1"))
    pg.goto(BASE+"/settlements"); pg.wait_for_timeout(700)
    btn=pg.get_by_role("button",name="Reverse",exact=True)
    check("Reverse button present", btn.count()>=1)
    if btn.count(): btn.first.click(); pg.wait_for_timeout(2000); check("settlement reversed + balance 0", Q(f"select status from settlements where company_id='{cid}'")=="REVERSED" and bal("A1").startswith("0") or bal("A1").startswith("0.0"), f"{Q(f'select status from settlements where company_id=chr(39)||1')}" if False else bal("A1"))
    # ledger transfer, edit, delete
    d=open_("/ledger","Add entry"); d.locator("select[name=companyId]").select_option(label=cn); pg.wait_for_timeout(300)
    d.locator("select[name=senderAgentId]").select_option(label=f"A1{tag}"); d.locator("select[name=receiverAgentId]").select_option(label=f"A2{tag}")
    d.locator("input[name=coins]").fill("10"); d.locator("input[name=rate]").fill("2"); sub(d,"Post transfer")
    check("ledger transfer posted", Q(f"select count(*) from ledger_entries where company_id='{cid}' and entry_type='TRANSACTION' and deleted_at is null")=="1", f"A1={bal('A1')} A2={bal('A2')}")
    check("balances move (A1 -10 / A2 +10 from 0 after reversal)", bal("A1").startswith("-10") and bal("A2").startswith("10"))
    pg.goto(f"{BASE}/ledger?companyId={cid}"); pg.wait_for_timeout(900)
    pg.get_by_role("link",name="Edit",exact=True).first.click(); pg.wait_for_timeout(800); pg.fill("input[name=coins]","20"); pg.wait_for_timeout(300); pg.locator("button[type=submit]").last.click(); pg.wait_for_timeout(1800)
    check("ledger edit recalculates", bal("A1").startswith("-20") and bal("A2").startswith("20"), f"A1={bal('A1')} A2={bal('A2')}")
    pg.goto(f"{BASE}/ledger?companyId={cid}"); pg.wait_for_timeout(900); pg.get_by_role("button",name="Delete",exact=True).first.click(); pg.wait_for_timeout(1800)
    check("ledger delete restores balances", bal("A1").startswith("0") and bal("A2").startswith("0"), f"A1={bal('A1')} A2={bal('A2')}")
    pg.get_by_role("button",name="Restore and recalculate",exact=True).first.click(); pg.wait_for_timeout(1800)
    check("ledger restore", bal("A1").startswith("-20") and bal("A2").startswith("20"), f"A1={bal('A1')} A2={bal('A2')}")
    # ID deactivate / remove
    pg.goto(BASE+"/identifiers"); pg.wait_for_timeout(700)
    row=pg.locator(f"xpath=//*[contains(normalize-space(text()),'ID-{tag}')]/ancestor::tr[1]").first
    row.get_by_role("button",name="Deactivate",exact=True).first.click(); pg.wait_for_timeout(1500)
    check("ID deactivated", Q(f"select status from agent_ids where value='ID-{tag}'")!="ACTIVE")
    row=pg.locator(f"xpath=//*[contains(normalize-space(text()),'ID-{tag}')]/ancestor::tr[1]").first
    row.get_by_role("button",name="Remove",exact=True).first.click(); pg.wait_for_timeout(1500)
    check("ID with settlements cannot be removed (rule: deactivate instead)", Q(f"select deleted_at is not null from agent_ids where value='ID-{tag}'")=="f")
    # user create / suspend / revoke
    d=open_("/users","Add user"); d.locator("input[name=displayName]").fill(f"User {tag}"); d.locator("input[name=username]").fill(f"u{tag}"); d.locator("input[name=email]").fill(f"u{tag}@example.com"); d.locator("input[name=phone]").fill("9"+str(int(tag,16)).zfill(9)[-9:]); d.locator("input[name=password]").fill("LocalDevPass12345!x")
    d.locator("select[name=roleId]").select_option(index=1)
    sub(d,"Create user"); check("user created", Q(f"select count(*) from users where username='u{tag}'")=="1" and dlg.count()==0, d.inner_text()[-120:] if dlg.count() else "")
    pg.goto(BASE+"/users"); pg.wait_for_timeout(700)
    urow=pg.locator(f"xpath=//*[contains(normalize-space(text()),'u{tag}')]/ancestor::tr[1]").first
    urow.get_by_role("button",name="Suspend",exact=True).first.click(); pg.wait_for_timeout(1500)
    check("user suspended", Q(f"select status from users where username='u{tag}'")!="ACTIVE", Q(f"select status from users where username='u{tag}'"))
    check("no page errors", not errs, str(errs[:2]))
print("OK",len(ok),"FAIL",len(bad),bad)
