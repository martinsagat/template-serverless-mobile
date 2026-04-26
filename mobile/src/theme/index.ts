import { MD3LightTheme, type MD3Theme } from 'react-native-paper';

/**
 * Mobile theme derived from the same palette/typography tokens as the web
 * (see platform/packages/ui/src/theme/tokens.ts). Duplicated rather than
 * imported because mobile/ is intentionally a separate repo.
 */
export const appTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#3f51b5',
    onPrimary: '#ffffff',
    secondary: '#f50057',
    onSecondary: '#ffffff',
    error: '#d32f2f',
    background: '#ffffff',
    surface: '#ffffff',
    onSurface: '#212121',
    onSurfaceVariant: '#616161',
  },
};
