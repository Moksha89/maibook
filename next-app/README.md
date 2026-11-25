# Maibook application

This folder is the Maibook web application, database schema, background worker, and tests.

For product overview, local setup, and deploy steps, see the [repository README](../README.md) and [documentation](../docs/README.md).

```sh
cp .env.example .env
npm ci
docker compose up -d postgres
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

The app is available at http://localhost:3000. Run `npm run worker` in a second terminal when you need background jobs.
