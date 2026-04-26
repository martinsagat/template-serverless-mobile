/**
 * Optional per-stage custom domain config. Pass into createAppAuth / Apis / Web
 * to attach `domain.com`, `admin.domain.com`, `admin-api.domain.com`,
 * `consumer-api.domain.com`, `auth.domain.com`. Omit to keep SST-generated URLs.
 *
 * Assumes the hosted zone is in Route 53 in the same AWS account. External DNS
 * providers are not supported in this iteration.
 */
export interface AppDomainConfig {
  /** Apex domain, e.g. `myapp.com`. */
  name: string;
  /**
   * Route 53 hosted zone the records live under. Defaults to `name`. Set this
   * if your zone is at a parent level (e.g. zone is `myapp.com` but `name` is
   * `staging.myapp.com`).
   */
  hostedZone?: string;
}

export interface AppSubdomains {
  landing: string;
  admin: string;
  adminApi: string;
  consumerApi: string;
  auth: string;
}

export function appSubdomains(domain: AppDomainConfig): AppSubdomains {
  return {
    landing: domain.name,
    admin: `admin.${domain.name}`,
    adminApi: `admin-api.${domain.name}`,
    consumerApi: `consumer-api.${domain.name}`,
    auth: `auth.${domain.name}`,
  };
}

/**
 * SST domain prop builder — pins the hosted zone explicitly so the same apex
 * with multiple zones in the account can't accidentally re-target. Used by
 * sst.aws.Nextjs and sst.aws.ApiGatewayV2.
 */
export function sstDomainProp(host: string, domain: AppDomainConfig) {
  const zoneId = aws.route53.getZoneOutput({
    name: domain.hostedZone ?? domain.name,
  }).zoneId;
  return {
    name: host,
    dns: sst.aws.dns({ zone: zoneId }),
  };
}

/**
 * Cognito client callbackUrls / logoutUrls for the admin web app.
 * Always retains the localhost variant so a developer can sign in against the
 * deployed user pool from `pnpm dev` without an extra config round-trip.
 */
export function adminWebUrls(domain: AppDomainConfig | undefined): {
  callback: string[];
  logout: string[];
} {
  const local = ['http://localhost:3001/'];
  if (!domain) return { callback: local, logout: local };
  const sub = appSubdomains(domain);
  return {
    callback: [...local, `https://${sub.admin}/`],
    logout: [...local, `https://${sub.admin}/`],
  };
}

/**
 * Cognito client callbackUrls / logoutUrls for the consumer web (landing /
 * future consumer portal). Mirrors adminWebUrls.
 */
export function consumerWebUrls(domain: AppDomainConfig | undefined): {
  callback: string[];
  logout: string[];
} {
  const local = ['http://localhost:3000/'];
  if (!domain) return { callback: local, logout: local };
  const sub = appSubdomains(domain);
  return {
    callback: [...local, `https://${sub.landing}/`],
    logout: [...local, `https://${sub.landing}/`],
  };
}
