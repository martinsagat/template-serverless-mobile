'use client';

import { AuthProvider, configureAmplify, QueryProvider } from '@app/auth';
import { ThemeRegistry } from '@app/ui';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { env } from '../lib/env';

export function Providers({ children }: { children: ReactNode }) {
  // Configure Amplify exactly once per browser session.
  useState(() => {
    const e = env();
    const origin =
      e.NEXT_PUBLIC_ADMIN_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    const redirect = origin ? [`${origin.replace(/\/$/, '')}/`] : undefined;
    configureAmplify({
      region: e.NEXT_PUBLIC_AWS_REGION,
      userPoolId: e.NEXT_PUBLIC_USER_POOL_ID,
      userPoolClientId: e.NEXT_PUBLIC_ADMIN_CLIENT_ID,
      oauthDomain: e.NEXT_PUBLIC_COGNITO_OAUTH_DOMAIN,
      redirectSignIn: redirect,
      redirectSignOut: redirect,
    });
    return null;
  });

  return (
    <ThemeRegistry>
      <QueryProvider>
        <AuthProvider>{children}</AuthProvider>
      </QueryProvider>
    </ThemeRegistry>
  );
}
