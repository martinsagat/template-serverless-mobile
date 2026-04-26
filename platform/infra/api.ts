import type { AppAuth } from './auth';
import type { AppTable } from './table';

export interface CreateAppApisParams {
  table: AppTable;
  auth: AppAuth;
}

export interface AppApis {
  adminApi: sst.aws.ApiGatewayV2;
  consumerApi: sst.aws.ApiGatewayV2;
}

const HONO_ENTRIES = {
  admin: 'apps/api/src/hono/entries/admin.handler',
  consumer: 'apps/api/src/hono/entries/consumer.handler',
} as const;

/**
 * Two API Gateways (admin + consumer), each with a Cognito JWT authorizer
 * scoped to that audience's app client(s).
 */
export function createAppApis(params: CreateAppApisParams): AppApis {
  const { table, auth } = params;
  const region = aws.getRegionOutput().name;
  const cognitoIssuer = $interpolate`https://cognito-idp.${region}.amazonaws.com/${auth.userPool.id}`;

  // Admin API — only the admin web client may mint tokens accepted here.
  const adminApi = new sst.aws.ApiGatewayV2('appAdminApi', {
    link: [table],
    transform: {
      route: {
        handler: (args) => {
          args.environment = { ...args.environment, STAGE: $app.stage };
        },
      },
    },
  });
  const adminAuthorizer = adminApi.addAuthorizer({
    name: 'AdminCognito',
    jwt: {
      issuer: cognitoIssuer,
      audiences: [auth.adminClient.id],
    },
  });
  adminApi.route('GET /health', HONO_ENTRIES.admin);
  adminApi.route('GET /openapi.json', HONO_ENTRIES.admin);
  adminApi.route('GET /docs', HONO_ENTRIES.admin);
  adminApi.route('ANY /widgets', HONO_ENTRIES.admin, {
    auth: { jwt: { authorizer: adminAuthorizer.id } },
  });
  adminApi.route('ANY /widgets/{proxy+}', HONO_ENTRIES.admin, {
    auth: { jwt: { authorizer: adminAuthorizer.id } },
  });

  // Consumer API — accepts both consumer-web and mobile audience tokens.
  const consumerApi = new sst.aws.ApiGatewayV2('appConsumerApi', {
    link: [table],
    transform: {
      route: {
        handler: (args) => {
          args.environment = { ...args.environment, STAGE: $app.stage };
        },
      },
    },
  });
  const consumerAuthorizer = consumerApi.addAuthorizer({
    name: 'ConsumerCognito',
    jwt: {
      issuer: cognitoIssuer,
      audiences: [auth.consumerClient.id, auth.mobileClient.id],
    },
  });
  consumerApi.route('GET /health', HONO_ENTRIES.consumer);
  consumerApi.route('GET /openapi.json', HONO_ENTRIES.consumer);
  consumerApi.route('GET /docs', HONO_ENTRIES.consumer);
  consumerApi.route('ANY /widgets', HONO_ENTRIES.consumer, {
    auth: { jwt: { authorizer: consumerAuthorizer.id } },
  });
  consumerApi.route('ANY /widgets/{proxy+}', HONO_ENTRIES.consumer, {
    auth: { jwt: { authorizer: consumerAuthorizer.id } },
  });

  return { adminApi, consumerApi };
}
