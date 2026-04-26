import {
  signIn as amplifySignIn,
  signInWithRedirect as amplifySignInWithRedirect,
  signOut as amplifySignOut,
  fetchAuthSession,
  getCurrentUser,
  type SignInInput,
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

/** Federated identity provider names that match the Cognito user pool. */
export type FederatedProvider = 'Google' | 'Apple';

export interface AuthUser {
  userId: string;
  username: string;
  email?: string;
  groups: string[];
}

export type AuthStatus = 'loading' | 'signed-in' | 'signed-out';

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  signIn: (input: SignInInput) => Promise<void>;
  signInWithProvider: (provider: FederatedProvider) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

async function loadUser(): Promise<AuthUser | null> {
  try {
    const session = await fetchAuthSession();
    const idTokenPayload = session.tokens?.idToken?.payload;
    if (!idTokenPayload) return null;
    const cu = await getCurrentUser();
    const rawGroups = idTokenPayload['cognito:groups'];
    const groups = Array.isArray(rawGroups)
      ? (rawGroups as string[])
      : typeof rawGroups === 'string'
        ? rawGroups
            .split(',')
            .map((g) => g.trim())
            .filter(Boolean)
        : [];
    return {
      userId: cu.userId,
      username: cu.username,
      email:
        typeof idTokenPayload.email === 'string'
          ? idTokenPayload.email
          : undefined,
      groups,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  const refresh = useCallback(async () => {
    const u = await loadUser();
    setUser(u);
    setStatus(u ? 'signed-in' : 'signed-out');
  }, []);

  useEffect(() => {
    void refresh();
    // Amplify dispatches Hub events when an OAuth redirect (Google / Apple)
    // completes — refresh the session so the UI flips to signed-in.
    const unsub = Hub.listen('auth', ({ payload }) => {
      if (
        payload.event === 'signInWithRedirect' ||
        payload.event === 'signedIn' ||
        payload.event === 'signedOut' ||
        payload.event === 'tokenRefresh'
      ) {
        void refresh();
      }
    });
    return unsub;
  }, [refresh]);

  const signIn = useCallback(
    async (input: SignInInput) => {
      await amplifySignIn(input);
      await refresh();
    },
    [refresh],
  );

  const signInWithProvider = useCallback(
    async (provider: FederatedProvider) => {
      await amplifySignInWithRedirect({ provider });
      // Refresh happens via the Hub listener once the redirect completes.
    },
    [],
  );

  const signOut = useCallback(async () => {
    await amplifySignOut();
    setUser(null);
    setStatus('signed-out');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signIn, signInWithProvider, signOut, refresh }),
    [status, user, signIn, signInWithProvider, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
