import {
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  fetchAuthSession,
  getCurrentUser,
  type SignInInput,
} from 'aws-amplify/auth';
import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

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
  }, [refresh]);

  const signIn = useCallback(
    async (input: SignInInput) => {
      await amplifySignIn(input);
      await refresh();
    },
    [refresh],
  );

  const signOut = useCallback(async () => {
    await amplifySignOut();
    setUser(null);
    setStatus('signed-out');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signIn, signOut, refresh }),
    [status, user, signIn, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
