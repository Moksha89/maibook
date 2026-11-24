import os,re,subprocess,json
from playwright.sync_api import sync_playwright
BASE=os.environ["BASE"]
DB="postgresql://ibook_dev:devpass@localhost:5432/ibook_dev"
def sql(q): return subprocess.check_output(["psql",DB,"-Atc",q]).decode().strip()
ok=[];bad=[]
def check(name,cond,extra=""):
    (ok if cond else bad).append(name); print(("PASS " if cond else "FAIL ")+name, extra)
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,channel="chrome",args=["--no-sandbox"]); ctx=b.new_context(viewport={"width":1366,"height":900}); pg=ctx.new_page()
    pg.goto(BASE+"/login"); pg.fill("input[name=identifier]","9182982174"); pg.fill("input[name=password]",os.environ["PW"]); pg.click("button[type=submit]"); pg.wait_for_url("**/dashboard")
    dlg=pg.locator("[role=dialog]")
    def bal_ok(eid):
      return sql(f"select abs(ca.current_balance - coalesce((select sum(l2.coins) from ledger_entry_lines l2 join ledger_entries e2 on e2.id=l2.entry_id where e2.deleted_at is null and l2.agent_id=ca.agent_id and l2.company_id=ca.company_id),0))<0.0001 from company_agents ca join ledger_entry_lines l on l.agent_id=ca.agent_id and l.company_id=ca.company_id where l.entry_id='{eid}' limit 1")=="t"
    def open_(t,nth=0): pg.get_by_role("button",name=t,exact=True).nth(nth).click(); dlg.first.wait_for(); return dlg.first
    def sub(d): pg.wait_for_timeout(350); d.locator("button[type=submit]").last.click()
    # 12 dashboard label
    pg.goto(BASE+"/dashboard"); check("12 dashboard 'Active entries' header", "Active entries" in pg.content())
    cid=sql("select id from companies where name like 'Sunrise%' limit 1")
    # 13 spinners
    pg.goto(f"{BASE}/companies/{cid}?tab=shareholders"); pg.wait_for_timeout(500)
    d=open_("Add shareholder"); num=d.locator("input[type=number]").first
    check("13 number input has no spinner (appearance none + no stepper buttons)", num.evaluate("e=>getComputedStyle(e).appearance")=="textfield" and d.locator("button[tabindex='-1']").count()==0)
    # 9 retain input after server rejection: Anita 60 ok, Sanjay 50 rejected (110)
    d.locator("input[name=name]").fill("Anita Desai"); d.locator("input[name=percentage]").fill("60"); sub(d); dlg.wait_for(state="detached")
    pg.goto(f"{BASE}/companies/{cid}?tab=shareholders"); pg.wait_for_timeout(500)
    d=open_("Add shareholder"); d.locator("input[name=name]").fill("Sanjay Patel"); d.locator("input[name=percentage]").fill("50"); sub(d); pg.wait_for_timeout(1800)
    msg=d.inner_text()
    check("9 server rejection shows message", "100" in msg, msg[-120:].replace("\n"," "))
    check("9 name retained", d.locator("input[name=name]").input_value()=="Sanjay Patel")
    check("9 percentage retained", d.locator("input[name=percentage]").input_value()=="50")
    d.locator("input[name=percentage]").fill("40"); sub(d); dlg.wait_for(state="detached")
    check("9 corrected submit saves", sql(f"select count(*) from shareholders where company_id='{cid}' and deleted_at is null")=="2")
    # uplines for groups
    pg.goto(f"{BASE}/companies/{cid}?tab=upline"); pg.wait_for_timeout(500)
    for nm,pc in [("Vikram Rao","10"),("Priya Nair","5")]:
        d=open_("Add upline"); d.locator("input[name=name]").fill(nm); d.locator("input[name=percentageRate]").fill(pc); sub(d); dlg.wait_for(state="detached"); pg.wait_for_timeout(300)
    check("11 upline create audited", int(sql("select count(*) from audit_logs where action='upline.create'"))>=2)
    # 10 groups
    pg.goto(f"{BASE}/upline-groups?companyId={cid}"); pg.wait_for_timeout(500)
    d=open_("Add group"); d.locator("input[name=name]").fill("North Region"); sub(d); pg.wait_for_timeout(1500)
    t=d.inner_text(); check("10 no-member error is friendly", "Tick at least one upline" in t and "Too small" not in t, t[-100:].replace("\n"," "))
    check("10 group name retained after error", d.locator("input[name=name]").input_value()=="North Region")
    boxes=d.locator("input[type=checkbox][name=uplineIds]"); boxes.nth(0).check(); boxes.nth(1).check()
    pcs=d.locator("input[name^=percentage-]"); pcs.nth(0).fill("70"); pcs.nth(1).fill("30"); sub(d); dlg.wait_for(state="detached"); pg.wait_for_timeout(500)
    check("10 group created", "North Region" in pg.content())
    check("11 group create audited", int(sql("select count(*) from audit_logs where action='upline_group.create'"))==1)
    pg.get_by_role("button",name="Edit",exact=True).first.click(); dlg.first.wait_for(); d=dlg.first
    d.locator("input[name=name]").fill("North Region 2"); pcs=d.locator("input[name^=percentage-]"); pcs.nth(0).fill("60"); pcs.nth(1).fill("40"); sub(d); dlg.wait_for(state="detached"); pg.wait_for_timeout(600)
    check("10 group edited", "North Region 2" in pg.content() and "60.00%" in pg.content())
    check("11 group update audited", int(sql("select count(*) from audit_logs where action='upline_group.update'"))==1)
    pg.once("dialog", lambda x: x.accept()); pg.get_by_role("button",name="Delete",exact=True).first.click(); pg.wait_for_timeout(1500)
    check("10 group deleted", sql("select count(*) from upline_groups")=="0")
    check("11 group delete audited", int(sql("select count(*) from audit_logs where action='upline_group.delete'"))==1)
    # 16 owners
    aid=sql(f"select a.id from agents a where a.name like 'Ravi%' limit 1")
    sql(f"insert into company_agents (company_id, agent_id, opening_balance, current_balance, assigned_at) select '{cid}','{aid}',0,0,now() where not exists (select 1 from company_agents where company_id='{cid}' and agent_id='{aid}')") if aid else None
    pg.goto(BASE+"/owners"); pg.wait_for_timeout(500)
    d=open_("Add owner"); d.locator("input[name=name]").fill("Anita Owner"); sub(d); dlg.wait_for(state="detached"); pg.wait_for_timeout(500)
    pg.get_by_role("button",name="Edit",exact=True).first.click(); dlg.first.wait_for(); d=dlg.first
    d.locator("input[name=name]").fill("Anita Owner Edited"); d.locator("input[name=email]").fill("anita@example.com"); sub(d); dlg.wait_for(state="detached"); pg.wait_for_timeout(500)
    check("16 owner edited", "Anita Owner Edited" in pg.content() and "anita@example.com" in pg.content())
    pg.once("dialog", lambda x: x.accept()); pg.get_by_role("button",name="Delete",exact=True).first.click(); pg.wait_for_timeout(1500)
    check("16 owner deleted", sql("select count(*) from owners")=="0")
    # 11 manual distribution + ledger edit/delete + audit company
    pg.goto(BASE+"/manual-distribution"); pg.wait_for_timeout(500)
    d=open_("New distribution"); d.locator("select[name=agentId]").select_option(index=1); d.locator("input[name=amount]").fill("125"); sub(d); dlg.wait_for(state="detached"); pg.wait_for_timeout(500)
    check("11 manual distribution audit has company", sql("select count(*) from audit_logs where action='agent.manual_distribution.create' and company_id is not null")=="1")
    pg.goto(f"{BASE}/ledger?companyId={cid}"); pg.wait_for_timeout(600)
    eid=sql("select id from ledger_entries where entry_type='MANUAL_AGENT' order by created_at desc limit 1"); cid=sql(f"select company_id from ledger_entries where id='{eid}'")
    pg.goto(f"{BASE}/ledger/{eid}/edit"); pg.wait_for_timeout(600)
    pg.fill("input[name=amount]","200"); pg.wait_for_timeout(300); pg.locator("button[type=submit]").last.click(); pg.wait_for_timeout(1800)
    check("11 manual entry edited + balance recalculated", sql(f"select coins from ledger_entry_lines where entry_id='{eid}'").startswith("200") and bal_ok(eid))
    pg.goto(f"{BASE}/ledger?companyId={cid}"); pg.wait_for_timeout(1500)
    check("11 ledger shows Delete for manual entry", pg.get_by_role("button",name="Delete",exact=True).count()>=1)
    check("5 ledger labels", "Coin balance" in pg.content() and "Credit (amount)" in pg.content())
    pg.get_by_role("button",name="Delete",exact=True).first.click(); pg.wait_for_timeout(1500)
    check("11 manual entry deleted + balance 0", sql(f"select deleted_at is not null from ledger_entries where id='{eid}'")=="t" and bal_ok(eid))
    pg.screenshot(path="/tmp/e2e/ledger.png")
    # 17 hint
    pg.goto(BASE+"/profile"); pg.wait_for_timeout(500)
    check("17 password hint says 12", "12+" in pg.content() or "At least 12" in pg.content() and "8+" not in pg.content())
print("OK",len(ok),"FAIL",len(bad),bad)
