# platform

SST v3 monorepo: Hono on Lambda + ElectroDB single-table DynamoDB + Next.js 16 web apps. Conventions and architectural rationale below.

## Architecture

- **Two-portal API**: `apps/api/` is one codebase that ships as two API Gateway HTTP APIs (admin, consumer). Each portal has its own Hono app (`hono/apps/{admin,consumer}.ts`), its own Lambda entry (`hono/entries/{admin,consumer}.ts`), and its own JWT authorizer. Cognito tokens for one portal don't work on the other (different audiences). Add a third portal by replicating the pattern, not by branching middleware.
- **Single-table DynamoDB**: one `app`-named DDB table with `pk/sk` primary + 6 generic GSIs (`gsi1pk/sk` … `gsi6pk/sk`). Every entity claims indexes by name. ElectroDB entities live in `apps/api/src/db/entities/` and share the table reference from `apps/api/src/db/client.ts`.
- **Service layer**: routes call `apps/api/src/services/<domain>/<domain>Service.ts`. Routes never see `EntityItem<…>`. Services validate input via zod (schemas in `packages/types`), call ElectroDB, and return DTOs.
- **Auth**: Cognito user pool with two groups (`admin`, `consumer`) and three app clients (admin web, consumer web, mobile). API Gateway pre-validates the JWT signature; `apps/api/src/hono/middleware/auth.ts` reads the already-trusted claims and exposes `c.get('auth')`. `requireGroup('admin')` enforces the `cognito:groups` claim.
- **OpenAPI spec**: every route is defined with `@hono/zod-openapi` `createRoute(...)`. Swagger UI is mounted at `/docs` on each portal.

## Where things live

| Concern | Path |
|---------|------|
| ElectroDB entity definitions | `apps/api/src/db/entities/` |
| Service-layer business logic | `apps/api/src/services/<domain>/` |
| Hono routes (per portal) | `apps/api/src/hono/routes/{admin,consumer}/` |
| Middleware (auth, cors, logger, errors) | `apps/api/src/hono/middleware/` |
| Shared zod schemas / types | `packages/types/src/<domain>.ts` |
| Web auth wrapper (Amplify v6) | `packages/auth/src/` |
| MUI theme + design tokens | `packages/ui/src/theme/` |
| ThemeRegistry (MUI client wrapper for RSC) | `packages/ui/src/components/ThemeRegistry.tsx` |
| Single-table DDB infra | `infra/table.ts` |
| Cognito infra | `infra/auth.ts` |
| API Gateway + JWT authorizers | `infra/api.ts` |
| Next.js sites infra | `infra/web.ts` |
| Per-stage dispatch | `infra/deployments/{development,uat,production}.ts` |
| Placeholder rename script | `bin/rename.ts` |

## Conventions

- **No code in routes.** Routes parse input + call the service + return the DTO. Real logic lives in services.
- **DTOs, not entities.** Service functions return zod-validated DTOs. Mappers (`toWidgetDto(...)`) live in the service file.
- **Zod is the contract.** Schemas in `packages/types` are imported by both API and web — change them in one place.
- **Errors flow up, not down.** Services throw `ServiceError.{notFound,invalidInput,conflict,unauthorized,validation}(...)` (`apps/api/src/lib/errors.ts`). Routes don't catch — the global `errorHandler` middleware (`apps/api/src/hono/middleware/errorHandler.ts`) maps `ServiceError` → status code, logs unexpected errors to the request-scoped logger, and returns a uniform `{ error }` envelope. Why no try/catch in routes: `@hono/zod-openapi` strict-types responses, so mixing 2xx and 4xx returns from a single handler trips the type system. The `mapServiceError` helper in `hono/helpers/` is available if you ever need explicit per-route handling.
- **Per-request logger.** `requestLogger` middleware sets `c.var.log` and `c.var.requestId` on each request. Auth middleware enriches it with `userSub`/`userEmail`. Use `c.get('log').info('...', { ... })` in routes and services for traceable logs. Local dev gets coloured output; Lambda emits one JSON line per entry for CloudWatch Logs Insights.
- **Lazy env on web.** `apps/web/admin/src/lib/env.ts` validates `process.env.NEXT_PUBLIC_*` on first call, not at module load. Why: SST injects env at deploy time, so a fresh-clone `next build` would otherwise crash.
- **Force-dynamic admin pages.** Auth-gated routes are session-dependent. The admin layout sets `dynamic = 'force-dynamic'` so Next never tries to prerender them.
- **MUI theme wrapper.** RSC layouts can't pass functions across the client boundary, and the MUI theme has function-valued fields. `ThemeRegistry` (a `'use client'` wrapper) is the only place the theme is constructed.
- **Cognito group naming.** Lowercase (`admin`, `consumer`) — the JWT `cognito:groups` claim preserves case, and middleware compares case-sensitively.
- **Region pinned in `sst.config.ts`.** Default `ap-southeast-2`; override per project.

## What lives in `sst-env.d.ts` vs `apps/api/src/types/resources.d.ts`

- `sst-env.d.ts` is **auto-generated** by `sst dev` / `sst deploy`, gitignored.
- `apps/api/src/types/resources.d.ts` is **hand-written**, committed. It augments the SST `Resource` interface with the entries the API depends on (e.g. `appTable`), so `pnpm typecheck` works on a fresh clone before anyone has run SST.

## Adding a new domain

1. Entity → `apps/api/src/db/entities/<Domain>.ts` (pin to a GSI).
2. Schemas + types → `packages/types/src/<domain>.ts`, re-exported from `packages/types/src/index.ts`.
3. Service → `apps/api/src/services/<domain>/{<domain>Service.ts,<domain>Types.ts,index.ts}`.
4. Routes → `apps/api/src/hono/routes/{admin,consumer}/<domain>.ts`.
5. Mount in `hono/apps/{admin,consumer}.ts` and add the route paths to the JWT-authorizer `route(...)` calls in `infra/api.ts`.

## When in doubt

The `Widget` example threads through every layer (entity → service → routes → admin UI → mobile UI). Use it as the reference pattern.
