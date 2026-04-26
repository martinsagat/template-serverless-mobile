# mobile

Expo (React Native) app, sibling to `platform/`. Authenticates against the platform's Cognito user pool and calls the **consumer API** with a Bearer token.

This directory is **deliberately outside the pnpm workspace** — there are no shared imports between `platform/` and `mobile/`. Once you've run the rename script at the template root, you can split this folder into its own git repository:

```sh
cd mobile && git init && git add . && git commit -m "init"
```

## Quick start

```sh
pnpm install

# Copy env from platform sst dev outputs
cp .env.example .env
# Edit .env with values from `pnpm --filter platform sst dev` output

pnpm start           # Expo dev server (scan QR with Expo Go)
pnpm ios             # iOS simulator (requires native build)
pnpm android         # Android emulator
```

Required env vars (see `.env.example`):

| Var | Source |
|-----|--------|
| `EXPO_PUBLIC_AWS_REGION` | `ap-southeast-2` (or your project's region) |
| `EXPO_PUBLIC_USER_POOL_ID` | platform `pnpm sst dev` output `userPoolId` |
| `EXPO_PUBLIC_USER_POOL_CLIENT_ID` | output `mobileClientId` |
| `EXPO_PUBLIC_CONSUMER_API_URL` | output `consumerApiUrl` |

## Stack

- **Expo SDK 55** + **expo-router** (typed routes)
- **React Native Paper** (Material Design)
- **AWS Amplify v6** + **`@aws-amplify/react-native`** for Cognito auth
- **AsyncStorage** (token persistence — Amplify uses it under the hood)

## Layout

```
app/                          # expo-router routes
├── _layout.tsx               # Providers: Paper, Auth, Amplify config
├── index.tsx                 # Redirects based on auth status
├── (auth)/sign-in.tsx        # Sign-in screen
└── (app)/widgets.tsx         # Auth-gated widgets list (consumer API)
src/
├── lib/
│   ├── env.ts                # Reads from Constants.expoConfig.extra
│   ├── amplify.ts            # configureAmplify()
│   └── apiClient.ts          # Bearer-token fetch wrapper
├── contexts/AuthContext.tsx  # AuthProvider + useAuth
└── theme/index.ts            # Paper MD3 theme (mirrors web tokens)
app.config.ts                 # Expo app config (bundle id, splash, etc.)
eas.json                      # EAS Build profiles (dev / preview / production)
```

## Backend pairing

This app uses Cognito's **mobile client** (longer 30-day refresh token) and is in the `consumer` user group. The platform's two API Gateways accept these tokens:

- **Consumer API** (this app + future consumer web): valid here ✓
- **Admin API**: rejects mobile tokens (different audience) — by design

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm start` | Expo dev server |
| `pnpm ios` / `pnpm android` | Native builds |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | `expo lint` (ESLint with Expo config) |
| `eas build --profile preview` | Internal distribution build |
| `eas build --profile production` | App Store / Play Store build |

## Notes

- The bundle identifier `com.app.app` in `app.config.ts` is a placeholder. Replace it with your real bundle ID before building for the App Store.
- The `assets/` directory (icon.png, splash.png) is empty — add your project icons there before submitting builds.
- Theme tokens are duplicated from the web's `@app/ui/theme/tokens` (rather than imported) because mobile is a separate repo. Keep them aligned manually if your design system evolves.
