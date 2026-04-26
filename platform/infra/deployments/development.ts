import { createAppApis } from '../api';
import { attachCognitoCustomDomain, createAppAuth } from '../auth';
import type { AppDomainConfig } from '../domain';
import { createAppTable } from '../table';
import { createAppWeb } from '../web';

// Set this to enable custom domains for the development stage. The hosted zone
// must live in Route 53 in this AWS account. See infra/domain.ts.
//
// const DOMAIN: AppDomainConfig | undefined = {
//   name: 'dev.myapp.com',
//   hostedZone: 'myapp.com',
// };
const DOMAIN: AppDomainConfig | undefined = undefined;

// Flip these to `true` after setting the corresponding SST secrets — see
// README "Social sign-in (Google + Apple)". Until you set the secrets, leave
// them as `false`, otherwise the deploy will fail when the IdP is created
// with empty client_id / client_secret values.
const ENABLE_GOOGLE_SSO = false;
const ENABLE_APPLE_SSO = false;

export async function deployDevelopment() {
  const table = createAppTable();
  const auth = createAppAuth({
    domain: DOMAIN,
    enableGoogleSso: ENABLE_GOOGLE_SSO,
    enableAppleSso: ENABLE_APPLE_SSO,
  });
  const apis = createAppApis({ table, auth, domain: DOMAIN });
  const web = createAppWeb({ apis, auth, domain: DOMAIN });
  if (DOMAIN) {
    attachCognitoCustomDomain({
      auth,
      domain: DOMAIN,
      dependsOn: [web.landing],
    });
  }

  return {
    region: aws.getRegionOutput().name,
    tableName: table.name,
    userPoolId: auth.userPool.id,
    adminClientId: auth.adminClient.id,
    consumerClientId: auth.consumerClient.id,
    mobileClientId: auth.mobileClient.id,
    cognitoOAuthDomain: auth.cognitoOAuthDomain,
    adminApiUrl: apis.adminApi.url,
    consumerApiUrl: apis.consumerApi.url,
    landingUrl: web.landing.url,
    adminUrl: web.admin.url,
  };
}
