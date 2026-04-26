import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { consumerApi } from '../../src/lib/apiClient';

interface WidgetDto {
  widgetId: string;
  ownerId: string;
  name: string;
  description?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface ListResponse {
  items: WidgetDto[];
  nextCursor?: string;
}

export default function WidgetsScreen() {
  const { status, signOut } = useAuth();
  const router = useRouter();
  const [widgets, setWidgets] = useState<WidgetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'signed-out') router.replace('/sign-in');
  }, [status, router]);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await consumerApi.get<ListResponse>('/widgets');
      setWidgets(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === 'signed-in') void load();
  }, [status]);

  async function onSignOut() {
    await signOut();
    router.replace('/sign-in');
  }

  if (status !== 'signed-in') return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Appbar.Header>
        <Appbar.Content title="Widgets" />
        <Appbar.Action icon="logout" onPress={onSignOut} />
      </Appbar.Header>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      )}
      {error && (
        <View style={styles.center}>
          <Text>{error}</Text>
        </View>
      )}
      {!loading && !error && (
        <FlatList
          data={widgets}
          keyExtractor={(w) => w.widgetId}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text>No widgets yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Title title={item.name} subtitle={item.status} />
              {item.description && (
                <Card.Content>
                  <Text variant="bodyMedium">{item.description}</Text>
                </Card.Content>
              )}
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { marginBottom: 8 },
});
