import type { AppApis } from './api';
import type { AppAuth } from './auth';

export interface CreateAppWebParams {
  apis: AppApis;
  auth: AppAuth;
}

export interface AppWeb {
  landing: sst.aws.Nextjs;
  admin: sst.aws.Nextjs;
}

/**
 * Two Next.js sites: marketing landing (no auth) + admin portal (Amplify auth).
 * Domains are project-specific — wire them in per-stage deployment files.
 */
export function createAppWeb(params: CreateAppWebParams): AppWeb {
  const { apis, auth } = params;
  const region = aws.getRegionOutput().name;

  const landing = new sst.aws.Nextjs('appLanding', {
    path: 'apps/web/landing',
  });

  const admin = new sst.aws.Nextjs('appAdmin', {
    path: 'apps/web/admin',
    environment: {
      NEXT_PUBLIC_AWS_REGION: region,
      NEXT_PUBLIC_USER_POOL_ID: auth.userPool.id,
      NEXT_PUBLIC_ADMIN_CLIENT_ID: auth.adminClient.id,
      NEXT_PUBLIC_ADMIN_API_URL: apis.adminApi.url,
      NEXT_PUBLIC_COGNITO_OAUTH_DOMAIN: auth.cognitoOAuthDomain,
    },
  });

  return { landing, admin };
}
