/**
 * Design tokens — single source of truth for colour, spacing, and typography.
 * Generated CSS variables (see scripts/generate-css-vars.ts) make these
 * available to any consumer without needing the JS theme bundle.
 */
export const tokens = {
  color: {
    primary: {
      main: '#3f51b5',
      light: '#7986cb',
      dark: '#303f9f',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f50057',
      light: '#ff4081',
      dark: '#c51162',
      contrastText: '#ffffff',
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      400: '#bdbdbd',
      600: '#757575',
      900: '#212121',
    },
    error: '#d32f2f',
    warning: '#ed6c02',
    info: '#0288d1',
    success: '#2e7d32',
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#616161',
    },
  },
  spacing: {
    unit: 8, // px — multiplied by integer scale (1, 2, 3, ...)
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 16,
  },
  typography: {
    fontFamily:
      '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
  },
} as const;

export type DesignTokens = typeof tokens;
