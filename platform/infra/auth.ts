import {
  type AppDomainConfig,
  adminWebUrls,
  appSubdomains,
  consumerWebUrls,
} from './domain';
import {
  appleKeyId,
  applePrivateKey,
  appleServiceId,
  appleTeamId,
  googleClientId,
  googleClientSecret,
} from './secrets';

export interface CreateAppAuthParams {
  domain?: AppDomainConfig;
  /**
   * Register Google as a Cognito identity provider and attach it to the admin,
   * consumer, and mobile clients. Requires the `GoogleClientId` and
   * `GoogleClientSecret` SST secrets to be set for the current stage.
   */
  enableGoogleSso?: boolean;
  /**
   * Register Sign in with Apple as a Cognito identity provider. Requires the
   * `AppleServiceId`, `AppleTeamId`, `AppleKeyId`, and `ApplePrivateKey` SST
   * secrets (the private key must be the base64-encoded `.p8` contents).
   */
  enableAppleSso?: boolean;
}

/**
 * Cognito user pool + three app clients (admin web, consumer web, mobile)
 * + two user groups (admin, consumer).
 *
 * Each API Gateway picks the relevant client id(s) for its JWT authorizer.
 *
 * `given_name`, `family_name`, and `email` are all marked required on the user
 * pool, so every sign-up path — username/password, Google, Apple — must yield
 * a first name, last name, and email before Cognito will create the user. For
 * Apple this means the user must opt in to share their name on the first
 * authorization (Apple only releases name on the very first auth).
 *
 * When `domain` is provided, client callbackUrls / logoutUrls register the
 * deployed `https://...` URLs alongside `localhost`. The custom Cognito Hosted
 * UI domain (`auth.{domain}`) is created in a separate step
 * (`attachCognitoCustomDomain`) because it must wait for the apex DNS record —
 * Cognito requires the parent domain to resolve before it will create a
 * subdomain custom domain.
 */
