import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';

export default function IndexRoute() {
  const { status } = useAuth();
  if (status === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  if (status === 'signed-in') return <Redirect href="/widgets" />;
  return <Redirect href="/sign-in" />;
}
