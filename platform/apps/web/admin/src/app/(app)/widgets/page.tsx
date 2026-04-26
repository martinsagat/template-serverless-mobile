'use client';

import { useAuth } from '@app/auth';
import type { ListWidgetsResponse } from '@app/types';
import { AppButton } from '@app/ui';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { adminApi } from '../../../lib/apiClient';

export default function WidgetsPage() {
  const { status, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'signed-out') router.replace('/sign-in');
  }, [status, router]);

  const query = useQuery({
    enabled: status === 'signed-in',
    queryKey: ['widgets'],
    queryFn: () => adminApi().get<ListWidgetsResponse>('/widgets'),
  });

  if (status !== 'signed-in') return null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" component="h1">
          Widgets
        </Typography>
        <AppButton variant="outlined" onClick={() => signOut()}>
          Sign out
        </AppButton>
      </Stack>

      {query.isLoading && <Typography>Loading…</Typography>}
      {query.error && (
        <Alert severity="error">{(query.error as Error).message}</Alert>
      )}
      {query.data && (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {query.data.items.map((w) => (
              <TableRow key={w.widgetId}>
                <TableCell>{w.widgetId}</TableCell>
                <TableCell>{w.ownerId}</TableCell>
                <TableCell>{w.name}</TableCell>
                <TableCell>{w.status}</TableCell>
                <TableCell>{new Date(w.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {query.data.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No widgets yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Container>
  );
}
