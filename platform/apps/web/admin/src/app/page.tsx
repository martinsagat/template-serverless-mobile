'use client';

import { useAuth } from '@app/auth';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'signed-out') router.replace('/sign-in');
    if (status === 'signed-in') router.replace('/widgets');
  }, [status, router]);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={2} alignItems="center">
        <Typography variant="h5">Loading…</Typography>
      </Stack>
    </Container>
  );
}
