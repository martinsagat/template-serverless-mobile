/**
 * Project-wide secrets. Set values with: `pnpm sst secret set <NAME> <value>`.
 *
 * Empty defaults are used so a fresh `sst dev` succeeds even before the secrets
 * have been populated. Features that depend on a secret should remain disabled
 * until you both set the secret AND flip the corresponding toggle (see
 * `infra/deployments/*.ts`).
 */

// Google (Cognito identity provider — Sign in with Google)
// Set per stage:
//   sst secret set GoogleClientId <client id> --stage <stage>
//   sst secret set GoogleClientSecret <client secret> --stage <stage>
export const googleClientId = new sst.Secret('GoogleClientId', '');
export const googleClientSecret = new sst.Secret('GoogleClientSecret', '');

// Apple (Cognito identity provider — Sign in with Apple)
// `ApplePrivateKey` must be the base64-encoded contents of the AuthKey_*.p8
// file Apple gives you when you create a Sign in with Apple key:
//   base64 -i AuthKey_XXXX.p8 | pbcopy
//   sst secret set ApplePrivateKey "<paste>" --stage <stage>
export const appleServiceId = new sst.Secret('AppleServiceId', '');
export const appleTeamId = new sst.Secret('AppleTeamId', '');
export const appleKeyId = new sst.Secret('AppleKeyId', '');
export const applePrivateKey = new sst.Secret('ApplePrivateKey', '');
