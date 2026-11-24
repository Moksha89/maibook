# iBook

iBook is a multi-company financial ledger and settlement application built with Next.js, React, Prisma, and PostgreSQL. The application source, database migrations, worker, and tests are in [next-app](next-app/).

## Run locally

Use Node.js 24 and Docker Compose. From the `next-app` directory, copy `.env.example` to `.env`. Set local database credentials, a unique auth secret, and seed-account credentials. Leave the delivery flags disabled for local testing.

```sh
npm ci
docker compose up -d postgres
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

Open http://localhost:3000 and sign in with the seed account. Start the background worker separately with `npm run worker` when testing queued jobs.

The [project specification](docs/IBOOK_PROJECT_SPECIFICATION.md) documents the historical workflows and rebuild scope.
