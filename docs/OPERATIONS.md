# Operations notes

## Backups
* The worker (`npm run worker`, service `maibook-worker`) creates a PostgreSQL custom-format dump every day at
  02:00 in `BACKUP_TIMEZONE` (default `Asia/Kolkata`; hour via `BACKUP_SCHEDULE_HOUR`). If the worker was down at that
  time, the backup runs as soon as it is back.
* Dumps use `pg_dump` against `DATABASE_URL` (override the binary with `PG_DUMP_PATH`; set `BACKUP_MODE=docker` for the
  legacy `docker compose exec postgres` mode). Each dump is validated with `pg_restore --list`, checksummed (SHA-256) and stored under
  `STORAGE_ROOT/backups`.
* Backups older than `BACKUP_RETENTION_DAYS` (default 30) are deleted together with their files; the newest completed backup is always kept.
* A failed run is retried after 30 minutes. The Database page and the dashboard warn when the latest backup failed or none completed in 26 hours.
* **Upload:** Database → "Upload a backup archive" validates the `PGDMP` header, the `pg_restore --list` table of contents and an optional SHA-256, then stores it and writes an audit entry (limit `BACKUP_UPLOAD_MAX_MB`, default 512).
* **Restore** is intentionally not available from the UI: it needs an isolated target database and OTP confirmation, which depends on SMS delivery being configured.

## Branding
The product name comes from Settings → Branding (`site.branding.title`), defaulting to **Maibook**.
