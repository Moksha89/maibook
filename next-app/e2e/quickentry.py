"""Quick-entry row (MyBook Advance layout): company workspace Entries tab and /ledger. Local DB only."""
import os, subprocess, uuid
from playwright.sync_api import sync_playwright
BASE = os.environ.get("BASE", "http://localhost:3200"); PW = os.environ.get("PW", "LocalDevPass12345"); tag = uuid.uuid4().hex[:4]
Q = lambda s: subprocess.check_output(["psql", "postgresql://ibook_dev:devpass@localhost:5432/ibook_dev", "-Atc", s]).decode().strip()
subprocess.run(["bash", "e2e/localclean.sh"]); ok = []; bad = []
def check(n, c, x=""): (ok if c else bad).append(n); print(("PASS " if c else "FAIL ") + n, x)
co = Q("select c.id||'|'||c.name from companies c join company_agents ca on ca.company_id=c.id and ca.removed_at is null where c.deleted_at is null and c.status='ACTIVE' group by c.id,c.name having count(*)>=2 limit 1").split("|")
cid = co[0]
ag = [r.split("|") for r in Q(f"select a.id||'|'||a.name from company_agents ca join agents a on a.id=ca.agent_id where ca.company_id='{cid}' and ca.removed_at is null order by a.name").split("\n")]
(A, an), (B, bn) = ag[0], ag[1]
def last(): return Q(f"select e.remarks||'|'||l.agent_id||'|'||l.coins from ledger_entries e join ledger_entry_lines l on l.entry_id=e.id where e.remarks like 'E2E-QE{tag}%' order by e.created_at, l.sequence").split("\n")
with sync_playwright() as p:
    b = p.chromium.launch(headless=True, channel="chrome", args=["--no-sandbox"]); ctx = b.new_context(viewport={"width": 1366, "height": 800}); pg = ctx.new_page()
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)[:150]))
    pg.goto(BASE + "/login"); pg.fill("input[name=identifier]", "9182982174"); pg.fill("input[name=password]", PW); pg.click("button[type=submit]"); pg.wait_for_url("**/dashboard")
    pg.goto(f"{BASE}/companies/{cid}?tab=entries&agent={A}"); form = pg.locator("form[aria-label='Quick entry']"); form.wait_for()
    check("company page has row", form.count() == 1)
    check("no agent/company selects when agent selected", form.locator("select").count() == 0)
    order = [e.get_attribute("aria-label") or e.get_attribute("placeholder") for e in form.locator("input:visible,[role=status]").all()]
    check("field order Balance,Name,Coins,Rate,Remarks", order == ["Counterparty balance", "Name (counterparty)", "Coins", "Rate", "Remarks"], order)
    bb = form.bounding_box(); check("row pinned at viewport bottom", abs((bb["y"] + bb["height"]) - 800) < 2, bb)
    # invalid name
    form.get_by_label("Name (counterparty)").fill("nobody"); form.get_by_label("Coins").fill("5"); form.get_by_label("Rate").fill("2"); form.get_by_role("button", name="OK").click()
    check("invalid name blocked", form.get_by_role("alert").count() == 1 and Q(f"select count(*) from ledger_entries where remarks like 'E2E-QE{tag}%'") == "0")
    # keyboard entry: Enter moves on, Enter on Remarks saves
    pg.reload(); form.wait_for()
    form.get_by_label("Name (counterparty)").fill(bn); pg.keyboard.press("Enter"); check("Enter moves Name->Coins", pg.evaluate("document.activeElement.getAttribute('aria-label')") == "Coins")
    pg.keyboard.type("10"); pg.keyboard.press("Enter"); pg.keyboard.press("Control+a"); pg.keyboard.type("2"); pg.keyboard.press("Enter"); pg.keyboard.type(f"E2E-QE{tag} in"); pg.keyboard.press("Enter")
    pg.wait_for_timeout(2000)
    r = last(); check("entry posted (receive)", len(r) == 2, r)
    if len(r) == 2:
        check("owner credited +10, counterparty -10", any(x.split("|")[1] == A and float(x.split("|")[2]) == 10 for x in r) and any(x.split("|")[1] == B and float(x.split("|")[2]) == -10 for x in r), r)
    check("fields cleared", form.get_by_label("Name (counterparty)").input_value() == "" and form.get_by_label("Coins").input_value() == "")
    check("focus back on Name", pg.evaluate("document.activeElement.getAttribute('aria-label')") == "Name (counterparty)")
    check("row appears in table", pg.get_by_text(f"E2E-QE{tag} in").count() >= 1)
    # negative = send
    form.get_by_label("Name (counterparty)").fill(bn); form.get_by_label("Coins").fill("-4"); form.get_by_label("Rate").fill("3"); form.get_by_label("Remarks").fill(f"E2E-QE{tag} out"); form.get_by_role("button", name="OK").click(); pg.wait_for_timeout(2000)
    r = [x for x in last() if x.startswith(f"E2E-QE{tag} out")]
    check("negative coins = owner sends", any(x.split("|")[1] == A and float(x.split("|")[2]) == -4 for x in r), r)
    # clear button
    form.get_by_label("Name (counterparty)").fill("abc"); form.get_by_role("button", name="Clear").click(); check("Clear empties", form.get_by_label("Name (counterparty)").input_value() == "")
    # all-entries view needs agent select
    pg.goto(f"{BASE}/companies/{cid}?tab=entries"); form.wait_for(); check("agent select when none selected", form.locator("select").count() == 1)
    # ledger page
    pg.goto(f"{BASE}/ledger"); form.wait_for(); check("ledger page has row", form.count() == 1)
    form.get_by_label("Company").select_option(cid); form.get_by_label("Agent (ledger owner)").select_option(B)
    form.get_by_label("Name (counterparty)").fill(an); form.get_by_label("Coins").fill("1"); form.get_by_label("Rate").fill("1"); form.get_by_label("Remarks").fill(f"E2E-QE{tag} ledger"); pg.keyboard.press("Enter"); pg.wait_for_timeout(2000)
    r = [x for x in last() if x.startswith(f"E2E-QE{tag} ledger")]; check("ledger page entry posted", len(r) == 2, r)
    pg.screenshot(path="/workspace/maibook-github/buttons/quick-entry-ledger-local.png")
    # mobile
    m = b.new_context(viewport={"width": 390, "height": 800}, is_mobile=True, has_touch=True); mp = m.new_page()
    mp.goto(BASE + "/login"); mp.fill("input[name=identifier]", "9182982174"); mp.fill("input[name=password]", PW); mp.click("button[type=submit]"); mp.wait_for_url("**/dashboard")
    mp.goto(f"{BASE}/companies/{cid}?tab=entries&agent={A}"); mf = mp.locator("form[aria-label='Quick entry']"); mf.wait_for()
    ov = mp.evaluate("document.documentElement.scrollWidth - innerWidth"); check("mobile no h-overflow", ov <= 0, ov)
    bb = mf.bounding_box(); check("mobile row in viewport", bb["y"] + bb["height"] <= 800 + 1 and bb["x"] >= -1 and bb["x"] + bb["width"] <= 391, bb)
    mp.screenshot(path="/workspace/maibook-github/buttons/quick-entry-mobile-local.png")
    pg.goto(f"{BASE}/companies/{cid}?tab=entries&agent={A}"); form.wait_for(); pg.screenshot(path="/workspace/maibook-github/buttons/quick-entry-company-local.png")
    check("no page errors", not errs, errs)
    b.close()
print("PASS", len(ok), "FAIL", len(bad), bad)