export function createAppAuth(params: CreateAppAuthParams = {}) {
  const { domain, enableGoogleSso, enableAppleSso } = params;
  const sub = domain ? appSubdomains(domain) : undefined;
  const admin = adminWebUrls(domain);
  const consumer = consumerWebUrls(domain);

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
        // Enforce first name / last name / email at the user-pool level so
        // every sign-up flow — local, Google, Apple — must supply them.
        const emailAttr = byName.get('email') ?? {
          name: 'email',
          attributeDataType: 'String',
          mutable: true,
        };
        byName.set('email', { ...emailAttr, required: true });
        byName.set('given_name', {
          name: 'given_name',
          attributeDataType: 'String',
          required: true,
          mutable: true,
        });
        byName.set('family_name', {
          name: 'family_name',
          attributeDataType: 'String',
          required: true,
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

  // Google — federated sign-in. Cognito hands the user an id_token signed by
  // its own user pool issuer, so the API Gateway JWT authorizer keeps working
  // unchanged.
  const googleProvider = enableGoogleSso
    ? userPool.addIdentityProvider('Google', {
        type: 'google',
        details: {
          authorize_scopes: 'email profile openid',
          client_id: googleClientId.value,
          client_secret: googleClientSecret.value,
        },
        attributes: {
          email: 'email',
          given_name: 'given_name',
          family_name: 'family_name',
          username: 'sub',
        },
      })
    : undefined;

  // Apple — Sign in with Apple. The private key is supplied as a base64-encoded
  // `.p8` blob in the `ApplePrivateKey` secret; we decode to UTF-8 PEM here.
  // Apple only releases the user's name on the very first authorization, so
  // first-name / last-name capture depends on the user choosing to share name.
  const appleProvider = enableAppleSso
    ? userPool.addIdentityProvider('SignInWithApple', {
        type: 'apple',
        details: {
          authorize_scopes: 'email name',
          client_id: appleServiceId.value,
          team_id: appleTeamId.value,
          key_id: appleKeyId.value,
          private_key: applePrivateKey.value.apply((v) =>
            Buffer.from(v, 'base64').toString('utf-8'),
          ),
        },
        attributes: {
          email: 'email',
          email_verified: 'email_verified',
          family_name: 'lastName',
          given_name: 'firstName',
          username: 'sub',
        },
      })
    : undefined;

  const idpProviderNames = [
    googleProvider?.providerName,
    appleProvider?.providerName,
  ].filter(Boolean) as $util.Input<string>[];

  // Web admin portal — server-side auth via Hosted UI.
  const adminClient = userPool.addClient('AdminClient', {
    ...(idpProviderNames.length > 0 && { providers: idpProviderNames }),
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
        args.callbackUrls = admin.callback;
        args.logoutUrls = admin.logout;
      },
    },
  });

  // Web consumer portal (e.g. landing-page sign-in flow). Reserved for future use.
  const consumerClient = userPool.addClient('ConsumerClient', {
    ...(idpProviderNames.length > 0 && { providers: idpProviderNames }),
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
        args.callbackUrls = consumer.callback;
        args.logoutUrls = consumer.logout;
      },
    },
  });

  // Mobile (Expo / Amplify) — public PKCE client; longer refresh token.
  const mobileClient = userPool.addClient('MobileClient', {
    ...(idpProviderNames.length > 0 && { providers: idpProviderNames }),
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

  // Hosted UI prefix domain — always created so we have a working OAuth
  // endpoint on first deploy (custom domain is optional and needs the apex
  // DNS record to exist before Cognito will create it).
  const domainPrefix = `app-${($app.stage ?? 'dev').toLowerCase().replace(/_/g, '-')}`;
  new aws.cognito.UserPoolDomain('appUserPoolDomain', {
    domain: domainPrefix,
    userPoolId: userPool.id,
  });
  const cognitoPrefixOAuthDomain = $interpolate`${domainPrefix}.auth.${aws.getRegionOutput().name}.amazoncognito.com`;

  // The OAuth domain consumed by Amplify (etc.). Deterministic from config:
  //   - with domain → `auth.{domain}` (still resolves once attachCognitoCustomDomain runs)
  //   - without    → the prefix domain we just created.
  const cognitoOAuthDomain = sub
    ? $interpolate`${sub.auth}`
    : cognitoPrefixOAuthDomain;

  return {
    userPool,
    adminClient,
    consumerClient,
    mobileClient,
    cognitoOAuthDomain,
    cognitoPrefixOAuthDomain,
    googleEnabled: Boolean(googleProvider),
    appleEnabled: Boolean(appleProvider),
  };
}

export type AppAuth = ReturnType<typeof createAppAuth>;

export interface AttachCognitoCustomDomainParams {
  auth: AppAuth;
  domain: AppDomainConfig;
  /**
   * Resources that must exist before the custom Cognito UserPoolDomain is
   * created. Pass the landing Nextjs site here — Cognito requires the apex
   * domain to have a DNS record at create time.
   */
  dependsOn: $util.Input<$util.Resource>[];
}

/**
 * Attach `auth.{domain}` as a Cognito Hosted UI custom domain.
 *
 * - ACM cert is provisioned in `us-east-1` (Cognito Hosted UI requirement,
 *   regardless of where the user pool lives).
 * - Apex DNS record (created by the landing site) must exist when the
 *   UserPoolDomain is created — pass `dependsOn: [web.landing]`.
 * - Coexists with the prefix domain on the same user pool.
 */
export function attachCognitoCustomDomain(
  params: AttachCognitoCustomDomainParams,
): aws.cognito.UserPoolDomain {
  const { auth, domain, dependsOn } = params;
  const sub = appSubdomains(domain);

  const usEast1 = new aws.Provider('appUsEast1', { region: 'us-east-1' });

  const cert = new aws.acm.Certificate(
    'appCognitoCert',
    {
      domainName: sub.auth,
      validationMethod: 'DNS',
    },
    { provider: usEast1 },
  );

  const zone = aws.route53.getZoneOutput({
    name: domain.hostedZone ?? domain.name,
  });

  const validationRecord = new aws.route53.Record(
    'appCognitoCertValidation',
    {
      name: cert.domainValidationOptions[0].resourceRecordName,
      type: cert.domainValidationOptions[0].resourceRecordType,
      records: [cert.domainValidationOptions[0].resourceRecordValue],
      zoneId: zone.zoneId,
      ttl: 60,
      allowOverwrite: true,
    },
  );

  const certValidation = new aws.acm.CertificateValidation(
    'appCognitoCertValidation',
    {
      certificateArn: cert.arn,
      validationRecordFqdns: [validationRecord.fqdn],
    },
    { provider: usEast1 },
  );

  const customDomain = new aws.cognito.UserPoolDomain(
    'appUserPoolCustomDomain',
    {
      domain: sub.auth,
      userPoolId: auth.userPool.id,
      certificateArn: certValidation.certificateArn,
    },
    { dependsOn },
  );

  // CloudFront's hosted zone ID is a global constant for alias records.
  new aws.route53.Record('appCognitoAliasRecord', {
    name: sub.auth,
    type: 'A',
    zoneId: zone.zoneId,
    aliases: [
      {
        name: customDomain.cloudfrontDistribution,
        zoneId: 'Z2FDTNDATAQYW2',
        evaluateTargetHealth: false,
      },
    ],
  });

  return customDomain;
}
