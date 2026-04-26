# Project Template

A reusable starter for SST v3 + Hono + ElectroDB monorepos with a sibling Expo mobile app. Distilled from production conventions — not a toy demo.

## What's in the box

| Layer | Stack |
|------|-------|
| Infra | SST v3 (Pulumi/AWS), DynamoDB single-table, Cognito user pool with `admin` + `consumer` groups |
| API | Hono v4 monolambda, two API Gateways (admin + consumer), JWT authorizers, ElectroDB v3, service-layer pattern, Swagger UI at `/docs` |
| Web | Next.js 16 App Router, MUI v7 + Emotion, design tokens, AWS Amplify v6 auth, TanStack Query |
| Mobile | Expo SDK 55, expo-router, React Native Paper, AWS Amplify v6, AsyncStorage — sibling repo, fully decoupled |
| Tooling | pnpm workspaces, Turbo, Biome, Vitest, Husky + lint-staged, TypeScript strict |

## Quick start

```sh
# 1. Rename placeholders — pick a kebab-case slug.
tsx platform/bin/rename.ts my-project

# 2. Bring up the platform monorepo.
cd platform
pnpm install
pnpm sst dev          # provisions DynamoDB + Cognito + APIs against your AWS account

# 3. (Optional) Bring up the mobile app — independent repo.
cd ../mobile
pnpm install
pnpm start
```

The rename script rewrites every occurrence of the placeholders `app`, `App`,
`@app/*`, `app-platform`, `app-mobile`, `APP_*` (env prefixes), and a handful of
identifier patterns (`appUserPool`, `createAppTable`, etc.) to your chosen slug.
It refuses to run if any `node_modules` directory already exists.

## Layout

```
template/
├── platform/                # SST monorepo — one git repo
│   ├── apps/
│   │   ├── api/             # Hono on AWS Lambda
│   │   └── web/
│   │       ├── landing/     # Next 16 marketing site
│   │       └── admin/       # Next 16 admin portal
│   ├── packages/
│   │   ├── ui/              # MUI theme + design tokens + shared components
│   │   ├── types/           # zod schemas, env validation, shared types
│   │   └── auth/            # Amplify wrapper, AuthProvider, apiClient
│   ├── data/                # static seed data (.json fixtures)
│   ├── infra/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── table.ts
│   │   ├── secrets.ts
│   │   ├── web.ts
│   │   └── deployments/{development,uat,production}.ts
│   ├── bin/rename.ts        # placeholder rewriter
│   ├── sst.config.ts
│   ├── pnpm-workspace.yaml
│   ├── turbo.json
│   ├── vitest.config.ts
│   ├── tsconfig.json
│   ├── biome.json
│   └── package.json
└── mobile/                  # Expo app — separate git repo
    ├── app/                 # expo-router routes
    ├── src/
    ├── app.config.ts
    └── package.json
```

## Splitting into separate repositories

`mobile/` is intentionally outside the pnpm workspace — there are no shared
imports between `platform/` and `mobile/`. After running the rename script you
can split them:

```sh
cp -r template/platform ~/code/my-project-platform
cp -r template/mobile   ~/code/my-project-mobile
cd ~/code/my-project-platform && git init && git add . && git commit -m "init"
cd ~/code/my-project-mobile   && git init && git add . && git commit -m "init"
```

Mobile authenticates against the same Cognito user pool used by the platform —
copy the user pool ID, mobile client ID, region, and consumer API URL into
`mobile/.env` after deploying `platform/`.

## Conventions

- **Single-table DynamoDB.** One table, `pk`/`sk` + six GSIs, ttl. ElectroDB
  entities under `apps/api/src/db/entities/` model access patterns.
- **Service layer.** Routes never touch entities directly — they call into
  `apps/api/src/services/<domain>/<domain>Service.ts`, which returns DTOs.
- **Two-portal API.** Admin and consumer surfaces live in the same Lambda but
  ship as two API Gateways with two JWT authorizers, so you can diverge them
  (rate limits, middleware, domains) without splitting the codebase.
- **Cognito groups.** `admin` and `consumer` user groups gate routes via
  middleware; the JWT `cognito:groups` claim is the source of truth.
- **Region.** Defaults to `ap-southeast-2`. Production uses `removal: 'retain'`
  and `protect: true`.

## Design doc

See [thoughts/shared/plans/2026-04-26-project-template-starter.md](thoughts/shared/plans/2026-04-26-project-template-starter.md) for the full design rationale and phase-by-phase implementation plan.
