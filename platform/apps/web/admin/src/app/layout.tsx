import '@app/ui/styles/globals.css';
import type { ReactNode } from 'react';
import { Providers } from '../components/Providers';

export const metadata = {
  title: 'App — Admin',
  description: 'Admin portal',
};

// Auth-gated portal — never prerendered, env vars are evaluated per-request.
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
