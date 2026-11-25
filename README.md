# Maibook

Maibook is a multi-company financial ledger and settlement application. It covers companies, agents, IDs, settlements, uplines, shareholders and partners, expenses, reports, user access, audit history, backups, and optional WhatsApp delivery.

The application is built with Next.js, React, Prisma, and PostgreSQL.

## Repository layout

```
maibook/
  next-app/            Web application, database schema, background worker, and tests
  whatsapp-bridge/     Optional private service for WhatsApp delivery
  docs/                Product, operations, and integration documentation
```

The live application lives in `next-app`. Keep that path as it is so local development and production deploys stay aligned.

## Run locally

Use Node.js 24 and Docker Compose. From the `next-app` directory, copy `.env.example` to `.env`. Set local database credentials, a unique auth secret, and seed-account credentials. Leave email, SMS, and WhatsApp delivery disabled for local work.

```sh
cd next-app
npm ci
docker compose up -d postgres
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

Open http://localhost:3000 and sign in with the seed account. Start the background worker separately with `npm run worker` when you need queued jobs (including backups and message delivery).

## Tests and checks

From `next-app`:

```sh
npm run typecheck
npm test
npm run lint
```

Browser end-to-end scripts in `next-app/e2e` are for a local, disposable database only. Do not point them at a production site.

## Deploy

See [docs/operations.md](docs/operations.md). In short: install dependencies, generate the database client, apply migrations, build the app, and restart the web process and the worker. Environment files, credentials, and database dumps stay outside this repository.

## Documentation

- [Documentation index](docs/README.md)
- [Product specification](docs/product-specification.md)
- [Operations](docs/operations.md)
- [WhatsApp bridge](docs/whatsapp-bridge.md)
