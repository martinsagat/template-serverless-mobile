/**
 * Cognito user pool + three app clients (admin web, consumer web, mobile)
 * + two user groups (admin, consumer).
 *
 * Each API Gateway picks the relevant client id(s) for its JWT authorizer.
 */
export function createAppAuth() {
  const userPool = new sst.aws.CognitoUserPool('appUserPool', {
    usernames: ['email'],
    transform: {
      userPool: (args) => {
        const existing =
          (
            args as {
              schema?: Array<{
                name: string;
                attributeDataType?: string;
                required?: boolean;
                mutable?: boolean;
              }>;
            }
          ).schema ?? [];
        const byName = new Map(existing.map((s) => [s.name, { ...s }]));
        byName.set('given_name', {
          name: 'given_name',
          attributeDataType: 'String',
          required: false,
          mutable: true,
        });
        byName.set('family_name', {
          name: 'family_name',
          attributeDataType: 'String',
          required: false,
          mutable: true,
        });
        byName.set('custom:user_account_id', {
          name: 'custom:user_account_id',
          attributeDataType: 'String',
          required: false,
          mutable: true,
        });
        (args as { schema?: unknown[] }).schema = Array.from(byName.values());
      },
    },
  });

  new aws.cognito.UserGroup('AdminGroup', {
    name: 'admin',
    userPoolId: userPool.id,
    description: 'Administrators (web admin portal)',
    precedence: 1,
  });

  new aws.cognito.UserGroup('ConsumerGroup', {
    name: 'consumer',
    userPoolId: userPool.id,
    description: 'End users (mobile app and consumer-facing web)',
    precedence: 2,
  });

  // Web admin portal — server-side auth via Hosted UI.
  const adminClient = userPool.addClient('AdminClient', {
    transform: {
      client: (args) => {
        args.generateSecret = false;
        args.allowedOauthFlowsUserPoolClient = true;
        args.allowedOauthFlows = ['code'];
        args.allowedOauthScopes = [
          'openid',
          'email',
          'profile',
          'aws.cognito.signin.user.admin',
        ];
        args.explicitAuthFlows = [
          'ALLOW_USER_SRP_AUTH',
          'ALLOW_REFRESH_TOKEN_AUTH',
          'ALLOW_USER_PASSWORD_AUTH',
        ];
        // Callback URLs are project-specific; populate per stage in infra/web.ts.
        args.callbackUrls = ['http://localhost:3001/'];
        args.logoutUrls = ['http://localhost:3001/'];
      },
    },
  });

  // Web consumer portal (e.g. landing-page sign-in flow). Reserved for future use.
  const consumerClient = userPool.addClient('ConsumerClient', {
    transform: {
      client: (args) => {
        args.generateSecret = false;
        args.allowedOauthFlowsUserPoolClient = true;
        args.allowedOauthFlows = ['code'];
        args.allowedOauthScopes = [
          'openid',
          'email',
          'profile',
          'aws.cognito.signin.user.admin',
        ];
        args.explicitAuthFlows = [
          'ALLOW_USER_SRP_AUTH',
          'ALLOW_REFRESH_TOKEN_AUTH',
          'ALLOW_USER_PASSWORD_AUTH',
        ];
        args.callbackUrls = ['http://localhost:3000/'];
        args.logoutUrls = ['http://localhost:3000/'];
      },
    },
  });

  // Mobile (Expo / Amplify) — public PKCE client; longer refresh token.
  const mobileClient = userPool.addClient('MobileClient', {
    transform: {
      client: (args) => {
        args.generateSecret = false;
        args.refreshTokenValidity = 30; // days
        args.tokenValidityUnits = {
          accessToken: 'hours',
          idToken: 'hours',
          refreshToken: 'days',
        };
        args.allowedOauthFlowsUserPoolClient = true;
        args.allowedOauthFlows = ['code'];
        args.allowedOauthScopes = [
          'openid',
          'email',
          'profile',
          'aws.cognito.signin.user.admin',
        ];
        args.explicitAuthFlows = [
          'ALLOW_USER_SRP_AUTH',
          'ALLOW_REFRESH_TOKEN_AUTH',
          'ALLOW_USER_PASSWORD_AUTH',
        ];
      },
    },
  });

  // Hosted UI domain prefix — namespace per stage so dev/uat/prod don't clash.
  const domainPrefix = `app-${($app.stage ?? 'dev').toLowerCase().replace(/_/g, '-')}`;
  new aws.cognito.UserPoolDomain('appUserPoolDomain', {
    domain: domainPrefix,
    userPoolId: userPool.id,
  });
  const cognitoOAuthDomain = $interpolate`${domainPrefix}.auth.${aws.getRegionOutput().name}.amazoncognito.com`;

  return {
    userPool,
    adminClient,
    consumerClient,
    mobileClient,
    cognitoOAuthDomain,
  };
}

export type AppAuth = ReturnType<typeof createAppAuth>;
