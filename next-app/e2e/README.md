# Browser end-to-end suites (local only)

These Playwright (Python, Chrome) scripts drive a LOCAL copy of the app against a LOCAL throw-away database.
Never point them at maibook.co: they create, edit and delete records and each login registers a device.

Setup: a Postgres database seeded with a superadmin (default 9182982174), `next build && next start -p 3200` with the same
`DATABASE_URL`, and the env vars `BASE` (default `http://localhost:3200`) and `PW` (the seeded password).
`e2e/localclean.sh` clears local sessions/devices so the 3-device limit is never hit; edit its connection string for your DB.
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
