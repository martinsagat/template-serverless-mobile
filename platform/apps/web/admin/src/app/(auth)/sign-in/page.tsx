'use client';

import { useAuth } from '@app/auth';
import { AppButton } from '@app/ui';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';

export default function SignInPage() {
  const { signIn, status } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
        <AppButton type="submit" disabled={pending} fullWidth>
          {pending ? 'Signing in…' : 'Sign in'}
        </AppButton>
      </Stack>
    </Container>
  );
}
