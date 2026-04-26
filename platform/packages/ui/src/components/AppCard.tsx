import Card, { type CardProps } from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import type { ReactNode } from 'react';

export interface AppCardProps extends Omit<CardProps, 'title'> {
  header?: ReactNode;
  subheader?: ReactNode;
  children?: ReactNode;
}

export function AppCard({
  header,
  subheader,
  children,
  ...rest
}: AppCardProps) {
  return (
    <Card variant="outlined" {...rest}>
      {(header || subheader) && (
        <CardHeader title={header} subheader={subheader} />
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}
