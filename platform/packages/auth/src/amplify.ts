import { Amplify } from 'aws-amplify';

export interface AmplifyConfig {
  region: string;
  userPoolId: string;
  userPoolClientId: string;
  /** Hosted UI domain, e.g. `app-dev.auth.ap-southeast-2.amazoncognito.com`. */
  oauthDomain?: string;
  /** Where the IdP redirects back after sign-in (must match Cognito client config). */
  redirectSignIn?: string[];
  redirectSignOut?: string[];
}

let configured = false;

/**
 * Configure Amplify v6 against your Cognito user pool.
 * Call once on module load (web) or app startup (mobile).
 */
export function configureAmplify(config: AmplifyConfig): void {
  if (configured) return;
  configured = true;

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: config.userPoolId,
        userPoolClientId: config.userPoolClientId,
        ...(config.oauthDomain && {
          loginWith: {
            oauth: {
              domain: config.oauthDomain,
              scopes: [
                'openid',
                'email',
                'profile',
                'aws.cognito.signin.user.admin',
              ],
              redirectSignIn: config.redirectSignIn ?? [],
              redirectSignOut: config.redirectSignOut ?? [],
              responseType: 'code',
            },
          },
        }),
      },
    },
  });
}
