import type { AppApis } from './api';
import type { AppAuth } from './auth';
import { type AppDomainConfig, appSubdomains, sstDomainProp } from './domain';

export interface CreateAppWebParams {
  apis: AppApis;
  auth: AppAuth;
  domain?: AppDomainConfig;
}

export interface AppWeb {
  landing: sst.aws.Nextjs;
  admin: sst.aws.Nextjs;
}

/**
 * Two Next.js sites: marketing landing (no auth) + admin portal (Amplify auth).
 * When a `domain` is supplied, landing attaches to the apex and admin attaches
 * to `admin.{domain}`; otherwise both fall back to SST-generated CloudFront
 * URLs.
 */
export function createAppWeb(params: CreateAppWebParams): AppWeb {
  const { apis, auth, domain } = params;
  const sub = domain ? appSubdomains(domain) : undefined;
  const region = aws.getRegionOutput().name;

  const landing = new sst.aws.Nextjs('appLanding', {
    path: 'apps/web/landing',
    ...(sub && domain && { domain: sstDomainProp(sub.landing, domain) }),
  });

  const admin = new sst.aws.Nextjs('appAdmin', {
    path: 'apps/web/admin',
    ...(sub && domain && { domain: sstDomainProp(sub.admin, domain) }),
    environment: {
      NEXT_PUBLIC_AWS_REGION: region,
      NEXT_PUBLIC_USER_POOL_ID: auth.userPool.id,
      NEXT_PUBLIC_ADMIN_CLIENT_ID: auth.adminClient.id,
      NEXT_PUBLIC_ADMIN_API_URL: apis.adminApi.url,
      NEXT_PUBLIC_COGNITO_OAUTH_DOMAIN: auth.cognitoOAuthDomain,
      // Empty when no custom domain — Providers.tsx falls back to window.location.origin.
      NEXT_PUBLIC_ADMIN_URL: sub ? `https://${sub.admin}` : '',
    },
  });

  return { landing, admin };
}
