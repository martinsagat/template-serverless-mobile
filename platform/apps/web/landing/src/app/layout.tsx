import { ThemeRegistry } from '@app/ui';
import '@app/ui/styles/globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'App — Landing',
  description: 'Marketing site',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
