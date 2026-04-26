# First-time setup

Step-by-step walkthrough for going from `git clone` to a working dev stack.

## Prerequisites

| Tool | Why |
|------|-----|
| Node 22+ | runtime |
| pnpm 10+ | workspace package manager |
| AWS CLI configured | `~/.aws/credentials` with at least one profile |
| (optional) Expo Go on phone | preview the mobile app |

## 1. Rename placeholders

The template ships with `app` / `App` / `@app/*` placeholders. Pick a kebab-case slug for your project and run the rename script **before** running `pnpm install`:

```sh
tsx platform/bin/rename.ts <your-slug>
# e.g.  tsx platform/bin/rename.ts acme-rewards
```

The script:
- Refuses to run if any `node_modules` directory exists (protects you from stale lockfiles).
- Validates `<slug>` against `^[a-z][a-z0-9-]{1,30}$`.
- Rewrites placeholders across `platform/` and `mobile/` — package names (`@app/* → @<slug>/*`), workspace names, SST/ElectroDB service names (`'app' → '<slug>'`), Cognito resource ids (`appUserPool → <slug>UserPool`), env-var prefixes (`APP_* → <UPPER_SLUG>_*`), and display strings.
- Deletes both `pnpm-lock.yaml` files so they regenerate cleanly with the new package names.
- Is idempotent — running twice is a no-op the second time.

After it runs, search for any remaining `App` strings — display labels you'll want to humanise (e.g. `name: 'AcmeRewards'` → `name: 'Acme Rewards'`).

## 2. Install platform deps

```sh
cd platform
pnpm install
```

## 3. Bring up the SST dev stack

```sh
# Pick the AWS profile you want to deploy under
export AWS_PROFILE=<your-profile>

pnpm sst dev
```

This provisions (in `ap-southeast-2` by default — change in `sst.config.ts`):

- One DynamoDB table (single-table design, 6 GSIs)
- One Cognito user pool with `admin` and `consumer` groups
- Three Cognito app clients (admin web, consumer web, mobile)
- Two API Gateways (admin + consumer) with JWT authorizers
- Two Next.js sites (landing + admin)

When `sst dev` finishes provisioning it prints outputs — note the `consumerApiUrl`, `adminApiUrl`, `userPoolId`, `adminClientId`, `mobileClientId`, and `cognitoOAuthDomain`.

## 4. Create test users

In the AWS Cognito console:

1. Go to your new user pool.
2. Create two users — one with email `admin@example.com` (assigned to `admin` group), one with `user@example.com` (assigned to `consumer` group).
3. Confirm both manually (set permanent passwords).

## 5. Run the web admin

In a new terminal:

```sh
# In platform/apps/web/admin, create .env.local with the SST outputs
cd platform/apps/web/admin
cp .env.example .env.local
# Fill in the values from `sst dev` outputs

cd ../../..
pnpm dev:admin   # http://localhost:3001
```

Sign in as `admin@example.com`. The widgets table will be empty initially — `POST` a widget via the consumer API or admin API to populate it.

## 6. Run the mobile app

```sh
cd mobile
pnpm install

cp .env.example .env
# Fill in EXPO_PUBLIC_USER_POOL_ID, EXPO_PUBLIC_USER_POOL_CLIENT_ID (mobileClientId),
# EXPO_PUBLIC_CONSUMER_API_URL from sst dev outputs

pnpm start
```

Scan the QR code with Expo Go on your phone, sign in as `user@example.com`, and watch the widgets list call the consumer API.

## 7. Try the API directly

```sh
# Get a token (admin user)
aws cognito-idp admin-initiate-auth \
  --user-pool-id <userPoolId> \
  --client-id <adminClientId> \
  --auth-flow ADMIN_USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=admin@example.com,PASSWORD=<password>

# Use the AccessToken
curl -H "Authorization: Bearer <token>" <adminApiUrl>/widgets
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"name":"first widget"}' <consumerApiUrl>/widgets
```

Visit `<adminApiUrl>/docs` and `<consumerApiUrl>/docs` to see the auto-generated Swagger UI.

## 8. Split mobile into its own repo (optional)

```sh
mv mobile ~/code/<your-slug>-mobile
cd ~/code/<your-slug>-mobile
git init && git add . && git commit -m "init"
```

The platform repo and the mobile repo can now evolve independently. They only share a Cognito user pool.

## Stages

```sh
pnpm sst deploy --stage uat            # uses removal:'remove'
pnpm sst deploy --stage production     # uses removal:'retain', protected
```

Production sets `protect: true` in `sst.config.ts` — destructive ops require the `--protect` flag explicitly.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Refusing to run: node_modules exists` from rename | Run rename **before** `pnpm install` |
| `Resource 'appTable' not found` typecheck error | Run `pnpm sst install` once to generate `.sst/platform/` types |
| Admin portal build fails locally with env errors | That's expected without `.env.local` — SST injects env vars at deploy time |
| `expo doctor` complains about peer dep mismatches | Run `pnpm install` again after `expo lint` configures ESLint |
