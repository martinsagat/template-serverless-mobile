import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import type { Context, MiddlewareHandler } from 'hono';
import type { LambdaContext, LambdaEvent } from 'hono/aws-lambda';
import { HTTPException } from 'hono/http-exception';

export interface AuthClaims {
  userId: string;
  email?: string;
  groups: string[];
}

export type AuthVariables = {
  auth: AuthClaims;
};

type Bindings = {
  event: LambdaEvent;
  lambdaContext: LambdaContext;
};

function extractClaims(event: LambdaEvent): AuthClaims | null {
  // SST exposes API Gateway HTTP API events; the JWT authorizer puts claims here.
  const v2 = event as unknown as APIGatewayProxyEventV2WithJWTAuthorizer;
  const claims = v2?.requestContext?.authorizer?.jwt?.claims;
  if (!claims) return null;
  const sub = claims.sub as string | undefined;
  const email = claims.email as string | undefined;
  const rawGroups = claims['cognito:groups'];
  const groups = Array.isArray(rawGroups)
    ? (rawGroups as string[])
    : typeof rawGroups === 'string'
      ? rawGroups
          .split(',')
          .map((g) => g.trim())
          .filter(Boolean)
      : [];
  if (!sub) return null;
  return { userId: sub, email, groups };
}

/** Reads JWT claims (already verified by API Gateway) and exposes them on c.var.auth. */
export const authMiddleware: MiddlewareHandler<{
  Variables: AuthVariables;
  Bindings: Bindings;
}> = async (c, next) => {
  const claims = extractClaims(c.env.event);
  if (!claims) {
    throw new HTTPException(401, { message: 'Unauthenticated' });
  }
  c.set('auth', claims);
  // Enrich the request log with the caller's identity for traceability.
  c.get('log')?.setContext({ userSub: claims.userId, userEmail: claims.email });
  await next();
};

/** Higher-order middleware that 403s if the caller is not in the required group. */
export function requireGroup(
  group: string,
): MiddlewareHandler<{ Variables: AuthVariables }> {
  return async (c, next) => {
    const auth = c.get('auth') as AuthClaims | undefined;
    if (!auth || !auth.groups.includes(group)) {
      throw new HTTPException(403, { message: `Requires group: ${group}` });
    }
    await next();
  };
}

export function getAuth(c: Context): AuthClaims {
  const auth = c.get('auth') as AuthClaims | undefined;
  if (!auth) throw new HTTPException(401, { message: 'Unauthenticated' });
  return auth;
}
