# platform

The SST monorepo: API, web apps, infra, and shared packages.

## Quick start

```sh
# Install workspace deps
pnpm install

# Provision your dev stack on AWS (DynamoDB, Cognito, two API Gateways, web sites)
pnpm sst dev

# In separate terminals (after sst dev populates resources):
pnpm dev:landing    # localhost:3000
pnpm dev:admin      # localhost:3001
```

You'll need:

- AWS credentials in your shell (`AWS_PROFILE=...` or env vars)
- pnpm 10+, Node 22+
- Region defaults to `ap-southeast-2` — change in `sst.config.ts`

## Layout

```
apps/
├── api/                       # Hono v4 monolambda, two entries (admin, consumer)
│   └── src/
│       ├── db/                # ElectroDB single-table (Widget example)
│       ├── services/          # Service-layer pattern (widgetService, etc.)
│       └── hono/
│           ├── apps/          # Per-portal Hono app composition
│           ├── entries/       # Lambda entry handlers
│           ├── middleware/    # auth (JWT claims), cors, errorHandler, logger
│           └── routes/{admin,consumer}/  # Per-portal route modules
└── web/
    ├── landing/               # Next.js 16, marketing site, no auth
    └── admin/                 # Next.js 16, Amplify-gated, hits admin API
packages/
├── types/    # zod schemas (Widget, env)
├── auth/     # Amplify wrapper + AuthProvider + apiClient (web)
└── ui/       # MUI theme + design tokens + ThemeRegistry + sample components
data/         # static seed JSON (per project)
infra/
├── api.ts            # API Gateway v2 + JWT authorizers
├── auth.ts           # Cognito user pool + 3 clients + admin/consumer groups
├── table.ts          # Single DynamoDB table (pk/sk + 6 GSIs + ttl)
├── secrets.ts        # Placeholder for SendGrid/Twilio/etc.
├── web.ts            # SST Nextjs sites
└── deployments/{development,uat,production}.ts
bin/
└── rename.ts         # One-shot placeholder rewriter
```

## Conventions

- **Single-table DynamoDB.** ElectroDB entities define access patterns. The shared `tableConfig` lives in `apps/api/src/db/client.ts`.
- **Service layer.** Routes call `widgetService.*` which returns DTOs. Routes never see entity items.
- **Two-portal API.** Each portal is its own Hono app (`hono/apps/admin.ts`, `consumer.ts`) → its own Lambda entry → its own API Gateway with its own JWT authorizer that only accepts tokens from the matching Cognito client.
- **Group-gated middleware.** `requireGroup('admin' | 'consumer')` enforces the `cognito:groups` JWT claim.
- **OpenAPI everywhere.** Routes use `@hono/zod-openapi` so Swagger UI at `/docs` is always in sync with the schemas.
- **Lazy env.** Web apps validate `NEXT_PUBLIC_*` env vars on first use, not at module load, so `next build` doesn't fail before `sst deploy` injects them.

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm sst dev` | Provision + watch your dev stack |
| `pnpm sst deploy --stage uat` | Deploy uat |
| `pnpm sst deploy --stage production` | Deploy production (`removal: 'retain'`, protected) |
| `pnpm dev:admin` / `dev:landing` | Run a single web app |
| `pnpm typecheck` | Across all workspaces |
| `pnpm typecheck:infra` | Infra-only (Pulumi types) |
| `pnpm test` | Vitest across workspaces |
| `pnpm lint` | Biome across workspaces |
| `pnpm lint:fix` | Auto-fix Biome issues |
| `pnpm rename <slug>` | One-shot rename (refuses if `node_modules` exists) |
| `pnpm --filter @app/ui generate:tokens` | Regenerate `globals.css` from `tokens.ts` |

## SST resource type augmentation

`apps/api/src/types/resources.d.ts` declares the SST `Resource` interface so the API typechecks before the first `sst dev`. SST overwrites these declarations with the real provisioned names via `sst-env.d.ts` (gitignored) on each run.

## Adding a new entity

1. Add the ElectroDB entity to `apps/api/src/db/entities/`.
2. Add zod schemas to `packages/types/src/<domain>.ts` and re-export from `packages/types/src/index.ts`.
3. Add a service module under `apps/api/src/services/<domain>/`.
4. Add routes under `apps/api/src/hono/routes/{admin,consumer}/<domain>.ts`.
5. Mount the routes in `hono/apps/admin.ts` / `consumer.ts`.

## See also

- [SETUP.md](../SETUP.md) — first-time setup walkthrough.
- [thoughts/shared/plans/2026-04-26-project-template-starter.md](../thoughts/shared/plans/2026-04-26-project-template-starter.md) — design rationale.
