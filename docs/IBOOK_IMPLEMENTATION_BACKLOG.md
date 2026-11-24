# iBook implementation backlog

This checklist records what remains to match the workflows documented in the old Maibook and iBook conversations and the [rebuild specification](IBOOK_PROJECT_SPECIFICATION.md). It describes the Next.js and PostgreSQL app published on `main` at commit `90c4027`.

The core ledger, historical transfer recalculation, settlements and reversals, distributions, responsive popups, and eight API routes are already present. The last verification passed 31 automated checks and browser tests at desktop, tablet, and mobile widths. The work below covers missing implementation and release checks.

## Priority 1 · WhatsApp and backups

These two workstreams can proceed independently. Start integration testing early with a disposable database and isolated providers.

### Connect the WhatsApp bridge and restore report sending

The app has QR controls, a status callback, Text/Image/Both choices, and a delivery worker. The bundled historical bridge uses different HTTP endpoints and authentication from the current Next.js client.

- [ ] Implement one compatible private bridge contract for initialize, logout, message delivery, and authenticated QR and connection-status callbacks.
- [ ] Restore QR pairing for SuperAdmin and permitted Admin users. Update QR and connection status without reloading the page. Keep the WhatsApp session paired across iBook sign-out and app restarts until an authorized user explicitly disconnects it.
- [ ] Restore single and bulk sends from Owners. Preview each recipient's report using their assigned agents, support multiple configured phone numbers, and send from the paired number. Offer Text, PNG Image, and Both. Keep PDF as a separate report download.
- [ ] Restore template preview and variable substitution where used by the old send flow. Record status and errors per recipient, and retry failed jobs without resending deliveries already recorded as successful.

**Acceptance.** Exercise QR refresh, persistent pairing, explicit disconnect, all three report modes, and a mixed-success bulk run. Verify rendered payloads with a non-delivery transport. Verify live pairing and delivery separately with a dedicated account and approved test recipient.

### Finish backup and restore

Manual `pg_dump` creation, checksum verification, and download are already implemented and tested.

- [ ] Schedule daily backups at 2 a.m. in the configured operational timezone. Apply the specification's 30-day default retention and surface failed or stale backups.
- [ ] Add backup upload and validation of the archive and checksum before restore. Audit upload, verification, restore, and cleanup actions.
- [ ] Require elevated permission, explicit confirmation, and short-lived OTP for restore and manual cleanup. Restore into an isolated PostgreSQL target first. Validate schema compatibility and financial totals and document how to preserve the current database and recover from a failed cutover.

**Acceptance.** Create, download, upload, verify, and restore a disposable database. Compare record counts and financial totals. Test corrupt archives, incorrect or expired OTP, denied roles, failed restore, scheduling, and retention.

## Priority 2 · Record management, reports, and UI parity

### Complete management actions and form behavior

- [ ] Add company rename, settings edit, and authorized removal. Complete agent edit, activate, deactivate, soft delete, and assignment management. Restore ID edit, status toggle, and authorized removal. Protect linked financial records and audit changes.
- [ ] Complete user editing and access administration, including role, company access level, module overrides, expiry, OTP, and device limits. Provide the applicable session and device controls to authorized administrators.
- [ ] Fill in edit, status, and assignment workflows for uplines, groups, and shareholders. Validate ownership percentages across overlapping effective periods and preserve historical settlement snapshots.
- [ ] Restore the Add Agent autocomplete. Selecting an existing agent should assign that agent to the selected company. Normalize names and prevent duplicate agent records and company assignments.
- [ ] Restore Enter-to-next-field on applicable data-entry forms. Reuse the compact dialogs and preserve normal behavior for multiline fields, selectors, and explicit submit buttons.
- [ ] Complete URL and table state for company tabs, selected agent, search, filters, sorting, and pagination where applicable. Restore the previous filtered view after create or edit, support browser Back and Forward, and implement the 30-minute table-state behavior.

**Acceptance.** Create, edit, deactivate, and reassign representative records. Confirm read-only and out-of-company users cannot submit writes. Exercise duplicate handling, dialog focus and keyboard behavior, deep links, and navigation back to filtered lists.

### Restore missing ledger and reporting views

- [ ] Recreate the standalone Shareholder Entries screen with shareholder selection, chronological entries, and running balance.
- [ ] Add the dedicated upline/group report. Present settlement-derived and manual upline entries separately so manual entries remain excluded from shareholder profit.
- [ ] Restore the separate Business Partners screen and its permissions. Reuse Owners components for recipient details, agent assignments, and report preview.
- [ ] Complete agent ledger views across assigned companies and within one company, with the relevant running and closing balances. Compare old report filters and export options with the rebuild, including Excel wherever the historical workflow requires it.

**Acceptance.** Reconcile report totals against PostgreSQL for representative companies and date ranges. Verify that reversals disappear from active reporting, access rules scope the results, and manual entries never alter settlement-derived shareholder profit.

## Priority 3 · Release verification

- [ ] Independently reconcile source and imported entity counts and financial totals for every company. Sample historical records, trace closing balances to their ledger lines, and document discrepancies and resolutions.
- [ ] Confirm Agent and Sub Agent posting directions for positive and negative settlements against the historical examples or an approved business rule. Verify subsequent recalculation and reversal against those examples.
- [ ] Test SuperAdmin, Admin, Manager, and Employee across module grants and denials and company read and full access. Cover menus, direct URLs, exports, API access, and server actions.
- [ ] Run browser regression across desktop, tablet, and mobile. Cover new and existing actions, popups, keyboard access, deep links, validation, and downloads.
- [ ] Verify email delivery and SMS OTP against sandbox providers. Confirm whether email OTP is required for login and implement it if confirmed. Keep production delivery disabled during routine QA.
- [ ] Document fresh setup, app and worker startup, database migration, private bridge setup, backup storage, deployment cutover, and recovery. Run the full automated suite, build, lint, typecheck, and dependency audit on the release candidate.

## Decisions to resolve

- Confirm the final brand, logo, deployment platform, storage provider, and backup timezone.
- Confirm whether Owners and Business Partners should remain separate permanently. The backlog restores the recovered separate screens with shared components.
- Confirm whether Database Management should be available in production and whether any specific tables need record edits. Any approved writes need explicit table allowlisting, confirmation, and an audit entry.
- Resolve any settlement posting direction that the historical evidence leaves ambiguous before changing the calculation rules.

## References

- [June Maibook implementation conversation](https://app.devin.ai/sessions/5f7f6a810ff54a82ba2be9d59c086645)
- [iBook rebuild specification](IBOOK_PROJECT_SPECIFICATION.md)
- [Rebuild and prior verification in PR #5](https://github.com/Moksha89/maibook/pull/5)
