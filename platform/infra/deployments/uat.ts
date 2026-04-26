import { createAppApis } from '../api';
import { createAppAuth } from '../auth';
import { createAppTable } from '../table';
import { createAppWeb } from '../web';

export async function deployUat() {
  const table = createAppTable();
  const auth = createAppAuth();
  const apis = createAppApis({ table, auth });
  const web = createAppWeb({ apis, auth });

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
