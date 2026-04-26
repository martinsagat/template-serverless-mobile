import { Amplify } from 'aws-amplify';
import { env } from './env';

let configured = false;

/**
 * Configure Amplify v6 against the platform's Cognito user pool. Uses the
 * mobile app client (longer refresh-token lifetime). Call once on app start.
 */
export function configureAmplify(): void {
  if (configured) return;
  configured = true;

  const e = env();
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: e.userPoolId,
        userPoolClientId: e.userPoolClientId,
      },
    },
  });
}
