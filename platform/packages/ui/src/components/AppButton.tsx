import Button, { type ButtonProps } from '@mui/material/Button';

export type AppButtonProps = ButtonProps;

/** Thin MUI Button wrapper — extend with project-specific defaults. */
export function AppButton(props: AppButtonProps) {
  return <Button variant="contained" {...props} />;
}
