import { createTheme, type Theme } from '@mui/material/styles';
import { tokens } from './tokens';

export type { DesignTokens } from './tokens';
export { tokens } from './tokens';

/** Build the MUI theme from the shared design tokens. */
export function createAppTheme(): Theme {
  return createTheme({
    palette: {
      mode: 'light',
      primary: tokens.color.primary,
      secondary: tokens.color.secondary,
      error: { main: tokens.color.error },
      warning: { main: tokens.color.warning },
      info: { main: tokens.color.info },
      success: { main: tokens.color.success },
      background: tokens.color.background,
      text: tokens.color.text,
    },
    spacing: tokens.spacing.unit,
    shape: { borderRadius: tokens.radius.md },
    typography: {
      fontFamily: tokens.typography.fontFamily,
      fontSize: tokens.typography.fontSize,
    },
  });
}
