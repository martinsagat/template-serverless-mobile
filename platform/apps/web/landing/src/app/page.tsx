import { AppCard } from '@app/ui';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function HomePage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Stack spacing={4}>
        <Typography variant="h2" component="h1">
          Welcome to App
        </Typography>
        <Typography variant="body1" color="text.secondary">
          A starter template scaffolded from SST v3, Hono, ElectroDB, and
          Next.js 16.
        </Typography>

        <AppCard header="Get started">
          <Typography variant="body2" sx={{ mb: 2 }}>
            Run <code>tsx platform/bin/rename.ts &lt;your-project&gt;</code> to
            claim this template, then{' '}
            <code>pnpm install &amp;&amp; pnpm sst dev</code>.
          </Typography>
          <Link
            href="https://sst.dev"
            target="_blank"
            rel="noreferrer"
            underline="hover"
          >
            Read the SST docs
          </Link>
        </AppCard>
      </Stack>
    </Container>
  );
}
