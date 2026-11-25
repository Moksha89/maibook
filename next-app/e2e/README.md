# Browser end-to-end suites (local only)

These Playwright (Python, Chrome) scripts drive a LOCAL copy of the app against a LOCAL throw-away database.
Never point them at maibook.co: they create, edit and delete records and each login registers a device.

Setup: a Postgres database seeded with a superadmin account, `next build && next start -p 3200` with the same
`DATABASE_URL`, and the env vars `BASE` (default `http://localhost:3200`) and `PW` (the seeded password).
`e2e/localclean.sh` clears local sessions/devices so the per-user device limit (default 6) is never hit; edit its connection string for your DB.
Run from `next-app/`.

| Script | Covers |
| --- | --- |
| `sweep.py` | Every sidebar page and deep link at 1366px and 390px: status, console errors, horizontal overflow, load time |
| `crud.py` | Every Add dialog at both sizes: fits the viewport, submit reachable, closes on save, Esc closes on mobile |
| `rows.py` | Company and agent create, edit, deactivate, remove |
| `flows2.py` | ID create/edit/deactivate, settlement post and reverse, ledger transfer edit/delete/restore with balance checks, user create and suspend |
| `reports_matrix.py` | 6 report types x 5 formats: generation, download signature, PNG preview |
| `qa8.py` | Form-value retention, group CRUD and audit, owner CRUD, manual distribution, ledger edit/delete, labels, spinners |

The financial rules themselves are covered by `src/lib/domain/finance.test.ts` and, with `RUN_INTEGRATION_TESTS=true`, by `src/lib/system.integration.test.ts`.

## Performance tools (`e2e/perf/`, local only)

- `lagproxy.py LISTEN UPSTREAM ONEWAY_SECONDS BYTES_PER_SEC` - TCP proxy that adds latency/bandwidth (e.g. `3300 3200 0.125 400000` = 250 ms RTT, ~3 Mbps) so a local instance behaves like a far-away user.
- `perf.py` - cold /login, login->dashboard, hard loads and SPA navigation: requests, KB, FCP/LCP/load. `BASE=http://localhost:3300 python3 e2e/perf/perf.py`.
- `nav.py` - sidebar navigation time to final content (first visit and revisit); `HOVER=250` simulates hovering before clicking.
- `ttfb.py` - HTML response time per page (run against the local instance directly).
- `seed_scale.sql` - adds 200k ledger entries / 400k lines / 150k audit rows to a local DB to expose slow queries. Delete the `PERF-%` rows afterwards.
