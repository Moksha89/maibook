begin;
create temp table c as select id, row_number() over() rn from companies where id in (select company_id from company_agents);
create temp table ca as select company_id, agent_id, row_number() over() rn from company_agents;
insert into ledger_entries(id,company_id,entry_type,entry_date,reference,remarks,created_at,updated_at,idempotency_key)
select gen_random_uuid(), (select id from c where rn=1+(g%(select count(*)::int from c))), 'TRANSACTION', current_date - (g%1000), 'PERF-'||g, 'seed', now()-(g||' minutes')::interval, now(), 'perf-'||g from generate_series(1,200000) g;
insert into ledger_entry_lines(id,entry_id,company_id,account_type,agent_id,coins,rate,cash_value,credit,debit,opening_balance,closing_balance,sequence,created_at)
select gen_random_uuid(), e.id, e.company_id, s.t::"LedgerAccountType", case when s.t='AGENT' then (select agent_id from ca where company_id=e.company_id limit 1) end, 100,1,100,100,0,0,100,s.seq, e.created_at from ledger_entries e, (values ('COMPANY',1),('AGENT',2)) s(t,seq) where e.reference like 'PERF-%';
insert into audit_logs(id,actor_id,action,entity_type,entity_id,created_at)
select gen_random_uuid(), (select id from users limit 1), (array['LOGIN','LEDGER_CREATE','AGENT_UPDATE','REPORT_GENERATE'])[1+g%4], 'LedgerEntry', g::text, now()-(g||' minutes')::interval from generate_series(1,150000) g;
commit;
analyze;
