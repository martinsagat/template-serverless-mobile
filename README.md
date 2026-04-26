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
- **Required user attributes.** The Cognito user pool enforces `email`,
  `given_name` (first name), and `family_name` (last name) on every sign-up
  path — username/password, Google, and Apple. Cognito will reject sign-ups
  that don't supply all three.

## Social sign-in (Google + Apple)

Cognito federates to Google and Apple as identity providers. The user pool
issues its own JWT regardless of which IdP the user authenticated with, so the
API authorizer code stays the same. Both providers are **off by default** —
turn them on per stage by setting the relevant SST secrets and flipping the
toggle in `infra/deployments/<stage>.ts`:

```ts
const ENABLE_GOOGLE_SSO = true;
const ENABLE_APPLE_SSO  = true;
```

The admin web sign-in page (`apps/web/admin/.../sign-in`) already renders
"Continue with Google" and "Continue with Apple" buttons — they call
`signInWithRedirect()` from Amplify v6 and round-trip via the Cognito Hosted
UI. The buttons will fail with a Cognito error until both the secrets and the
toggle are in place.

### 1. Google

1. Open [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth client ID** of type **Web application**.
3. **Authorized JavaScript origins** — add the Cognito Hosted UI domain that
   `sst dev` printed (e.g. `https://app-dev.auth.ap-southeast-2.amazoncognito.com`)
   plus any custom auth domain (`https://auth.myapp.com`).
4. **Authorized redirect URIs** — add `https://<hosted-ui>/oauth2/idpresponse`
   for every Cognito domain you'll use.
5. Copy the client ID and client secret.
6. Set the SST secrets per stage:

   ```sh
   pnpm sst secret set GoogleClientId <client-id> --stage dev
   pnpm sst secret set GoogleClientSecret <client-secret> --stage dev
   ```

7. Set `ENABLE_GOOGLE_SSO = true` in `infra/deployments/development.ts` and
   redeploy (`pnpm sst dev` / `pnpm sst deploy --stage <stage>`).

### 2. Apple

1. In your [Apple Developer account](https://developer.apple.com/account/resources/identifiers/list)
   create:
   - An **App ID** (Identifier) for your app — enable **Sign in with Apple**.
   - A **Services ID** for the web flow — this is the value Cognito needs as
     `client_id`. Configure it for **Sign in with Apple** and add the Cognito
     redirect URL: `https://<hosted-ui>/oauth2/idpresponse`.
   - A **Key** with **Sign in with Apple** enabled. Download the `.p8` file
     (you can only download it once) and note the **Key ID**.
2. Find your **Team ID** at the top right of the developer portal.
3. Base64-encode the `.p8` file:

   ```sh
   base64 -i AuthKey_XXXXXXXXXX.p8 | pbcopy
   ```

4. Set the SST secrets per stage:

   ```sh
   pnpm sst secret set AppleServiceId <services-id>     --stage dev   # e.g. com.myapp.signin
   pnpm sst secret set AppleTeamId    <team-id>         --stage dev
   pnpm sst secret set AppleKeyId     <key-id>          --stage dev
   pnpm sst secret set ApplePrivateKey "<base64-blob>"  --stage dev
   ```

5. Set `ENABLE_APPLE_SSO = true` in `infra/deployments/development.ts` and
   redeploy.

> **First-name / last-name with Apple.** Apple only releases the user's name
> on the very first authorization, and only if the user chooses to share it
> on the consent screen. Because the user pool requires `given_name` and
> `family_name`, a user who selects "Hide my name" on first auth will fail
> sign-up with a Cognito error. To re-test: revoke the app at
> [appleid.apple.com](https://appleid.apple.com/) → Sign in with Apple → Stop
> using.

### Required SST secrets summary

| Secret | Used for | Where to find it |
|--------|----------|------------------|
| `GoogleClientId`     | Google IdP | Google Cloud Console → Credentials |
| `GoogleClientSecret` | Google IdP | Google Cloud Console → Credentials |
| `AppleServiceId`     | Apple IdP  | Apple Developer → Identifiers → Services ID |
| `AppleTeamId`        | Apple IdP  | Apple Developer (header) |
| `AppleKeyId`         | Apple IdP  | Apple Developer → Keys |
| `ApplePrivateKey`    | Apple IdP  | base64 of the `.p8` Key file |

Set per stage with `pnpm sst secret set <name> <value> --stage <stage>`. List
or remove secrets with `pnpm sst secret list` / `pnpm sst secret remove`.

## CI/CD

GitHub Actions workflows live at `.github/workflows/`:

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `platform-pr-checks.yml`         | PR against `main` (paths: `platform/**`) | Turbo lint + typecheck + test + infra typecheck |
| `platform-deploy-uat.yml`        | Push to `main` (paths: `platform/**`)    | Quality checks → `sst deploy --stage uat` |
| `platform-deploy-production.yml` | GitHub release published                 | Quality checks → `sst deploy --stage production` |
| `mobile-preview.yml`             | Manual (`workflow_dispatch`)             | EAS preview build → TestFlight + Play Internal |
| `mobile-production-release.yml`  | Manual (`workflow_dispatch`)             | EAS production build → App Store + Play |

### Setting up the AWS deploy role (GitHub OIDC)

The deploy workflows assume an IAM role via OIDC — no long-lived AWS keys stored
in GitHub. One-time setup per AWS account:

**1. Add GitHub as an OIDC identity provider** (once per account):

AWS Console → IAM → Identity providers → Add provider → OpenID Connect:

- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

Or via CLI:

```sh
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

**2. Create the deploy role.** Save this trust policy as `trust-policy.json`,
replacing `<AWS_ACCOUNT_ID>`, `<GITHUB_ORG>`, `<REPO_NAME>`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:<GITHUB_ORG>/<REPO_NAME>:*"
        }
      }
    }
  ]
}
```

To restrict to specific environments only (recommended for production), narrow
the `sub` claim:

```json
"token.actions.githubusercontent.com:sub": "repo:<GITHUB_ORG>/<REPO_NAME>:environment:production"
```

Then create the role:

```sh
aws iam create-role \
  --role-name GitHubActionsSSTDeployRole \
  --assume-role-policy-document file://trust-policy.json
```

**3. Attach permissions.** SST needs broad infrastructure rights. The simplest
working policy is `arn:aws:iam::aws:policy/AdministratorAccess`:

```sh
aws iam attach-role-policy \
  --role-name GitHubActionsSSTDeployRole \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

If you want to scope down later, SST documents the minimum set:
[https://sst.dev/docs/iam-credentials](https://sst.dev/docs/iam-credentials).

**4. Create GitHub Environments.** In the GitHub repo: Settings → Environments
→ New environment. Create one per stage (`uat`, `production`). For each:

- **Secrets:**
  - `AWS_DEPLOY_ROLE_ARN` = `arn:aws:iam::<AWS_ACCOUNT_ID>:role/GitHubActionsSSTDeployRole`
- **Variables (optional):**
  - `AWS_REGION` (defaults to `ap-southeast-2` if unset)
- **Protection rules (production only):**
  - Required reviewers: at least one
  - Restrict to `main` branch and tags

If `uat` and `production` live in different AWS accounts, repeat steps 1-3 in
each account and use the per-environment role ARN.

**5. (Optional) Mobile workflow secrets.** Repository → Settings → Secrets and
variables → Actions → New repository secret:

| Secret | Source |
|--------|--------|
| `EXPO_TOKEN` | Expo dashboard → account → Access tokens |
| `EAS_PROJECT_ID` | Expo dashboard → project → Settings |
| `ASC_API_KEY_BASE64` | App Store Connect → Users and Access → Keys (`.p8`, raw or base64) |
| `ASC_ISSUER_ID` | App Store Connect → Users and Access → Keys |
| `ASC_KEY_ID` | App Store Connect → Users and Access → Keys |
| `APPLE_TEAM_ID` | developer.apple.com → Membership |
| `APPLE_TEAM_TYPE` | `INDIVIDUAL` or `COMPANY_OR_ORGANIZATION` |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Google Play Console service account JSON (raw or base64) |

### Triggering deploys

- **UAT:** push or merge into `main`. The path filter (`platform/**`) prevents
  mobile-only changes from triggering a redeploy.
- **Production:** create a GitHub Release (Releases → Draft a new release →
  publish). The workflow checks out the release tag and deploys it.
- **Mobile:** Actions tab → select workflow → Run workflow.

## Design doc

See [thoughts/shared/plans/2026-04-26-project-template-starter.md](thoughts/shared/plans/2026-04-26-project-template-starter.md) for the full design rationale and phase-by-phase implementation plan.
