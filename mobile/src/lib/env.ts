import Constants from 'expo-constants';

interface Extra {
  awsRegion?: string;
  userPoolId?: string;
  userPoolClientId?: string;
  consumerApiUrl?: string;
}

interface Env {
  awsRegion: string;
  userPoolId: string;
  userPoolClientId: string;
  consumerApiUrl: string;
}

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  const extra = (Constants.expoConfig?.extra ?? {}) as Extra;
  const missing: string[] = [];
  if (!extra.awsRegion) missing.push('EXPO_PUBLIC_AWS_REGION');
  if (!extra.userPoolId) missing.push('EXPO_PUBLIC_USER_POOL_ID');
  if (!extra.userPoolClientId) missing.push('EXPO_PUBLIC_USER_POOL_CLIENT_ID');
  if (!extra.consumerApiUrl) missing.push('EXPO_PUBLIC_CONSUMER_API_URL');
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
  cached = {
    awsRegion: extra.awsRegion as string,
    userPoolId: extra.userPoolId as string,
    userPoolClientId: extra.userPoolClientId as string,
    consumerApiUrl: extra.consumerApiUrl as string,
  };
  return cached;
}
