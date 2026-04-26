'use client';

import { type FederatedProvider, useAuth } from '@app/auth';
import { AppButton } from '@app/ui';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';

export default function SignInPage() {
  const { signIn, signInWithProvider, status } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [federatedPending, setFederatedPending] =
    useState<FederatedProvider | null>(null);

  useEffect(() => {
    if (status === 'signed-in') router.replace('/widgets');
  }, [status, router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await signIn({ username, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setPending(false);
    }
  }

  async function onFederated(provider: FederatedProvider) {
    setError(null);
    setFederatedPending(provider);
    try {
      await signInWithProvider(provider);
      // Browser is redirected to the IdP; nothing else happens on this page.
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `${provider} sign-in failed`,
      );
      setFederatedPending(null);
    }
  }

  const anyPending = pending || federatedPending !== null;

  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Stack spacing={3} component="form" onSubmit={onSubmit}>
        <Typography variant="h4" component="h1">
          Sign in
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Email"
          type="email"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
        />
        <AppButton type="submit" disabled={anyPending} fullWidth>
          {pending ? 'Signing in…' : 'Sign in'}
        </AppButton>
        <Divider>or</Divider>
        <AppButton
          type="button"
          variant="outlined"
          disabled={anyPending}
          onClick={() => onFederated('Google')}
          fullWidth
        >
          {federatedPending === 'Google'
            ? 'Redirecting to Google…'
            : 'Continue with Google'}
        </AppButton>
        <AppButton
          type="button"
          variant="outlined"
          disabled={anyPending}
          onClick={() => onFederated('Apple')}
          fullWidth
        >
          {federatedPending === 'Apple'
            ? 'Redirecting to Apple…'
            : 'Continue with Apple'}
        </AppButton>
      </Stack>
    </Container>
  );
}
