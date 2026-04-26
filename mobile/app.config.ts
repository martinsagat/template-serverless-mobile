import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'App',
  slug: 'app',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  scheme: 'app',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.app.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.app.app',
  },
  web: {
    bundler: 'metro',
  },
  plugins: ['expo-router'],
  extra: {
    // Public env vars surfaced via Constants.expoConfig.extra at runtime.
    // Set these via app.config.ts overrides or EAS environment groups per stage.
    awsRegion: process.env.EXPO_PUBLIC_AWS_REGION,
    userPoolId: process.env.EXPO_PUBLIC_USER_POOL_ID,
    userPoolClientId: process.env.EXPO_PUBLIC_USER_POOL_CLIENT_ID,
    consumerApiUrl: process.env.EXPO_PUBLIC_CONSUMER_API_URL,
  },
  experiments: {
    typedRoutes: true,
  },
};

export default config;
